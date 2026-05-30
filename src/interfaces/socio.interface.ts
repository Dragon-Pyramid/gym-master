export interface Socio {
  id_socio: string;
  usuario_id: string;
  nombre_completo: string;
  dni: string;
  direccion?: string;
  telefono?: string;
  email: string;
  sexo?: 'M' | 'F' | null;
  fecnac?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
  foto?: string;
  activo: boolean;
  fecha_baja?: string;
  fecha_alta?: string;
  descuento_activo: boolean;
}

export interface CreateSocioDto {
  usuario_id: string;
  nombre_completo: string;
  dni: string;
  direccion?: string;
  telefono?: string;
  email: string;
  sexo?: 'M' | 'F' | null;
  fecnac?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
  foto?: string;
}

export interface UpdateSocioDto {
  usuario_id?: string;
  nombre_completo?: string;
  dni?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  sexo?: 'M' | 'F' | null;
  fecnac?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
  foto?: string;
  activo?: boolean;
  fecha_baja?: string;
  fecha_alta?: string;
  descuento_activo?: boolean;
}
