import { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  CreateSoporteTicketDto,
  SoporteTicket,
  SoporteTicketCategoria,
  SoporteTicketEstado,
  SoporteTicketEvento,
  SoporteTicketEventoTipo,
  SoporteTicketPrioridad,
  UpdateSoporteTicketDto,
} from '@/interfaces/soporteTicket.interface';
import { sendEmail } from '@/lib/brevo';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';

const ticketSelect = `
  *,
  usuario:usuario_id(id,nombre,email,rol),
  respondedor:respondido_por(id,nombre,email,rol)
`;

const ticketWithEventosSelect = `
  *,
  usuario:usuario_id(id,nombre,email,rol),
  respondedor:respondido_por(id,nombre,email,rol),
  eventos:soporte_ticket_evento(
    *,
    usuario:usuario_id(id,nombre,email,rol)
  )
`;

const allowedCategorias: SoporteTicketCategoria[] = [
  'fallas',
  'dudas',
  'problemas',
  'sugerencias',
  'otros',
];

const allowedPrioridades: SoporteTicketPrioridad[] = [
  'baja',
  'media',
  'alta',
  'critica',
];

const allowedEstados: SoporteTicketEstado[] = [
  'pendiente',
  'en_revision',
  'respondido',
  'cerrado',
];

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCategoria(value: unknown): SoporteTicketCategoria {
  const raw = normalizeString(value) as SoporteTicketCategoria | null;
  return raw && allowedCategorias.includes(raw) ? raw : 'otros';
}

function normalizePrioridad(value: unknown): SoporteTicketPrioridad {
  const raw = normalizeString(value) as SoporteTicketPrioridad | null;
  return raw && allowedPrioridades.includes(raw) ? raw : 'media';
}

function normalizeEstado(value: unknown): SoporteTicketEstado | null {
  const raw = normalizeString(value) as SoporteTicketEstado | null;
  return raw && allowedEstados.includes(raw) ? raw : null;
}

function assertAdminOrUsuario(user: JwtUser) {
  if (user.rol !== 'admin' && user.rol !== 'usuario') {
    throw new Error('No autorizado para gestionar soporte Dragon Pyramid');
  }
}

function getGymName() {
  return (
    process.env.GYM_MASTER_CLIENT_NAME ||
    process.env.NEXT_PUBLIC_GYM_NAME ||
    'Gimnasio cliente Gym Master'
  );
}

