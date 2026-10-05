import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearDominioRequest, DominioResponse } from './models/dominio.model';

@Injectable({
  providedIn: 'root'
})
export class DominioService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dominios`;

  listarDominios(): Observable<DominioResponse[]> {
    return this.http.get<DominioResponse[]>(this.apiUrl);
  }

  crearDominio(request: CrearDominioRequest): Observable<DominioResponse> {
    return this.http.post<DominioResponse>(this.apiUrl, request);
  }

  eliminarDominio(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
}