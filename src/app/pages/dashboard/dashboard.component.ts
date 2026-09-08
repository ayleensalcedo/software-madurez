import { Component, OnInit } from '@angular/core';
import { PREGUNTAS } from '../../core/data/preguntas';
import { Pregunta } from '../../core/services/models/pregunta.model';
import { HeaderComponent } from '../header/header.component';
import { DatePipe } from '@angular/common';
import { OrganizacionService } from '../../core/services/organizacion.service'; // ajusta según tu estructura


interface ResultadoDominio {
  nombre: string;
  cobertura: number;
  peso: number;
  preguntas: number;
  puntaje: number;
  puntajeMaximo: number;
}

interface Recomendacion {
  pregunta: Pregunta;
  prioridad: 'ALTA' | 'MEDIA';
  recomendacion: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [HeaderComponent, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  preguntas: Pregunta[] = [];

  organizacion = 'Sin organizacion registrada';
  sector = 'Tecnología';
  solucion = 'Text-to-SQL';

  fechaEvaluacion = new Date();

  dominios = [
    {
      nombre: 'Desarrollo y Uso Responsable',
      peso: 0.29
    },
    {
      nombre: 'Monitoreo y Respuesta',
      peso: 0.22
    },
    {
      nombre: 'Protección de Datos',
      peso: 0.32
    },
    {
      nombre: 'Gestión de Terceros',
      peso: 0.17
    }
  ];
  Math=Math;

  resultadosDominio: ResultadoDominio[] = [];

  coberturaGlobal = 0;

  nivelMadurez = 1;
  nombreMadurez = 'Inicial';

  recomendaciones: Recomendacion[] = [];

  constructor(
    private organizacionService: OrganizacionService
  ) {}

  ngOnInit(): void {
    this.cargarEvaluacion();
    this.calcularResultados();
    this.generarRecomendaciones();
    this.cargarOrganizacion();
  }

  // =========================================================
  // CARGAR ORGANIZACIÓN
  // =========================================================

  cargarOrganizacion(): void {

    const org = this.organizacionService.obtenerOrganizacion();

    if (org) {
      this.organizacion = org.nombre;
      this.sector = org.sector;
    }
  }


  // =========================================================
  // CARGAR EVALUACIÓN
  // =========================================================

  cargarEvaluacion(): void {

    const datosGuardados = localStorage.getItem('evaluacion');

    if (!datosGuardados) {

      // Solo para evitar que el dashboard quede vacío
      // mientras desarrollamos.
      this.preguntas = PREGUNTAS;

      return;
    }

    try {

      const evaluacion = JSON.parse(datosGuardados);

      // Si guardamos un objeto:
      if (evaluacion.respuestas) {

        this.preguntas = evaluacion.respuestas;

        if (evaluacion.fecha) {
          this.fechaEvaluacion = new Date(evaluacion.fecha);
        }

      } else {

        // Compatibilidad con el formato anterior
        // donde guardábamos directamente las preguntas.
        this.preguntas = evaluacion;
      }

    } catch (error) {

      console.error(
        'No se pudo cargar la evaluación',
        error
      );

      this.preguntas = PREGUNTAS;
    }
  }


  // =========================================================
  // CÁLCULO DE RESULTADOS
  // =========================================================

  calcularResultados(): void {

    this.resultadosDominio = [];

    for (const dominio of this.dominios) {

      const preguntasDominio = this.preguntas.filter(
        pregunta => pregunta.dominio === dominio.nombre
      );

      const puntaje = preguntasDominio.reduce(
        (total, pregunta) =>
          total + (pregunta.respuesta ?? 0),
        0
      );

      const puntajeMaximo =
        preguntasDominio.length * 4;

      const cobertura =
        puntajeMaximo > 0
          ? (puntaje / puntajeMaximo) * 100
          : 0;

      this.resultadosDominio.push({

        nombre: dominio.nombre,

        cobertura: Math.round(cobertura),

        peso: dominio.peso,

        preguntas: preguntasDominio.length,

        puntaje,

        puntajeMaximo

      });

    }


    // =======================================================
    // COBERTURA GLOBAL
    // =======================================================

    this.coberturaGlobal =
      this.resultadosDominio.reduce(
        (total, dominio) =>
          total + (
            dominio.cobertura *
            dominio.peso
          ),
        0
      );

    this.coberturaGlobal =
      Math.round(this.coberturaGlobal);


    this.determinarNivelMadurez();

  }


  // =========================================================
  // NIVEL DE MADUREZ
  // =========================================================

  determinarNivelMadurez(): void {

    const cobertura = this.coberturaGlobal;

    if (cobertura <= 20) {

      this.nivelMadurez = 1;
      this.nombreMadurez = 'Inicial';

    } else if (cobertura <= 40) {

      this.nivelMadurez = 2;
      this.nombreMadurez = 'Básico';

    } else if (cobertura <= 60) {

      this.nivelMadurez = 3;
      this.nombreMadurez = 'Definido';

    } else if (cobertura <= 80) {

      this.nivelMadurez = 4;
      this.nombreMadurez = 'Gestionado';

    } else {

      this.nivelMadurez = 5;
      this.nombreMadurez = 'Optimizado';

    }

  }


  // =========================================================
  // RECOMENDACIONES
  // =========================================================

  generarRecomendaciones(): void {

    this.recomendaciones = [];

    for (const pregunta of this.preguntas) {

      const respuesta = pregunta.respuesta;

      if (respuesta === 1) {

        this.recomendaciones.push({

          pregunta,

          prioridad: 'ALTA',

          recomendacion:
            pregunta.recomendaciones.INEXISTENTE

        });

      }

      else if (respuesta === 2 || respuesta === 3) {

        this.recomendaciones.push({

          pregunta,

          prioridad: 'MEDIA',

          recomendacion:
            pregunta.recomendaciones.PARCIAL

        });

      }

    }

    // Primero mostramos las de mayor prioridad
    this.recomendaciones.sort((a, b) => {

      if (a.prioridad === 'ALTA' &&
          b.prioridad === 'MEDIA') {
        return -1;
      }

      if (a.prioridad === 'MEDIA' &&
          b.prioridad === 'ALTA') {
        return 1;
      }

      return 0;
    });

  }


  // =========================================================
  // KPIs
  // =========================================================

  get totalPreguntas(): number {

    return this.preguntas.length;

  }


  get preguntasImplementadas(): number {

    return this.preguntas.filter(
      p => p.respuesta === 4
    ).length;

  }


  get brechas(): number {

    return this.preguntas.filter(
      p => p.respuesta !== undefined &&
           p.respuesta !== null &&
           p.respuesta < 4
    ).length;

  }


  get controlesEvaluados(): number {

    const controles = new Set<string>();

    this.preguntas.forEach(pregunta => {

      pregunta.controlesISO27001?.forEach(
        control => controles.add(`27001-${control}`)
      );

      pregunta.controlesISO42001?.forEach(
        control => controles.add(`42001-${control}`)
      );

    });

    return controles.size;

  }


  // =========================================================
  // RADAR
  // =========================================================

  getRadarPoints(): string {

    const centerX = 150;
    const centerY = 130;
    const radius = 90;

    const total = this.resultadosDominio.length;

    return this.resultadosDominio
      .map((dominio, index) => {

        const angle =
          (-90 + (360 / total) * index)
          * Math.PI / 180;

        const r =
          radius *
          (dominio.cobertura / 100);

        const x =
          centerX +
          Math.cos(angle) * r;

        const y =
          centerY +
          Math.sin(angle) * r;

        return `${x},${y}`;

      })
      .join(' ');

  }


  getRadarLabels(): {
    x: number,
    y: number,
    texto: string
  }[] {

    const centerX = 150;
    const centerY = 130;
    const radius = 110;

    const total = this.resultadosDominio.length;

    return this.resultadosDominio
      .map((dominio, index) => {

        const angle =
          (-90 + (360 / total) * index)
          * Math.PI / 180;

        return {

          x:
            centerX +
            Math.cos(angle) * radius,

          y:
            centerY +
            Math.sin(angle) * radius,

          texto:
            this.obtenerNombreCorto(
              dominio.nombre
            )

        };

      });

  }


  obtenerNombreCorto(nombre: string): string {

    switch (nombre) {

      case 'Desarrollo y Uso Responsable':
        return 'Responsable';

      case 'Monitoreo y Respuesta':
        return 'Monitoreo';

      case 'Protección de Datos':
        return 'Datos';

      case 'Gestión de Terceros':
        return 'Terceros';

      default:
        return nombre;

    }

  }


  obtenerClaseCobertura(
    cobertura: number
  ): string {

    if (cobertura <= 40) {
      return 'bajo';
    }

    if (cobertura <= 60) {
      return 'medio';
    }

    if (cobertura <= 80) {
      return 'alto';
    }

    return 'optimo';

  }


  obtenerClasePrioridad(
    prioridad: string
  ): string {

    return prioridad === 'ALTA'
      ? 'priority-high'
      : 'priority-medium';

  }

}