import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

  constructor(private router: Router) {}
  
  Registrar(): void {
    this.router.navigate(['/organizaciones']);
  }

  Evaluar(): void {
    this.router.navigate(['/evaluacion']);
  }

  Dashboard(): void {
    this.router.navigate(['/dashboard']);
  }

}
