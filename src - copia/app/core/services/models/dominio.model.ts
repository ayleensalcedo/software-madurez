export interface DominioResponse {
  id: number;
  nombre: string;
  descripcion: string;
  pesoRelativo: number;
}

export interface CrearDominioRequest {
  nombre: string;
  descripcion: string;
}