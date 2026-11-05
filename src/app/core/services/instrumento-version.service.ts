import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VersionInstrumento {
  id: number;
  numeroVersion: number;
  fechaPublicacion: string;
  vigente: boolean;
  nota: string | null;
  totalDominios: number;
  totalControles: number;
  totalPreguntas: number;
}

@Injectable({
  providedIn: 'root'
})
export class InstrumentoVersionService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/instrumento-versiones`;

  listarVersiones(): Observable<VersionInstrumento[]> {
    return this.http.get<VersionInstrumento[]>(this.apiUrl);
  }

  // Copia el catálogo vigente a una versión nueva y la marca como vigente
  publicarNuevaVersion(nota: string): Observable<VersionInstrumento> {
    return this.http.post<VersionInstrumento>(`${this.apiUrl}/publicar`, { nota });
  }
}
