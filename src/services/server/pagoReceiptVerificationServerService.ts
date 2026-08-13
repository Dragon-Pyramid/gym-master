import 'server-only';

import type { JwtUser } from '@/interfaces/jwtUser.interface';
import { AuthorizationError } from '@/lib/auth/serverAuthorization';
import { buildPagoReceiptVerificationCode } from '@/lib/security/pagoReceiptVerification';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';

const ALLOWED_ROLES = new Set(['admin', 'usuario', 'socio']);

async function resolveSocioId(user: JwtUser) {
  if (user.id_socio) {
    return user.id_socio;
  }

  const supabase = getSupabaseServerClient();

  const { data: socio, error } = await supabase
    .from('socio')
    .select('id_socio')
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error('No se pudo resolver el socio autenticado');
  }

  if (!socio?.id_socio) {
    throw new AuthorizationError(
      'No se pudo determinar el socio asociado a la cuenta',
      'AUTH_SOCIO_SCOPE_FORBIDDEN',
    );
  }

  return socio.id_socio;
}

export async function getPagoReceiptVerificationCredentialsServer(
  user: JwtUser,
  pagoId: string,
) {
  if (!ALLOWED_ROLES.has(user.rol)) {
    throw new AuthorizationError(
      'El usuario no puede generar credenciales de verificación de pagos',
      'AUTH_ROLE_FORBIDDEN',
    );
  }

  const supabase = getSupabaseServerClient();

  const { data: pago, error } = await supabase
    .from('pago')
    .select('id,socio_id')
    .eq('id', pagoId)
    .maybeSingle();

  if (error) {
    throw new Error('No se pudo consultar el pago');
  }

  if (!pago) {
    throw new Error('No se encontró el pago');
  }

  if (user.rol === 'socio') {
    const socioId = await resolveSocioId(user);

    if (socioId !== pago.socio_id) {
      throw new AuthorizationError(
        'El socio no puede generar credenciales para un pago ajeno',
        'AUTH_SOCIO_SCOPE_FORBIDDEN',
      );
    }
  }

  const codigo = buildPagoReceiptVerificationCode(pago.id);

  return {
    codigo,
    verification_path:
      `/api/pagos/${encodeURIComponent(pago.id)}/verificar` +
      `?codigo=${encodeURIComponent(codigo)}`,
  };
}
