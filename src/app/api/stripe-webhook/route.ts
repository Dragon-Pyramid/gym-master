import { NextRequest } from 'next/server';
import Stripe from 'stripe';

import { stripe } from '@/lib/stripe';
import {
  noStoreJson,
  readTextBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';
import { registerStripeCheckoutPago } from '@/services/server/stripePagoRegistrationService';

export const dynamic = 'force-dynamic';

// AUTH POLICY: PUBLIC_SIGNED_WEBHOOK

const STRIPE_WEBHOOK_BODY_MAX_BYTES = 1024 * 1024;

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET no está definido');
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  let body: string;

  try {
    body = await readTextBody(request, STRIPE_WEBHOOK_BODY_MAX_BYTES);
  } catch (error) {
    return runtimeErrorResponse(
      error,
      'No se pudo procesar el webhook de Stripe',
    );
  }

  const sig = request.headers.get('stripe-signature');

  if (!sig || sig.length > 2048) {
    return noStoreJson(
      { error: 'No se recibió una firma válida de Stripe' },
      400,
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (error) {
    console.error('Firma de Stripe inválida:', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
    return noStoreJson(
      { error: 'Firma de Stripe inválida' },
      400,
    );
  }

  if (event.type !== 'checkout.session.completed') {
    return noStoreJson(
      { message: 'Evento recibido sin acción requerida' },
      200,
    );
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await registerStripeCheckoutPago(session, {
      origen: 'stripe_webhook',
    });

    return noStoreJson(
      {
        message:
          result.status === 'already_registered'
            ? 'Pago ya registrado previamente'
            : 'Webhook recibido correctamente. Pago creado.',
        status: result.status,
        data: result.pago,
      },
      200,
    );
  } catch (error) {
    console.error('Error al registrar pago desde webhook Stripe:', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
    return noStoreJson(
      { error: 'No se pudo registrar el pago desde Stripe' },
      500,
    );
  }
}
