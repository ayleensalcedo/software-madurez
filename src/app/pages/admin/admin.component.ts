import { Component, HostListener, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { IconComponent, NombreIcono } from '../../shared/icon/icon.component';
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
import { InstrumentoVersionService, VersionInstrumento } from '../../core/services/instrumento-version.service';
import { MENSAJE_CORREO_REPETIDO, esCorreoRepetido, textoError } from '../../core/utils/errores';

type Seccion = 'usuarios' | 'dominios' | 'controles' | 'preguntas' | 'recomendaciones' | 'niveles' | 'versiones' | 'auditoria';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [HeaderComponent, IconComponent, DatePipe, DecimalPipe, FormsModule],
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
  private versionService = inject(InstrumentoVersionService);

  seccion: Seccion = 'usuarios';

  // Menú lateral
  readonly grupos: { titulo: string; items: { id: Seccion; label: string; icono: NombreIcono }[] }[] = [
    { titulo: 'Gestión', items: [
      { id: 'usuarios', label: 'Usuarios', icono: 'users' }
    ]},
    { titulo: 'Catálogo de evaluación', items: [
      { id: 'dominios', label: 'Dominios', icono: 'layers' },
      { id: 'controles', label: 'Controles', icono: 'shield-check' },
      { id: 'preguntas', label: 'Preguntas', icono: 'circle-help' },
      { id: 'recomendaciones', label: 'Recomendaciones', icono: 'lightbulb' }
    ]},
    { titulo: 'Configuración', items: [
      { id: 'niveles', label: 'Niveles de madurez', icono: 'gauge' },
      { id: 'versiones', label: 'Versiones del instrumento', icono: 'layers' },
      { id: 'auditoria', label: 'Auditoría técnica', icono: 'history' }
    ]}
  ];

  // Título, subtítulo y acción principal de cada sección
  readonly infoSeccion: Record<Seccion, { eyebrow: string; titulo: string; sub: string; accion?: string }> = {
    usuarios: { eyebrow: 'Administración', titulo: 'Usuarios', sub: 'Crea y gestiona las cuentas de jefes y gerentes de la plataforma.', accion: 'Nuevo usuario' },
    dominios: { eyebrow: 'Catálogo de evaluación', titulo: 'Dominios', sub: 'Áreas de seguridad en las que se agrupan los controles y preguntas.', accion: 'Nuevo dominio' },
    controles: { eyebrow: 'Catálogo de evaluación', titulo: 'Controles', sub: 'Controles de las normas ISO 27001 e ISO 42001 asociados a cada dominio.', accion: 'Nuevo control' },
    preguntas: { eyebrow: 'Catálogo de evaluación', titulo: 'Preguntas', sub: 'Preguntas de la evaluación y los controles que cubren.', accion: 'Nueva pregunta' },
    recomendaciones: { eyebrow: 'Catálogo de evaluación', titulo: 'Recomendaciones', sub: 'Acciones sugeridas según el nivel de implementación de cada pregunta.', accion: 'Nueva recomendación' },
    niveles: { eyebrow: 'Configuración', titulo: 'Niveles de madurez', sub: 'Define el rango de cobertura (0–100) de cada uno de los 5 niveles.' },
    versiones: { eyebrow: 'Configuración', titulo: 'Versiones del instrumento', sub: 'Cada versión conserva el catálogo (dominios, controles y preguntas) con el que se evaluó.', accion: 'Publicar nueva versión' },
    auditoria: { eyebrow: 'Auditoría', titulo: 'Auditoría técnica', sub: 'Historial de cambios de configuración realizados en el sistema.' }
  };

  readonly coloresNivel = ['#f08a8a', '#f2c07a', '#e8c53a', '#6db7f0', '#5ccad0'];

  // Panel lateral de creación
  panelAbierto = false;

  // Filtros
  busqueda = '';
  filtroRol: 'TODOS' | 'JEFE' | 'GERENTE' | 'ANALISTA' | 'INACTIVOS' = 'TODOS';
  filtroAccion = '';

  // Filtros de auditoría: los campos se editan y se aplican con el botón "Buscar"
  filtroUsuario = '';
  filtroDesde = '';
  filtroHasta = '';
  private aplicado = { usuario: '', desde: '', hasta: '' };

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
    this.precargarContadores();
  }

  // Carga silenciosa de listas para mostrar los contadores del menú lateral
  private precargarContadores(): void {
    this.dominioService.listarDominios().subscribe({ next: d => { if (this.dominios.length === 0) this.dominios = d; }, error: () => {} });
    this.controlService.listarControles().subscribe({ next: c => { if (this.controles.length === 0) this.controles = c; }, error: () => {} });
    this.preguntaService.listarPreguntas().subscribe({ next: p => { if (this.preguntas.length === 0) this.preguntas = p; }, error: () => {} });
    this.nivelMadurezService.listarNiveles().subscribe({ next: n => { if (this.niveles.length === 0) this.niveles = n; }, error: () => {} });
  }

  contador(id: Seccion): number | null {
    switch (id) {
      case 'usuarios': return this.usuarios.length || null;
      case 'dominios': return this.dominios.length || null;
      case 'controles': return this.controles.length || null;
      case 'preguntas': return this.preguntas.length || null;
      case 'niveles': return this.niveles.length || null;
      default: return null;
    }
  }

  abrirPanel(): void {
    this.error = ''; this.exito = '';
    this.errorPublicar = ''; this.notaVersion = '';
    this.sinControles = false;
    this.panelAbierto = true;
  }

  @HostListener('document:keydown.escape')
  cerrarPanel(): void {
    this.panelAbierto = false;
    this.usuarioPorDesactivar = null;
    this.avisoDesactivar = null;
  }

  cambiarSeccion(seccion: Seccion): void {
    this.seccion = seccion;
    this.error = '';
    this.exito = '';
    this.panelAbierto = false;
    this.busqueda = '';
    this.filtroRol = 'TODOS';
    this.filtroAccion = '';
    this.limpiarFiltrosAuditoria();
    this.sinControles = false;

    if (seccion === 'usuarios' && this.usuarios.length === 0) this.cargarUsuarios();
    if (seccion === 'auditoria' && this.auditoria.length === 0) this.cargarAuditoria();
    if (seccion === 'dominios' && this.dominios.length === 0) this.cargarDominios();
    if (seccion === 'controles') this.cargarControles();
    if (seccion === 'preguntas') this.cargarPreguntasYControles();
    if (seccion === 'recomendaciones') this.cargarPreguntasSoloParaSelector();
    if (seccion === 'niveles') this.cargarNiveles();
    if (seccion === 'versiones') this.cargarVersiones();
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
        this.panelAbierto = false;
        this.nuevoUsuario = {
          nombre: '', email: '', password: '', rol: 'JEFE_CIBERSEGURIDAD',
          organizacionId: undefined, nombreOrganizacion: '', sectorOrganizacion: '', plataformaOrganizacion: ''
        };
        this.cargarUsuarios();
      },
      error: (err) => {
        const texto = textoError(err, 'No se pudo crear el usuario');
        this.error = esCorreoRepetido(texto) ? MENSAJE_CORREO_REPETIDO : texto;
      }
    });
  }

  // Motivo por el que el servidor no permitió desactivar la cuenta
  avisoDesactivar: string | null = null;

  // Usuario pendiente de confirmar en la ventana "Desactivar usuario"
  usuarioPorDesactivar: UsuarioResponse | null = null;

  pedirDesactivar(usuario: UsuarioResponse): void {
    this.usuarioPorDesactivar = usuario;
  }

  cancelarDesactivar(): void {
    this.usuarioPorDesactivar = null;
  }

  confirmarDesactivar(): void {
    const usuario = this.usuarioPorDesactivar;
    this.usuarioPorDesactivar = null;
    if (usuario) this.desactivar(usuario);
  }

  private desactivar(usuario: UsuarioResponse): void {
    this.error = ''; this.exito = '';
    this.usuarioService.desactivarUsuario(usuario.id).subscribe({
      next: () => { this.exito = `${usuario.nombre} desactivado correctamente`; this.cargarUsuarios(); },
      error: (err) => {
        // El backend rechaza la desactivación (p. ej. evaluaciones en curso): se explica en un pop up
        this.avisoDesactivar = textoError(err, 'No se pudo desactivar el usuario');
      }
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
        this.panelAbierto = false;
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
        this.panelAbierto = false;
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

  // Se activa al intentar crear una pregunta sin controles: resalta la sección en rojo
  sinControles = false;

  toggleControlSeleccionado(controlId: number): void {
    this.sinControles = false;
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
      this.sinControles = true;
      this.error = 'Selecciona al menos un control para la pregunta';
      return;
    }

    this.preguntaService.crearPregunta(this.nuevaPregunta).subscribe({
      next: () => {
        this.exito = 'Pregunta creada correctamente';
        this.panelAbierto = false;
        this.nuevaPregunta = { texto: '', controlIds: [] };
        this.sinControles = false;
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
        this.panelAbierto = false;
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

  // ===== Versiones del instrumento =====

  versiones: VersionInstrumento[] = [];
  notaVersion = '';
  publicando = false;
  errorPublicar = '';

  get versionVigente(): VersionInstrumento | undefined {
    return this.versiones.find(v => v.vigente);
  }

  private cargarVersiones(): void {
    this.cargando = true;
    this.versionService.listarVersiones().subscribe({
      next: (v) => { this.versiones = v; this.cargando = false; },
      error: (err) => { this.cargando = false; this.error = textoError(err, 'No se pudo cargar las versiones del instrumento'); }
    });
  }

  publicarVersion(): void {
    this.errorPublicar = '';
    if (!this.notaVersion.trim()) {
      this.errorPublicar = 'Debe registrar la nota de la versión';
      return;
    }
    if (this.publicando) return;
    this.publicando = true;

    this.versionService.publicarNuevaVersion(this.notaVersion.trim()).subscribe({
      next: (nueva) => {
        this.publicando = false;
        this.panelAbierto = false;
        this.notaVersion = '';
        this.exito = `Versión ${nueva.numeroVersion} publicada correctamente`;
        // El catálogo vigente cambió: se recargan las listas que dependen de él
        this.dominios = []; this.controles = []; this.preguntas = [];
        this.cargarVersiones();
        this.precargarContadores();
      },
      error: (err) => {
        this.publicando = false;
        this.errorPublicar = textoError(err, 'No se pudo publicar la nueva versión');
      }
    });
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

  // ===== Ayudas de vista =====

  // Suma de los pesos relativos de los dominios (debe ser 100%)
  get totalPesos(): number {
    return this.dominios.reduce((suma, d) => suma + d.pesoRelativo, 0);
  }

  get pesosCompletos(): boolean {
    return Math.abs(this.totalPesos - 100) < 0.05;
  }

  get totalActivos(): number {
    return this.usuarios.filter(u => u.estado === 'ACTIVO').length;
  }

  get totalJefes(): number {
    return this.usuarios.filter(u => u.rol === 'JEFE_CIBERSEGURIDAD').length;
  }

  get usuariosFiltrados(): UsuarioResponse[] {
    const q = this.busqueda.trim().toLowerCase();

    return this.usuarios.filter(u => {
      const coincideRol =
        this.filtroRol === 'TODOS' ||
        (this.filtroRol === 'JEFE' && u.rol === 'JEFE_CIBERSEGURIDAD') ||
        (this.filtroRol === 'GERENTE' && u.rol === 'GERENTE_GENERAL') ||
        (this.filtroRol === 'ANALISTA' && u.rol === 'ANALISTA_CIBERSEGURIDAD') ||
        (this.filtroRol === 'INACTIVOS' && u.estado === 'INACTIVO');

      const coincideTexto = !q ||
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.organizacionNombre ?? '').toLowerCase().includes(q);

      return coincideRol && coincideTexto;
    });
  }

  iniciales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
  }

  claseRol(rol: string): string {
    switch (rol) {
      case 'JEFE_CIBERSEGURIDAD': return 'jefe';
      case 'ANALISTA_CIBERSEGURIDAD': return 'ana';
      case 'GERENTE_GENERAL': return 'ger';
      default: return 'adm';
    }
  }

  get accionesAuditoria(): string[] {
    return Array.from(new Set(this.auditoria.map(a => a.accion)));
  }

  get usuariosAuditoria(): string[] {
    return Array.from(new Set(this.auditoria.map(a => a.usuarioNombre))).sort((a, b) => a.localeCompare(b));
  }

  buscarAuditoria(): void {
    this.aplicado = { usuario: this.filtroUsuario, desde: this.filtroDesde, hasta: this.filtroHasta };
  }

  limpiarFiltrosAuditoria(): void {
    this.filtroUsuario = this.filtroDesde = this.filtroHasta = '';
    this.buscarAuditoria();
  }

  get rangoFechasInvalido(): boolean {
    return !!this.filtroDesde && !!this.filtroHasta && this.filtroDesde > this.filtroHasta;
  }

  // Compara por día local (yyyy-MM-dd), igual que los campos de fecha
  private diaLocal(fecha: string): string {
    const d = new Date(fecha);
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  }

  get auditoriaFiltrada(): AuditoriaTecnicaResponse[] {
    const q = this.busqueda.trim().toLowerCase();
    const { usuario, desde, hasta } = this.aplicado;

    return this.auditoria.filter(a =>
      (!this.filtroAccion || a.accion === this.filtroAccion) &&
      (!usuario || a.usuarioNombre === usuario) &&
      (!desde || this.diaLocal(a.fecha) >= desde) &&
      (!hasta || this.diaLocal(a.fecha) <= hasta) &&
      (!q ||
        a.usuarioNombre.toLowerCase().includes(q) ||
        a.entidadAfectada.toLowerCase().includes(q) ||
        a.accion.toLowerCase().includes(q) ||
        (a.detalle ?? '').toLowerCase().includes(q))
    );
  }

  claseAccion(accion: string): string {
    const a = accion.toUpperCase();
    if (a.includes('CRE')) return 'c';
    if (a.includes('ELIM') || a.includes('DESACT')) return 'd';
    return 'u';
  }

  // Escala visual de niveles de madurez (a partir del formulario)
  get escala(): { nombre: string; color: string; ancho: number }[] {
    return this.nivelesForm
      .slice()
      .sort((a, b) => a.rangoMin - b.rangoMin)
      .map((n, i) => ({
        nombre: n.nombre,
        color: this.coloresNivel[i % this.coloresNivel.length],
        ancho: Math.max(0, (Number(n.rangoMax) || 0) - (Number(n.rangoMin) || 0))
      }));
  }

  get nivelesValidos(): boolean {
    const n = this.nivelesForm.slice().sort((a, b) => a.rangoMin - b.rangoMin);
    if (n.length === 0) return false;
    if (n[0].rangoMin !== 0 || n[n.length - 1].rangoMax !== 100) return false;
    return n.every((x, i) => x.rangoMin < x.rangoMax && (i === 0 || x.rangoMin === n[i - 1].rangoMax));
  }

  get preguntaSeleccionada(): PreguntaResponse | undefined {
    return this.preguntas.find(p => p.id === Number(this.nuevaRecomendacion.preguntaId));
  }
}
