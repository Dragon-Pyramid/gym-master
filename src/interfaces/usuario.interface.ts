export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: string;
  activo: boolean;
  dbName: string;
  sexo: string;
  fecnac: string;
}

export interface CreateUsuarioDto {
  nombre: string;
  email: string;
  password: string;
  dbName: string;
  sexo: string;
  fecnac: string;
}

export interface UpdateUsuarioDto {
  nombre?: string;
  email?: string;
  password_hash?: string;
  rol?: string;
  activo?: boolean;
}

export interface ResponseUsuario{
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}
