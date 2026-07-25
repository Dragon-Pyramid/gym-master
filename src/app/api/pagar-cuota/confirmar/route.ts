import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { registerStripeCheckoutPago } from '@/services/server/stripePagoRegistrationService';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

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

    let body: { session_id?: string } = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const sessionId = body.session_id?.trim();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id es obligatorio' },
        { status: 400 }
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
      return NextResponse.json(
        { error: 'La sesión de Stripe no corresponde al socio autenticado' },
        { status: 403 }
      );
    }

    const result = await registerStripeCheckoutPago(session, {
      origen: 'stripe_success_sync',
    });

    return NextResponse.json(
      {
        message:
          result.status === 'already_registered'
            ? 'Pago ya registrado previamente'
            : 'Pago Stripe sincronizado correctamente',
        status: result.status,
        data: result.pago,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al confirmar pago Stripe:', error);
    return NextResponse.json(
      { error: error.message || 'Error al confirmar pago Stripe' },
      { status: 500 }
    );
  }
}
