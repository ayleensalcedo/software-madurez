import { Injectable, signal } from '@angular/core';
import { Organizacion } from '../../core/services/models/organizacion.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizacionService {
  private organizacionActual = signal<Organizacion | null>(null);
  organizacion = this.organizacionActual.asReadonly();

  guardarOrganizacion(org: Organizacion): void {
    this.organizacionActual.set(org);
  }

  obtenerOrganizacion(): Organizacion | null {
    return this.organizacionActual();
  }

  limpiar(): void {
    this.organizacionActual.set(null);
  }
}