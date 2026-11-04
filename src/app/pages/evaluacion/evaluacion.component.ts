import { IconComponent } from '../../shared/icon/icon.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
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
  imports: [HeaderComponent, IconComponent, ModalComponent, NgTemplateOutlet],
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

  // Normas de la pregunta con ISO 27001 primero, para un orden consistente
  get controlesOrdenados() {
    return this.pregunta.controles.slice().sort((a, b) => a.norma.localeCompare(b.norma));
  }

  get porcentajeRespondido(): number {
    if (this.preguntas.length === 0) return 0;
    return Math.round((this.totalRespondidas / this.preguntas.length) * 100);
  }

  estaRespondida(indice: number): boolean {
    return this.respuestasGuardadas.has(this.preguntas[indice].id);
  }

  // Avance por dominio: índices de sus preguntas y cuántas están respondidas
  get dominiosVista(): { id: number; nombre: string; indices: number[]; respondidas: number; porcentaje: number; completo: boolean; activo: boolean }[] {
    return this.dominios.map(d => {
      const indices = this.preguntas
        .map((p, i) => (p.dominioId === d.id ? i : -1))
        .filter(i => i !== -1);

      const respondidas = indices.filter(i => this.estaRespondida(i)).length;
      const porcentaje = indices.length ? Math.round((respondidas / indices.length) * 100) : 0;

      return {
        id: d.id,
        nombre: d.nombre,
        indices,
        respondidas,
        porcentaje,
        completo: indices.length > 0 && respondidas === indices.length,
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
      // Avanzar sin responder está permitido, pero se advierte
      if (!this.respuestaActual) {
        this.avisar('Esta pregunta aún no tiene respuesta. Podrás volver a ella antes de finalizar.');
      }

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

  get totalRespondidas(): number {
    return this.preguntas.filter(p => this.respuestasGuardadas.has(p.id)).length;
  }

  get totalPendientes(): number {
    return this.preguntas.length - this.totalRespondidas;
  }

  // ===== Advertencia no bloqueante =====

  advertencia = '';
  private temporizadorAdvertencia?: ReturnType<typeof setTimeout>;

  private avisar(texto: string): void {
    clearTimeout(this.temporizadorAdvertencia);
    this.advertencia = texto;
    this.temporizadorAdvertencia = setTimeout(() => (this.advertencia = ''), 5000);
  }

  cerrarAdvertencia(): void {
    clearTimeout(this.temporizadorAdvertencia);
    this.advertencia = '';
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizadorAdvertencia);
  }

  // ===== Preguntas pendientes =====

  // Se activa tras un intento de finalizar con preguntas sin responder: las marca en rojo en la barra de avance
  mostrarOmitidas = false;

  esOmitida(indice: number): boolean {
    return this.mostrarOmitidas && !this.estaRespondida(indice);
  }

  // Preguntas sin responder agrupadas por dominio (con su número en la evaluación)
  get pendientesPorDominio(): { id: number; posicion: number; nombre: string; preguntas: { indice: number; numero: number }[] }[] {
    return this.dominiosVista
      .map((d, i) => ({
        id: d.id,
        posicion: i + 1,
        nombre: d.nombre,
        preguntas: d.indices.filter(idx => !this.estaRespondida(idx)).map(idx => ({ indice: idx, numero: idx + 1 }))
      }))
      .filter(d => d.preguntas.length > 0);
  }

  // Mensaje de bloqueo al intentar finalizar con preguntas pendientes
  get lineasBloqueo(): string[] {
    return this.pendientesPorDominio.map(d =>
      `Existen ${d.preguntas.length} pregunta(s) pendiente(s) por responder en el dominio ${d.nombre}.`
    );
  }

  irAPendiente(indice: number): void {
    this.ventana = null;
    this.irAPregunta(indice);
  }

  irAPrimeraPendiente(): void {
    const primera = this.pendientesPorDominio[0]?.preguntas[0];
    if (primera) this.irAPendiente(primera.indice);
  }

  // ===== Ventanas emergentes =====

  ventana: 'guardado' | 'pendientes' | 'bloqueo' | 'confirmar' | null = null;

  cerrarVentana(): void {
    this.ventana = null;
  }

  abrirPendientes(): void {
    this.ventana = 'pendientes';
  }

  /**
   * Cada respuesta se registra en el servidor en cuanto se selecciona, por lo que
   * el avance ya está persistido. Esta acción lo confirma con una ventana; al pulsar
   * "Entendido" se vuelve al panel principal.
   */
  guardarAvance(): void {
    if (this.guardando || this.ventana) return;

    this.error = '';
    this.ventana = 'guardado';
  }

  entendido(): void {
    this.router.navigate(['/menu']);
  }

  // ===== Finalizar =====

  finalizando = false;

  intentarFinalizar(): void {
    if (this.finalizando || this.ventana) return;

    if (this.guardando) {
      this.avisar('Se está guardando una respuesta. Inténtalo de nuevo en un momento.');
      return;
    }

    this.error = '';

    // Con preguntas sin responder no se puede finalizar: se detallan y se marcan en rojo
    if (this.totalPendientes > 0) {
      this.mostrarOmitidas = true;
      this.ventana = 'bloqueo';
      return;
    }

    this.ventana = 'confirmar';
  }

  confirmarFinalizacion(): void {
    this.ventana = null;

    if (!this.todasRespondidas()) {
      this.mostrarOmitidas = true;
      this.ventana = 'bloqueo';
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
