import {
  CreateNotificacionDto,
  Notificacion,
  NotificacionEnvio,
  NotificacionPlantilla,
  NotificacionSegmento,
  UpdateNotificacionDto,
} from '@/interfaces/notificacion.interface';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

type NotificacionPayload = Record<string, string | number | boolean | null>;

type SocioRecipient = {
  id_socio: string;
  nombre_completo: string;
  email: string | null;
  activo: boolean | null;
};

const notificacionSelect = '*';

const nullableString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toPositiveInt = (value: unknown, fallback: number): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.round(parsed));
};

const normalizeDateTime = (value: unknown): string | null => {
  const raw = nullableString(value);
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    return new Date(raw).toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T00:00:00`).toISOString();
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const normalizePayload = (payload: CreateNotificacionDto | UpdateNotificacionDto): NotificacionPayload => {
  const normalized: NotificacionPayload = {};

  if (payload.plantilla_id !== undefined) normalized.plantilla_id = nullableString(payload.plantilla_id);
  if (payload.titulo !== undefined) normalized.titulo = nullableString(payload.titulo);
  if (payload.asunto !== undefined) normalized.asunto = nullableString(payload.asunto);
  if (payload.cuerpo !== undefined) normalized.cuerpo = nullableString(payload.cuerpo);
  if (payload.tipo !== undefined) normalized.tipo = nullableString(payload.tipo) ?? 'general';
  if (payload.canal !== undefined) normalized.canal = nullableString(payload.canal) ?? 'email';
  if (payload.estado !== undefined) normalized.estado = nullableString(payload.estado) ?? 'borrador';
  if (payload.destinatario_segmento !== undefined) {
    normalized.destinatario_segmento = nullableString(payload.destinatario_segmento) ?? 'socios_activos';
  }
  if (payload.fecha_programada !== undefined) normalized.fecha_programada = normalizeDateTime(payload.fecha_programada);
  if (payload.fecha_vigencia_hasta !== undefined) normalized.fecha_vigencia_hasta = normalizeDateTime(payload.fecha_vigencia_hasta);
  if (payload.mostrar_terminal !== undefined) normalized.mostrar_terminal = Boolean(payload.mostrar_terminal);
  if (payload.terminal_visible !== undefined) normalized.terminal_visible = Boolean(payload.terminal_visible);
  if (payload.terminal_imagen_url !== undefined) normalized.terminal_imagen_url = nullableString(payload.terminal_imagen_url);
  if (payload.terminal_color_neon !== undefined) normalized.terminal_color_neon = nullableString(payload.terminal_color_neon);
  if (payload.terminal_duracion_segundos !== undefined) {
    normalized.terminal_duracion_segundos = toPositiveInt(payload.terminal_duracion_segundos, 8);
  }
  if (payload.terminal_frecuencia_segundos !== undefined) {
    normalized.terminal_frecuencia_segundos = toPositiveInt(payload.terminal_frecuencia_segundos, 60);
  }

  return normalized;
};

export const getNotificacionPlantillas = async (_user: JwtUser): Promise<NotificacionPlantilla[]> => {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('notificacion_plantilla')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as NotificacionPlantilla[];
};

export const getNotificaciones = async (_user: JwtUser): Promise<Notificacion[]> => {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('notificacion')
    .select(notificacionSelect)
    .eq('activo', true)
    .order('creado_en', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Notificacion[];
};

export const getNotificacionById = async (id: string, _user: JwtUser): Promise<Notificacion> => {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('notificacion')
    .select(notificacionSelect)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  const { data: envios } = await supabase
    .from('notificacion_envio')
    .select('*')
    .eq('notificacion_id', id)
    .order('creado_en', { ascending: false })
    .limit(100);

  return {
    ...(data as Notificacion),
    envios: (envios ?? []) as NotificacionEnvio[],
  };
};

export const createNotificacion = async (
  payload: CreateNotificacionDto,
  user: JwtUser
): Promise<Notificacion> => {
  const supabase = conexionBD();
  const normalized = normalizePayload(payload);

  if (!normalized.titulo) throw new Error('Título requerido');
  if (!normalized.asunto) throw new Error('Asunto requerido');
  if (!normalized.cuerpo) throw new Error('Mensaje requerido');

  normalized.estado = normalized.estado ?? 'borrador';
  normalized.destinatario_segmento = normalized.destinatario_segmento ?? 'socios_activos';
  normalized.mostrar_terminal = normalized.mostrar_terminal ?? false;
  normalized.terminal_visible = normalized.terminal_visible ?? true;
  normalized.terminal_duracion_segundos = normalized.terminal_duracion_segundos ?? 8;
  normalized.terminal_frecuencia_segundos = normalized.terminal_frecuencia_segundos ?? 60;
  normalized.creado_por = user.id ?? null;

  const { data, error } = await supabase
    .from('notificacion')
    .insert(normalized)
    .select(notificacionSelect)
    .single();

  if (error) throw new Error(error.message);
  return data as Notificacion;
};

export const updateNotificacion = async (
  id: string,
  payload: UpdateNotificacionDto,
  _user: JwtUser
): Promise<Notificacion> => {
  const supabase = conexionBD();
  const normalized = normalizePayload(payload);

  const { data, error } = await supabase
    .from('notificacion')
    .update({ ...normalized, actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .select(notificacionSelect)
    .single();

  if (error) throw new Error(error.message);
  return data as Notificacion;
};

export const cancelarNotificacion = async (id: string, user: JwtUser): Promise<Notificacion> => {
  return updateNotificacion(id, { estado: 'cancelada' }, user);
};

const resolveRecipients = async (segmento: NotificacionSegmento): Promise<SocioRecipient[]> => {
  const supabase = conexionBD();
  let query = supabase
    .from('socio')
    .select('id_socio,nombre_completo,email,activo')
    .not('email', 'is', null);

  if (segmento === 'socios_activos' || segmento === 'socios_cuota_al_dia') {
    query = query.eq('activo', true);
  }

  const { data, error } = await query.order('nombre_completo', { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as SocioRecipient[]).filter((socio) => Boolean(socio.email));
};


export const getNotificacionesTerminalActivas = async (_user: JwtUser): Promise<Notificacion[]> => {
  const supabase = conexionBD();
  const now = new Date();

  const { data, error } = await supabase
    .from('notificacion')
    .select(notificacionSelect)
    .eq('activo', true)
    .eq('mostrar_terminal', true)
    .eq('terminal_visible', true)
    .neq('estado', 'cancelada')
    .neq('estado', 'error')
    .order('fecha_programada', { ascending: false, nullsFirst: false })
    .order('creado_en', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);

  return ((data ?? []) as Notificacion[]).filter((item) => {
    const desde = item.fecha_programada ? new Date(item.fecha_programada) : null;
    const hasta = item.fecha_vigencia_hasta ? new Date(item.fecha_vigencia_hasta) : null;

    if (desde && !Number.isNaN(desde.getTime()) && desde > now) return false;
    if (hasta && !Number.isNaN(hasta.getTime()) && hasta < now) return false;

    return true;
  });
};

export const enviarNotificacion = async (id: string, user: JwtUser): Promise<Notificacion> => {
  const supabase = conexionBD();
  const notificacion = await getNotificacionById(id, user);

  if (notificacion.estado === 'cancelada') {
    throw new Error('No se puede enviar una notificación cancelada');
  }

  const recipients = await resolveRecipients(notificacion.destinatario_segmento);

  if (recipients.length === 0) {
    const { data, error } = await supabase
      .from('notificacion')
      .update({
        estado: 'error',
        total_destinatarios: 0,
        total_enviados: 0,
        total_errores: 1,
        error: 'No se encontraron socios con email para el segmento seleccionado.',
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id)
      .select(notificacionSelect)
      .single();

    if (error) throw new Error(error.message);
    return data as Notificacion;
  }

  const payload = recipients.map((recipient) => ({
    notificacion_id: id,
    socio_id: recipient.id_socio,
    email: recipient.email,
    nombre_destinatario: recipient.nombre_completo,
    estado: 'enviado',
    enviado_en: new Date().toISOString(),
  }));

  await supabase.from('notificacion_envio').delete().eq('notificacion_id', id);
  const { error: insertError } = await supabase.from('notificacion_envio').insert(payload);
  if (insertError) throw new Error(insertError.message);

  const { data, error } = await supabase
    .from('notificacion')
    .update({
      estado: 'enviada',
      fecha_enviada: new Date().toISOString(),
      total_destinatarios: recipients.length,
      total_enviados: recipients.length,
      total_errores: 0,
      error: null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', id)
    .select(notificacionSelect)
    .single();

  if (error) throw new Error(error.message);
  return data as Notificacion;
};
