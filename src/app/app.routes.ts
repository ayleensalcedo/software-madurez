import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { OrganizacionesComponent } from './pages/organizaciones/organizaciones.component';
import { EvaluacionComponent } from './pages/evaluacion/evaluacion.component';
import { ResultadosComponent } from './pages/resultados/resultados.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MenuComponent } from './pages/menu/menu.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {path: 'menu', component:MenuComponent},
  {path: 'login', component: LoginComponent},
  {path: 'organizaciones', component: OrganizacionesComponent},
  {path: 'evaluacion', component: EvaluacionComponent},
  {path: 'resultados', component: ResultadosComponent},
  {path: 'dashboard', component: DashboardComponent
}
];