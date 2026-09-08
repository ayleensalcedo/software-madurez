import { Injectable } from '@angular/core';
import { Usuario } from '../services/models/usuario.model';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);

  private usuarios: Usuario[] = [
    {
      id: 1,
      nombre: 'Administrador',
      email: 'admin@madurezai.com',
      password: '123456',
      rol: 'Administrador'
    },
    {
      id: 2,
      nombre: 'Consultor',
      email: 'consultor@madurezai.com',
      password: '123456',
      rol: 'Consultor'
    }
  ];


  login(email: string, password: string): boolean {

    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const usuario = this.usuarios.find(
      u =>
        u.email === email &&
        u.password === password
    );

    if (!usuario) {
      return false;
    }

    localStorage.setItem(
      'usuario',
      JSON.stringify(usuario)
    );

    return true;
  }


  logout(): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem('usuario');

  }


  getUsuario(): Usuario | null {

    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const usuario = localStorage.getItem('usuario');

    if (!usuario) {
      return null;
    }

    return JSON.parse(usuario);

  }


  estaLogueado(): boolean {

    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    return localStorage.getItem('usuario') !== null;

  }


  getRol(): string {

    const usuario = this.getUsuario(); // ya está protegido internamente

    return usuario?.rol ?? '';

  }

}