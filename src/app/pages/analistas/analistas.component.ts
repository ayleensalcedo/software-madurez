import { Component, HostListener, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { UsuarioResponse } from '../../core/services/models/usuario.model';

@Component({
  selector: 'app-analistas',
  standalone: true,
  imports: [HeaderComponent, IconComponent, FormsModule],
  templateUrl: './analistas.component.html',
  styleUrl: './analistas.component.css'
})
export class AnalistasComponent implements OnInit {

  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private evaluacionService = inject(EvaluacionService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // Registro del propio jefe (la sesión solo guarda nombre, correo y rol)
  private jefe: UsuarioResponse | null = null;
  analistas: UsuarioResponse[] = [];

  busqueda = '';
  filtro: 'TODOS' | 'ACTIVOS' | 'INACTIVOS' = 'TODOS';

  // true cuando el servidor no deja listar usuarios al Jefe y se usa el respaldo local
  modoRespaldo = false;

  cargando = true;
  error = '';
  exito = '';

  // Crear analista
  creando = false;
  guardando = false;
  errorFormulario = '';
  nuevo = { nombre: '', email: '', password: '' };

  // Desactivar analista (ventana de confirmación)
  porDesactivar: UsuarioResponse | null = null;
  desactivando = false;

  ngOnInit(): void {
    if (this.authService.getRol() !== 'JEFE_CIBERSEGURIDAD') {
      this.router.navigate(['/menu']);
      return;
    }
    this.cargar();
  }

  private mensajeError(err: { status?: number; error?: unknown }, porDefecto: string): string {
    if (err.status === 403 || err.status === 401) {
      return 'El servidor no autoriza a tu cuenta para gestionar usuarios.';
    }
    if (typeof err.error === 'string' && err.error) return err.error;
    const mensaje = (err.error as { message?: string } | null)?.message;
    return mensaje || porDefecto;
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';

    this.usuarioService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.modoRespaldo = false;
        const correo = this.authService.getUsuario()?.email?.toLowerCase();
        this.jefe = usuarios.find(u => u.email.toLowerCase() === correo) ?? null;

        // Solo sus analistas: si conocemos su id se filtra por jefeId
        this.analistas = usuarios.filter(u =>
          u.rol === 'ANALISTA_CIBERSEGURIDAD' && (!this.jefe || u.jefeId === this.jefe.id)
        );
        this.cargando = false;
      },
      // El servidor no lista usuarios a un Jefe: se arma el equipo con lo que sí se conoce
      error: () => this.cargarRespaldo()
    });
  }

  // ===== Respaldo sin cambios en el backend =====
  // Equipo = analistas creados desde este navegador (guardados localmente)
  //        + analistas que figuran en las evaluaciones del equipo (solo se conoce su id).

  private get claveLocal(): string {
    return `equipoAnalistas:${(this.authService.getUsuario()?.email ?? '').toLowerCase()}`;
  }

  private leerLocal(): UsuarioResponse[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const datos = JSON.parse(localStorage.getItem(this.claveLocal) ?? '[]');
      return Array.isArray(datos) ? datos : [];
    } catch {
      return [];
    }
  }

  private guardarLocal(lista: UsuarioResponse[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(this.claveLocal, JSON.stringify(lista));
    } catch { /* sin espacio o bloqueado */ }
  }

  private cargarRespaldo(): void {
    this.modoRespaldo = true;
    const locales = this.leerLocal();

    this.evaluacionService.listarEvaluacionesEquipo().subscribe({
      next: (evaluaciones) => this.armarRespaldo(locales, evaluaciones.map(e => ({ id: e.analistaId, org: e.organizacionNombre }))),
      error: () => this.armarRespaldo(locales, [])
    });
  }

  private armarRespaldo(locales: UsuarioResponse[], deEvaluaciones: { id: number; org: string }[]): void {
    const lista = [...locales];

    for (const e of deEvaluaciones) {
      if (e.id && !lista.some(a => a.id === e.id)) {
        lista.push({
          id: e.id,
          nombre: `Analista #${e.id}`,
          email: 'Dato no disponible (sin acceso a la lista de usuarios)',
          rol: 'ANALISTA_CIBERSEGURIDAD',
          estado: 'ACTIVO',
          jefeId: null,
          organizacionId: null,
          organizacionNombre: e.org
        });
      }
    }

    this.analistas = lista;
    this.cargando = false;
  }

  private registrarLocal(analista: UsuarioResponse): void {
    const lista = this.leerLocal().filter(a => a.id !== analista.id);
    lista.push(analista);
    this.guardarLocal(lista);
  }

  private marcarInactivoLocal(id: number): void {
    this.guardarLocal(this.leerLocal().map(a => a.id === id ? { ...a, estado: 'INACTIVO' } : a));
  }

  get filtrados(): UsuarioResponse[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.analistas.filter(a =>
      (this.filtro === 'TODOS' || (this.filtro === 'ACTIVOS') === (a.estado === 'ACTIVO')) &&
      (!q || a.nombre.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
    );
  }

  get totalActivos(): number {
    return this.analistas.filter(a => a.estado === 'ACTIVO').length;
  }

  iniciales(nombre: string): string {
    const p = nombre.trim().split(/\s+/).filter(Boolean);
    return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }

  // ===== Crear =====

  abrirCrear(): void {
    this.nuevo = { nombre: '', email: '', password: '' };
    this.errorFormulario = '';
    this.exito = '';
    this.creando = true;
  }

  cerrarCrear(): void {
    if (!this.guardando) this.creando = false;
  }

  get formularioValido(): boolean {
    return !!this.nuevo.nombre.trim()
      && /^\S+@\S+\.\S+$/.test(this.nuevo.email.trim())
      && this.nuevo.password.length >= 6;
  }

  crear(): void {
    if (!this.formularioValido || this.guardando) return;
    this.guardando = true;
    this.errorFormulario = '';

    this.usuarioService.crearUsuario({
      nombre: this.nuevo.nombre.trim(),
      email: this.nuevo.email.trim(),
      password: this.nuevo.password,
      rol: 'ANALISTA_CIBERSEGURIDAD',
      // El analista queda en la organización del jefe
      ...(this.jefe?.organizacionId ? { organizacionId: this.jefe.organizacionId } : {})
    }).subscribe({
      next: (creado) => {
        // Se recuerda localmente por si el servidor no permite listar usuarios
        if (creado?.id) this.registrarLocal({ ...creado, rol: creado.rol ?? 'ANALISTA_CIBERSEGURIDAD', estado: creado.estado ?? 'ACTIVO' });
        this.guardando = false;
        this.creando = false;
        this.exito = `Analista ${creado?.nombre ?? this.nuevo.nombre} creado correctamente.`;
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.errorFormulario = this.mensajeError(err, 'No se pudo crear el analista.');
      }
    });
  }

  // ===== Desactivar =====

  pedirDesactivar(a: UsuarioResponse): void {
    this.porDesactivar = a;
  }

  cancelarDesactivar(): void {
    if (!this.desactivando) this.porDesactivar = null;
  }

  confirmarDesactivar(): void {
    const a = this.porDesactivar;
    if (!a || this.desactivando) return;
    this.desactivando = true;
    this.error = ''; this.exito = '';

    this.usuarioService.desactivarUsuario(a.id).subscribe({
      next: () => {
        this.desactivando = false;
        this.porDesactivar = null;
        this.exito = `${a.nombre} desactivado correctamente.`;
        this.marcarInactivoLocal(a.id);
        this.cargar();
      },
      error: (err) => {
        this.desactivando = false;
        this.porDesactivar = null;
        this.error = this.mensajeError(err, 'No se pudo desactivar al analista.');
      }
    });
  }

  @HostListener('document:keydown.escape')
  cerrarVentanas(): void {
    this.cerrarCrear();
    this.cancelarDesactivar();
  }

  volver(): void {
    this.router.navigate(['/menu']);
  }
}
