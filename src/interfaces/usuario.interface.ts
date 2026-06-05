export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: string;
  activo: boolean;
  creado_en?: Date;
  foto?: string;
  dni?: string | null;
  permisos_menu?: string[] | null;
  must_change_password?: boolean;
  password_actualizado_en?: Date | string | null;
  primer_login_en?: Date | string | null;
  ultimo_login_en?: Date | string | null;
}

export interface CreateUsuarioDto {
  nombre: string;
  email: string;
  password?: string;
  rol?: string;
  dni?: string;
  use_initial_password?: boolean;
  foto?: string;
  permisos_menu?: string[] | null;
  telefono?: string;
  direccion?: string;
  sexo?: 'M' | 'F' | null;
  fecnac?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
  fecha_alta?: string | null;
  puesto?: string | null;
  area?: string | null;
  tipo_contratacion?: string | null;
  turno?: string | null;
  sueldo_base?: number | string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  horarios_texto?: string | null;
  observaciones?: string | null;
}

export interface UpdateUsuarioDto {
  nombre?: string;
  email?: string;
  password?: string;
  password_hash?: string;
  rol?: string;
  activo?: boolean;
  foto?: string;
  dni?: string | null;
  permisos_menu?: string[] | null;
  must_change_password?: boolean;
  telefono?: string;
  direccion?: string;
  sexo?: 'M' | 'F' | null;
  fecnac?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
  fecha_alta?: string | null;
  puesto?: string | null;
  area?: string | null;
  tipo_contratacion?: string | null;
  turno?: string | null;
  sueldo_base?: number | string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  horarios_texto?: string | null;
  observaciones?: string | null;
}

export interface ResponseUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  foto?: string;
  dni?: string | null;
  creado_en?: Date;
  permisos_menu?: string[] | null;
  must_change_password?: boolean;
  password_actualizado_en?: Date | string | null;
  primer_login_en?: Date | string | null;
  ultimo_login_en?: Date | string | null;
}
