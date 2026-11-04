import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { EvaluacionResponse } from '../../core/services/models/evaluacion.model';
import { ResultadoResponse } from '../../core/services/models/resultado.model';

interface LadoVista {
  evaluacion: EvaluacionResponse;
  resultado: ResultadoResponse;
}

interface FilaDominio {
  nombre: string;
  izquierda: number | null;
  derecha: number | null;
  diferencia: number | null;
}

@Component({
  selector: 'app-comparativa',
  standalone: true,
  imports: [HeaderComponent, IconComponent, DecimalPipe, DatePipe],
  templateUrl: './comparativa.component.html',
  styleUrl: './comparativa.component.css'
})
export class ComparativaComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private evaluacionService = inject(EvaluacionService);
  private resultadoService = inject(ResultadoService);

  // Izquierda = la evaluación más antigua; derecha = la más reciente
  izquierda: LadoVista | null = null;
  derecha: LadoVista | null = null;

  cargando = true;
  error = '';

  ngOnInit(): void {
    const a = Number(this.route.snapshot.queryParamMap.get('a'));
    const b = Number(this.route.snapshot.queryParamMap.get('b'));

    if (!a || !b || a === b) {
      this.cargando = false;
      this.error = 'Selecciona dos evaluaciones distintas para compararlas.';
      return;
    }

    this.evaluacionService.listarEvaluacionesEquipo().subscribe({
      next: (lista) => {
        const evA = lista.find(e => e.id === a);
        const evB = lista.find(e => e.id === b);

        if (!evA || !evB || evA.estado === 'EN_CURSO' || evB.estado === 'EN_CURSO') {
          this.cargando = false;
          this.error = 'Solo se pueden comparar evaluaciones finalizadas de tu equipo.';
          return;
        }

        forkJoin({
          ra: this.resultadoService.obtenerResultado(evA.id),
          rb: this.resultadoService.obtenerResultado(evB.id)
        }).subscribe({
          next: ({ ra, rb }) => {
            const lados: LadoVista[] = [
              { evaluacion: evA, resultado: ra },
              { evaluacion: evB, resultado: rb }
            ].sort((x, y) => this.tiempo(x.evaluacion) - this.tiempo(y.evaluacion));

            [this.izquierda, this.derecha] = lados;
            this.cargando = false;
          },
          error: () => {
            this.cargando = false;
            this.error = 'No se pudieron cargar los resultados de las evaluaciones.';
          }
        });
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudieron cargar las evaluaciones del equipo.';
      }
    });
  }

  private tiempo(e: EvaluacionResponse): number {
    return new Date(e.fechaFin ?? e.fechaInicio).getTime();
  }

  volver(): void {
    this.router.navigate(['/equipo']);
  }

  // Diferencia (derecha - izquierda) en puntos porcentuales, a un decimal
  private diferencia(izq: number, der: number): number {
    return Math.round((der - izq) * 10) / 10;
  }

  get diferenciaGlobal(): number {
    if (!this.izquierda || !this.derecha) return 0;
    return this.diferencia(this.izquierda.resultado.coberturaGlobal, this.derecha.resultado.coberturaGlobal);
  }

  get filasDominio(): FilaDominio[] {
    if (!this.izquierda || !this.derecha) return [];

    const nombres = new Map<number, string>();
    const izq = new Map<number, number>();
    const der = new Map<number, number>();

    this.izquierda.resultado.porDominio.forEach(d => { nombres.set(d.dominioId, d.dominioNombre); izq.set(d.dominioId, d.coberturaPorcentaje); });
    this.derecha.resultado.porDominio.forEach(d => { nombres.set(d.dominioId, d.dominioNombre); der.set(d.dominioId, d.coberturaPorcentaje); });

    return Array.from(nombres.entries()).map(([id, nombre]) => {
      const i = izq.get(id) ?? null;
      const d = der.get(id) ?? null;
      return {
        nombre,
        izquierda: i,
        derecha: d,
        diferencia: i !== null && d !== null ? this.diferencia(i, d) : null
      };
    });
  }

  get mejoras(): number {
    return this.filasDominio.filter(f => (f.diferencia ?? 0) > 0).length;
  }

  get retrocesos(): number {
    return this.filasDominio.filter(f => (f.diferencia ?? 0) < 0).length;
  }

  clase(diferencia: number | null): string {
    if (diferencia === null || diferencia === 0) return 'igual';
    return diferencia > 0 ? 'mejora' : 'retroceso';
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'FINALIZADA': return 'Pendiente de revisión';
      case 'VALIDADA': return 'Validada';
      case 'OBSERVADA': return 'Observada';
      default: return estado;
    }
  }
}
