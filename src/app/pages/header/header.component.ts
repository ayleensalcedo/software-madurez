import { IconComponent } from '../../shared/icon/icon.component';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  private authService = inject(AuthService);

  usuario = this.authService.usuario;

  constructor(private router: Router) {}

  private readonly ETIQUETAS_ROL: Record<string, string> = {
    ADMINISTRADOR: 'Administrador',
    JEFE_CIBERSEGURIDAD: 'Jefe de ciberseguridad',
    ANALISTA_CIBERSEGURIDAD: 'Analista de ciberseguridad',
    GERENTE_GENERAL: 'Gerente general'
  };

  get rolLegible(): string {
    const rol = this.usuario()?.rol ?? '';
    return this.ETIQUETAS_ROL[rol] ?? rol;
  }

  IrInicio(): void {
    this.router.navigate(['/menu']);
  }

  Logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}