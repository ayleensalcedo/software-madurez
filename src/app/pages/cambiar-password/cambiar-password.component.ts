import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { textoError } from '../../core/utils/errores';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './cambiar-password.component.html',
  styleUrl: './cambiar-password.component.css'
})
export class CambiarPasswordComponent {

  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  readonly MINIMO = 6;

  actual = '';
  nueva = '';
  confirmar = '';

  // Se activa al intentar enviar: resalta en rojo los campos con problemas
  intento = false;
  guardando = false;
  error = '';

  get nombre(): string {
    return this.authService.getUsuario()?.nombre ?? '';
  }

  get errorActual(): boolean { return this.intento && !this.actual; }
  get errorNueva(): boolean { return this.intento && this.nueva.length < this.MINIMO; }
  get errorConfirmar(): boolean { return this.intento && (!this.confirmar || this.confirmar !== this.nueva); }

  get mensajeValidacion(): string {
    if (!this.intento) return '';
    if (!this.actual || !this.nueva || !this.confirmar) return 'Por favor complete todos los campos obligatorios para continuar';
    if (this.nueva.length < this.MINIMO) return `La nueva contraseña debe tener al menos ${this.MINIMO} caracteres`;
    if (this.confirmar !== this.nueva) return 'La confirmación no coincide con la nueva contraseña';
    if (this.nueva === this.actual) return 'La nueva contraseña debe ser distinta de la actual';
    return '';
  }

  actualizar(): void {
    this.intento = true;
    this.error = '';
    if (this.mensajeValidacion || this.guardando) return;

    this.guardando = true;
    this.usuarioService.cambiarPassword(this.actual, this.nueva).subscribe({
      next: () => {
        this.guardando = false;
        this.authService.marcarPasswordCambiada();
        this.router.navigate(['/menu']);
      },
      error: (err) => {
        this.guardando = false;
        this.error = textoError(err, 'No se pudo actualizar la contraseña');
      }
    });
  }

  salir(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
