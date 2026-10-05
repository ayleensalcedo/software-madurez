export interface ResultadoDominioItem {
  dominioId: number;
  dominioNombre: string;
  coberturaPorcentaje: number;
  pesoRelativo: number;
}

export interface ResultadoResponse {
  coberturaGlobal: number;
  nivelMadurez: string;
  porDominio: ResultadoDominioItem[];
}