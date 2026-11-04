import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearUsuarioRequest, UsuarioResponse } from './models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  listarUsuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.apiUrl);
  }

  crearUsuario(request: CrearUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.apiUrl, request);
  }

  desactivarUsuario(id: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/desactivar`, {}, { responseType: 'text' });
  }

  // El backend solo entrega la lista de usuarios al Administrador y no tiene un endpoint de "mi equipo".
  // Los analistas que crea un Jefe se recuerdan en este navegador para poder mostrarlos.
  leerEquipoLocal(emailJefe: string | undefined): UsuarioResponse[] {
    if (!isPlatformBrowser(this.platformId) || !emailJefe) return [];
    try {
      const datos = JSON.parse(localStorage.getItem(`equipoAnalistas:${emailJefe.toLowerCase()}`) ?? '[]');
      return Array.isArray(datos) ? datos : [];
    } catch {
      return [];
    }
  }

  registrarAnalistaLocal(emailJefe: string | undefined, analista: UsuarioResponse): void {
    if (!isPlatformBrowser(this.platformId) || !emailJefe) return;
    const lista = this.leerEquipoLocal(emailJefe).filter(a => a.id !== analista.id);
    lista.push(analista);
    try {
      localStorage.setItem(`equipoAnalistas:${emailJefe.toLowerCase()}`, JSON.stringify(lista));
    } catch { /* almacenamiento no disponible */ }
  }
}
