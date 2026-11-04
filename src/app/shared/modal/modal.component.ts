import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, input, output } from '@angular/core';
import { IconComponent, NombreIcono } from '../icon/icon.component';

/**
 * Ventana emergente de la plataforma (mismo formato que el pop up del login):
 * icono, título, contenido y botones.
 *
 * - El contenido se escribe dentro de la etiqueta; los botones, con el atributo `acciones`.
 * - El botón marcado con `data-autofocus` recibe el foco al abrirse.
 * - El foco se queda dentro de la ventana mientras está abierta.
 * - Si `cerrable` es verdadero, Esc (y el clic fuera) emiten `cerrar`.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="overlay" (click)="alPulsarFondo($event)">
      <div
        #caja
        class="caja"
        role="alertdialog"
        aria-modal="true"
        [class.ancha]="ancha()"
        [attr.aria-labelledby]="idTitulo"
      >
        <div class="icono" [class]="'icono ' + tono()">
          <app-icon [name]="icono()" />
        </div>

        <h3 [id]="idTitulo">{{ titulo() }}</h3>

        <div class="cuerpo"><ng-content /></div>

        <div class="acciones"><ng-content select="[acciones]" /></div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(8, 13, 20, 0.72);
    }

    .caja {
      width: 100%;
      max-width: 400px;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      padding: 32px 28px 26px;
      background: #1a2332;
      border: 1px solid #324158;
      border-radius: 14px;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
      font-family: inherit;
    }

    .caja.ancha { max-width: 480px; }

    .icono {
      width: 52px;
      height: 52px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 28px;
    }

    .icono.ok { background: rgba(18, 163, 111, 0.16); color: #2ed39a; }
    .icono.warn { background: rgba(232, 161, 58, 0.16); color: #f0b45a; }
    .icono.danger { background: rgba(239, 83, 80, 0.14); color: #ef5350; }
    .icono.info { background: rgba(58, 143, 214, 0.16); color: #6db7f0; }

    h3 {
      margin: 0 0 8px;
      color: #ffffff;
      font-size: 18px;
      font-weight: 700;
    }

    .cuerpo {
      margin: 0 0 22px;
      color: #a0aec0;
      font-size: 14px;
      line-height: 1.5;
    }

    .acciones {
      display: flex;
      gap: 10px;
    }

    .acciones:empty { display: none; }
  `]
})
export class ModalComponent implements AfterViewInit {
  titulo = input.required<string>();
  icono = input<NombreIcono>('info');
  tono = input<'ok' | 'warn' | 'danger' | 'info'>('info');
  cerrable = input(false);
  ancha = input(false);

  cerrar = output<void>();

  @ViewChild('caja', { static: true }) private caja!: ElementRef<HTMLElement>;

  private static contador = 0;
  readonly idTitulo = `modal-titulo-${++ModalComponent.contador}`;

  ngAfterViewInit(): void {
    const el = this.caja.nativeElement;
    const inicial = el.querySelector<HTMLElement>('[data-autofocus]') ?? this.enfocables()[0] ?? el;
    if (inicial === el) el.setAttribute('tabindex', '-1');
    inicial.focus();
  }

  private enfocables(): HTMLElement[] {
    return Array.from(
      this.caja.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    );
  }

  alPulsarFondo(evento: MouseEvent): void {
    if (this.cerrable() && evento.target === evento.currentTarget) {
      this.cerrar.emit();
    }
  }

  @HostListener('document:keydown', ['$event'])
  alPulsarTecla(evento: KeyboardEvent): void {
    if (evento.key === 'Escape' && this.cerrable()) {
      evento.preventDefault();
      this.cerrar.emit();
      return;
    }

    // El foco no sale de la ventana
    if (evento.key === 'Tab') {
      const lista = this.enfocables();
      if (lista.length === 0) {
        evento.preventDefault();
        return;
      }

      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const activo = document.activeElement;
      const dentro = this.caja.nativeElement.contains(activo);

      if (!dentro || (evento.shiftKey && activo === primero)) {
        evento.preventDefault();
        (evento.shiftKey ? ultimo : primero).focus();
      } else if (!evento.shiftKey && activo === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }
  }
}
