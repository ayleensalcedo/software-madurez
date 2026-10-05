export interface RecomendacionResponse {
  id: number;
  descripcion: string;
  preguntaId: number;
  preguntaTexto: string;
  nivel: string;
}
export interface RecomendacionSugerida {
  preguntaId: number;
  preguntaTexto: string;
  dominioNombre: string;
  nivelRespondido: string;
  recomendacionDescripcion: string;
}
export interface CrearRecomendacionRequest {
  preguntaId: number;
  nivel: string;
  descripcion: string;
}