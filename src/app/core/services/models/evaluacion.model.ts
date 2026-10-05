export interface IniciarEvaluacionRequest {
  organizacionId?: number;
  nombreOrganizacion?: string;
  sector?: string;
  plataformaTextToSql?: string;
}

export interface EvaluacionResponse {
  id: number;
  organizacionId: number;
  organizacionNombre: string;
  analistaId: number;
  estado: string;
  fechaInicio: string;
  fechaFin: string | null;
  observacion: string | null;
}