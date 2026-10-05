import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ControlResponse, CrearControlRequest } from './models/pregunta.model';

@Injectable({
  providedIn: 'root'
})
export class ControlService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/controles`;

  listarControles(): Observable<ControlResponse[]> {
    return this.http.get<ControlResponse[]>(this.apiUrl);
  }

  crearControl(request: CrearControlRequest): Observable<ControlResponse> {
    return this.http.post<ControlResponse>(this.apiUrl, request);
  }
}