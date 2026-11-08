import { IconComponent } from '../../shared/icon/icon.component';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
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
import { InformeService } from '../../core/services/informe.service';
import { textoError } from '../../core/utils/errores';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { DominioService } from '../../core/services/dominio.service';
import { ordenarPreguntasPorDominio } from '../../core/utils/orden-preguntas';
import { catchError, forkJoin, of } from 'rxjs';
import { OrganizacionResponse } from '../../core/services/models/organizacion.model';

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
    numero: number;
    dominio: string;
    pregunta: string;
    controlesISO27001: string[];
    controlesISO42001: string[];
  };
  prioridad: 'ALTA' | 'MEDIA';
  pesoDominio: number;
  recomendacion: string;
}

interface TendenciaVista {
  direccion: 'sube' | 'baja' | 'igual';
  simbolo: string;
  etiqueta: string;
  diferencia: number;
  nivelAnterior: string;
  coberturaAnterior: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [HeaderComponent, DatePipe, DecimalPipe, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  private evaluacionService = inject(EvaluacionService);
  private resultadoService = inject(ResultadoService);
  private recomendacionService = inject(RecomendacionService);
  private preguntaService = inject(PreguntaService);
  private respuestaService = inject(RespuestaService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private informeService = inject(InformeService);
  private organizacionService = inject(OrganizacionService);
  private dominioService = inject(DominioService);

  Math = Math;

  evaluacion: EvaluacionResponse | null = null;
  tendencia: TendenciaVista | null = null;
  analista = '';
  generandoInforme = false;

  get esJefe(): boolean {
    return this.authService.getRol() === 'JEFE_CIBERSEGURIDAD';
  }

  get esValidada(): boolean {
    return this.evaluacion?.estado === 'VALIDADA';
  }

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
    this.cargarSector(evaluacion.organizacionId);
    if (evaluacion.fechaFin) {
      this.fechaEvaluacion = new Date(evaluacion.fechaFin);
    }

    this.cargarResultado(evaluacion.id);
    this.cargarTendencia(evaluacion);
    if (this.esJefe) this.cargarAnalista(evaluacion);
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
      },
      error: (err) => {
        this.cargando = false;
        this.error = textoError(err, 'No se pudo cargar el resultado de la evaluación');
      }
    });
  }

  // ===== Tendencia respecto a la evaluación anterior de la misma organización =====

  private cargarTendencia(actual: EvaluacionResponse): void {
    const lista$ = this.esJefe
      ? this.evaluacionService.listarEvaluacionesEquipo()
      : this.evaluacionService.listarMisEvaluaciones();

    lista$.subscribe({
      next: (evaluaciones) => {
        const tiempo = (e: EvaluacionResponse) => new Date(e.fechaFin ?? e.fechaInicio).getTime();

        // Anterior = la última evaluación terminada de la misma organización, previa a la actual
        const anterior = evaluaciones
          .filter(e => e.id !== actual.id
            && e.organizacionId === actual.organizacionId
            && e.estado !== 'EN_CURSO'
            && tiempo(e) <= tiempo(actual))
          .sort((a, b) => tiempo(b) - tiempo(a))[0];

        if (!anterior) return;

        this.resultadoService.obtenerResultado(anterior.id).subscribe({
          next: (res) => this.calcularTendencia(res.coberturaGlobal, res.nivelMadurez),
          error: () => { /* sin tendencia */ }
        });
      },
      error: () => { /* sin tendencia */ }
    });
  }

  private calcularTendencia(coberturaAnterior: number, nivelAnterior: string): void {
    const anterior = Math.round(coberturaAnterior);
    const diferencia = this.coberturaGlobal - anterior;

    const direccion = diferencia > 0 ? 'sube' : diferencia < 0 ? 'baja' : 'igual';
    this.tendencia = {
      direccion,
      simbolo: direccion === 'sube' ? '↑' : direccion === 'baja' ? '↓' : '=',
      etiqueta: direccion === 'sube' ? 'Subió' : direccion === 'baja' ? 'Bajó' : 'Se mantuvo',
      diferencia,
      nivelAnterior,
      coberturaAnterior: anterior
    };
  }

  // El Jefe consulta su equipo para mostrar el nombre del analista en el informe
  private cargarAnalista(evaluacion: EvaluacionResponse): void {
    this.analista = `Analista #${evaluacion.analistaId}`;
    this.usuarioService.listarMiEquipo().subscribe({
      next: (equipo) => {
        const a = equipo.find(u => u.id === evaluacion.analistaId);
        if (a) this.analista = a.nombre;
      },
      error: () => { /* se conserva el identificador */ }
    });
  }

  // ===== Informes en PDF =====

  private datosInforme(final: boolean) {
    return {
      titulo: final ? 'Informe final de evaluación' : 'Resultados de evaluación',
      organizacion: this.organizacion,
      fecha: this.fechaEvaluacion,
      coberturaGlobal: this.coberturaGlobal,
      nivel: this.nombreMadurez,
      tendencia: this.tendencia
        ? `Respecto a la evaluación anterior: ${this.tendencia.etiqueta}` +
          (this.tendencia.diferencia !== 0 ? ` (${this.tendencia.diferencia > 0 ? '+' : ''}${this.tendencia.diferencia} pts)` : '') +
          ` · Anterior: ${this.tendencia.nivelAnterior} (${this.tendencia.coberturaAnterior}%)`
        : undefined,
      porDominio: this.resultadosDominio.map(d => ({ nombre: d.nombre, cobertura: d.cobertura, peso: d.peso * 100 })),
      recomendaciones: this.recomendaciones.map(r => ({
        prioridad: r.prioridad,
        pregunta: r.pregunta.numero,
        dominio: r.pregunta.dominio,
        pesoDominio: r.pesoDominio,
        texto: r.pregunta.pregunta,
        accion: r.recomendacion
      })),
      ...(final ? {
        analista: this.analista || `Analista #${this.evaluacion?.analistaId ?? ''}`,
        estado: 'Validada',
        observaciones: this.evaluacion?.observacion ?? ''
      } : {})
    };
  }

  private nombreArchivo(prefijo: string): string {
    const org = this.organizacion.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
    const f = this.fechaEvaluacion;
    const fecha = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
    return `${prefijo}-${org || 'organizacion'}-${fecha}.pdf`;
  }

  exportarInforme(): void {
    this.descargar(false, 'informe-madurez');
  }

  descargarInformeFinal(): void {
    if (!this.esValidada) return;
    this.descargar(true, 'informe-final');
  }

  private descargar(final: boolean, prefijo: string): void {
    if (this.generandoInforme || this.cargando) return;
    this.generandoInforme = true;
    try {
      this.informeService.descargar(this.datosInforme(final), this.nombreArchivo(prefijo));
    } finally {
      this.generandoInforme = false;
    }
  }

  private cargarPreguntasYRespuestas(evaluacionId: number): void {
    forkJoin({
      preguntas: this.preguntaService.listarPreguntas(),
      dominios: this.dominioService.listarDominios().pipe(catchError(() => of([])))
    }).subscribe(({ preguntas: lista, dominios }) => {
      // Mismo orden que el formulario de evaluación, para que "Pregunta N" coincida
      const preguntas = ordenarPreguntasPorDominio(lista, dominios);
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

  private cargarRecomendaciones(evaluacionId: number, preguntas: PreguntaResponse[]): void {
    this.recomendacionService.obtenerSugeridasPorEvaluacion(evaluacionId).subscribe(sugeridas => {
      this.recomendaciones = sugeridas.map(s => {
        const p = preguntas.find(x => x.id === s.preguntaId);
        const dominio = this.resultadosDominio.find(d => d.nombre === s.dominioNombre);

        return {
          pregunta: {
            id: s.preguntaId,
            numero: this.numeroPregunta(preguntas, s.preguntaId),
            dominio: s.dominioNombre,
            pregunta: s.preguntaTexto,
            controlesISO27001: p?.controles.filter(c => c.norma === 'ISO_27001').map(c => c.anexoA) ?? [],
            controlesISO42001: p?.controles.filter(c => c.norma === 'ISO_42001').map(c => c.anexoA) ?? []
          },
          prioridad: (s.nivelRespondido === 'NO_EXISTE' ? 'ALTA' : 'MEDIA') as 'ALTA' | 'MEDIA',
          pesoDominio: (dominio?.peso ?? 0) * 100,
          recomendacion: s.recomendacionDescripcion
        };
      });

      // Prioridad (ALTA, luego MEDIA) -> peso del dominio (mayor a menor) -> número de pregunta
      this.recomendaciones.sort((a, b) => {
        if (a.prioridad !== b.prioridad) return a.prioridad === 'ALTA' ? -1 : 1;
        if (a.pesoDominio !== b.pesoDominio) return b.pesoDominio - a.pesoDominio;
        return a.pregunta.numero - b.pregunta.numero;
      });
    });
  }

  /** Número de la pregunta según su orden en la evaluación (el mismo que ve el Analista). */
  private numeroPregunta(preguntas: PreguntaResponse[], preguntaId: number): number {
    const indice = preguntas.findIndex(p => p.id === preguntaId);
    return indice === -1 ? preguntaId : indice + 1;
  }

  /**
   * El sector no viene en la evaluación: se busca en "mi organización" (Analista/Jefe)
   * y, si no coincide, en la lista de organizaciones (Administrador/Gerente).
   */
  private cargarSector(organizacionId: number): void {
    const aplicar = (org: OrganizacionResponse | undefined): boolean => {
      if (org && org.id === organizacionId && org.sector) {
        this.sector = org.sector;
        return true;
      }
      return false;
    };
    const buscarEnLista = () => this.organizacionService.listarOrganizaciones().subscribe({
      next: (orgs) => { aplicar(orgs.find(o => o.id === organizacionId)); },
      error: () => { /* se conserva "—" */ }
    });
    this.organizacionService.obtenerMiOrganizacion().subscribe({
      next: (org) => { if (!aplicar(org)) buscarEnLista(); },
      error: () => buscarEnLista()
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
