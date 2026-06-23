export type ServicioCategoria =
  | "personal_trainer"
  | "evaluacion"
  | "nutricion"
  | "clase_especial"
  | "pase"
  | "alquiler"
  | "premium"
  | "otro";

export type ServicioModalidad = "presencial" | "online" | "mixto";

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  codigo?: string | null;
  activo: boolean;
  categoria?: ServicioCategoria | string | null;
  duracion_minutos?: number | null;
  requiere_reserva?: boolean | null;
  cupo_maximo?: number | null;
  modalidad?: ServicioModalidad | string | null;
  disponible_online?: boolean | null;
  observaciones?: string | null;
  creado_en?: string;
  actualizado_en?: string;
}

export interface CreateServicioDto {
  nombre: string;
  descripcion: string;
  precio: number;
  codigo?: string | null;
  activo?: boolean;
  categoria?: ServicioCategoria | string | null;
  duracion_minutos?: number | null;
  requiere_reserva?: boolean | null;
  cupo_maximo?: number | null;
  modalidad?: ServicioModalidad | string | null;
  disponible_online?: boolean | null;
  observaciones?: string | null;
}

export interface UpdateServicioDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  codigo?: string | null;
  activo?: boolean;
  categoria?: ServicioCategoria | string | null;
  duracion_minutos?: number | null;
  requiere_reserva?: boolean | null;
  cupo_maximo?: number | null;
  modalidad?: ServicioModalidad | string | null;
  disponible_online?: boolean | null;
  observaciones?: string | null;
}
