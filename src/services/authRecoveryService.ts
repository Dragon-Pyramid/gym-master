import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { sendEmail } from '@/lib/brevo';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { getPasswordPolicyMessage, isStrongPassword } from '@/utils/passwordPolicy';

type RecoveryRole = 'admin' | 'usuario' | 'socio';

type RequestPasswordResetParams = {
  email: string;
  rol?: string | null;
  requestUrl: string;
  headers: Headers;
};

type ResetPasswordParams = {
  token: string;
  newPassword: string;
  headers: Headers;
};

type PasswordResetTokenRow = {
  id: string;
  usuario_id: string;
  email: string;
  rol: RecoveryRole;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
};

type UsuarioRecoveryRow = {
  id: string;
  nombre: string | null;
  email: string;
  rol: RecoveryRole;
  activo: boolean | null;
};

export const PASSWORD_RESET_GENERIC_MESSAGE =
  'Si el email corresponde a una cuenta válida, enviaremos un enlace para restablecer la contraseña.';

const allowedRoles = new Set<RecoveryRole>(['admin', 'usuario', 'socio']);

class PasswordRecoveryError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PasswordRecoveryError';
    this.status = status;
  }
}

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeRole(value: unknown): RecoveryRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase() as RecoveryRole;
  return allowedRoles.has(normalized) ? normalized : null;
}

function getClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || null;
  return headers.get('x-real-ip') || null;
}

function getUserAgent(headers: Headers): string | null {
  return headers.get('user-agent') || null;
}

function getTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function getTtlMinutes(): number {
  const raw = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? 60);
  return Number.isFinite(raw) && raw >= 10 && raw <= 1440 ? Math.round(raw) : 60;
}

function buildAppBaseUrl(requestUrl: string, headers: Headers): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');

  const origin = headers.get('origin');
  if (origin) return origin.replace(/\/+$/, '');

  const host = headers.get('x-forwarded-host') || headers.get('host');
  const proto = headers.get('x-forwarded-proto') || 'http';
  if (host) return `${proto}://${host}`.replace(/\/+$/, '');

  return new URL(requestUrl).origin.replace(/\/+$/, '');
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'email registrado';
  const first = name.slice(0, 1);
  const last = name.length > 2 ? name.slice(-1) : '';
  return `${first}${'*'.repeat(Math.max(name.length - 2, 2))}${last}@${domain}`;
}

async function insertAudit(params: {
  usuarioId?: string | null;
  email?: string | null;
  rol?: string | null;
  accion: string;
  resultado: string;
  ip?: string | null;
  userAgent?: string | null;
  detalle?: Record<string, unknown>;
}) {
  const supabase = getSupabaseServerClient();

  await supabase.from('auth_password_reset_auditoria').insert({
    usuario_id: params.usuarioId ?? null,
    email: params.email ?? null,
    rol: params.rol ?? null,
    accion: params.accion,
    resultado: params.resultado,
    ip: params.ip ?? null,
    user_agent: params.userAgent ?? null,
    detalle: params.detalle ?? {},
  });
}

function buildResetEmail(params: {
  nombre: string;
  resetUrl: string;
  ttlMinutes: number;
}) {
  const escapedName = params.nombre.replace(/[<>&"']/g, (char) => {
    const map: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char] ?? char;
  });

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px;color:#0f172a">Restablecer contraseña - Gym Master</h2>
      <p>Hola ${escapedName},</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p>Hacé click en el siguiente botón para crear una nueva contraseña segura:</p>
      <p style="margin:24px 0">
        <a href="${params.resetUrl}" style="background:#0ea5e9;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold;display:inline-block">
          Restablecer contraseña
        </a>
      </p>
      <p>El enlace vence en ${params.ttlMinutes} minutos y solo puede usarse una vez.</p>
      <p>Si no solicitaste este cambio, podés ignorar este email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="font-size:12px;color:#64748b">Equipo Gym Master / Dragon Pyramid</p>
    </div>
  `;
}

export async function requestPasswordReset({
  email,
  rol,
  requestUrl,
  headers,
}: RequestPasswordResetParams) {
  const supabase = getSupabaseServerClient();
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = normalizeRole(rol);
  const ip = getClientIp(headers);
  const userAgent = getUserAgent(headers);

  if (!normalizedEmail) {
    throw new PasswordRecoveryError('El email es obligatorio', 400);
  }

  if (rol && !normalizedRole) {
    throw new PasswordRecoveryError('Tipo de usuario inválido', 400);
  }

  const { data: usuario, error } = await supabase
    .from('usuario')
    .select('id,nombre,email,rol,activo')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new PasswordRecoveryError('No se pudo procesar la solicitud', 500);
  }

  const user = usuario as UsuarioRecoveryRow | null;
  const isRecoverable = Boolean(
    user &&
      user.activo !== false &&
      (!normalizedRole || user.rol === normalizedRole)
  );

  if (!isRecoverable || !user) {
    await insertAudit({
      email: normalizedEmail,
      rol: normalizedRole,
      accion: 'request',
      resultado: 'ignored',
      ip,
      userAgent,
      detalle: {
        reason: !user ? 'email_not_found' : user.activo === false ? 'user_inactive_or_not_recoverable' : 'role_mismatch',
      },
    });

    return { message: PASSWORD_RESET_GENERIC_MESSAGE };
  }

  const token = generateResetToken();
  const tokenHash = getTokenHash(token);
  const ttlMinutes = getTtlMinutes();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  await supabase
    .from('auth_password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('usuario_id', user.id)
    .is('used_at', null);

  const { error: insertError } = await supabase.from('auth_password_reset_tokens').insert({
    usuario_id: user.id,
    email: user.email,
    rol: user.rol,
    token_hash: tokenHash,
    expires_at: expiresAt,
    requested_ip: ip,
    user_agent: userAgent,
  });

  if (insertError) {
    throw new PasswordRecoveryError(insertError.message, 500);
  }

  const appBaseUrl = buildAppBaseUrl(requestUrl, headers);
  const resetUrl = `${appBaseUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

  try {
    const emailResult = await sendEmail({
      to: [{ email: user.email, name: user.nombre || user.email }],
      subject: 'Restablecé tu contraseña de Gym Master',
      htmlContent: buildResetEmail({
        nombre: user.nombre || user.email,
        resetUrl,
        ttlMinutes,
      }),
    }) as { skipped?: boolean } | unknown;

    const emailSkipped = Boolean(
      emailResult &&
        typeof emailResult === 'object' &&
        'skipped' in emailResult &&
        (emailResult as { skipped?: boolean }).skipped
    );

    await insertAudit({
      usuarioId: user.id,
      email: user.email,
      rol: user.rol,
      accion: 'request',
      resultado: emailSkipped ? 'email_skipped' : 'email_sent',
      ip,
      userAgent,
      detalle: { expires_at: expiresAt },
    });
  } catch (emailError) {
    console.error('No se pudo enviar el email de recuperación:', emailError);
    await insertAudit({
      usuarioId: user.id,
      email: user.email,
      rol: user.rol,
      accion: 'request',
      resultado: 'email_error',
      ip,
      userAgent,
      detalle: {
        expires_at: expiresAt,
        error: emailError instanceof Error ? emailError.message : 'unknown',
      },
    });
  }

  return { message: PASSWORD_RESET_GENERIC_MESSAGE };
}

