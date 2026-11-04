import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './core/guards/auth.guard';

// El login se carga al iniciar; el resto de las pantallas se descargan al visitarlas por primera vez
// (reduce el paquete inicial). Los guardianes de ruta funcionan igual.
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  { path: 'login', component: LoginComponent },
  { path: 'menu', loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent), canActivate: [authGuard] },
  { path: 'organizaciones', loadComponent: () => import('./pages/organizaciones/organizaciones.component').then(m => m.OrganizacionesComponent), canActivate: [authGuard] },
  { path: 'evaluacion', loadComponent: () => import('./pages/evaluacion/evaluacion.component').then(m => m.EvaluacionComponent), canActivate: [authGuard] },
  { path: 'resultados', loadComponent: () => import('./pages/resultados/resultados.component').then(m => m.ResultadosComponent), canActivate: [authGuard] },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'equipo', loadComponent: () => import('./pages/equipo/equipo.component').then(m => m.EquipoComponent), canActivate: [authGuard] },
  { path: 'equipo/comparar', loadComponent: () => import('./pages/comparativa/comparativa.component').then(m => m.ComparativaComponent), canActivate: [authGuard] },
  { path: 'admin', loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent), canActivate: [authGuard] },
];