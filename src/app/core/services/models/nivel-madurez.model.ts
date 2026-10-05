export interface NivelMadurezResponse {
  id: number;
  nombre: string;
  rangoMin: number;
  rangoMax: number;
}

export interface NivelItem {
  nombre: string;
  rangoMin: number;
  rangoMax: number;
}

export interface ConfigurarNivelesMadurezRequest {
  niveles: NivelItem[];
}