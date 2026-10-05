import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuditoriaService } from '../../core/services/auditoria.service';
import { DominioService } from '../../core/services/dominio.service';
import { ControlService } from '../../core/services/control.service';
import { UsuarioResponse } from '../../core/services/models/usuario.model';
import { AuditoriaTecnicaResponse } from '../../core/services/models/auditoria.model';
import { DominioResponse } from '../../core/services/models/dominio.model';
import { ControlResponse } from '../../core/services/models/pregunta.model';

type Seccion = 'usuarios' | 'auditoria' | 'dominios' | 'controles';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [HeaderComponent, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {

  private usuarioService = inject(UsuarioService);
  private auditoriaService = inject(AuditoriaService);
  private dominioService = inject(DominioService);
  private controlService = inject(ControlService);

  seccion: Seccion = 'usuarios';

  usuarios: UsuarioResponse[] = [];
  auditoria: AuditoriaTecnicaResponse[] = [];
  dominios: DominioResponse[] = [];
  controles: ControlResponse[] = [];

  nuevoUsuario = { nombre: '', email: '', password: '', rol: 'JEFE_CIBERSEGURIDAD' };
  nuevoDominio = { nombre: '', descripcion: '' };
  nuevoControl = { norma: 'ISO_27001', anexoA: '', dominioId: 0 };

  cargando: boolean = true;
  error: string = '';
  exito: string = '';

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cambiarSeccion(seccion: Seccion): void {
    this.seccion = seccion;
    this.error = '';
    this.exito = '';

    if (seccion === 'usuarios' && this.usuarios.length === 0) this.cargarUsuarios();
    if (seccion === 'auditoria' && this.auditoria.length === 0) this.cargarAuditoria();
    if (seccion === 'dominios' && this.dominios.length === 0) this.cargarDominios();
    if (seccion === 'controles') this.cargarControles();
  }

  // ===== Usuarios =====

  private cargarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.listarUsuarios().subscribe({
      next: (usuarios) => { this.usuarios = usuarios; this.cargando = false; },
      error: (err) => { this.cargando = false; this.error = err.error ?? 'No se pudo cargar la lista de usuarios'; }
    });
  }

  crearUsuario(): void {
    this.error = ''; this.exito = '';
    this.usuarioService.crearUsuario(this.nuevoUsuario).subscribe({
      next: () => {
        this.exito = 'Usuario creado correctamente';
        this.nuevoUsuario = { nombre: '', email: '', password: '', rol: 'JEFE_CIBERSEGURIDAD' };
        this.cargarUsuarios();
      },
      error: (err) => this.error = err.error ?? 'No se pudo crear el usuario'
    });
  }

  desactivar(usuario: UsuarioResponse): void {
    this.error = ''; this.exito = '';
    this.usuarioService.desactivarUsuario(usuario.id).subscribe({
      next: () => { this.exito = `${usuario.nombre} desactivado correctamente`; this.cargarUsuarios(); },
      error: (err) => this.error = err.error ?? 'No se pudo desactivar el usuario'
    });
  }

  etiquetaRol(rol: string): string {
    switch (rol) {
      case 'ADMINISTRADOR': return 'Administrador';
      case 'JEFE_CIBERSEGURIDAD': return 'Jefe de ciberseguridad';
      case 'ANALISTA_CIBERSEGURIDAD': return 'Analista de ciberseguridad';
      case 'GERENTE_GENERAL': return 'Gerente general';
      default: return rol;
    }
  }

  // ===== Auditoría =====

  private cargarAuditoria(): void {
    this.cargando = true;
    this.auditoriaService.listarTodo().subscribe({
      next: (registros) => { this.auditoria = registros; this.cargando = false; },
      error: (err) => { this.cargando = false; this.error = err.error ?? 'No se pudo cargar la auditoría'; }
    });
  }

  // ===== Dominios =====

  private cargarDominios(): void {
    this.cargando = true;
    this.dominioService.listarDominios().subscribe({
      next: (dominios) => { this.dominios = dominios; this.cargando = false; },
      error: (err) => { this.cargando = false; this.error = err.error ?? 'No se pudo cargar los dominios'; }
    });
  }

  crearDominio(): void {
    this.error = ''; this.exito = '';
    this.dominioService.crearDominio(this.nuevoDominio).subscribe({
      next: () => {
        this.exito = 'Dominio creado correctamente';
        this.nuevoDominio = { nombre: '', descripcion: '' };
        this.cargarDominios();
      },
      error: (err) => this.error = err.error ?? 'No se pudo crear el dominio'
    });
  }

  eliminarDominio(dominio: DominioResponse): void {
    this.error = ''; this.exito = '';
    this.dominioService.eliminarDominio(dominio.id).subscribe({
      next: () => { this.exito = `Dominio "${dominio.nombre}" eliminado`; this.cargarDominios(); },
      error: (err) => this.error = err.error ?? 'No se pudo eliminar el dominio'
    });
  }

  // ===== Controles =====

  private cargarControles(): void {
    this.cargando = true;

    // Necesitamos los dominios cargados para el selector del formulario y para
    // mostrar el nombre del dominio de cada control en la tabla
    this.dominioService.listarDominios().subscribe({
      next: (dominios) => {
        this.dominios = dominios;
        if (dominios.length > 0 && this.nuevoControl.dominioId === 0) {
          this.nuevoControl.dominioId = dominios[0].id;
        }

        this.controlService.listarControles().subscribe({
          next: (controles) => { this.controles = controles; this.cargando = false; },
          error: (err) => { this.cargando = false; this.error = err.error ?? 'No se pudo cargar los controles'; }
        });
      },
      error: (err) => { this.cargando = false; this.error = err.error ?? 'No se pudo cargar los dominios'; }
    });
  }

  crearControl(): void {
    this.error = ''; this.exito = '';

    if (!this.nuevoControl.dominioId) {
      this.error = 'Selecciona un dominio';
      return;
    }

    this.controlService.crearControl(this.nuevoControl).subscribe({
      next: () => {
        this.exito = 'Control creado correctamente';
        this.nuevoControl.anexoA = '';
        this.cargarControles();
        // Recargamos dominios en la pestaña de dominios también, porque sus
        // pesos relativos cambiaron con este nuevo control (HU0010)
        this.dominios = [];
      },
      error: (err) => this.error = err.error ?? 'No se pudo crear el control'
    });
  }
}