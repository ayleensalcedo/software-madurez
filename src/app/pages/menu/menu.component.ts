import { HeaderComponent } from '../header/header.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { PreguntaService } from '../../core/services/pregunta.service';
import { RespuestaService } from '../../core/services/respuesta.service';
import { EvaluacionResponse } from '../../core/services/models/evaluacion.model';

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
  private preguntaService = inject(PreguntaService);
  private respuestaService = inject(RespuestaService);

  constructor(private router: Router) {}

  // Evaluación "En curso" del analista (si tiene una) y su avance
  enCurso: EvaluacionResponse | null = null;
  avanceRespondidas = 0;
  avanceTotal = 0;
  continuando = false;

  ngOnInit(): void {
    if (this.esAnalista) {
      this.cargarEvaluacionEnCurso();
    }
  }

  private cargarEvaluacionEnCurso(): void {
    this.evaluacionService.listarMisEvaluaciones().subscribe({
      next: (evaluaciones) => {
        // La más reciente que siga en curso
        const enCurso = evaluaciones
          .filter(e => e.estado === 'EN_CURSO')
          .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())[0];

        if (!enCurso) return;

        forkJoin({
          preguntas: this.preguntaService.listarPreguntas(),
          respuestas: this.respuestaService.listarRespuestas(enCurso.id)
        }).subscribe({
          next: ({ preguntas, respuestas }) => {
            this.avanceTotal = preguntas.length;
            this.avanceRespondidas = preguntas.filter(p => respuestas.some(r => r.preguntaId === p.id)).length;
            this.enCurso = enCurso;
          },
          // Sin el avance igual se puede continuar
          error: () => { this.enCurso = enCurso; }
        });
      },
      error: () => { /* silencioso: solo se omite la tarjeta */ }
    });
  }

  get porcentajeAvance(): number {
    return this.avanceTotal === 0 ? 0 : Math.round((this.avanceRespondidas / this.avanceTotal) * 100);
  }

  continuarEvaluacion(): void {
    if (!this.enCurso || this.continuando) return;
    this.continuando = true;

    this.evaluacionService.obtenerEvaluacion(this.enCurso.id).subscribe({
      next: () => this.router.navigate(['/evaluacion']),
      error: () => { this.continuando = false; }
    });
  }

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
