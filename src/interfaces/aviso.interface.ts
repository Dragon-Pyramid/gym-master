export interface Aviso {
  id: string;
  mensaje: string;
  tipo: string;
  titulo: string;
  fecha_envio: string;
  enviar_email: boolean;
  enviado: boolean;
  activo: boolean;
}

export interface CreateAvisoDto {
  mensaje: string;
  tipo: string;
  titulo: string;
  fecha_envio: string;
  enviar_email: boolean;
  enviado: boolean;
}

export interface UpdateAvisoDto {
  mensaje?: string;
  tipo?: string;
  titulo?: string;
  fecha_envio?: string;
  enviar_email?: boolean;
  enviado?: boolean;
  activo?: boolean;
}
