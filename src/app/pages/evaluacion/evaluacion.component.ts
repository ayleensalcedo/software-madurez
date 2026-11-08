import { IconComponent } from '../../shared/icon/icon.component';
import { Component, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { PreguntaService } from '../../core/services/pregunta.service';
import { DominioService } from '../../core/services/dominio.service';
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
export class EvaluacionComponent implements OnInit {

  private evaluacionService = inject(EvaluacionService);
  private preguntaService = inject(PreguntaService);
  private dominioService = inject(DominioService);
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

        // Todos los dominios configurados, incluso los que aún no tienen preguntas
        this.dominioService.listarDominios().subscribe({
          next: (dominios) => {
            this.completarDominios(dominios);
            this.cargarRespuestasPrevias();
          },
          error: () => this.cargarRespuestasPrevias()
        });
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

  // Los dominios con preguntas conservan el orden de las preguntas (así "Dominio 1" corresponde a la
  // "Pregunta 1"); los configurados que aún no tienen preguntas se agregan al final.
  private completarDominios(configurados: { id: number; nombre: string }[]): void {
    configurados
      .slice()
      .sort((a, b) => a.id - b.id)
      .forEach(d => {
        if (!this.dominios.some(x => x.id === d.id)) {
          this.dominios.push({ id: d.id, nombre: d.nombre });
        }
      });
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

  // Aviso temporal al avanzar sin responder
  avisoSinRespuesta = false;
  private temporizadorAviso?: ReturnType<typeof setTimeout>;

  private mostrarAviso(): void {
    this.avisoSinRespuesta = true;
    clearTimeout(this.temporizadorAviso);
    this.temporizadorAviso = setTimeout(() => this.avisoSinRespuesta = false, 5000);
  }

  cerrarAviso(): void {
    clearTimeout(this.temporizadorAviso);
    this.avisoSinRespuesta = false;
  }

  siguiente(): void {
    // Se puede avanzar sin responder, pero se advierte que queda pendiente
    if (!this.respuestaActual) {
      this.mostrarAviso();
    }

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
      this.cerrarAviso();
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

  // Ventana de confirmación que aparece al guardar el avance
  avanceGuardado = false;

  // Al abrirse la ventana, el foco pasa al botón "Entendido"
  @ViewChild('btnEntendido')
  set btnEntendido(ref: ElementRef<HTMLButtonElement> | undefined) {
    ref?.nativeElement.focus();
  }

  get totalRespondidas(): number {
    return this.preguntas.filter(p => this.respuestasGuardadas.has(p.id)).length;
  }

  /**
   * Cada respuesta se registra en el servidor en cuanto se selecciona, por lo que
   * el avance ya está persistido. Esta acción lo confirma con una ventana; al pulsar
   * "Entendido" se vuelve al panel principal.
   */
  guardarAvance(): void {
    if (this.guardando || this.avanceGuardado) return;

    this.error = '';
    this.avanceGuardado = true;
  }

  entendido(): void {
    this.router.navigate(['/menu']);
  }

  // ----- Preguntas pendientes -----

  // Se activa al intentar finalizar con preguntas sin responder: las omitidas se resaltan en rojo
  intentoFinalizar = false;

  // Ventanas: resumen de pendientes (bloqueo o consulta) y confirmación de finalizar
  ventanaPendientes: 'bloqueo' | 'consulta' | null = null;
  confirmandoFinalizar = false;

  get ventanaAbierta(): boolean {
    return this.avanceGuardado || this.ventanaPendientes !== null || this.confirmandoFinalizar;
  }

  esOmitida(indice: number): boolean {
    return this.intentoFinalizar && !this.estaRespondida(indice);
  }

  // Pendientes agrupadas por dominio, con su número de pregunta (1..N) en la evaluación
  get pendientesPorDominio(): { id: number; numero: number; nombre: string; preguntas: number[]; texto: string }[] {
    return this.dominiosVista
      .map((d, i) => {
        const preguntas = d.indices.filter(idx => !this.estaRespondida(idx)).map(idx => idx + 1);
        return {
          id: d.id,
          numero: i + 1,
          nombre: d.nombre,
          preguntas,
          texto: this.listaNumeros(preguntas)
        };
      })
      .filter(d => d.preguntas.length > 0);
  }

  get totalPendientes(): number {
    return this.preguntas.length - this.totalRespondidas;
  }

  // "5", "5 y 12", "3, 5 y 12"
  private listaNumeros(numeros: number[]): string {
    if (numeros.length <= 1) return numeros.join('');
    return `${numeros.slice(0, -1).join(', ')} y ${numeros[numeros.length - 1]}`;
  }

  verPendientes(): void {
    if (this.totalPendientes === 0) return;
    this.ventanaPendientes = 'consulta';
  }

  cerrarPendientes(): void {
    this.ventanaPendientes = null;
  }

  // Desde el resumen: lleva directamente a la pregunta
  irAPendiente(numeroPregunta: number): void {
    this.ventanaPendientes = null;
    this.irAPregunta(numeroPregunta - 1);
  }

  porcentajeDominio(d: { respondidas: number; indices: number[] }): number {
    return d.indices.length === 0 ? 0 : Math.round((d.respondidas / d.indices.length) * 100);
  }

  // ----- Finalizar -----

  finalizando = false;

  finalizarEvaluacion(): void {
    if (this.finalizando) return;

    if (!this.todasRespondidas()) {
      this.error = '';
      this.intentoFinalizar = true;
      this.ventanaPendientes = 'bloqueo';
      return;
    }

    this.confirmandoFinalizar = true;
  }

  cancelarFinalizar(): void {
    this.confirmandoFinalizar = false;
  }

  confirmarFinalizar(): void {
    if (this.finalizando) return;
    this.finalizando = true;

    this.evaluacionService.finalizarEvaluacion(this.evaluacionId).pipe(
      switchMap(() => this.evaluacionService.obtenerEvaluacion(this.evaluacionId))
    ).subscribe({
      next: () => {
        this.finalizando = false;
        this.confirmandoFinalizar = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.finalizando = false;
        this.confirmandoFinalizar = false;
        this.error = typeof err.error === 'string'
          ? err.error
          : (err.error?.message ?? 'No se pudo finalizar la evaluación');
      }
    });
  }

  @HostListener('document:keydown.escape')
  cerrarVentanas(): void {
    if (this.finalizando) return;
    this.ventanaPendientes = null;
    this.confirmandoFinalizar = false;
  }
}
