import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from './models/auth.model';
import { UsuarioResponse } from './models/usuario.model';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Estado reactivo del usuario logueado, disponible en toda la app
  private usuarioActual = signal<UsuarioResponse | null>(this.cargarUsuarioInicial());
  usuario = this.usuarioActual.asReadonly();

  private cargarUsuarioInicial(): UsuarioResponse | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, password };

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, body).pipe(
      tap(respuesta => this.guardarSesion(respuesta))
    );
  }

  private guardarSesion(respuesta: LoginResponse): void {
  if (!isPlatformBrowser(this.platformId)) {
    return;
  }

  const usuario: UsuarioResponse = {
    id: 0,
    nombre: respuesta.nombre,
    email: respuesta.email,
    rol: respuesta.rol,
    estado: 'ACTIVO',
    jefeId: null
  };

  localStorage.setItem('token', respuesta.token);
  localStorage.setItem('usuario', JSON.stringify(usuario));

  this.usuarioActual.set(usuario);
}

  logout(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('evaluacionActualId');  
    this.usuarioActual.set(null);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('token');
  }

  getUsuario(): UsuarioResponse | null {
    return this.usuarioActual();
  }

  estaLogueado(): boolean {
    return this.usuarioActual() !== null && this.getToken() !== null;
  }

  getRol(): string {
    return this.usuarioActual()?.rol ?? '';
  }
}