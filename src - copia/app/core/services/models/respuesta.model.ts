export type NivelImplementacion =
  | 'NO_EXISTE'
  | 'EXISTE_PARCIALMENTE'
  | 'EXISTE_NO_FORMALIZADO'
  | 'IMPLEMENTADO';

export interface GuardarRespuestaRequest {
  preguntaId: number;
  nivelImplementacion: NivelImplementacion;
  comentario?: string;
}

export interface RespuestaResponse {
  id: number;
  preguntaId: number;
  preguntaTexto: string;
  nivelImplementacion: NivelImplementacion;
  comentario: string | null;
}