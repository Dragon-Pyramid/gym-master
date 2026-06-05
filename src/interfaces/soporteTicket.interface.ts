export type SoporteTicketCategoria =
  | 'fallas'
  | 'dudas'
  | 'problemas'
  | 'sugerencias'
  | 'otros';

export type SoporteTicketPrioridad = 'baja' | 'media' | 'alta' | 'critica';

export type SoporteTicketEstado =
  | 'pendiente'
  | 'en_revision'
  | 'respondido'
  | 'cerrado';

export type SoporteTicketEventoTipo =
  | 'creado'
  | 'estado'
  | 'comentario'
  | 'respuesta'
  | 'email'
  | 'cerrado';

export interface SoporteTicketUsuarioResumen {
  id: string;
  nombre: string | null;
  email: string | null;
  rol?: string | null;
}

export interface SoporteTicketEvento {
  id: string;
  ticket_id: string;
  usuario_id?: string | null;
  tipo: SoporteTicketEventoTipo;
  mensaje?: string | null;
  estado_anterior?: SoporteTicketEstado | null;
  estado_nuevo?: SoporteTicketEstado | null;
  creado_en: string;
  usuario?: SoporteTicketUsuarioResumen | null;
}

export interface SoporteTicket {
  id: string;
  codigo: string;
  categoria: SoporteTicketCategoria;
  prioridad: SoporteTicketPrioridad;
  estado: SoporteTicketEstado;
  asunto: string;
  descripcion: string;
  adjunto_url?: string | null;
  gimnasio_nombre?: string | null;
  usuario_id?: string | null;
  usuario_email?: string | null;
  usuario_nombre?: string | null;
  email_notificacion_enviado: boolean;
  email_notificacion_error?: string | null;
  respondido_por?: string | null;
  respondido_en?: string | null;
  cerrado_en?: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en?: string | null;
  usuario?: SoporteTicketUsuarioResumen | null;
  respondedor?: SoporteTicketUsuarioResumen | null;
  eventos?: SoporteTicketEvento[];
}

export interface CreateSoporteTicketDto {
  categoria: SoporteTicketCategoria;
  prioridad: SoporteTicketPrioridad;
  asunto: string;
  descripcion: string;
  adjunto_url?: string | null;
}

export interface UpdateSoporteTicketDto {
  estado?: SoporteTicketEstado;
  comentario?: string;
  respuesta?: string;
}
