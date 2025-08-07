export interface Socio {
  id_socio: string;
  usuario_id: string;
  nombre_completo: string;
  dni: string;
  direccion?: string;
  telefono?: string;
  email: string;
  foto?: string;
  activo: boolean;
  fecha_baja?: string;
  fecha_alta?: string;
}

export interface CreateSocioDto {
  usuario_id: string;
  nombre_completo: string;
  dni: string;
  direccion?: string;
  telefono?: string;
  email: string;
  foto?: string;
}

export interface UpdateSocioDto {
  usuario_id?: string;
  nombre_completo?: string;
  dni?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  foto?: string;
  activo?: boolean;
  fecha_baja?: string;
  fecha_alta?: string;
}
