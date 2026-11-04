import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { EvaluacionResponse } from '../../core/services/models/evaluacion.model';
import { ResultadoResponse } from '../../core/services/models/resultado.model';

interface Lado {
  evaluacion: EvaluacionResponse;
  resultado: ResultadoResponse;
  cobertura: number;
}

interface FilaDominio {
  nombre: string;
  antes: number | null;
  despues: number | null;
  diferencia: number | null;
}

type Tipo = 'mejora' | 'retroceso' | 'igual' | 'na';

/** Vista comparativa de dos evaluaciones: la más antigua a la izquierda y la más reciente a la derecha. */
@Component({
  selector: 'app-comparativa',
  standalone: true,
  imports: [HeaderComponent, IconComponent, DatePipe],
  templateUrl: './comparativa.component.html',
  styleUrl: './comparativa.component.css'
})
export class ComparativaComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private evaluacionService = inject(EvaluacionService);
  private resultadoService = inject(ResultadoService);

  cargando = true;
  error = '';

  anterior?: Lado;
  reciente?: Lado;
  filas: FilaDominio[] = [];
  diferenciaGlobal = 0;

  ngOnInit(): void {
    const a = Number(this.route.snapshot.queryParamMap.get('a'));
    const b = Number(this.route.snapshot.queryParamMap.get('b'));

    if (!a || !b || a === b) {
      this.cargando = false;
      this.error = 'Selecciona dos evaluaciones distintas para compararlas.';
      return;
    }

    forkJoin({
      lista: this.evaluacionService.listarEvaluacionesEquipo(),
      resultadoA: this.resultadoService.obtenerResultado(a),
      resultadoB: this.resultadoService.obtenerResultado(b)
    }).subscribe({
      next: ({ lista, resultadoA, resultadoB }) => {
        const evA = lista.find(e => e.id === a);
        const evB = lista.find(e => e.id === b);

        if (!evA || !evB) {
          this.cargando = false;
          this.error = 'No se encontraron las evaluaciones seleccionadas.';
          return;
        }

        const lados: Lado[] = [
          { evaluacion: evA, resultado: resultadoA, cobertura: Math.round(resultadoA.coberturaGlobal) },
          { evaluacion: evB, resultado: resultadoB, cobertura: Math.round(resultadoB.coberturaGlobal) }
        ].sort((x, y) =>
          new Date(x.evaluacion.fechaInicio).getTime() - new Date(y.evaluacion.fechaInicio).getTime()
        );

        this.anterior = lados[0];
        this.reciente = lados[1];
        this.diferenciaGlobal = this.reciente.cobertura - this.anterior.cobertura;
        this.filas = this.construirFilas(this.anterior.resultado, this.reciente.resultado);
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = typeof err.error === 'string' && err.error
          ? err.error
          : 'No se pudo cargar la comparación de evaluaciones.';
      }
    });
  }

  private construirFilas(antes: ResultadoResponse, despues: ResultadoResponse): FilaDominio[] {
    const nombres = new Map<number, string>();
    antes.porDominio.forEach(d => nombres.set(d.dominioId, d.dominioNombre));
    despues.porDominio.forEach(d => nombres.set(d.dominioId, d.dominioNombre));

    return Array.from(nombres.entries()).map(([id, nombre]) => {
      const a = antes.porDominio.find(d => d.dominioId === id);
      const b = despues.porDominio.find(d => d.dominioId === id);
      const valorA = a ? Math.round(a.coberturaPorcentaje) : null;
      const valorB = b ? Math.round(b.coberturaPorcentaje) : null;

      return {
        nombre,
        antes: valorA,
        despues: valorB,
        diferencia: valorA !== null && valorB !== null ? valorB - valorA : null
      };
    });
  }

  tipo(diferencia: number | null): Tipo {
    if (diferencia === null) return 'na';
    if (diferencia > 0) return 'mejora';
    if (diferencia < 0) return 'retroceso';
    return 'igual';
  }

  texto(diferencia: number | null): string {
    if (diferencia === null) return '—';
    if (diferencia === 0) return 'Sin cambios';
    return `${diferencia > 0 ? '+' : ''}${diferencia}%`;
  }

  get mejoras(): number {
    return this.filas.filter(f => this.tipo(f.diferencia) === 'mejora').length;
  }

  get retrocesos(): number {
    return this.filas.filter(f => this.tipo(f.diferencia) === 'retroceso').length;
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'EN_CURSO': return 'En curso';
      case 'FINALIZADA': return 'Pendiente de revisión';
      case 'VALIDADA': return 'Validada';
      case 'OBSERVADA': return 'Observada';
      default: return estado;
    }
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'EN_CURSO': return 'estado-en-curso';
      case 'FINALIZADA': return 'estado-finalizada';
      case 'VALIDADA': return 'estado-validada';
      case 'OBSERVADA': return 'estado-observada';
      default: return '';
    }
  }

  claseCobertura(valor: number | null): string {
    if (valor === null) return '';
    if (valor <= 40) return 'bajo';
    if (valor <= 60) return 'medio';
    if (valor <= 80) return 'alto';
    return 'optimo';
  }

  volver(): void {
    this.router.navigate(['/equipo']);
  }
}
