import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

  private authService = inject(AuthService);

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