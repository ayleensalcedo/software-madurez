export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  jefeId: number | null;
}

export interface CrearUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}