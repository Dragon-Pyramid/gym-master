import 'server-only';

import Stripe from 'stripe';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { reactivarSocioPorPago } from '@/services/morosidadService';

export type StripePagoRegistrationResult = {
  status: 'created' | 'already_registered';
  pago: any;
};

function toPositiveInteger(value: unknown, fallback = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), 24);
}

function toMoney(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Number(parsed.toFixed ? parsed.toFixed(2) : parsed);
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getPaymentIntentId(session: Stripe.Checkout.Session): string | null {
  const paymentIntent = session.payment_intent;

  if (!paymentIntent) return null;
  if (typeof paymentIntent === 'string') return paymentIntent;

  return paymentIntent.id ?? null;
}

function getSessionAmount(session: Stripe.Checkout.Session): number {
  if (typeof session.amount_total !== 'number') return 0;
  return Number((session.amount_total / 100).toFixed(2));
}

async function findExistingPago(
  supabase: SupabaseClient,
  stripeSessionId: string,
  stripePaymentIntentId: string | null
) {
  let query = supabase
    .from('pago')
    .select('*')
    .eq('stripe_session_id', stripeSessionId)
    .limit(1);

  const bySession = await query.maybeSingle();
  if (bySession.error) throw new Error(bySession.error.message);
  if (bySession.data) return bySession.data;

  if (!stripePaymentIntentId) return null;

  const byPaymentIntent = await supabase
    .from('pago')
    .select('*')
    .eq('stripe_payment_intent_id', stripePaymentIntentId)
    .limit(1)
    .maybeSingle();

  if (byPaymentIntent.error) throw new Error(byPaymentIntent.error.message);
  return byPaymentIntent.data ?? null;
}

export async function registerStripeCheckoutPago(
  session: Stripe.Checkout.Session,
  options: {
    origen?: 'stripe_webhook' | 'stripe_success_sync';
    supabase?: SupabaseClient;
  } = {}
): Promise<StripePagoRegistrationResult> {
  const supabase = options.supabase ?? getSupabaseServerClient();
  const metadata = session.metadata ?? {};

  const socioId = normalizeString(metadata.socio_id);
  const cuotaId = normalizeString(metadata.cuota_id);

  if (!socioId || !cuotaId) {
    throw new Error('socio_id o cuota_id no encontrados en los metadatos de Stripe');
  }

  if (session.payment_status && session.payment_status !== 'paid') {
    throw new Error(`La sesión de Stripe no está pagada. Estado: ${session.payment_status}`);
  }

  const stripeSessionId = session.id;
  const stripePaymentIntentId = getPaymentIntentId(session);
  const existingPago = await findExistingPago(
    supabase,
    stripeSessionId,
    stripePaymentIntentId
  );

  if (existingPago) {
    return { status: 'already_registered', pago: existingPago };
  }

  const amountFromStripe = getSessionAmount(session);
  const montoPagado = toMoney(metadata.monto_pagado, amountFromStripe);
  const fechaPago = new Date().toISOString().slice(0, 10);
  const periodoDesde =
    normalizeString(metadata.periodo_desde) ?? fechaPago;
  const periodoHasta =
    normalizeString(metadata.periodo_hasta) ??
    normalizeString(metadata.fecha_vencimiento) ??
    fechaPago;

  if (montoPagado <= 0) {
    throw new Error('El monto pagado informado por Stripe no es válido');
  }

  const insertPayload = {
    socio_id: socioId,
    cuota_id: cuotaId,
    fecha_pago: fechaPago,
    fecha_vencimiento: periodoHasta,
    periodo_desde: periodoDesde,
    periodo_hasta: periodoHasta,
    meses_cubiertos: toPositiveInteger(metadata.meses_cubiertos, 1),
    monto_pagado: montoPagado,
    subtotal: toMoney(metadata.subtotal, montoPagado),
    descuento_porcentaje: toMoney(metadata.descuento_porcentaje, 0),
    descuento_monto: toMoney(metadata.descuento_monto, 0),
    descuento_motivo: normalizeString(metadata.descuento_motivo),
    metodo_pago: 'stripe',
    estado: 'pagado',
    observaciones: 'Pago registrado automáticamente por Stripe.',
    enviar_email: true,
    activo: true,
    stripe_session_id: stripeSessionId,
    stripe_payment_intent_id: stripePaymentIntentId,
  };

  const { data, error } = await supabase
    .from('pago')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`No se pudo registrar el pago Stripe: ${error.message}`);
  }

  await reactivarSocioPorPago(
    supabase,
    socioId,
    data.id,
    options.origen ?? 'stripe_webhook',
    null
  );

  return { status: 'created', pago: data };
}
