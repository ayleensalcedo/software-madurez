import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaLogueado()) {
    // Primer inicio de sesión: no se puede usar el sistema hasta cambiar la contraseña
    if (authService.debeCambiarPassword() && state.url.split('?')[0] !== '/cambiar-password') {
      router.navigate(['/cambiar-password']);
      return false;
    }
    return true;
  }

  router.navigate(['/login']);
  return false;
};