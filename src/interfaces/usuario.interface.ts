export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: string;
  activo: boolean;
  creado_en?: Date;
  foto?: string;
  permisos_menu?: string[] | null;
}

export interface CreateUsuarioDto {
  nombre: string;
  email: string;
  password: string;
  rol?: string;
  dni?: string;
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
  permisos_menu?: string[] | null;
}

export interface ResponseUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  foto?: string;
  creado_en?: Date;
  permisos_menu?: string[] | null;
}
