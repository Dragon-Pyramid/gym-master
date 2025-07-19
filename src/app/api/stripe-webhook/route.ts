import { createPago } from "@/services/pagoService";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request:Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No se envió la firma de Stripe" }, { status: 400 });
  }
  
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (error:any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      const checkoutSessionCompleted = event.data.object;
      // guardar en una base de datos
    const socio_id = checkoutSessionCompleted?.metadata?.socio_id;
    if (!socio_id) {
        return NextResponse.json({ error: "socio_id no encontrado en los metadatos" }, { status: 400 });
    }
       
    //AHORA DEBO GENERAR EL PAGO.
    const pago = await createPago({socio_id,registrado_por:"978b915d-a2ae-45d7-b05f-74b8ab555956"})
      // enviar un correo
      console.log({ checkoutSessionCompleted }); 

      break;
    default:
      console.log(`Evento no manejado: ${event.type}`);
  }

  return NextResponse.json({ message: "WebHook Recibido correctamente, pago creado" }, { status: 200 });
}