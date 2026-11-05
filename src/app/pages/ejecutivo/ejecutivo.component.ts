import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { AuthService } from '../../core/services/auth.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { OrganizacionResponse } from '../../core/services/models/organizacion.model';
import { DashboardEjecutivo, DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-ejecutivo',
  standalone: true,
  imports: [HeaderComponent, IconComponent, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './ejecutivo.component.html',
  styleUrl: './ejecutivo.component.css'
})
export class EjecutivoComponent implements OnInit {

  private authService = inject(AuthService);
  private organizacionService = inject(OrganizacionService);
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  organizaciones: OrganizacionResponse[] = [];
  organizacionId: number | null = null;

  dashboard: DashboardEjecutivo | null = null;

  cargandoOrganizaciones = true;
  cargandoResultado = false;
  sinResultados = false;
  error = '';

  ngOnInit(): void {
    if (this.authService.getRol() !== 'GERENTE_GENERAL') {
      this.router.navigate(['/menu']);
      return;
    }

    this.organizacionService.listarOrganizaciones().subscribe({
      next: (orgs) => {
        this.organizaciones = orgs.sort((a, b) => a.nombre.localeCompare(b.nombre));
        this.cargandoOrganizaciones = false;

        // Con una sola organización se muestra directamente
        if (orgs.length === 1) {
          this.organizacionId = orgs[0].id;
          this.consultar();
        }
      },
      error: (err) => {
        this.cargandoOrganizaciones = false;
        this.error = typeof err.error === 'string' && err.error ? err.error : 'No se pudieron cargar las organizaciones';
      }
    });
  }

  consultar(): void {
    this.dashboard = null;
    this.sinResultados = false;
    this.error = '';

    if (!this.organizacionId) return;
    this.cargandoResultado = true;

    this.dashboardService.obtenerPorOrganizacion(Number(this.organizacionId)).subscribe({
      next: (d) => {
        this.dashboard = d;
        this.cargandoResultado = false;
      },
      error: (err) => {
        this.cargandoResultado = false;
        const texto = typeof err.error === 'string' ? err.error : '';

        // El backend responde 400 cuando la organización aún no tiene una evaluación finalizada
        if (err.status === 400 && texto.toLowerCase().includes('resultados')) {
          this.sinResultados = true;
        } else {
          this.error = texto || 'No se pudo cargar el dashboard de la organización';
        }
      }
    });
  }

  clase(cobertura: number): string {
    if (cobertura <= 40) return 'bajo';
    if (cobertura <= 60) return 'medio';
    if (cobertura <= 80) return 'alto';
    return 'optimo';
  }

  etiquetaTendencia(t: string): string {
    switch (t) {
      case 'SUBIO': return 'Subió respecto a la evaluación anterior';
      case 'BAJO': return 'Bajó respecto a la evaluación anterior';
      case 'MANTUVO': return 'Se mantuvo respecto a la evaluación anterior';
      default: return 'Sin evaluación anterior para comparar';
    }
  }

  simboloTendencia(t: string): string {
    return t === 'SUBIO' ? '↑' : t === 'BAJO' ? '↓' : t === 'MANTUVO' ? '=' : '–';
  }

  volver(): void {
    this.router.navigate(['/menu']);
  }
}
