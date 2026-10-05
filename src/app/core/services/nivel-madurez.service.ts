import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfigurarNivelesMadurezRequest, NivelMadurezResponse } from './models/nivel-madurez.model';

@Injectable({
  providedIn: 'root'
})
export class NivelMadurezService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/niveles-madurez`;

  listarNiveles(): Observable<NivelMadurezResponse[]> {
    return this.http.get<NivelMadurezResponse[]>(this.apiUrl);
  }

  configurarNiveles(request: ConfigurarNivelesMadurezRequest): Observable<NivelMadurezResponse[]> {
    return this.http.post<NivelMadurezResponse[]>(this.apiUrl, request);
  }
}