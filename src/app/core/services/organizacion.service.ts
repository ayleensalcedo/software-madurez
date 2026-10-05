import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrganizacionResponse } from './models/organizacion.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizacionService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/organizaciones`;

  listarOrganizaciones(): Observable<OrganizacionResponse[]> {
    return this.http.get<OrganizacionResponse[]>(this.apiUrl);
  }

  obtenerMiOrganizacion(): Observable<OrganizacionResponse> {
    return this.http.get<OrganizacionResponse>(`${this.apiUrl}/mia`);
  }
}