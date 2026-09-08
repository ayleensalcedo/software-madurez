import { Component } from '@angular/core';
import { PREGUNTAS } from '../../core/data/preguntas';
import { Pregunta, ValorRespuesta } from '../../core/services/models/pregunta.model';
import { HeaderComponent } from '../header/header.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-evaluacion',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './evaluacion.component.html',
  styleUrl: './evaluacion.component.css'
})
export class EvaluacionComponent {

  constructor(private router: Router) {}


  preguntas: Pregunta[] = PREGUNTAS;
  preguntaActual: number = 0;

  dominios = [
    { id: 1, nombre: 'Desarrollo y Uso Responsable' },
    { id: 2, nombre: 'Monitoreo y Respuesta' },
    { id: 3, nombre: 'Protección de Datos' },
    { id: 4, nombre: 'Gestion de Terceros' }
  ];

  get pregunta(): Pregunta {
    return this.preguntas[this.preguntaActual];
  }

  get porcentajeProgreso(): number {
    return Math.round(((this.preguntaActual + 1) / this.preguntas.length) * 100);
  }

  

  totalPreguntasPorDominio(nombreDominio: string): number {
    return this.preguntas.filter(p => p.dominio === nombreDominio).length;
  }

  // Guarda la opción elegida (1, 2, 3 o 4)
  seleccionarRespuesta(valor: ValorRespuesta): void {
    this.preguntas[this.preguntaActual].respuesta = valor;
  }

  // Mapea la respuesta numérica a la recomendación correspondiente
  obtenerRecomendacion(): string | null {
    const resp = this.pregunta.respuesta;

    if (!resp || resp === 4) { 
      // 4 = Implementado (no genera recomendación)
      return null; 
    }

    if (resp === 1) {
      // 1 = Inexistente
      return this.pregunta.recomendaciones.INEXISTENTE;
    }

    if (resp === 2 || resp === 3) {
      // 2 y 3 corresponden a PARCIAL
      return this.pregunta.recomendaciones.PARCIAL;
    }

    return null;
  }

  siguiente(): void {
    if (this.preguntaActual < this.preguntas.length - 1) {
      this.preguntaActual++;
    }
  }

  anterior(): void {
    if (this.preguntaActual > 0) {
      this.preguntaActual--;
    }
  }

  irAlDominio(nombreDominio: string): void {
    const index = this.preguntas.findIndex(p => p.dominio === nombreDominio);
    if (index !== -1) {
      this.preguntaActual = index;
    }
  }

  todasRespondidas(): boolean {
  return this.preguntas.every(p => p.respuesta !== undefined);
}

  finalizarEvaluacion(): void {

  if (!this.todasRespondidas()) {
    alert('Debes responder todas las preguntas antes de finalizar.');
    return;
  }

  // Guardar evaluación
  localStorage.setItem(
    'evaluacion',
    JSON.stringify(this.preguntas)
  );


  this.router.navigate(['/dashboard']);
}
}