export async function validatePasswordResetToken(token: string) {
  const normalizedToken = typeof token === 'string' ? token.trim() : '';

  if (!normalizedToken) {
    return { valid: false, message: 'Token requerido' };
  }

  const supabase = getSupabaseServerClient();
  const tokenHash = getTokenHash(normalizedToken);
  const { data, error } = await supabase
    .from('auth_password_reset_tokens')
    .select('id,usuario_id,email,rol,token_hash,expires_at,used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !data) return { valid: false, message: 'El enlace no es válido o expiró' };

  const row = data as PasswordResetTokenRow;
  if (row.used_at) return { valid: false, message: 'El enlace ya fue utilizado' };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { valid: false, message: 'El enlace expiró. Solicitá uno nuevo.' };
  }

  return {
    valid: true,
    email_masked: maskEmail(row.email),
    expires_at: row.expires_at,
  };
}

export async function resetPasswordWithToken({ token, newPassword, headers }: ResetPasswordParams) {
  const supabase = getSupabaseServerClient();
  const normalizedToken = typeof token === 'string' ? token.trim() : '';
  const ip = getClientIp(headers);
  const userAgent = getUserAgent(headers);

  if (!normalizedToken) {
    throw new PasswordRecoveryError('El enlace de recuperación es obligatorio', 400);
  }

  if (!newPassword || typeof newPassword !== 'string') {
    throw new PasswordRecoveryError('La nueva contraseña es obligatoria', 400);
  }

  if (!isStrongPassword(newPassword)) {
    throw new PasswordRecoveryError(getPasswordPolicyMessage(), 400);
  }

  const tokenHash = getTokenHash(normalizedToken);
  const { data: tokenRow, error: tokenError } = await supabase
    .from('auth_password_reset_tokens')
    .select('id,usuario_id,email,rol,token_hash,expires_at,used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (tokenError || !tokenRow) {
    await insertAudit({
      accion: 'reset',
      resultado: 'invalid_token',
      ip,
      userAgent,
    });
    throw new PasswordRecoveryError('El enlace no es válido o expiró', 400);
  }

  const row = tokenRow as PasswordResetTokenRow;

  if (row.used_at) {
    await insertAudit({
      usuarioId: row.usuario_id,
      email: row.email,
      rol: row.rol,
      accion: 'reset',
      resultado: 'token_used',
      ip,
      userAgent,
    });
    throw new PasswordRecoveryError('El enlace ya fue utilizado', 400);
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await insertAudit({
      usuarioId: row.usuario_id,
      email: row.email,
      rol: row.rol,
      accion: 'reset',
      resultado: 'token_expired',
      ip,
      userAgent,
      detalle: { expires_at: row.expires_at },
    });
    throw new PasswordRecoveryError('El enlace expiró. Solicitá uno nuevo.', 400);
  }

  const { data: usuario, error: userError } = await supabase
    .from('usuario')
    .select('id,nombre,email,rol,activo')
    .eq('id', row.usuario_id)
    .maybeSingle();

  if (userError || !usuario || (usuario as UsuarioRecoveryRow).activo === false) {
    await insertAudit({
      usuarioId: row.usuario_id,
      email: row.email,
      rol: row.rol,
      accion: 'reset',
      resultado: 'user_not_recoverable',
      ip,
      userAgent,
    });
    throw new PasswordRecoveryError('No se pudo restablecer la contraseña de esta cuenta', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('usuario')
    .update({
      password_hash: passwordHash,
      must_change_password: false,
      password_actualizado_en: now,
      actualizado_en: now,
    })
    .eq('id', row.usuario_id);

  if (updateError) {
    throw new PasswordRecoveryError(updateError.message, 500);
  }

  await supabase
    .from('auth_password_reset_tokens')
    .update({ used_at: now })
    .eq('id', row.id);

  await insertAudit({
    usuarioId: row.usuario_id,
    email: row.email,
    rol: row.rol,
    accion: 'reset',
    resultado: 'success',
    ip,
    userAgent,
  });

  return { message: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' };
}

export function getPasswordRecoveryErrorStatus(error: unknown) {
  return error instanceof PasswordRecoveryError ? error.status : 500;
}
