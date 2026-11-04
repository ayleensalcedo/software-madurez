import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { OrganizacionesComponent } from './pages/organizaciones/organizaciones.component';
import { EvaluacionComponent } from './pages/evaluacion/evaluacion.component';
import { ResultadosComponent } from './pages/resultados/resultados.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MenuComponent } from './pages/menu/menu.component';
import { authGuard } from './core/guards/auth.guard';
import { EquipoComponent } from './pages/equipo/equipo.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent, canActivate: [authGuard] },
  { path: 'organizaciones', component: OrganizacionesComponent, canActivate: [authGuard] },
  { path: 'evaluacion', component: EvaluacionComponent, canActivate: [authGuard] },
  { path: 'resultados', component: ResultadosComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'equipo', component: EquipoComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
];