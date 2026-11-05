import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
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

  cargar(): void {
    this.cargando = true;
    this.error = '';

    this.usuarioService.listarMiEquipo().subscribe({
      next: (equipo) => {
        this.analistas = equipo
          .filter(u => u.rol === 'ANALISTA_CIBERSEGURIDAD')
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = this.mensajeError(err, 'No se pudo cargar tu equipo.');
      }
    });
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

  porDesactivar: UsuarioResponse | null = null;
  desactivando = false;

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
