import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { OrganizacionResponse } from '../../core/services/models/organizacion.model';

@Component({
  selector: 'app-organizaciones',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './organizaciones.component.html',
  styleUrl: './organizaciones.component.css'
})
export class OrganizacionesComponent implements OnInit {

  private evaluacionService = inject(EvaluacionService);
  private organizacionService = inject(OrganizacionService);
  private router = inject(Router);

  organizacion: OrganizacionResponse | null = null;

  cargando: boolean = true;
  iniciando: boolean = false;
  error: string = '';

  ngOnInit(): void {
    this.organizacionService.obtenerMiOrganizacion().subscribe({
      next: (org) => {
        this.organizacion = org;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error ?? 'No tienes una organización asignada. Contacta a tu Jefe de ciberseguridad.';
      }
    });
  }

  IniciarEvaluacion(): void {
    this.error = '';
    this.iniciando = true;

    this.evaluacionService.iniciarEvaluacion().subscribe({
      next: () => {
        this.iniciando = false;
        this.router.navigate(['/evaluacion']);
      },
      error: (err) => {
        this.iniciando = false;
        this.error = err.error ?? 'No se pudo iniciar la evaluación';
      }
    });
  }
}