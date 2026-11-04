import { HeaderComponent } from '../header/header.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { RespuestaService } from '../../core/services/respuesta.service';
import { PreguntaService } from '../../core/services/pregunta.service';
import { EvaluacionResponse } from '../../core/services/models/evaluacion.model';
import { forkJoin, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [HeaderComponent, IconComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit {

  private authService = inject(AuthService);
  private evaluacionService = inject(EvaluacionService);
  private respuestaService = inject(RespuestaService);
  private preguntaService = inject(PreguntaService);

  // Evaluación "En curso" del analista (la más reciente) con su avance
  enCurso: { evaluacion: EvaluacionResponse; respondidas: number; total: number; porcentaje: number } | null = null;

  ngOnInit(): void {
    if (this.esAnalista) {
      this.cargarEnCurso();
    }
  }

  private cargarEnCurso(): void {
    this.evaluacionService.listarMisEvaluaciones().pipe(
      switchMap(lista => {
        const evaluacion = lista
          .filter(e => e.estado === 'EN_CURSO')
          .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())[0];

        if (!evaluacion) return of(null);

        return forkJoin({
          evaluacion: of(evaluacion),
          respuestas: this.respuestaService.listarRespuestas(evaluacion.id),
          preguntas: this.preguntaService.listarPreguntas()
        });
      })
    ).subscribe({
      next: (datos) => {
        if (!datos) {
          this.enCurso = null;
          return;
        }

        const respondidas = new Set(datos.respuestas.map(r => r.preguntaId)).size;
        const total = datos.preguntas.length;

        this.enCurso = {
          evaluacion: datos.evaluacion,
          respondidas,
          total,
          porcentaje: total ? Math.round((respondidas / total) * 100) : 0
        };
      },
      // Si no se puede consultar, simplemente no se muestra la tarjeta
      error: () => { this.enCurso = null; }
    });
  }

  ContinuarEvaluacion(): void {
    if (!this.enCurso) return;

    this.evaluacionService.setEvaluacionActual(this.enCurso.evaluacion);
    this.router.navigate(['/evaluacion']);
  }

  constructor(private router: Router) {}

  get esAnalista(): boolean {
    return this.authService.getRol() === 'ANALISTA_CIBERSEGURIDAD';
  }

  get esJefe(): boolean {
    return this.authService.getRol() === 'JEFE_CIBERSEGURIDAD';
  }

  IniciarEvaluacion(): void {
    this.router.navigate(['/organizaciones']);
  }

  VerEvaluaciones(): void {
    this.router.navigate(['/resultados']);
  }

  VerEquipo(): void {
    this.router.navigate(['/equipo']);
  }
  get esAdmin(): boolean {
    return this.authService.getRol() === 'ADMINISTRADOR';
  }

  VerAdmin(): void {
    this.router.navigate(['/admin']);
  }
}