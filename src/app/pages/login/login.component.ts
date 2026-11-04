import { Component, inject } from '@angular/core';
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

        if (err.status === 401) {
          this.error = 'Correo o contraseña incorrectos';
        } else if (err.status === 0) {
          this.error = 'No se pudo conectar con el servidor';
        } else {
          this.error = 'Ocurrió un error al iniciar sesión';
        }
      }
    });
  }


}