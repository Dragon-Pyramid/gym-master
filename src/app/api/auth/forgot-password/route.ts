import {
  noStoreJson,
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';
import {
  getPasswordRecoveryErrorStatus,
  requestPasswordReset,
} from '@/services/authRecoveryService';

export const dynamic = 'force-dynamic';

// AUTH POLICY: PUBLIC_RECOVERY

const PASSWORD_RECOVERY_BODY_MAX_BYTES = 8 * 1024;

type PasswordRecoveryBody = {
  email?: unknown;
  rol?: unknown;
};

export async function POST(req: Request) {
  try {
    const body = await readJsonBody<PasswordRecoveryBody>(
      req,
      PASSWORD_RECOVERY_BODY_MAX_BYTES,
    );
    const result = await requestPasswordReset({
      email: body.email as string,
      rol: body.rol as string,
      requestUrl: req.url,
      headers: req.headers,
    });

    return noStoreJson(result, 200);
  } catch (error) {
    const status = getPasswordRecoveryErrorStatus(error);

    if (status >= 500) {
      console.error('Error al solicitar recuperación de contraseña:', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
      return runtimeErrorResponse(
        error,
        'No se pudo procesar la solicitud',
      );
    }

    const message = error instanceof Error
      ? error.message
      : 'No se pudo procesar la solicitud';

    return noStoreJson({ error: message }, status);
  }
}
