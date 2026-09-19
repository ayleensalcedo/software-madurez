import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {

  registroForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {

    this.registroForm = this.fb.group(
      {
        nombre: [
          '',
          [
            Validators.required,
            Validators.minLength(2)
          ]
        ],

        apellido: [
          '',
          [
            Validators.required,
            Validators.minLength(2)
          ]
        ],

        correo: [
          '',
          [
            Validators.required,
            Validators.email
          ]
        ],

        organizacion: [
          '',
          [
            Validators.required,
            Validators.minLength(2)
          ]
        ],

        cargo: [
          '',
          [
            Validators.required
          ]
        ],

        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8)
          ]
        ],

        confirmPassword: [
          '',
          [
            Validators.required
          ]
        ]
      },
      {
        validators: this.passwordMatchValidator
      }
    );
  }

  /**
   * Valida que ambas contraseñas sean iguales.
   */
  passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword
      ? null
      : { passwordMismatch: true };
  }

  /**
   * Verifica si un campo debe mostrar error.
   */
  campoInvalido(campo: string): boolean {

    const control = this.registroForm.get(campo);

    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched)
    );
  }

  /**
   * Procesa el formulario.
   *
   * Por ahora solamente muestra los datos.
   * Más adelante aquí llamaremos al backend.
   */
  registrar(): void {

    if (this.registroForm.invalid) {

      this.registroForm.markAllAsTouched();

      return;
    }

    const datosRegistro = this.registroForm.value;

    console.log('Datos del registro:', datosRegistro);

    /*
     * MÁS ADELANTE:
     *
     * this.authService.registrar(datosRegistro).subscribe({
     *
     *   next: (respuesta) => {
     *      this.router.navigate(['/login']);
     *   },
     *
     *   error: (error) => {
     *      console.error(error);
     *   }
     *
     * });
     */

    alert(
      'Solicitud de registro enviada correctamente.'
    );

    this.router.navigate(['/login']);
  }

  /**
   * Regresa a la pantalla de inicio de sesión.
   */
  irAlLogin(): void {

    this.router.navigate(['/login']);

  }

}