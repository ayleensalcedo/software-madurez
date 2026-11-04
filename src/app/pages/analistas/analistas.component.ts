import { Component, HostListener, OnInit, inject } from '@angular/core';
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

  analistas: UsuarioResponse[] = [];

  busqueda = '';
  filtro: 'TODOS' | 'ACTIVOS' | 'INACTIVOS' = 'TODOS';


  cargando = true;
  error = '';
  exito = '';

  // Crear analista
  creando = false;
  guardando = false;
  errorFormulario = '';
  nuevo = { nombre: '', email: '', password: '' };

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

  // El backend solo lista usuarios al Administrador (GET /usuarios responde 400 a un Jefe),
  // así que el equipo se arma con lo que sí se conoce.
  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.cargarRespaldo();
  }

  // ===== Respaldo sin cambios en el backend =====
  // Equipo = analistas creados desde este navegador (guardados localmente)
  //        + analistas que figuran en las evaluaciones del equipo (solo se conoce su id).

  private cargarRespaldo(): void {
    const locales = this.usuarioService.leerEquipoLocal(this.authService.getUsuario()?.email);

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
      // El servidor asocia el analista al jefe que lo crea
      rol: 'ANALISTA_CIBERSEGURIDAD'
    }).subscribe({
      next: (creado) => {
        // El servidor no permite listar el equipo: se recuerda en este navegador
        if (creado?.id) {
          this.usuarioService.registrarAnalistaLocal(this.authService.getUsuario()?.email,
            { ...creado, rol: creado.rol ?? 'ANALISTA_CIBERSEGURIDAD', estado: creado.estado ?? 'ACTIVO' });
        }
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

  @HostListener('document:keydown.escape')
  cerrarVentanas(): void {
    this.cerrarCrear();
  }

  volver(): void {
    this.router.navigate(['/menu']);
  }
}
