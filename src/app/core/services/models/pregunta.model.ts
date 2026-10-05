export interface ControlResponse {
  id: number;
  norma: string;
  anexoA: string;
  dominioId: number;
  dominioNombre: string;
}

export interface PreguntaResponse {
  id: number;
  texto: string;
  dominioId: number;
  dominioNombre: string;
  controles: ControlResponse[];
}
export interface CrearControlRequest {
  norma: string;
  anexoA: string;
  dominioId: number;
}
export interface CrearPreguntaRequest {
  texto: string;
  controlIds: number[];
}