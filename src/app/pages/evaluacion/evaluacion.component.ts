import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { PreguntaService } from '../../core/services/pregunta.service';
import { RespuestaService } from '../../core/services/respuesta.service';
import { RecomendacionService } from '../../core/services/recomendacion.service';
import { PreguntaResponse } from '../../core/services/models/pregunta.model';
import { NivelImplementacion } from '../../core/services/models/respuesta.model';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-evaluacion',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './evaluacion.component.html',
  styleUrl: './evaluacion.component.css'
})
export class EvaluacionComponent implements OnInit {

  private evaluacionService = inject(EvaluacionService);
  private preguntaService = inject(PreguntaService);
  private respuestaService = inject(RespuestaService);
  private recomendacionService = inject(RecomendacionService);
  private router = inject(Router);

  preguntas: PreguntaResponse[] = [];
  preguntaActual: number = 0;

  // Respuesta guardada por preguntaId (recuperadas del backend o elegidas en esta sesión)
  respuestasGuardadas = new Map<number, NivelImplementacion>();
  recomendacionActual: string | null = null;

  cargando: boolean = true;
  guardando: boolean = false;
  error: string = '';

  dominios: { id: number; nombre: string }[] = [];

  evaluacionId!: number;
  organizacionNombre: string = '';

  ngOnInit(): void {
    this.evaluacionService.cargarEvaluacionActual().subscribe(evaluacion => {
      if (!evaluacion) {
        this.router.navigate(['/organizaciones']);
        return;
      }

      // Si ya está finalizada, no tiene sentido seguir respondiendo
      if (evaluacion.estado !== 'EN_CURSO') {
        this.router.navigate(['/dashboard']);
        return;
      }

      this.evaluacionId = evaluacion.id;
      this.organizacionNombre = evaluacion.organizacionNombre;
      this.cargarPreguntas();
    });
  }

  private cargarPreguntas(): void {
    this.preguntaService.listarPreguntas().subscribe({
      next: (preguntas) => {
        this.preguntas = preguntas;
        this.construirDominios();
        this.cargarRespuestasPrevias();
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudieron cargar las preguntas';
      }
    });
  }

  private construirDominios(): void {
    const vistos = new Set<number>();
    this.dominios = [];

    for (const p of this.preguntas) {
      if (!vistos.has(p.dominioId)) {
        vistos.add(p.dominioId);
        this.dominios.push({ id: p.dominioId, nombre: p.dominioNombre });
      }
    }
  }

  private cargarRespuestasPrevias(): void {
    this.respuestaService.listarRespuestas(this.evaluacionId).subscribe({
      next: (respuestas) => {
        respuestas.forEach(r => this.respuestasGuardadas.set(r.preguntaId, r.nivelImplementacion));
        this.cargando = false;
        this.actualizarRecomendacion();
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  get pregunta(): PreguntaResponse {
    return this.preguntas[this.preguntaActual];
  }

  get respuestaActual(): NivelImplementacion | undefined {
    return this.respuestasGuardadas.get(this.pregunta.id);
  }

  get porcentajeProgreso(): number {
    if (this.preguntas.length === 0) return 0;
    return Math.round(((this.preguntaActual + 1) / this.preguntas.length) * 100);
  }

  totalPreguntasPorDominio(nombreDominio: string): number {
    return this.preguntas.filter(p => p.dominioNombre === nombreDominio).length;
  }

  seleccionarRespuesta(valor: NivelImplementacion): void {
    this.guardando = true;
    this.error = '';

    this.respuestaService.guardarRespuesta(this.evaluacionId, {
      preguntaId: this.pregunta.id,
      nivelImplementacion: valor
    }).subscribe({
      next: () => {
        this.respuestasGuardadas.set(this.pregunta.id, valor);
        this.guardando = false;
        this.actualizarRecomendacion();
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.error ?? 'No se pudo guardar la respuesta';
      }
    });
  }

  private actualizarRecomendacion(): void {
    this.recomendacionActual = null;
    const nivel = this.respuestaActual;

    if (!nivel || nivel === 'IMPLEMENTADO' || nivel === 'EXISTE_NO_FORMALIZADO') {
      return;
    }

    this.recomendacionService.listarPorPregunta(this.pregunta.id).subscribe(recs => {
      const encontrada = recs.find(r => r.nivel === nivel);
      this.recomendacionActual = encontrada ? encontrada.descripcion : null;
    });
  }

  siguiente(): void {
    if (this.preguntaActual < this.preguntas.length - 1) {
      this.preguntaActual++;
      this.actualizarRecomendacion();
    }
  }

  anterior(): void {
    if (this.preguntaActual > 0) {
      this.preguntaActual--;
      this.actualizarRecomendacion();
    }
  }

  irAlDominio(nombreDominio: string): void {
    const index = this.preguntas.findIndex(p => p.dominioNombre === nombreDominio);
    if (index !== -1) {
      this.preguntaActual = index;
      this.actualizarRecomendacion();
    }
  }

  todasRespondidas(): boolean {
    return this.preguntas.every(p => this.respuestasGuardadas.has(p.id));
  }

  finalizando = false;
  
  finalizarEvaluacion(): void {
    if (!this.todasRespondidas()) {
      this.error = 'Debes responder todas las preguntas antes de finalizar.';
      return;
    }

    if (this.finalizando) return;
    this.finalizando = true;
    
    this.evaluacionService.finalizarEvaluacion(this.evaluacionId).pipe(
      switchMap(() => this.evaluacionService.obtenerEvaluacion(this.evaluacionId))).subscribe({
      next: () => {
        next: () => this.router.navigate(['/dashboard']),
        this.finalizando = false;
        this.error = err.error ?? 'No se pudo finalizar la evaluación';
      }
    });
  }
}
