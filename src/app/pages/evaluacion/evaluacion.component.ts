import { IconComponent } from '../../shared/icon/icon.component';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { PreguntaService } from '../../core/services/pregunta.service';
import { RespuestaService } from '../../core/services/respuesta.service';
import { PreguntaResponse } from '../../core/services/models/pregunta.model';
import { NivelImplementacion } from '../../core/services/models/respuesta.model';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-evaluacion',
  standalone: true,
  imports: [HeaderComponent, IconComponent],
  templateUrl: './evaluacion.component.html',
  styleUrl: './evaluacion.component.css'
})
export class EvaluacionComponent implements OnInit, OnDestroy {

  private evaluacionService = inject(EvaluacionService);
  private preguntaService = inject(PreguntaService);
  private respuestaService = inject(RespuestaService);
  private router = inject(Router);

  preguntas: PreguntaResponse[] = [];
  preguntaActual: number = 0;

  // Respuesta guardada por preguntaId (recuperadas del backend o elegidas en esta sesión)
  respuestasGuardadas = new Map<number, NivelImplementacion>();

  cargando: boolean = true;
  // Respuestas elegidas que el servidor aún no confirmó (se muestran al instante)
  private pendientes = new Map<number, NivelImplementacion>();

  get guardando(): boolean {
    return this.pendientes.size > 0;
  }

  get guardandoActual(): boolean {
    return this.pendientes.has(this.pregunta.id);
  }
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
        this.posicionarEnPrimeraPendiente();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  // Al retomar una evaluación se continúa donde se quedó: primera pregunta sin responder
  private posicionarEnPrimeraPendiente(): void {
    const pendiente = this.preguntas.findIndex(p => !this.respuestasGuardadas.has(p.id));
    this.preguntaActual = pendiente === -1 ? this.preguntas.length - 1 : pendiente;
  }

  get pregunta(): PreguntaResponse {
    return this.preguntas[this.preguntaActual];
  }

  get respuestaActual(): NivelImplementacion | undefined {
    return this.pendientes.get(this.pregunta.id) ?? this.respuestasGuardadas.get(this.pregunta.id);
  }

  get porcentajeRespondido(): number {
    if (this.preguntas.length === 0) return 0;
    return Math.round((this.totalRespondidas / this.preguntas.length) * 100);
  }

  estaRespondida(indice: number): boolean {
    return this.respuestasGuardadas.has(this.preguntas[indice].id);
  }

  // Avance por dominio: índices de sus preguntas y cuántas están respondidas
  get dominiosVista(): { id: number; nombre: string; indices: number[]; respondidas: number; activo: boolean }[] {
    return this.dominios.map(d => {
      const indices = this.preguntas
        .map((p, i) => (p.dominioId === d.id ? i : -1))
        .filter(i => i !== -1);

      return {
        id: d.id,
        nombre: d.nombre,
        indices,
        respondidas: indices.filter(i => this.estaRespondida(i)).length,
        activo: indices.includes(this.preguntaActual)
      };
    });
  }

  readonly opciones: { valor: NivelImplementacion; numero: number; titulo: string; descripcion: string }[] = [
    { valor: 'NO_EXISTE', numero: 1, titulo: 'No existe', descripcion: 'No existe ningún mecanismo o práctica relacionada con este aspecto.' },
    { valor: 'EXISTE_PARCIALMENTE', numero: 2, titulo: 'Existe parcialmente', descripcion: 'Existen algunas prácticas, pero su implementación es limitada.' },
    { valor: 'EXISTE_NO_FORMALIZADO', numero: 3, titulo: 'Existe, pero no formalizado', descripcion: 'La práctica existe, pero no se encuentra formalmente documentada.' },
    { valor: 'IMPLEMENTADO', numero: 4, titulo: 'Implementado', descripcion: 'El mecanismo se encuentra implementado formalmente en la organización.' }
  ];

  seleccionarRespuesta(valor: NivelImplementacion): void {
    this.error = '';

    // Se fija el id ahora: el usuario podría cambiar de pregunta antes de que responda el servidor
    const preguntaId = this.pregunta.id;
    this.pendientes.set(preguntaId, valor);

    this.respuestaService.guardarRespuesta(this.evaluacionId, {
      preguntaId,
      nivelImplementacion: valor
    }).subscribe({
      next: () => {
        this.respuestasGuardadas.set(preguntaId, valor);
        if (this.pendientes.get(preguntaId) === valor) this.pendientes.delete(preguntaId);
      },
      error: (err) => {
        if (this.pendientes.get(preguntaId) === valor) this.pendientes.delete(preguntaId);
        this.error = typeof err.error === 'string' && err.error
          ? err.error
          : 'No se pudo guardar la respuesta';
      }
    });
  }

  siguiente(): void {
    if (this.preguntaActual < this.preguntas.length - 1) {
      this.preguntaActual++;
    }
  }

  anterior(): void {
    if (this.preguntaActual > 0) {
      this.preguntaActual--;
    }
  }

  irAPregunta(indice: number): void {
    if (indice >= 0 && indice < this.preguntas.length) {
      this.preguntaActual = indice;
      this.error = '';
    }
  }

  irAlDominio(nombreDominio: string): void {
    const index = this.preguntas.findIndex(p => p.dominioNombre === nombreDominio);
    if (index !== -1) {
      this.preguntaActual = index;
    }
  }

  todasRespondidas(): boolean {
    return this.preguntas.every(p => this.respuestasGuardadas.has(p.id));
  }

  mensajeAvance: string = '';
  guardandoAvance: boolean = false;
  private temporizadorAvance?: ReturnType<typeof setTimeout>;

  get totalRespondidas(): number {
    return this.preguntas.filter(p => this.respuestasGuardadas.has(p.id)).length;
  }

  /**
   * Cada respuesta se registra en el servidor en cuanto se selecciona, por lo que
   * el avance ya está persistido. Esta acción lo confirma y devuelve al usuario a
   * "Mis evaluaciones", desde donde puede retomar la evaluación en curso.
   */
  guardarAvance(): void {
    if (this.guardando || this.guardandoAvance) return;

    this.error = '';
    this.guardandoAvance = true;
    this.mensajeAvance = `Avance guardado: ${this.totalRespondidas} de ${this.preguntas.length} preguntas respondidas.`;

    this.temporizadorAvance = setTimeout(() => this.router.navigate(['/resultados']), 1200);
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizadorAvance);
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
      switchMap(() => this.evaluacionService.obtenerEvaluacion(this.evaluacionId))
    ).subscribe({
      next: () => {
        this.finalizando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.finalizando = false;
        this.error = typeof err.error === 'string'
          ? err.error
          : (err.error?.message ?? 'No se pudo finalizar la evaluación');
      }
    });
  }
}
