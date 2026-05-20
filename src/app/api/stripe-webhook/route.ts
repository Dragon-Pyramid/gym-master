import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createPago } from "@/services/pagoService";
import { supabase } from "@/services/supabaseClient";

export const dynamic = "force-dynamic";

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET no está definido");
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const parsePositiveInt = (value: unknown, fallback = 1): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
};

const parseMoney = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value;
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "No se envió la firma de Stripe" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (error: any) {
    console.error("Firma de Stripe inválida:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    console.log(`Evento no manejado: ${event.type}`);
    return NextResponse.json(
      { message: "Evento recibido sin acción requerida" },
      { status: 200 },
    );
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};

  const socioId = metadata.socio_id;
  const cuotaId = metadata.cuota_id;

  if (!socioId || !cuotaId) {
    return NextResponse.json(
      { error: "socio_id o cuota_id no encontrados en los metadatos" },
      { status: 400 },
    );
  }

  const stripeSessionId = session.id;
  const stripePaymentIntentId = toNullableString(session.payment_intent);

  const { data: pagoExistente, error: pagoExistenteError } = await supabase
    .from("pago")
    .select("id")
    .or(
      `stripe_session_id.eq.${stripeSessionId}${
        stripePaymentIntentId
          ? `,stripe_payment_intent_id.eq.${stripePaymentIntentId}`
          : ""
      }`,
    )
    .limit(1);

  if (pagoExistenteError) {
    console.error("Error al validar pago duplicado:", pagoExistenteError);
    return NextResponse.json(
      { error: "Error al validar pago duplicado" },
      { status: 500 },
    );
  }

  if (pagoExistente && pagoExistente.length > 0) {
    return NextResponse.json(
      { message: "Pago ya registrado previamente", data: pagoExistente[0] },
      { status: 200 },
    );
  }

  const amountFromStripe = session.amount_total
    ? session.amount_total / 100
    : 0;
  const montoPagado = parseMoney(metadata.monto_pagado, amountFromStripe);
  const fechaPago = new Date().toISOString().slice(0, 10);
  const periodoDesde = metadata.periodo_desde || fechaPago;
  const periodoHasta =
    metadata.periodo_hasta || metadata.fecha_vencimiento || fechaPago;

  const pago = await createPago({
    socio_id: socioId,
    cuota_id: cuotaId,
    fecha_pago: fechaPago,
    fecha_vencimiento: periodoHasta,
    periodo_desde: periodoDesde,
    periodo_hasta: periodoHasta,
    meses_cubiertos: parsePositiveInt(metadata.meses_cubiertos, 1),
    monto_pagado: montoPagado,
    metodo_pago: "stripe",
    estado: "pagado",
    observaciones: "Pago registrado automáticamente por webhook de Stripe.",
    enviar_email: true,
    stripe_session_id: stripeSessionId,
    stripe_payment_intent_id: stripePaymentIntentId,
  });
  console.log("Pago Stripe creado", pago);

  return NextResponse.json(
    { message: "Webhook recibido correctamente. Pago creado.", data: pago },
    { status: 200 },
  );
}
