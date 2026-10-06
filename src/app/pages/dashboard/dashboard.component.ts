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
  };
  prioridad: 'ALTA' | 'MEDIA';
  recomendacion: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [HeaderComponent, DatePipe],
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
            controlesISO42001: p?.controles.filter(c => c.norma === 'ISO_42001').map(c => c.anexoA) ?? []
          },
          prioridad: (s.nivelRespondido === 'NO_EXISTE' ? 'ALTA' : 'MEDIA') as 'ALTA' | 'MEDIA',
          recomendacion: s.recomendacionDescripcion
        };
      });

      this.recomendaciones.sort((a, b) => {
        if (a.prioridad === b.prioridad) return 0;
        return a.prioridad === 'ALTA' ? -1 : 1;
      });
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
