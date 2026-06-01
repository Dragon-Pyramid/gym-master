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
