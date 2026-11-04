import { IconComponent } from '../../shared/icon/icon.component';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { RecomendacionService } from '../../core/services/recomendacion.service';
import { PreguntaService } from '../../core/services/pregunta.service';
import { RespuestaService } from '../../core/services/respuesta.service';
import { PreguntaResponse } from '../../core/services/models/pregunta.model';
import { EvaluacionResponse } from '../../core/services/models/evaluacion.model';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { InformeService, DatosInforme } from '../../core/services/informe.service';
import { catchError, firstValueFrom, map, of, switchMap } from 'rxjs';

interface ResultadoDominioVista {
  nombre: string;
  cobertura: number;
  peso: number;
  preguntas: number;
  puntaje: number;
  puntajeMaximo: number;
}

interface RecomendacionVista {
  pregunta: {
    id: number;
    dominio: string;
    pregunta: string;
    controlesISO27001: string[];
    controlesISO42001: string[];
    /** Peso relativo del dominio, en porcentaje. */
    pesoDominio: number;
  };
  prioridad: 'ALTA' | 'MEDIA';
  recomendacion: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [HeaderComponent, DatePipe, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  private evaluacionService = inject(EvaluacionService);
  private resultadoService = inject(ResultadoService);
  private recomendacionService = inject(RecomendacionService);
  private preguntaService = inject(PreguntaService);
  private respuestaService = inject(RespuestaService);
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private informeService = inject(InformeService);
  private router = inject(Router);

  Math = Math;

  organizacion = 'Sin organización registrada';
  sector = '—';
  solucion = 'Text-to-SQL';

  fechaEvaluacion = new Date();

  resultadosDominio: ResultadoDominioVista[] = [];
  coberturaGlobal = 0;
  nivelMadurez = 1;
  nombreMadurez = 'Inicial';

  recomendaciones: RecomendacionVista[] = [];

  totalPreguntas = 0;
  preguntasImplementadas = 0;
  brechas = 0;
  controlesEvaluados = 0;

  cargando = true;
  error = '';

  // Evaluación que se está mostrando
  evaluacion: EvaluacionResponse | null = null;

  // Tendencia respecto a la evaluación anterior de la misma organización
  tendencia: { tipo: 'sube' | 'baja' | 'igual'; nivelAnterior: string; coberturaAnterior: number; diferencia: number; fecha: Date } | null = null;
  tendenciaEstado: 'cargando' | 'sin-anterior' | 'listo' | 'error' = 'cargando';

  // Informes en PDF
  recomendacionesListas = false;
  generandoInforme = false;
  errorInforme = '';

  private readonly ORDEN_NIVELES = ['Inicial', 'Básico', 'Definido', 'Gestionado', 'Optimizado'];

  ngOnInit(): void {
  this.evaluacionService.cargarEvaluacionActual().subscribe(evaluacion => {
    if (!evaluacion) {
      this.router.navigate(['/organizaciones']);
      return;
    }

    // Si todavía está en curso, aún no hay resultados que mostrar
    if (evaluacion.estado === 'EN_CURSO') {
      this.router.navigate(['/evaluacion']);
      return;
    }

    this.evaluacion = evaluacion;
    this.organizacion = evaluacion.organizacionNombre;
    if (evaluacion.fechaFin) {
      this.fechaEvaluacion = new Date(evaluacion.fechaFin);
    }

    this.cargarResultado(evaluacion.id);
  });
}

  private cargarResultado(evaluacionId: number): void {
    this.resultadoService.obtenerResultado(evaluacionId).subscribe({
      next: (resultado) => {
        this.coberturaGlobal = Math.round(resultado.coberturaGlobal);
        this.nombreMadurez = resultado.nivelMadurez;

        const indice = this.ORDEN_NIVELES.indexOf(resultado.nivelMadurez);
        this.nivelMadurez = indice !== -1 ? indice + 1 : 1;

        this.resultadosDominio = resultado.porDominio.map(d => ({
          nombre: d.dominioNombre,
          cobertura: Math.round(d.coberturaPorcentaje),
          peso: d.pesoRelativo / 100,
          preguntas: 0,
          puntaje: 0,
          puntajeMaximo: 0
        }));

        this.cargando = false;
        this.cargarPreguntasYRespuestas(evaluacionId);
        this.cargarTendencia();
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error ?? 'No se pudo cargar el resultado de la evaluación';
      }
    });
  }

  private cargarPreguntasYRespuestas(evaluacionId: number): void {
    this.preguntaService.listarPreguntas().subscribe(preguntas => {
      this.totalPreguntas = preguntas.length;

      const controles = new Set<string>();
      preguntas.forEach(p => p.controles.forEach(c => controles.add(`${c.norma}-${c.anexoA}`)));
      this.controlesEvaluados = controles.size;

      this.respuestaService.listarRespuestas(evaluacionId).subscribe(respuestas => {
        this.preguntasImplementadas = respuestas.filter(r => r.nivelImplementacion === 'IMPLEMENTADO').length;
        this.brechas = respuestas.filter(r => r.nivelImplementacion !== 'IMPLEMENTADO').length;

        // Completar el detalle por dominio (preguntas/puntaje ya con datos reales)
        this.resultadosDominio.forEach(rd => {
          const preguntasDominio = preguntas.filter(p => p.dominioNombre === rd.nombre);
          rd.preguntas = preguntasDominio.length;
          rd.puntajeMaximo = preguntasDominio.length;
          rd.puntaje = preguntasDominio.filter(p =>
            respuestas.find(r => r.preguntaId === p.id)?.nivelImplementacion === 'IMPLEMENTADO'
          ).length;
        });

        this.cargarRecomendaciones(evaluacionId, preguntas);
      });
    });
  }

  // ===== Tendencia =====

  get esJefe(): boolean {
    return this.authService.getRol() === 'JEFE_CIBERSEGURIDAD';
  }

  // Compara con la evaluación finalizada anterior de la misma organización
  private cargarTendencia(): void {
    const actual = this.evaluacion;
    if (!actual) return;

    const lista$ = this.esJefe
      ? this.evaluacionService.listarEvaluacionesEquipo()
      : this.evaluacionService.listarMisEvaluaciones();

    lista$.pipe(
      switchMap(lista => {
        const inicioActual = new Date(actual.fechaInicio).getTime();

        const anterior = lista
          .filter(e =>
            e.organizacionId === actual.organizacionId &&
            e.id !== actual.id &&
            e.estado !== 'EN_CURSO' &&
            new Date(e.fechaInicio).getTime() < inicioActual
          )
          .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())[0];

        if (!anterior) return of(null);

        return this.resultadoService.obtenerResultado(anterior.id).pipe(
          map(resultado => ({ anterior, resultado }))
        );
      })
    ).subscribe({
      next: (datos) => {
        if (!datos) {
          this.tendencia = null;
          this.tendenciaEstado = 'sin-anterior';
          return;
        }

        const coberturaAnterior = Math.round(datos.resultado.coberturaGlobal);
        const diferencia = this.coberturaGlobal - coberturaAnterior;

        this.tendencia = {
          tipo: diferencia > 0 ? 'sube' : diferencia < 0 ? 'baja' : 'igual',
          nivelAnterior: datos.resultado.nivelMadurez,
          coberturaAnterior,
          diferencia,
          fecha: new Date(datos.anterior.fechaFin ?? datos.anterior.fechaInicio)
        };
        this.tendenciaEstado = 'listo';
      },
      error: () => { this.tendenciaEstado = 'error'; }
    });
  }

