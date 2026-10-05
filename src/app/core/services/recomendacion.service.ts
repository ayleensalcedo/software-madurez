import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearRecomendacionRequest, RecomendacionResponse, RecomendacionSugerida } from './models/recomendacion.model';

@Injectable({
  providedIn: 'root'
})
export class RecomendacionService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/recomendaciones`;

  listarPorPregunta(preguntaId: number): Observable<RecomendacionResponse[]> {
    return this.http.get<RecomendacionResponse[]>(`${this.apiUrl}/pregunta/${preguntaId}`);
  }

  obtenerSugeridasPorEvaluacion(evaluacionId: number): Observable<RecomendacionSugerida[]> {
    return this.http.get<RecomendacionSugerida[]>(`${this.apiUrl}/evaluacion/${evaluacionId}/sugeridas`);
  }
  crearRecomendacion(request: CrearRecomendacionRequest): Observable<RecomendacionResponse> {
  return this.http.post<RecomendacionResponse>(this.apiUrl, request);
}
}