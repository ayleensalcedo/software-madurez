import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuditoriaService } from '../../core/services/auditoria.service';
import { DominioService } from '../../core/services/dominio.service';
import { ControlService } from '../../core/services/control.service';
import { PreguntaService } from '../../core/services/pregunta.service';
import { RecomendacionService } from '../../core/services/recomendacion.service';
import { NivelMadurezService } from '../../core/services/nivel-madurez.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { UsuarioResponse } from '../../core/services/models/usuario.model';
import { AuditoriaTecnicaResponse } from '../../core/services/models/auditoria.model';
import { DominioResponse } from '../../core/services/models/dominio.model';
import { ControlResponse, PreguntaResponse } from '../../core/services/models/pregunta.model';
import { RecomendacionResponse } from '../../core/services/models/recomendacion.model';
import { NivelItem, NivelMadurezResponse } from '../../core/services/models/nivel-madurez.model';
import { OrganizacionResponse } from '../../core/services/models/organizacion.model';

type Seccion = 'usuarios' | 'dominios' | 'controles' | 'preguntas' | 'recomendaciones' | 'niveles' | 'auditoria';

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
  private preguntaService = inject(PreguntaService);
  private recomendacionService = inject(RecomendacionService);
  private nivelMadurezService = inject(NivelMadurezService);
  private organizacionService = inject(OrganizacionService);

  seccion: Seccion = 'usuarios';

  usuarios: UsuarioResponse[] = [];
  auditoria: AuditoriaTecnicaResponse[] = [];
  dominios: DominioResponse[] = [];
  controles: ControlResponse[] = [];
  preguntas: PreguntaResponse[] = [];
  recomendacionesPregunta: RecomendacionResponse[] = [];
  niveles: NivelMadurezResponse[] = [];
  organizacionesDisponibles: OrganizacionResponse[] = [];

  modoOrganizacion: 'existente' | 'nueva' = 'nueva';

  nuevoUsuario = {
    nombre: '',
    email: '',
    password: '',
    rol: 'JEFE_CIBERSEGURIDAD',
    organizacionId: undefined as number | undefined,
    nombreOrganizacion: '',
    sectorOrganizacion: '',
    plataformaOrganizacion: ''
  };

  nuevoDominio = { nombre: '', descripcion: '' };
  nuevoControl = { norma: 'ISO_27001', anexoA: '', dominioId: 0 };
  nuevaPregunta = { texto: '', controlIds: [] as number[] };
  nuevaRecomendacion = { preguntaId: 0, nivel: 'NO_EXISTE', descripcion: '' };

  nivelesForm: NivelItem[] = [
    { nombre: 'Inicial', rangoMin: 0, rangoMax: 20 },
    { nombre: 'Básico', rangoMin: 20, rangoMax: 40 },
    { nombre: 'Definido', rangoMin: 40, rangoMax: 60 },
    { nombre: 'Gestionado', rangoMin: 60, rangoMax: 80 },
    { nombre: 'Optimizado', rangoMin: 80, rangoMax: 100 }
  ];

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
    if (seccion === 'preguntas') this.cargarPreguntasYControles();
    if (seccion === 'recomendaciones') this.cargarPreguntasSoloParaSelector();
    if (seccion === 'niveles') this.cargarNiveles();
  }

  // ===== Usuarios =====

  private cargarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.listarUsuarios().subscribe({
      next: (usuarios) => { this.usuarios = usuarios; this.cargando = false; },
      error: (err) => { this.cargando = false; this.error = err.error ?? 'No se pudo cargar la lista de usuarios'; }
    });

    this.organizacionService.listarOrganizaciones().subscribe({
      next: (orgs) => { this.organizacionesDisponibles = orgs; },
      error: () => { /* silencioso: solo afecta el selector de "organización existente" */ }
    });
  }

  crearUsuario(): void {
    this.error = ''; this.exito = '';
    this.usuarioService.crearUsuario(this.nuevoUsuario).subscribe({
      next: () => {
        this.exito = 'Usuario creado correctamente';
        this.nuevoUsuario = {
          nombre: '', email: '', password: '', rol: 'JEFE_CIBERSEGURIDAD',
          organizacionId: undefined, nombreOrganizacion: '', sectorOrganizacion: '', plataformaOrganizacion: ''
        };
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
        this.dominios = [];
      },
      error: (err) => this.error = err.error ?? 'No se pudo crear el control'
    });
  }

  // ===== Preguntas =====

  private cargarPreguntasYControles(): void {
    this.cargando = true;

    this.controlService.listarControles().subscribe({
      next: (controles) => {
        this.controles = controles;

        this.preguntaService.listarPreguntas().subscribe({
          next: (preguntas) => { this.preguntas = preguntas; this.cargando = false; },
          error: (err) => { this.cargando = false; this.error = err.error ?? 'No se pudo cargar las preguntas'; }
        });
      },
      error: (err) => { this.cargando = false; this.error = err.error ?? 'No se pudo cargar los controles'; }
    });
  }

  toggleControlSeleccionado(controlId: number): void {
    const idx = this.nuevaPregunta.controlIds.indexOf(controlId);
    if (idx === -1) {
      this.nuevaPregunta.controlIds.push(controlId);
    } else {
      this.nuevaPregunta.controlIds.splice(idx, 1);
    }
  }

  controlEstaSeleccionado(controlId: number): boolean {
    return this.nuevaPregunta.controlIds.includes(controlId);
  }

  crearPregunta(): void {
    this.error = ''; this.exito = '';

    if (this.nuevaPregunta.controlIds.length === 0) {
      this.error = 'Selecciona al menos un control para la pregunta';
      return;
    }

    this.preguntaService.crearPregunta(this.nuevaPregunta).subscribe({
      next: () => {
        this.exito = 'Pregunta creada correctamente';
        this.nuevaPregunta = { texto: '', controlIds: [] };
        this.cargarPreguntasYControles();
      },
      error: (err) => this.error = err.error ?? 'No se pudo crear la pregunta'
    });
  }

  // ===== Recomendaciones =====

  private cargarPreguntasSoloParaSelector(): void {
    this.cargando = true;
    this.preguntaService.listarPreguntas().subscribe({
      next: (preguntas) => {
        this.preguntas = preguntas;
        if (preguntas.length > 0 && this.nuevaRecomendacion.preguntaId === 0) {
          this.nuevaRecomendacion.preguntaId = preguntas[0].id;
          this.cargarRecomendacionesDePregunta(preguntas[0].id);
        } else {
          this.cargando = false;
        }
      },
      error: (err) => { this.cargando = false; this.error = err.error ?? 'No se pudo cargar las preguntas'; }
    });
  }

  cambiarPreguntaSeleccionada(): void {
    this.cargarRecomendacionesDePregunta(this.nuevaRecomendacion.preguntaId);
  }

  private cargarRecomendacionesDePregunta(preguntaId: number): void {
    this.cargando = true;
    this.recomendacionService.listarPorPregunta(preguntaId).subscribe({
      next: (recs) => { this.recomendacionesPregunta = recs; this.cargando = false; },
      error: (err) => { this.cargando = false; this.error = err.error ?? 'No se pudo cargar las recomendaciones'; }
    });
  }

  crearRecomendacion(): void {
    this.error = ''; this.exito = '';

    if (!this.nuevaRecomendacion.preguntaId) {
      this.error = 'Selecciona una pregunta';
      return;
    }

    this.recomendacionService.crearRecomendacion(this.nuevaRecomendacion).subscribe({
      next: () => {
        this.exito = 'Recomendación guardada correctamente';
        this.nuevaRecomendacion.descripcion = '';
        this.cargarRecomendacionesDePregunta(this.nuevaRecomendacion.preguntaId);
      },
      error: (err) => this.error = err.error ?? 'No se pudo guardar la recomendación'
    });
  }

  etiquetaNivel(nivel: string): string {
    switch (nivel) {
      case 'NO_EXISTE': return 'No existe';
      case 'EXISTE_PARCIALMENTE': return 'Existe parcialmente';
      case 'EXISTE_NO_FORMALIZADO': return 'Existe, no formalizado';
      case 'IMPLEMENTADO': return 'Implementado';
      default: return nivel;
    }
  }

  // ===== Niveles de madurez =====

  private cargarNiveles(): void {
    this.cargando = true;
    this.nivelMadurezService.listarNiveles().subscribe({
      next: (niveles) => {
        this.niveles = niveles;
        if (niveles.length === 5) {
          this.nivelesForm = niveles
            .slice()
            .sort((a, b) => a.rangoMin - b.rangoMin)
            .map(n => ({ nombre: n.nombre, rangoMin: n.rangoMin, rangoMax: n.rangoMax }));
        }
        this.cargando = false;
      },
      error: (err) => { this.cargando = false; this.error = err.error ?? 'No se pudo cargar los niveles de madurez'; }
    });
  }

  guardarNiveles(): void {
    this.error = ''; this.exito = '';

    this.nivelMadurezService.configurarNiveles({ niveles: this.nivelesForm }).subscribe({
      next: (niveles) => {
        this.exito = 'Niveles de madurez configurados correctamente';
        this.niveles = niveles;
      },
      error: (err) => this.error = err.error ?? 'No se pudo guardar la configuración'
    });
  }
}