  // ===== Informes en PDF =====

  get informeListo(): boolean {
    return !this.cargando && !this.error && this.recomendacionesListas;
  }

  // El informe final lo descarga el jefe cuando la evaluación ya fue validada
  get puedeInformeFinal(): boolean {
    return this.esJefe && this.evaluacion?.estado === 'VALIDADA';
  }

  private datosInforme(): DatosInforme {
    return {
      organizacion: this.organizacion,
      plataforma: this.solucion,
      fecha: this.fechaEvaluacion,
      coberturaGlobal: this.coberturaGlobal,
      nivel: this.nombreMadurez,
      dominios: this.resultadosDominio.map(d => ({
        nombre: d.nombre,
        cobertura: d.cobertura,
        peso: Math.round(d.peso * 1000) / 10
      })),
      recomendaciones: this.recomendaciones.map(r => ({
        prioridad: r.prioridad,
        dominio: r.pregunta.dominio,
        pesoDominio: r.pregunta.pesoDominio,
        preguntaId: r.pregunta.id,
        pregunta: r.pregunta.pregunta,
        recomendacion: r.recomendacion,
        controles: [
          ...r.pregunta.controlesISO27001.filter(Boolean).map(c => `ISO 27001: ${c}`),
          ...r.pregunta.controlesISO42001.filter(Boolean).map(c => `ISO 42001: ${c}`)
        ]
      }))
    };
  }

