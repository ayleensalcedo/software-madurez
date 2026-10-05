import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResultadoResponse } from './models/resultado.model';

@Injectable({
  providedIn: 'root'
})
export class ResultadoService {

  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  obtenerResultado(evaluacionId: number): Observable<ResultadoResponse> {
    return this.http.get<ResultadoResponse>(`${this.apiUrl}/evaluaciones/${evaluacionId}/resultado`);
  }
}