function getSupportRecipients() {
  const raw =
    process.env.DRAGON_PYRAMID_SUPPORT_EMAIL ||
    process.env.GYM_MASTER_SUPPORT_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    '';

  return raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({ email, name: 'Soporte Dragon Pyramid' }));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildTicketEmailHtml(ticket: SoporteTicket) {
  const safeDescription = escapeHtml(ticket.descripcion).replace(/\n/g, '<br/>');
  const safeSubject = escapeHtml(ticket.asunto);
  const safeGym = escapeHtml(ticket.gimnasio_nombre || getGymName());
  const safeUserName = escapeHtml(ticket.usuario_nombre || 'Usuario del gimnasio');
  const safeUserEmail = escapeHtml(ticket.usuario_email || 'sin email');

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h2 style="margin: 0 0 16px;">Nuevo ticket de soporte - Gym Master</h2>
      <p>Se registró un nuevo ticket desde una instancia cliente de Gym Master.</p>
      <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:16px 0;background:#f9fafb;">
        <p style="margin:0 0 8px;"><strong>Código:</strong> ${ticket.codigo}</p>
        <p style="margin:0 0 8px;"><strong>Gimnasio:</strong> ${safeGym}</p>
        <p style="margin:0 0 8px;"><strong>Usuario:</strong> ${safeUserName} (${safeUserEmail})</p>
        <p style="margin:0 0 8px;"><strong>Categoría:</strong> ${ticket.categoria}</p>
        <p style="margin:0 0 8px;"><strong>Prioridad:</strong> ${ticket.prioridad}</p>
        <p style="margin:0 0 8px;"><strong>Asunto:</strong> ${safeSubject}</p>
        <p style="margin:0;"><strong>Descripción:</strong><br/>${safeDescription}</p>
        ${ticket.adjunto_url ? `<p style="margin:12px 0 0;"><strong>Adjunto / captura:</strong> ${escapeHtml(ticket.adjunto_url)}</p>` : ''}
      </div>
      <p>Revisar y responder por los canales definidos con el cliente.</p>
    </div>
  `;
}

async function createTicketEvent(
  ticketId: string,
  userId: string | null,
  tipo: SoporteTicketEventoTipo,
  mensaje: string | null,
  estadoAnterior?: SoporteTicketEstado | null,
  estadoNuevo?: SoporteTicketEstado | null
) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('soporte_ticket_evento').insert({
    ticket_id: ticketId,
    usuario_id: userId,
    tipo,
    mensaje,
    estado_anterior: estadoAnterior ?? null,
    estado_nuevo: estadoNuevo ?? null,
  });

  if (error) throw new Error(error.message);
}

async function notifyDragonPyramid(ticket: SoporteTicket) {
  const recipients = getSupportRecipients();

  if (recipients.length === 0) {
    return {
      sent: false,
      error: 'No se configuró DRAGON_PYRAMID_SUPPORT_EMAIL / GYM_MASTER_SUPPORT_EMAIL.',
    };
  }

  try {
    await sendEmail({
      to: recipients,
      subject: `[Gym Master][${ticket.prioridad.toUpperCase()}] ${ticket.codigo} - ${ticket.asunto}`,
      htmlContent: buildTicketEmailHtml(ticket),
    });

    return { sent: true, error: null };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Error enviando email de soporte',
    };
  }
}

export async function getSoporteTickets(
  user: JwtUser,
  params?: { estado?: string | null; q?: string | null }
): Promise<SoporteTicket[]> {
  assertAdminOrUsuario(user);
  const supabase = getSupabaseServerClient();
  const estado = normalizeEstado(params?.estado);
  const term = normalizeString(params?.q);

  let query = supabase
    .from('soporte_ticket')
    .select(ticketSelect)
    .eq('activo', true)
    .order('creado_en', { ascending: false });

  if (estado) query = query.eq('estado', estado);

  if (term) {
    const pattern = `%${term.replace(/[%_]/g, '')}%`;
    query = query.or(
      `codigo.ilike.${pattern},asunto.ilike.${pattern},descripcion.ilike.${pattern},gimnasio_nombre.ilike.${pattern}`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []) as SoporteTicket[];
}

export async function getSoporteTicketById(
  id: string,
  user: JwtUser
): Promise<SoporteTicket> {
  assertAdminOrUsuario(user);
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('soporte_ticket')
    .select(ticketWithEventosSelect)
    .eq('id', id)
    .eq('activo', true)
    .single();

  if (error) throw new Error(error.message);

  const ticket = data as SoporteTicket;
  if (Array.isArray(ticket.eventos)) {
    ticket.eventos = [...ticket.eventos].sort(
      (a: SoporteTicketEvento, b: SoporteTicketEvento) =>
        new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime()
    );
  }

  return ticket;
}

export async function createSoporteTicket(
  payload: CreateSoporteTicketDto,
  user: JwtUser
): Promise<SoporteTicket> {
  assertAdminOrUsuario(user);
  const supabase = getSupabaseServerClient();
  const asunto = normalizeString(payload.asunto);
  const descripcion = normalizeString(payload.descripcion);

  if (!asunto) throw new Error('El asunto es obligatorio');
  if (!descripcion) throw new Error('La descripción es obligatoria');

  const insertPayload = {
    categoria: normalizeCategoria(payload.categoria),
    prioridad: normalizePrioridad(payload.prioridad),
    asunto,
    descripcion,
    adjunto_url: normalizeString(payload.adjunto_url),
    gimnasio_nombre: getGymName(),
    usuario_id: user.id,
    usuario_email: user.email,
    usuario_nombre: user.nombre ?? user.email,
    estado: 'pendiente' as SoporteTicketEstado,
  };

  const { data, error } = await supabase
    .from('soporte_ticket')
    .insert(insertPayload)
    .select(ticketSelect)
    .single();

  if (error) throw new Error(error.message);

  const ticket = data as SoporteTicket;
  await createTicketEvent(
    ticket.id,
    user.id,
    'creado',
    `Ticket creado por ${user.nombre ?? user.email}.`,
    null,
    'pendiente'
  );

  const emailResult = await notifyDragonPyramid(ticket);

  const { data: finalData, error: finalError } = await supabase
    .from('soporte_ticket')
    .update({
      email_notificacion_enviado: emailResult.sent,
      email_notificacion_error: emailResult.error,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', ticket.id)
    .select(ticketSelect)
    .single();

  if (finalError) throw new Error(finalError.message);

  await createTicketEvent(
    ticket.id,
    user.id,
    'email',
    emailResult.sent
      ? 'Notificación enviada a Dragon Pyramid por email.'
      : `No se pudo enviar email a Dragon Pyramid: ${emailResult.error}`,
    null,
    null
  );

  return finalData as SoporteTicket;
}

export async function updateSoporteTicket(
  id: string,
  payload: UpdateSoporteTicketDto,
  user: JwtUser
): Promise<SoporteTicket> {
  assertAdminOrUsuario(user);
  const supabase = getSupabaseServerClient();
  const current = await getSoporteTicketById(id, user);
  const now = new Date().toISOString();
  const estado = normalizeEstado(payload.estado);
  const comentario = normalizeString(payload.comentario);
  const respuesta = normalizeString(payload.respuesta);
  const updatePayload: Record<string, unknown> = { actualizado_en: now };

  if (estado && estado !== current.estado) {
    updatePayload.estado = estado;

    if (estado === 'respondido') {
      updatePayload.respondido_por = user.id;
      updatePayload.respondido_en = now;
    }

    if (estado === 'cerrado') {
      updatePayload.cerrado_en = now;
    }
  }

  if (respuesta) {
    updatePayload.estado = 'respondido';
    updatePayload.respondido_por = user.id;
    updatePayload.respondido_en = now;
  }

  if (!estado && !comentario && !respuesta) {
    throw new Error('No hay cambios para aplicar');
  }

  const { data, error } = await supabase
    .from('soporte_ticket')
    .update(updatePayload)
    .eq('id', id)
    .select(ticketSelect)
    .single();

  if (error) throw new Error(error.message);

  const updated = data as SoporteTicket;

  if (estado && estado !== current.estado) {
    await createTicketEvent(
      id,
      user.id,
      estado === 'cerrado' ? 'cerrado' : 'estado',
      `Estado actualizado de ${current.estado} a ${estado}.`,
      current.estado,
      estado
    );
  }

  if (respuesta) {
    await createTicketEvent(id, user.id, 'respuesta', respuesta, current.estado, 'respondido');
  }

  if (comentario) {
    await createTicketEvent(id, user.id, 'comentario', comentario, null, null);
  }

  return updated;
}
