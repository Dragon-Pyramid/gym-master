import { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  CreateSocioMensajeDto,
  SocioMensaje,
  SocioMensajeCategoria,
  SocioMensajeEstado,
  UpdateSocioMensajeAdminDto,
} from '@/interfaces/socioMensaje.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { sendEmail } from '@/lib/brevo';

const mensajeSelect = `
  *,
  socio:socio_id(id_socio,nombre_completo,email,dni),
  usuario:usuario_id(id,nombre,email),
  respondedor:respondido_por(id,nombre,email)
`;

const allowedCategorias: SocioMensajeCategoria[] = [
  'consulta',
  'critica',
  'reclamo',
  'pregunta',
  'sugerencia',
  'otro',
];

const allowedEstados: SocioMensajeEstado[] = [
  'pendiente',
  'leido',
  'respondido',
  'cerrado',
];

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCategoria(value: unknown): SocioMensajeCategoria {
  const raw = normalizeString(value) as SocioMensajeCategoria | null;
  return raw && allowedCategorias.includes(raw) ? raw : 'consulta';
}

function normalizeEstado(value: unknown): SocioMensajeEstado | null {
  const raw = normalizeString(value) as SocioMensajeEstado | null;
  return raw && allowedEstados.includes(raw) ? raw : null;
}

function assertAdminOrUsuario(user: JwtUser) {
  if (user.rol !== 'admin' && user.rol !== 'usuario') {
    throw new Error('No autorizado para administrar mensajes de socios');
  }
}

async function resolveSocioForUser(user: JwtUser): Promise<string> {
  if (user.rol !== 'socio') {
    throw new Error('Solo los socios pueden usar esta bandeja personal');
  }

  if (user.id_socio) return user.id_socio;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('socio')
    .select('id_socio')
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.id_socio) {
    throw new Error('No se pudo identificar el socio asociado al usuario');
  }

  return data.id_socio as string;
}

export async function getMensajesSocio(user: JwtUser): Promise<SocioMensaje[]> {
  const supabase = getSupabaseServerClient();
  const socioId = await resolveSocioForUser(user);

  const { data, error } = await supabase
    .from('socio_mensaje')
    .select(mensajeSelect)
    .eq('socio_id', socioId)
    .eq('activo', true)
    .order('creado_en', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SocioMensaje[];
}

export async function createMensajeSocio(
  payload: CreateSocioMensajeDto,
  user: JwtUser
): Promise<SocioMensaje> {
  const supabase = getSupabaseServerClient();
  const socioId = await resolveSocioForUser(user);
  const asunto = normalizeString(payload.asunto);
  const mensaje = normalizeString(payload.mensaje);

  if (!asunto) throw new Error('El asunto es obligatorio');
  if (!mensaje) throw new Error('El mensaje es obligatorio');

  const insertPayload = {
    socio_id: socioId,
    usuario_id: user.id,
    asunto,
    mensaje,
    categoria: normalizeCategoria(payload.categoria),
    estado: 'pendiente' as SocioMensajeEstado,
  };

  const { data, error } = await supabase
    .from('socio_mensaje')
    .insert(insertPayload)
    .select(mensajeSelect)
    .single();

  if (error) throw new Error(error.message);
  return data as SocioMensaje;
}

export async function getMensajesAdmin(
  user: JwtUser,
  params?: { estado?: string | null; q?: string | null }
): Promise<SocioMensaje[]> {
  assertAdminOrUsuario(user);
  const supabase = getSupabaseServerClient();
  const estado = normalizeEstado(params?.estado);
  const term = normalizeString(params?.q);

  let query = supabase
    .from('socio_mensaje')
    .select(mensajeSelect)
    .eq('activo', true)
    .order('creado_en', { ascending: false });

  if (estado) query = query.eq('estado', estado);

  if (term) {
    const pattern = `%${term.replace(/[%_]/g, '')}%`;
    query = query.or(
      `asunto.ilike.${pattern},mensaje.ilike.${pattern},respuesta.ilike.${pattern}`
    );
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data ?? []) as SocioMensaje[];
}

export async function getMensajeAdminById(
  id: string,
  user: JwtUser
): Promise<SocioMensaje> {
  assertAdminOrUsuario(user);
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('socio_mensaje')
    .select(mensajeSelect)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as SocioMensaje;
}

function buildRespuestaEmailHtml(mensaje: SocioMensaje, respuesta: string) {
  const socioNombre = mensaje.socio?.nombre_completo || 'socio';
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h2 style="margin: 0 0 16px;">Respuesta de administración - Gym Master</h2>
      <p>Hola ${socioNombre},</p>
      <p>La administración respondió tu mensaje:</p>
      <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:16px 0;background:#f9fafb;">
        <p style="margin:0 0 8px;"><strong>Asunto:</strong> ${mensaje.asunto}</p>
        <p style="margin:0;"><strong>Tu consulta:</strong><br/>${mensaje.mensaje.replace(/\n/g, '<br/>')}</p>
      </div>
      <div style="border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:16px 0;background:#eff6ff;">
        <p style="margin:0;"><strong>Respuesta:</strong><br/>${respuesta.replace(/\n/g, '<br/>')}</p>
      </div>
      <p>También podés ver esta respuesta desde tu panel de socio.</p>
      <p style="margin-top:24px;">Saludos,<br/>Equipo Gym Master</p>
    </div>
  `;
}

async function notifySocioResponse(mensaje: SocioMensaje, respuesta: string) {
  const socioEmail = mensaje.socio?.email;
  if (!socioEmail) return { sent: false, error: 'El socio no tiene email registrado.' };

  try {
    await sendEmail({
      to: [
        {
          email: socioEmail,
          name: mensaje.socio?.nombre_completo || socioEmail,
        },
      ],
      subject: `Respuesta a tu mensaje: ${mensaje.asunto}`,
      htmlContent: buildRespuestaEmailHtml(mensaje, respuesta),
    });
    return { sent: true, error: null };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Error enviando email',
    };
  }
}

export async function updateMensajeAdmin(
  id: string,
  payload: UpdateSocioMensajeAdminDto,
  user: JwtUser
): Promise<SocioMensaje> {
  assertAdminOrUsuario(user);
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const respuesta = normalizeString(payload.respuesta);
  const estado = normalizeEstado(payload.estado);
  const updatePayload: Record<string, unknown> = {
    actualizado_en: now,
  };

  if (estado === 'leido') {
    updatePayload.estado = 'leido';
    updatePayload.leido_en = now;
  }

  if (estado === 'cerrado') {
    updatePayload.estado = 'cerrado';
    updatePayload.cerrado_en = now;
  }

  if (respuesta) {
    updatePayload.respuesta = respuesta;
    updatePayload.estado = 'respondido';
    updatePayload.respondido_por = user.id;
    updatePayload.respondido_en = now;
  }

  if (!respuesta && !estado) {
    throw new Error('No hay cambios para aplicar');
  }

  const { data, error } = await supabase
    .from('socio_mensaje')
    .update(updatePayload)
    .eq('id', id)
    .select(mensajeSelect)
    .single();

  if (error) throw new Error(error.message);

  const updated = data as SocioMensaje;

  if (respuesta) {
    const emailResult = await notifySocioResponse(updated, respuesta);
    const { data: finalData, error: finalError } = await supabase
      .from('socio_mensaje')
      .update({
        email_respuesta_enviado: emailResult.sent,
        email_respuesta_error: emailResult.error,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id)
      .select(mensajeSelect)
      .single();

    if (finalError) throw new Error(finalError.message);
    return finalData as SocioMensaje;
  }

  return updated;
}
