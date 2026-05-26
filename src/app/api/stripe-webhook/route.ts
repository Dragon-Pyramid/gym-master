import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { registerStripeCheckoutPago } from '@/services/server/stripePagoRegistrationService';

export const dynamic = 'force-dynamic';

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET no está definido');
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'No se envió la firma de Stripe' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (error: any) {
    console.error('Firma de Stripe inválida:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    console.log(`Evento no manejado: ${event.type}`);
    return NextResponse.json(
      { message: 'Evento recibido sin acción requerida' },
      { status: 200 }
    );
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await registerStripeCheckoutPago(session, {
      origen: 'stripe_webhook',
    });

    return NextResponse.json(
      {
        message:
          result.status === 'already_registered'
            ? 'Pago ya registrado previamente'
            : 'Webhook recibido correctamente. Pago creado.',
        status: result.status,
        data: result.pago,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al registrar pago desde webhook Stripe:', error);
    return NextResponse.json(
      { error: error.message || 'Error al registrar pago desde Stripe' },
      { status: 500 }
    );
  }
}
