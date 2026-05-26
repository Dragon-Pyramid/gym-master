import dayjs from "dayjs";
import { stripe } from "@/lib/stripe";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";
import { getSocioByIdUsuario } from "./socioService";
import { calcularDescuentoPago } from "@/lib/cuotas/descuentoPago";
import { fetchCuotaDescuentoConfig } from "@/services/cuotaDescuentoService";
import type { PagoDescuentoPreview } from "@/interfaces/pago.interface";

type CreateSessionPagoOptions = {
  meses_cubiertos?: number;
};

type PagoCuotaContext = {
  cuota: {
    id: string;
    descripcion: string;
    monto: number;
    periodo?: string | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
  };
  socio: {
    id_socio: string;
  };
  mesesCubiertos: number;
  periodoDesde: string;
  periodoHasta: string;
  preview: PagoDescuentoPreview;
};

const toPositiveInt = (value: unknown, fallback = 1): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), 24);
};

const getStripeCurrency = (): string => {
  return process.env.STRIPE_CURRENCY || "usd";
};

async function buildPagoCuotaContext(
  user: JwtUser,
  options: CreateSessionPagoOptions = {}
): Promise<PagoCuotaContext> {
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

  const periodoDesde =
    ultimoPeriodoHasta && dayjs(ultimoPeriodoHasta).isAfter(today)
      ? dayjs(ultimoPeriodoHasta).add(1, "day").format("YYYY-MM-DD")
      : today;

  const periodoHasta = dayjs(periodoDesde)
    .add(mesesCubiertos, "month")
    .format("YYYY-MM-DD");

  const descuentoConfig = await fetchCuotaDescuentoConfig(supabase);
  const preview = calcularDescuentoPago({
    cuotaMonto: Number(cuota.monto ?? 0),
    mesesCubiertos,
    config: descuentoConfig,
  });

  return {
    cuota: {
      id: cuota.id,
      descripcion: cuota.descripcion,
      monto: Number(cuota.monto ?? 0),
      periodo: cuota.periodo ?? null,
      fecha_inicio: cuota.fecha_inicio ?? null,
      fecha_fin: cuota.fecha_fin ?? null,
    },
    socio: {
      id_socio: socio.id_socio,
    },
    mesesCubiertos,
    periodoDesde,
    periodoHasta,
    preview: {
      ...preview,
      cuota_id: cuota.id,
      cuota_descripcion: cuota.descripcion,
      periodo_desde: periodoDesde,
      periodo_hasta: periodoHasta,
      fecha_vencimiento: periodoHasta,
    },
  };
}

export const previewSessionPago = async (
  user: JwtUser,
  options: CreateSessionPagoOptions = {}
): Promise<PagoDescuentoPreview> => {
  const context = await buildPagoCuotaContext(user, options);
  return context.preview;
};

export const createSessionPago = async (
  user: JwtUser,
  options: CreateSessionPagoOptions = {}
): Promise<{ url: string }> => {
  const context = await buildPagoCuotaContext(user, options);

  const unitAmount = Math.round(context.preview.total * 100);

  if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
    throw new Error("El monto de la cuota vigente no es válido");
  }

  const discountSuffix = context.preview.descuento_aplicado
    ? ` con ${context.preview.descuento_porcentaje}% de descuento`
    : "";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: getStripeCurrency(),
          product_data: {
            name: `${context.cuota.descripcion} - ${context.mesesCubiertos} mes(es)${discountSuffix}`,
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
      socio_id: context.socio.id_socio,
      usuario_id: user.id,
      cuota_id: context.cuota.id,
      meses_cubiertos: String(context.mesesCubiertos),
      periodo_desde: context.periodoDesde,
      periodo_hasta: context.periodoHasta,
      fecha_vencimiento: context.periodoHasta,
      subtotal: String(context.preview.subtotal),
      descuento_porcentaje: String(context.preview.descuento_porcentaje),
      descuento_monto: String(context.preview.descuento_monto),
      descuento_motivo: context.preview.mensaje ?? "",
      monto_pagado: String(context.preview.total),
      metodo_pago: "stripe",
    },
  });

  if (!session?.url) {
    throw new Error("Error al crear la sesión de pago");
  }

  return { url: session.url };
};
