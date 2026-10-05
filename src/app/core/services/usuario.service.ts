import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearUsuarioRequest, UsuarioResponse } from './models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private http = inject(HttpClient);
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
}