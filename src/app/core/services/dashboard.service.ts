import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardEjecutivoDominio {
  dominioId: number;
  dominioNombre: string;
  coberturaPorcentaje: number;
  pesoRelativo: number;
}

export interface DashboardEjecutivo {
  organizacionId: number;
  organizacionNombre: string;
  fechaEvaluacion: string;
  coberturaGlobal: number;
  nivelMadurezNombre: string;
  tendencia: 'SUBIO' | 'BAJO' | 'MANTUVO' | 'SIN_COMPARATIVA';
  porDominio: DashboardEjecutivoDominio[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  // Resultado de la última evaluación finalizada de la organización
  obtenerPorOrganizacion(organizacionId: number): Observable<DashboardEjecutivo> {
    return this.http.get<DashboardEjecutivo>(`${this.apiUrl}/organizacion/${organizacionId}`);
  }
}
