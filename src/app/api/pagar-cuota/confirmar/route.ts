import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { registerStripeCheckoutPago } from '@/services/server/stripePagoRegistrationService';
import {
  noStoreJson,
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

const PAYMENT_CONFIRMATION_BODY_MAX_BYTES = 8 * 1024;

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeDashboardRequest(
      req,
      '/dashboard/mi-cuenta/pagar-cuota',
      ['socio']
    );

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readJsonBody<{ session_id?: unknown }>(
      req,
      PAYMENT_CONFIRMATION_BODY_MAX_BYTES,
    );
    const sessionId = typeof body.session_id === 'string'
      ? body.session_id.trim()
      : '';

    if (!sessionId) {
      return noStoreJson(
        { error: 'session_id es obligatorio' },
        400,
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    const metadata = session.metadata ?? {};
    const metadataUsuarioId = metadata.usuario_id?.trim();
    const metadataSocioId = metadata.socio_id?.trim();

    if (
      !metadataUsuarioId ||
      !metadataSocioId ||
      !user.id_socio ||
      metadataUsuarioId !== user.id ||
      metadataSocioId !== user.id_socio
    ) {
      return noStoreJson(
        { error: 'La sesión de Stripe no corresponde al socio autenticado' },
        403,
      );
    }

    const result = await registerStripeCheckoutPago(session, {
      origen: 'stripe_success_sync',
    });

    return noStoreJson(
      {
        message:
          result.status === 'already_registered'
            ? 'Pago ya registrado previamente'
            : 'Pago Stripe sincronizado correctamente',
        status: result.status,
        data: result.pago,
      },
      200,
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const runtimeResponse = runtimeErrorResponse(
      error,
      'No se pudo confirmar el pago Stripe',
    );
    if (runtimeResponse.status >= 500) {
      console.error('Error al confirmar pago Stripe:', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
    }
    return runtimeResponse;
  }
}
