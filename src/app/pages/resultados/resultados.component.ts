import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { EvaluacionResponse } from '../../core/services/models/evaluacion.model';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [HeaderComponent, DatePipe],
  templateUrl: './resultados.component.html',
  styleUrl: './resultados.component.css'
})
export class ResultadosComponent implements OnInit {

  private evaluacionService = inject(EvaluacionService);
  private router = inject(Router);

  evaluaciones: EvaluacionResponse[] = [];
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
        this.error = err.error ?? 'No se pudieron cargar las evaluaciones';
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
}