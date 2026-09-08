export type ValorRespuesta = 1 | 2 | 3 | 4;

export interface Recomendaciones {
  INEXISTENTE: string;
  PARCIAL: string;
}

export interface Pregunta {

  id: number;
  dominio: string;
  pregunta: string;
  controlesISO27001: string[];
  controlesISO42001: string[];
  recomendaciones: Recomendaciones;
  respuesta?: ValorRespuesta|null;
}