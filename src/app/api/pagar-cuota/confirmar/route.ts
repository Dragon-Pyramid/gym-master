import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { stripe } from '@/lib/stripe';
import { registerStripeCheckoutPago } from '@/services/server/stripePagoRegistrationService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);

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
    const metadataUsuarioId = metadata.usuario_id;

    if (user.rol === 'socio' && metadataUsuarioId && metadataUsuarioId !== user.id) {
      return NextResponse.json(
        { error: 'La sesión de Stripe no corresponde al socio autenticado' },
        { status: 403 }
      );
    }

    if (!['socio', 'admin', 'usuario'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'Rol no autorizado para confirmar pagos Stripe' },
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
    console.error('Error al confirmar pago Stripe:', error);
    return NextResponse.json(
      { error: error.message || 'Error al confirmar pago Stripe' },
      { status: 500 }
    );
  }
}
