import {
  authorizationErrorResponse,
  requireDashboardPermission,
  requireRoles,
} from '@/lib/auth/serverAuthorization';
import { noStoreJson } from '@/lib/security/httpRuntimeSecurity';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getPagoReceiptVerificationCredentialsServer } from '@/services/server/pagoReceiptVerificationServerService';

export const dynamic = 'force-dynamic';

const PAGOS_PATH = '/dashboard/pagos';
const MAX_PAYMENT_ID_LENGTH = 128;

// AUTH POLICY: AUTHENTICATED_RECEIPT_CREDENTIALS
// admin/usuario require dashboard payment permission.
// socio may request credentials only for a payment belonging to that socio.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await authMiddleware(req);
    const { id: rawId } = await params;
    const id = String(rawId ?? '').trim();

    if (!id || id.length > MAX_PAYMENT_ID_LENGTH) {
      return noStoreJson(
        {
          error: 'ID de pago inválido',
          error_code: 'PAYMENT_RECEIPT_ID_INVALID',
        },
        400,
      );
    }

    if (user.rol === 'socio') {
      requireRoles(user, ['socio']);
    } else {
      requireRoles(user, ['admin', 'usuario']);
      requireDashboardPermission(user, PAGOS_PATH);
    }

    const data = await getPagoReceiptVerificationCredentialsServer(
      user,
      id,
    );

    return noStoreJson({ data }, 200);
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error ? error.message : 'No se pudo generar la verificación';

    if (message === 'No se encontró el pago') {
      return noStoreJson(
        {
          error: 'No se encontró el pago',
          error_code: 'PAYMENT_NOT_FOUND',
        },
        404,
      );
    }

    console.error('Error al generar credenciales de recibo:', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });

    return noStoreJson(
      {
        error: 'No se pudieron generar las credenciales del comprobante',
        error_code: 'PAYMENT_RECEIPT_CREDENTIALS_ERROR',
      },
      500,
    );
  }
}
