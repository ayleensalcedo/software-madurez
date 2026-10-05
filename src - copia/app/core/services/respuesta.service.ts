import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GuardarRespuestaRequest, RespuestaResponse } from './models/respuesta.model';

@Injectable({
  providedIn: 'root'
})
export class RespuestaService {

  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  guardarRespuesta(evaluacionId: number, request: GuardarRespuestaRequest): Observable<RespuestaResponse> {
    return this.http.post<RespuestaResponse>(
      `${this.apiUrl}/evaluaciones/${evaluacionId}/respuestas`, request
    );
  }

  listarRespuestas(evaluacionId: number): Observable<RespuestaResponse[]> {
    return this.http.get<RespuestaResponse[]>(
      `${this.apiUrl}/evaluaciones/${evaluacionId}/respuestas`
    );
  }
}