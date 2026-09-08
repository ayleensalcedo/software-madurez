import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {FormsModule } from '@angular/forms';
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


  iniciarSesion(): void {

    const resultado = this.authService.login(
      this.email,
      this.password
    );


    if (resultado) {

      this.router.navigate(['/menu']);

    } else {

      this.error = 'Correo o contraseña incorrectos';

    }

  }


}
