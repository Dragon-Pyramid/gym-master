export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
}

export interface CreateServicioDto {
  nombre: string;
  descripcion: string;
  precio: number;
  activo?: boolean;
}

export interface UpdateServicioDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  activo?: boolean;
}
