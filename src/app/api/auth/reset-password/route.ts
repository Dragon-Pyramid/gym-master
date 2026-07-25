import {
  noStoreJson,
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';
import {
  getPasswordRecoveryErrorStatus,
  resetPasswordWithToken,
  validatePasswordResetToken,
} from '@/services/authRecoveryService';

export const dynamic = 'force-dynamic';

// AUTH POLICY: PUBLIC_RECOVERY_TOKEN

const PASSWORD_RESET_BODY_MAX_BYTES = 16 * 1024;
const PASSWORD_RESET_TOKEN_MAX_LENGTH = 256;

type PasswordResetBody = {
  token?: unknown;
  new_password?: unknown;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token')?.trim() ?? '';

  if (!token || token.length > PASSWORD_RESET_TOKEN_MAX_LENGTH) {
    return noStoreJson(
      { valid: false, message: 'El enlace no es válido o expiró' },
      400,
    );
  }

  const result = await validatePasswordResetToken(token);
  return noStoreJson(result, result.valid ? 200 : 400);
}

export async function POST(req: Request) {
  try {
    const body = await readJsonBody<PasswordResetBody>(
      req,
      PASSWORD_RESET_BODY_MAX_BYTES,
    );
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (token.length > PASSWORD_RESET_TOKEN_MAX_LENGTH) {
      return noStoreJson(
        { error: 'El enlace no es válido o expiró' },
        400,
      );
    }

    const result = await resetPasswordWithToken({
      token,
      newPassword: body.new_password as string,
      headers: req.headers,
    });

    return noStoreJson(result, 200);
  } catch (error) {
    const status = getPasswordRecoveryErrorStatus(error);

    if (status >= 500) {
      console.error('Error al restablecer contraseña:', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
      return runtimeErrorResponse(
        error,
        'No se pudo restablecer la contraseña',
      );
    }

    const message = error instanceof Error
      ? error.message
      : 'No se pudo restablecer la contraseña';

    return noStoreJson({ error: message }, status);
  }
}
