import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
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

  // Ventana que avisa que el correo o la contraseña son incorrectos
  mostrarCredenciales: boolean = false;

  // true cuando el servidor rechaza la cuenta por estar desactivada (403)
  cuentaInactiva: boolean = false;

  // Al abrirse la ventana, el foco pasa a su botón
  @ViewChild('btnEntendido')
  set btnEntendido(ref: ElementRef<HTMLButtonElement> | undefined) {
    ref?.nativeElement.focus();
  }

  iniciarSesion(): void {
    this.error = '';
    this.cargando = true;

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/menu']);
      },
      error: (err) => {
        this.cargando = false;

        if (err.status === 403) {
          this.cuentaInactiva = true;
          this.mostrarCredenciales = true;
        } else if (err.status === 400 || err.status === 401) {
          this.cuentaInactiva = false;
          this.mostrarCredenciales = true;
        } else if (err.status === 0) {
          this.error = 'No se pudo conectar con el servidor';
        } else {
          this.error = 'Ocurrió un error al iniciar sesión';
        }
      }
    });
  }

  cerrarCredenciales(): void {
    this.mostrarCredenciales = false;

    // Se devuelve el cursor a la contraseña para corregirla
    setTimeout(() => document.getElementById('password')?.focus());
  }

  @HostListener('document:keydown', ['$event'])
  alPulsarTecla(evento: KeyboardEvent): void {
    if (!this.mostrarCredenciales) return;

    if (evento.key === 'Escape') {
      this.cerrarCredenciales();
    } else if (evento.key === 'Tab') {
      // Con la ventana abierta, el foco se queda en su botón
      evento.preventDefault();
    }
  }
}
