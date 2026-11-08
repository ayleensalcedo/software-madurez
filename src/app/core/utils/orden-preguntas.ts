import { PreguntaResponse } from '../services/models/pregunta.model';

/**
 * Ordena las preguntas dominio por dominio, en el orden en que están configurados
 * los dominios. Dentro de cada dominio se conserva el orden original de las preguntas.
 * Los dominios que no estén en la lista se ubican al final, en el orden en que aparecen.
 *
 * Se usa en el formulario de evaluación y en el dashboard para que la numeración
 * "Pregunta N" sea la misma en ambas pantallas.
 */
export function ordenarPreguntasPorDominio(
  preguntas: PreguntaResponse[],
  dominios: { id: number }[] = []
): PreguntaResponse[] {
  const orden = new Map<number, number>();
  dominios.forEach((d, i) => { if (!orden.has(d.id)) orden.set(d.id, i); });
  let siguiente = dominios.length;
  preguntas.forEach(p => { if (!orden.has(p.dominioId)) orden.set(p.dominioId, siguiente++); });

  return preguntas
    .map((pregunta, indice) => ({ pregunta, indice }))
    .sort((a, b) =>
      (orden.get(a.pregunta.dominioId)! - orden.get(b.pregunta.dominioId)!) || (a.indice - b.indice))
    .map(x => x.pregunta);
}
