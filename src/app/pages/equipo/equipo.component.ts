import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { EvaluacionResponse } from '../../core/services/models/evaluacion.model';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioResponse } from '../../core/services/models/usuario.model';

@Component({
  selector: 'app-equipo',
  standalone: true,
  imports: [HeaderComponent, DatePipe, FormsModule],
  templateUrl: './equipo.component.html',
  styleUrl: './equipo.component.css'
})
export class EquipoComponent implements OnInit {

  private evaluacionService = inject(EvaluacionService);
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);

  evaluaciones: EvaluacionResponse[] = [];
  cargando: boolean = true;
  error: string = '';

  evaluacionParaObservar: EvaluacionResponse | null = null;
  textoObservacion: string = '';

  // ===== Pestañas: evaluaciones / analistas de mi equipo =====

  pestana: 'evaluaciones' | 'analistas' = 'evaluaciones';
  analistas: UsuarioResponse[] = [];
  cargandoAnalistas = true;
  errorAnalistas = '';
  analistaDetalle: UsuarioResponse | null = null;

  ngOnInit(): void {
    this.cargar();
    this.cargarAnalistas();
  }

  private cargarAnalistas(): void {
    this.cargandoAnalistas = true;
    this.usuarioService.listarMiEquipo().subscribe({
      next: (equipo) => {
        this.analistas = equipo
          .filter(u => u.rol === 'ANALISTA_CIBERSEGURIDAD')
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        this.cargandoAnalistas = false;
      },
      error: (err) => {
        this.cargandoAnalistas = false;
        this.errorAnalistas = typeof err.error === 'string' && err.error
          ? err.error
          : 'No se pudo cargar a los analistas de tu equipo';
      }
    });
  }

  // Evaluaciones de un analista (la evaluación trae su analistaId)
  evaluacionesDe(analista: UsuarioResponse): EvaluacionResponse[] {
    return this.evaluaciones.filter(e => e.analistaId === analista.id);
  }

  enCurso(analista: UsuarioResponse): number {
    return this.evaluacionesDe(analista).filter(e => e.estado === 'EN_CURSO').length;
  }

  finalizadas(analista: UsuarioResponse): number {
    return this.evaluacionesDe(analista).filter(e => e.estado !== 'EN_CURSO').length;
  }

  verDetalleAnalista(analista: UsuarioResponse): void {
    this.analistaDetalle = analista;
  }

  volverAAnalistas(): void {
    this.analistaDetalle = null;
  }

  iniciales(nombre: string): string {
    const p = nombre.trim().split(/\s+/).filter(Boolean);
    return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }

  private cargar(): void {
    this.cargando = true;
    this.evaluacionService.listarEvaluacionesEquipo().subscribe({
      next: (evaluaciones) => {
        this.evaluaciones = evaluaciones.sort((a, b) =>
          new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
        );
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error ?? 'No se pudieron cargar las evaluaciones del equipo';
      }
    });
  }

  // ===== Comparar dos evaluaciones finalizadas =====

  seleccionadas: number[] = [];

  // Solo se comparan evaluaciones ya finalizadas (finalizada, validada u observada)
  puedeComparar(evaluacion: EvaluacionResponse): boolean {
    return evaluacion.estado !== 'EN_CURSO';
  }

  estaSeleccionada(evaluacion: EvaluacionResponse): boolean {
    return this.seleccionadas.includes(evaluacion.id);
  }

  // Con dos elegidas, el resto de casillas se bloquea hasta quitar una
  casillaBloqueada(evaluacion: EvaluacionResponse): boolean {
    return this.seleccionadas.length >= 2 && !this.estaSeleccionada(evaluacion);
  }

  alternarSeleccion(evaluacion: EvaluacionResponse): void {
    if (this.estaSeleccionada(evaluacion)) {
      this.seleccionadas = this.seleccionadas.filter(id => id !== evaluacion.id);
    } else if (this.seleccionadas.length < 2) {
      this.seleccionadas = [...this.seleccionadas, evaluacion.id];
    }
  }

  compararEvaluaciones(): void {
    if (this.seleccionadas.length !== 2) return;
    const [a, b] = this.seleccionadas;
    this.router.navigate(['/comparativa'], { queryParams: { a, b } });
  }

  verResultados(evaluacion: EvaluacionResponse): void {
    this.evaluacionService.setEvaluacionActual(evaluacion);
    this.router.navigate(['/dashboard']);
  }

  puedeRevisar(evaluacion: EvaluacionResponse): boolean {
    return evaluacion.estado === 'FINALIZADA';
  }

  validar(evaluacion: EvaluacionResponse): void {
    this.evaluacionService.validarEvaluacion(evaluacion.id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error = err.error ?? 'No se pudo validar la evaluación'
    });
  }

  abrirObservar(evaluacion: EvaluacionResponse): void {
    this.evaluacionParaObservar = evaluacion;
    this.textoObservacion = '';
  }

  cancelarObservar(): void {
    this.evaluacionParaObservar = null;
    this.textoObservacion = '';
  }

  confirmarObservar(): void {
    if (!this.evaluacionParaObservar || !this.textoObservacion.trim()) {
      return;
    }

    this.evaluacionService.observarEvaluacion(this.evaluacionParaObservar.id, this.textoObservacion).subscribe({
      next: () => {
        this.cancelarObservar();
        this.cargar();
      },
      error: (err) => this.error = err.error ?? 'No se pudo observar la evaluación'
    });
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'EN_CURSO': return 'En curso';
      case 'FINALIZADA': return 'Pendiente de revisión';
      case 'VALIDADA': return 'Validada';
      case 'OBSERVADA': return 'Observada';
      default: return estado;
    }
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'EN_CURSO': return 'estado-en-curso';
      case 'FINALIZADA': return 'estado-finalizada';
      case 'VALIDADA': return 'estado-validada';
      case 'OBSERVADA': return 'estado-observada';
      default: return '';
    }
  }
}