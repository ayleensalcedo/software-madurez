import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

/**
 * Tras publicar una versión nueva, los fragmentos de pantallas de la versión anterior dejan de existir.
 * Si alguien tenía la aplicación abierta, esa descarga falla; se recarga la página para obtener la
 * versión nueva. Para evitar bucles, no se recarga más de una vez cada 15 segundos.
 */
const CLAVE_RECARGA = 'ultima-recarga-por-version-nueva';
const ESPERA_ENTRE_RECARGAS_MS = 15000;

function recargarSiFallaDescarga(evento: { error: unknown }): void {
  const mensaje = String((evento.error as { message?: string } | null)?.message ?? evento.error ?? '');
  const esFalloDeDescarga = /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(mensaje);

  if (!esFalloDeDescarga || typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    const ultima = Number(sessionStorage.getItem(CLAVE_RECARGA) ?? 0);
    if (Date.now() - ultima < ESPERA_ENTRE_RECARGAS_MS) {
      return;
    }

    sessionStorage.setItem(CLAVE_RECARGA, String(Date.now()));
    location.reload();
  } catch {
    // Sin acceso al almacenamiento: no se recarga
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withNavigationErrorHandler(recargarSiFallaDescarga)),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};