import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { Organizacion } from '../../core/services/models/organizacion.model';

@Component({
  selector: 'app-organizaciones',
  imports: [HeaderComponent,FormsModule],
  standalone:true,
  templateUrl: './organizaciones.component.html',
  styleUrl: './organizaciones.component.css'
})
export class OrganizacionesComponent {
  organizacion: Organizacion = {
    id: 0,
    nombre: '',
    sector: '',
    responsable: '',
    fechaEvaluacion: ''
  };

  constructor(
    private router: Router,
    private organizacionService: OrganizacionService
  ) {}

  IniciarEvaluacion(): void {
    // completamos los campos que no vienen del formulario
    this.organizacion.id = Date.now();
    this.organizacion.fechaEvaluacion = new Date().toISOString();

    this.organizacionService.guardarOrganizacion(this.organizacion);
    this.router.navigate(['/evaluacion']);
  }


}
