import { Component, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, IconComponent],
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  email: string = '';
  password: string = '';

  error: string = '';
  cargando: boolean = false;
  mostrarError: boolean = false;

  iniciarSesion(): void {
    if (this.cargando) return;

    this.error = '';
    this.mostrarError = false;
    this.cargando = true;

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/menu']);
      },
      error: (err) => {
        this.cargando = false;

        if (err.status === 400 || err.status === 401 || err.status === 403) {
          this.error = 'El correo electrónico o la contraseña son incorrectos. Verifica tus datos e inténtalo nuevamente.';
        } else if (err.status === 0) {
          this.error = 'No se pudo conectar con el servidor. Inténtalo nuevamente en unos momentos.';
        } else {
          this.error = 'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.';
        }

        this.mostrarError = true;
      }
    });
  }

  @HostListener('document:keydown.escape')
  cerrarError(): void {
    this.mostrarError = false;
  }


}