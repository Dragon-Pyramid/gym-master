export type NotificacionTipo =
  | 'general'
  | 'feriado'
  | 'promocion'
  | 'stock'
  | 'cumpleanos'
  | 'cuota'
  | 'sistema'
  | 'recordatorio'
  | 'otro';

export type NotificacionCanal = 'email' | 'terminal' | 'sistema' | 'email_terminal';

export type NotificacionEstado =
  | 'borrador'
  | 'programada'
  | 'enviada'
  | 'cancelada'
  | 'error';

export type NotificacionSegmento =
  | 'todos_socios'
  | 'socios_activos'
  | 'socios_cuota_al_dia'
  | 'manual';

export type NotificacionEnvioEstado = 'pendiente' | 'enviado' | 'error' | 'cancelado';

export interface NotificacionPlantilla {
  id: string;
  nombre: string;
  tipo: NotificacionTipo;
  canal: NotificacionCanal;
  asunto: string;
  cuerpo: string;
  activo: boolean;
  creado_por?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
}

export interface NotificacionEnvio {
  id: string;
  notificacion_id: string;
  socio_id?: string | null;
  email?: string | null;
  nombre_destinatario?: string | null;
  estado: NotificacionEnvioEstado;
  enviado_en?: string | null;
  error?: string | null;
  creado_en?: string | null;
}

export interface Notificacion {
  id: string;
  plantilla_id?: string | null;
  titulo: string;
  asunto: string;
  cuerpo: string;
  tipo: NotificacionTipo;
  canal: NotificacionCanal;
  estado: NotificacionEstado;
  destinatario_segmento: NotificacionSegmento;
  fecha_programada?: string | null;
  fecha_vigencia_hasta?: string | null;
  fecha_enviada?: string | null;
  mostrar_terminal: boolean;
  terminal_visible: boolean;
  terminal_imagen_url?: string | null;
  terminal_color_neon?: string | null;
  terminal_duracion_segundos: number;
  terminal_frecuencia_segundos: number;
  total_destinatarios: number;
  total_enviados: number;
  total_errores: number;
  error?: string | null;
  activo: boolean;
  creado_por?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
  envios?: NotificacionEnvio[];
}

export interface CreateNotificacionDto {
  plantilla_id?: string | null;
  titulo: string;
  asunto: string;
  cuerpo: string;
  tipo: NotificacionTipo;
  canal: NotificacionCanal;
  estado?: NotificacionEstado;
  destinatario_segmento?: NotificacionSegmento;
  fecha_programada?: string | null;
  fecha_vigencia_hasta?: string | null;
  mostrar_terminal?: boolean;
  terminal_visible?: boolean;
  terminal_imagen_url?: string | null;
  terminal_color_neon?: string | null;
  terminal_duracion_segundos?: number | string | null;
  terminal_frecuencia_segundos?: number | string | null;
}

export type UpdateNotificacionDto = Partial<CreateNotificacionDto>;
