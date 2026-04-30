export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: string;
  activo: boolean;
  creado_en?: Date;
  foto?: string;
}

export interface CreateUsuarioDto {
  nombre: string;
  email: string;
  password: string;
  foto?: string;
}

export interface UpdateUsuarioDto {
  nombre?: string;
  email?: string;
  password_hash?: string;
  rol?: string;
  activo?: boolean;
  foto?: string;
}

export interface ResponseUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  foto?: string;
  creado_en?: Date;
}
