export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  jefeId: number | null;
  organizacionId: number | null;
  organizacionNombre: string | null;
}

export interface CrearUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol: string;
  organizacionId?: number;
  nombreOrganizacion?: string;
  sectorOrganizacion?: string;
  plataformaOrganizacion?: string;
}