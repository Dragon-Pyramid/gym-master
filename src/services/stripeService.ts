import dayjs from "dayjs";
import { stripe } from "@/lib/stripe";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";
import { getSocioByIdUsuario } from "./socioService";

type CreateSessionPagoOptions = {
  meses_cubiertos?: number;
};

const toPositiveInt = (value: unknown, fallback = 1): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
};

const getStripeCurrency = (): string => {
  return process.env.STRIPE_CURRENCY || "usd";
};

export const createSessionPago = async (
  user: JwtUser,
  options: CreateSessionPagoOptions = {}
): Promise<{ url: string }> => {
  const supabase = conexionBD();

  const mesesCubiertos = toPositiveInt(options.meses_cubiertos, 1);

  const { data: cuota, error: cuotaError } = await supabase
    .from("cuota")
    .select("id, descripcion, monto, periodo, fecha_inicio, fecha_fin, activo")
    .eq("activo", true)
    .order("fecha_inicio", { ascending: false })
    .limit(1)
    .single();

  if (cuotaError || !cuota) {
    console.log(cuotaError?.message);
    throw new Error("Error al traer la cuota vigente");
  }

  const socio = await getSocioByIdUsuario(user.id);

  const { data: ultimoPago, error: ultimoPagoError } = await supabase
    .from("pago")
    .select("id, periodo_hasta, fecha_vencimiento, estado, activo")
    .eq("socio_id", socio.id_socio)
    .eq("estado", "pagado")
    .eq("activo", true)
    .order("periodo_hasta", { ascending: false, nullsFirst: false })
    .order("fecha_vencimiento", { ascending: false, nullsFirst: false })
    .limit(1);

  if (ultimoPagoError) {
    console.log(ultimoPagoError.message);
    throw new Error("Error al traer el último pago");
  }

  const today = dayjs().format("YYYY-MM-DD");
  const ultimoPeriodoHasta = ultimoPago?.[0]?.periodo_hasta || ultimoPago?.[0]?.fecha_vencimiento;

  const periodoDesde = ultimoPeriodoHasta && dayjs(ultimoPeriodoHasta).isAfter(today)
    ? dayjs(ultimoPeriodoHasta).add(1, "day").format("YYYY-MM-DD")
    : today;

  const periodoHasta = dayjs(periodoDesde)
    .add(mesesCubiertos, "month")
    .format("YYYY-MM-DD");

  const cuotaMonto = Number(cuota.monto ?? 0);
  const subtotal = cuotaMonto * mesesCubiertos;
  const totalConDescuento = socio.descuento_activo ? subtotal * 0.9 : subtotal;
  const unitAmount = Math.round(totalConDescuento * 100);

  if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
    throw new Error("El monto de la cuota vigente no es válido");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: getStripeCurrency(),
          product_data: {
            name: `${cuota.descripcion} - ${mesesCubiertos} mes(es)`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXTAUTH_URL}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pago-fallido`,
    metadata: {
      socio_id: socio.id_socio,
      usuario_id: user.id,
      cuota_id: cuota.id,
      meses_cubiertos: String(mesesCubiertos),
      periodo_desde: periodoDesde,
      periodo_hasta: periodoHasta,
      fecha_vencimiento: periodoHasta,
      monto_pagado: String(totalConDescuento),
      metodo_pago: "stripe",
    },
  });

  if (!session?.url) {
    throw new Error("Error al crear la sesión de pago");
  }

  return { url: session.url };
};
