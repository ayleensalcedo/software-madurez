import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PreguntaResponse } from './models/pregunta.model';

@Injectable({
  providedIn: 'root'
})
export class PreguntaService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/preguntas`;

  listarPreguntas(): Observable<PreguntaResponse[]> {
    return this.http.get<PreguntaResponse[]>(this.apiUrl);
  }
}