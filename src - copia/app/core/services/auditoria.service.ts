import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditoriaTecnicaResponse } from './models/auditoria.model';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auditoria`;

  listarTodo(): Observable<AuditoriaTecnicaResponse[]> {
    return this.http.get<AuditoriaTecnicaResponse[]>(this.apiUrl);
  }
}