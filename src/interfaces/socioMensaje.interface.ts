export type SocioMensajeCategoria =
  | 'consulta'
  | 'critica'
  | 'reclamo'
  | 'pregunta'
  | 'sugerencia'
  | 'otro';

export type SocioMensajeEstado = 'pendiente' | 'leido' | 'respondido' | 'cerrado';

export interface SocioMensajeSocioResumen {
  id_socio: string;
  nombre_completo: string;
  email: string | null;
  dni: string | null;
}

export interface SocioMensajeUsuarioResumen {
  id: string;
  nombre: string | null;
  email: string | null;
}

export interface SocioMensaje {
  id: string;
  socio_id: string;
  usuario_id?: string | null;
  asunto: string;
  mensaje: string;
  categoria: SocioMensajeCategoria;
  estado: SocioMensajeEstado;
  respuesta?: string | null;
  respondido_por?: string | null;
  respondido_en?: string | null;
  leido_en?: string | null;
  cerrado_en?: string | null;
  email_respuesta_enviado?: boolean | null;
  email_respuesta_error?: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en?: string | null;
  socio?: SocioMensajeSocioResumen | null;
  usuario?: SocioMensajeUsuarioResumen | null;
  respondedor?: SocioMensajeUsuarioResumen | null;
}

export interface CreateSocioMensajeDto {
  asunto: string;
  mensaje: string;
  categoria?: SocioMensajeCategoria;
}

export interface UpdateSocioMensajeAdminDto {
  estado?: SocioMensajeEstado;
  respuesta?: string;
}
