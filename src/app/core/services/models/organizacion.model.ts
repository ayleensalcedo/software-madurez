export interface Organizacion {
  id?: number;
  nombre: string;
  sector: string;
  plataformaTextToSql: string;
}
export interface OrganizacionResponse {
  id: number;
  nombre: string;
  sector: string;
}