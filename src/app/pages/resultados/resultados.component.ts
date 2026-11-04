import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { EvaluacionResponse } from '../../core/services/models/evaluacion.model';
import { DatePipe } from '@angular/common';
import { IconComponent, NombreIcono } from '../../shared/icon/icon.component';
@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [HeaderComponent, IconComponent, DatePipe],
  templateUrl: './resultados.component.html',
  styleUrl: './resultados.component.css'
})
export class ResultadosComponent implements OnInit {

  private evaluacionService = inject(EvaluacionService);
  private router = inject(Router);

  evaluaciones: EvaluacionResponse[] = [];

  // Pestañas por estado (null = todas)
  readonly pestanas: { estado: string | null; etiqueta: string }[] = [
    { estado: null, etiqueta: 'Todas' },
    { estado: 'EN_CURSO', etiqueta: 'En curso' },
    { estado: 'FINALIZADA', etiqueta: 'Finalizadas' },
    { estado: 'VALIDADA', etiqueta: 'Validadas' },
    { estado: 'OBSERVADA', etiqueta: 'Observadas' }
  ];

  pestanaActiva: string | null = null;
  cargando: boolean = true;
  error: string = '';

  ngOnInit(): void {
    this.evaluacionService.listarMisEvaluaciones().subscribe({
      next: (evaluaciones) => {
        // Más reciente primero
        this.evaluaciones = evaluaciones.sort((a, b) =>
          new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
        );
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = typeof err.error === 'string' && err.error
          ? err.error
          : 'No se pudieron cargar las evaluaciones';
      }
    });
  }

  continuarOVerResultado(evaluacion: EvaluacionResponse): void {
    this.evaluacionService.setEvaluacionActual(evaluacion);

    if (evaluacion.estado === 'EN_CURSO') {
      this.router.navigate(['/evaluacion']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'EN_CURSO': return 'En curso';
      case 'FINALIZADA': return 'Finalizada';
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

  // ===== Pestañas y filtros =====

  contador(estado: string | null): number {
    return estado ? this.evaluaciones.filter(e => e.estado === estado).length : this.evaluaciones.length;
  }

  get filtradas(): EvaluacionResponse[] {
    return this.pestanaActiva
      ? this.evaluaciones.filter(e => e.estado === this.pestanaActiva)
      : this.evaluaciones;
  }

  iconoEstado(estado: string): NombreIcono {
    switch (estado) {
      case 'EN_CURSO': return 'clock';
      case 'FINALIZADA': return 'clipboard-check';
      case 'VALIDADA': return 'shield-check';
      case 'OBSERVADA': return 'circle-alert';
      default: return 'clipboard-list';
    }
  }

  nuevaEvaluacion(): void {
    this.router.navigate(['/organizaciones']);
  }
}
