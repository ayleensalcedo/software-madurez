import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EvaluacionResponse, IniciarEvaluacionRequest } from './models/evaluacion.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionService {

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private readonly apiUrl = `${environment.apiUrl}/evaluaciones`;
  private readonly CLAVE_ID = 'evaluacionActualId';

  private evaluacionActualSignal = signal<EvaluacionResponse | null>(null);
  evaluacionActual = this.evaluacionActualSignal.asReadonly();

  // Guarda la evaluación activa en memoria y su id en localStorage (sobrevive al F5)
  private fijarActual(evaluacion: EvaluacionResponse): void {
    this.evaluacionActualSignal.set(evaluacion);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.CLAVE_ID, String(evaluacion.id));
    }
  }

  // Devuelve la evaluación activa; si se perdió (F5), la recupera desde el backend
  cargarEvaluacionActual(): Observable<EvaluacionResponse | null> {
    const actual = this.evaluacionActualSignal();
    if (actual) {
      return of(actual);
    }

    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }

    const id = localStorage.getItem(this.CLAVE_ID);
    if (!id) {
      return of(null);
    }

    return this.obtenerEvaluacion(Number(id)).pipe(
      catchError(() => of(null))
    );
  }

  iniciarEvaluacion(): Observable<EvaluacionResponse> {
    return this.http.post<EvaluacionResponse>(this.apiUrl, {}).pipe(
      tap(evaluacion => this.fijarActual(evaluacion))
    );
  }

  iniciarReevaluacion(): Observable<EvaluacionResponse> {
    return this.http.post<EvaluacionResponse>(`${this.apiUrl}/reevaluar`, {}).pipe(
      tap(evaluacion => this.fijarActual(evaluacion))
    );
  }

  listarMisEvaluaciones(): Observable<EvaluacionResponse[]> {
    return this.http.get<EvaluacionResponse[]>(`${this.apiUrl}/mias`);
  }

  listarEvaluacionesEquipo(): Observable<EvaluacionResponse[]> {
    return this.http.get<EvaluacionResponse[]>(`${this.apiUrl}/equipo`);
  }

  obtenerEvaluacion(id: number): Observable<EvaluacionResponse> {
    return this.http.get<EvaluacionResponse>(`${this.apiUrl}/${id}`).pipe(
      tap(evaluacion => this.fijarActual(evaluacion))
    );
  }

  finalizarEvaluacion(id: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/finalizar`, {}, { responseType: 'text' });
  }

  validarEvaluacion(id: number): Observable<EvaluacionResponse> {
    return this.http.put<EvaluacionResponse>(`${this.apiUrl}/${id}/validar`, {});
  }

  observarEvaluacion(id: number, observacion: string): Observable<EvaluacionResponse> {
    return this.http.put<EvaluacionResponse>(`${this.apiUrl}/${id}/observar`, { observacion });
  }

  setEvaluacionActual(evaluacion: EvaluacionResponse): void {
    this.fijarActual(evaluacion);
  }

  limpiar(): void {
    this.evaluacionActualSignal.set(null);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.CLAVE_ID);
    }
  }
}