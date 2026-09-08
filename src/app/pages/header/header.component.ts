import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  private authService = inject(AuthService);

  usuario = this.authService.getUsuario();

  constructor(private router: Router) {}
  
  IrInicio(): void {
    this.router.navigate(['/menu']);
  }

  Logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