  async exportarInforme(): Promise<void> {
    if (!this.informeListo || this.generandoInforme) return;

    this.generandoInforme = true;
    this.errorInforme = '';

    try {
      await this.informeService.generar(this.datosInforme(), false);
    } catch {
      this.errorInforme = 'No se pudo generar el informe. Inténtalo nuevamente.';
    } finally {
      this.generandoInforme = false;
    }
  }

  async descargarInformeFinal(): Promise<void> {
    if (!this.informeListo || this.generandoInforme || !this.evaluacion) return;

    this.generandoInforme = true;
    this.errorInforme = '';

    try {
      const analista = await this.nombreAnalista(this.evaluacion.analistaId);

      await this.informeService.generar({
        ...this.datosInforme(),
        analista,
        estado: 'Validada',
        observaciones: this.evaluacion.observacion ?? ''
      }, true);
    } catch {
      this.errorInforme = 'No se pudo generar el informe final. Inténtalo nuevamente.';
    } finally {
      this.generandoInforme = false;
    }
  }

  // La evaluación solo trae el id del analista: se busca su nombre; si no se puede, se indica el id
  private async nombreAnalista(analistaId: number): Promise<string> {
    const usuarios = await firstValueFrom(
      this.usuarioService.listarUsuarios().pipe(catchError(() => of([])))
    );

    return usuarios.find(u => u.id === analistaId)?.nombre ?? `Analista #${analistaId}`;
  }

  private cargarRecomendaciones(evaluacionId: number, preguntas: PreguntaResponse[]): void {
    this.recomendacionService.obtenerSugeridasPorEvaluacion(evaluacionId).subscribe(sugeridas => {
      this.recomendaciones = sugeridas.map(s => {
        const p = preguntas.find(x => x.id === s.preguntaId);

        return {
          pregunta: {
            id: s.preguntaId,
            dominio: s.dominioNombre,
            pregunta: s.preguntaTexto,
            controlesISO27001: p?.controles.filter(c => c.norma === 'ISO_27001').map(c => c.anexoA) ?? [],
            controlesISO42001: p?.controles.filter(c => c.norma === 'ISO_42001').map(c => c.anexoA) ?? [],
            pesoDominio: Math.round((this.resultadosDominio.find(d => d.nombre === s.dominioNombre)?.peso ?? 0) * 1000) / 10
          },
          prioridad: (s.nivelRespondido === 'NO_EXISTE' ? 'ALTA' : 'MEDIA') as 'ALTA' | 'MEDIA',
          recomendacion: s.recomendacionDescripcion
        };
      });

      // Prioridad (ALTA, luego MEDIA); después, peso del dominio de mayor a menor; y por número de pregunta
      this.recomendaciones.sort((a, b) => {
        if (a.prioridad !== b.prioridad) return a.prioridad === 'ALTA' ? -1 : 1;
        if (a.pregunta.pesoDominio !== b.pregunta.pesoDominio) return b.pregunta.pesoDominio - a.pregunta.pesoDominio;
        return a.pregunta.id - b.pregunta.id;
      });

      this.recomendacionesListas = true;
    });
  }

  obtenerNombreCorto(nombre: string): string {
    switch (nombre) {
      case 'Desarrollo y Uso Responsable': return 'Responsable';
      case 'Monitoreo y Respuesta': return 'Monitoreo';
      case 'Protección de Datos': return 'Datos';
      case 'Gestión de Terceros': return 'Terceros';
      default: return nombre;
    }
  }

  getRadarPoints(): string {
    const centerX = 150;
    const centerY = 130;
    const radius = 90;
    const total = this.resultadosDominio.length;

    return this.resultadosDominio
      .map((dominio, index) => {
        const angle = (-90 + (360 / total) * index) * Math.PI / 180;
        const r = radius * (dominio.cobertura / 100);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        return `${x},${y}`;
      })
      .join(' ');
  }

  getRadarLabels(): { x: number; y: number; texto: string }[] {
    const centerX = 150;
    const centerY = 130;
    const radius = 110;
    const total = this.resultadosDominio.length;

    return this.resultadosDominio.map((dominio, index) => {
      const angle = (-90 + (360 / total) * index) * Math.PI / 180;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        texto: this.obtenerNombreCorto(dominio.nombre)
      };
    });
  }

  obtenerClaseCobertura(cobertura: number): string {
    if (cobertura <= 40) return 'bajo';
    if (cobertura <= 60) return 'medio';
    if (cobertura <= 80) return 'alto';
    return 'optimo';
  }

  obtenerClasePrioridad(prioridad: string): string {
    return prioridad === 'ALTA' ? 'priority-high' : 'priority-medium';
  }
}
