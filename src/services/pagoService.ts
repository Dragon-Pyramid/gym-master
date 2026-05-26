import { getSupabaseClient, supabase } from "./supabaseClient";
import {
  Pago,
  CreatePagoDto,
  UpdatePagoDto,
  ResponsePago,
} from "../interfaces/pago.interface";
import dayjs from "dayjs";
import {
  reactivarSocioPorPago,
  registrarDesactivacionPorMorosidad,
} from "./morosidadService";
import { calcularDescuentoPago } from "@/lib/cuotas/descuentoPago";
import { fetchCuotaDescuentoConfig } from "@/services/cuotaDescuentoService";

/*export const getAllPagos = async (): Promise<Pago[]> => {
  const { data, error } = await supabase.from("pago").select();
  if (error) throw new Error(error.message);
  return data as Pago[];
};
*/

type PagoRow = {
  id: string;
  socio_id?: string;
  cuota_id?: string;
  fecha_pago: string;
  fecha_vencimiento: string;
  periodo_desde?: string | null;
  periodo_hasta?: string | null;
  meses_cubiertos?: number | null;
  monto_pagado: number;
  subtotal?: number | null;
  descuento_porcentaje?: number | null;
  descuento_monto?: number | null;
  descuento_motivo?: string | null;
  total?: number | null;
  metodo_pago?: string | null;
  estado?: string | null;
  observaciones?: string | null;
  enviar_email?: boolean | null;
  activo?: boolean | null;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  registrado_por:
    | {
        id: string;
        nombre: string;
      }
    | null;
  socio:
    | {
        id_socio: string;
        nombre_completo: string;
        email?: string | null;
      }
    | null;
  cuota:
    | {
        id: string;
        descripcion: string;
        monto?: number | null;
        periodo?: string | null;
        fecha_fin?: string | null;
      }
    | null;
};

export const getAllPagos = async (): Promise<ResponsePago[]> => {
  const { data, error } = await supabase
    .from("pago")
    .select(`
      *,
      socio:socio_id (
        id_socio,
        nombre_completo,
        email
      ),
      cuota:cuota_id (
        id,
        descripcion,
        monto,
        periodo,
        fecha_fin
      ),
      registrado_por:registrado_por (
        id,
        nombre
      )
    `)
    .order("fecha_pago", { ascending: false });

  console.log(error, data);

  if (error) throw new Error(error.message);

  return responseAllPagos((data ?? []) as PagoRow[]);
};

// Genera una respuesta segura y simplificada para consumir en UI.
const responseAllPagos = (data: PagoRow[]): ResponsePago[] => {
  return data.map((pago) => responsePago(pago));
};

const responsePago = (data: PagoRow): ResponsePago => {
  return {
    id: data.id,

    fecha_pago: data.fecha_pago,
    fecha_vencimiento: data.fecha_vencimiento,

    periodo_desde: data.periodo_desde ?? null,
    periodo_hasta: data.periodo_hasta ?? null,
    meses_cubiertos: data.meses_cubiertos ?? null,

    monto_pagado: data.monto_pagado,
    subtotal: data.subtotal ?? null,
    descuento_porcentaje: data.descuento_porcentaje ?? null,
    descuento_monto: data.descuento_monto ?? null,
    descuento_motivo: data.descuento_motivo ?? null,
    total: data.total ?? null,

    metodo_pago: data.metodo_pago ?? null,
    estado: data.estado ?? null,
    observaciones: data.observaciones ?? null,
    enviar_email: data.enviar_email ?? false,
    activo: data.activo ?? true,

    stripe_session_id: data.stripe_session_id ?? null,
    stripe_payment_intent_id: data.stripe_payment_intent_id ?? null,

    registrado_por: data.registrado_por
      ? {
          id: data.registrado_por.id,
          nombre: data.registrado_por.nombre,
        }
      : null,

    cuota: data.cuota
      ? {
          id: data.cuota.id,
          descripcion: data.cuota.descripcion,
          monto: data.cuota.monto ?? null,
          periodo: data.cuota.periodo ?? null,
        }
      : {
          id: data.cuota_id ?? "",
          descripcion: "Cuota no disponible",
          monto: null,
          periodo: null,
        },

    socio: data.socio
      ? {
          id_socio: data.socio.id_socio,
          nombre_completo: data.socio.nombre_completo,
          email: data.socio.email ?? null,
        }
      : {
          id_socio: data.socio_id ?? "",
          nombre_completo: "Socio no disponible",
          email: null,
        },
  };
};

export const createPago = async (payload: CreatePagoDto): Promise<Pago> => {
  const dto = payload as CreatePagoDto & {
    cuota_id?: string;
    fecha_pago?: string;
    fecha_vencimiento?: string;
    periodo_desde?: string;
    periodo_hasta?: string;
    meses_cubiertos?: number;
    monto_pagado?: number;
    subtotal?: number;
    descuento_porcentaje?: number;
    descuento_monto?: number;
    descuento_motivo?: string | null;
    metodo_pago?: string;
    estado?: string;
    registrado_por?: string | null;
    observaciones?: string | null;
    enviar_email?: boolean;
    stripe_session_id?: string | null;
    stripe_payment_intent_id?: string | null;
  };

  const { data: cuota, error: cuotaError } = dto.cuota_id
    ? await supabase.from("cuota").select().eq("id", dto.cuota_id).single()
    : await supabase
        .from("cuota")
        .select()
        .eq("activo", true)
        .order("creado_en", { ascending: false })
        .limit(1)
        .single();

  if (cuotaError) {
    console.log(cuotaError.message);
    throw new Error("Error al traer la cuota");
  }

  const socioId = dto.socio_id;
  const cuotaId = cuota.id;

  const fechaPago = dto.fecha_pago ?? dayjs().format("YYYY-MM-DD");
  const mesesCubiertos = dto.meses_cubiertos ?? 1;

  const periodoDesde = dto.periodo_desde ?? fechaPago;
  const periodoHasta =
    dto.periodo_hasta ??
    dto.fecha_vencimiento ??
    dayjs(periodoDesde).add(mesesCubiertos, "month").format("YYYY-MM-DD");

  const fechaVencimiento = dto.fecha_vencimiento ?? periodoHasta;

  const descuentoConfig = await fetchCuotaDescuentoConfig(supabase);
  const previewDescuento = calcularDescuentoPago({
    cuotaMonto: Number(cuota.monto ?? 0),
    mesesCubiertos,
    config: descuentoConfig,
  });

  const montoPagadoCalculado = dto.monto_pagado ?? previewDescuento.total;
  const montoPagado = Number(montoPagadoCalculado) > 0 ? montoPagadoCalculado : previewDescuento.total;
  const descuentoMonto =
    dto.descuento_monto ?? Math.max(previewDescuento.subtotal - Number(montoPagado), 0);
  const descuentoPorcentaje =
    dto.descuento_porcentaje ?? previewDescuento.descuento_porcentaje;

  const { data, error } = await supabase
    .from("pago")
    .insert({
      socio_id: socioId,
      cuota_id: cuotaId,
      fecha_pago: fechaPago,
      fecha_vencimiento: fechaVencimiento,
      periodo_desde: periodoDesde,
      periodo_hasta: periodoHasta,
      meses_cubiertos: mesesCubiertos,
      monto_pagado: montoPagado,
      subtotal: dto.subtotal ?? previewDescuento.subtotal,
      descuento_porcentaje: descuentoPorcentaje,
      descuento_monto: descuentoMonto,
      descuento_motivo: dto.descuento_motivo ?? previewDescuento.mensaje ?? null,
      metodo_pago: dto.metodo_pago ?? "efectivo",
      estado: dto.estado ?? "pagado",
      registrado_por: dto.registrado_por ?? null,
      observaciones: dto.observaciones ?? null,
      enviar_email: dto.enviar_email ?? true,
      activo: true,
      stripe_session_id: dto.stripe_session_id ?? null,
      stripe_payment_intent_id: dto.stripe_payment_intent_id ?? null,
    })
    .select()
    .single();

  if (error) {
    console.log(error.message);
    throw new Error("Error al crear el pago");
  }

  await reactivarSocioPorPago(
    supabase,
    socioId,
    data.id,
    dto.metodo_pago === "stripe" ? "stripe_webhook" : "pago_manual",
    dto.registrado_por ?? null
  );


  return data as Pago;
};

export const updatePago = async (
  id: string,
  updateData: UpdatePagoDto
): Promise<Pago> => {
  const { data, error } = await supabase
    .from("pago")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró pago con ese id");

  if (data.socio_id && data.estado === "pagado" && data.activo !== false) {
    await reactivarSocioPorPago(
      supabase,
      data.socio_id,
      data.id,
      "pago_update",
      data.registrado_por ?? null
    );
  }

  return data as Pago;
};

export const deletePago = async (id: string): Promise<Pago> => {
  const { data, error } = await supabase
    .from("pago")
    .update({
      activo: false,
      estado: "cancelado",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró pago con ese id");

  if (data.socio_id) {
    await registrarDesactivacionPorMorosidad(
      supabase,
      data.socio_id,
      "pago_cancelado",
      data.registrado_por ?? null
    );
  }

  return data as Pago;
};

export const getPagoById = async (id: string): Promise<ResponsePago> => {
  const { data, error } = await supabase
    .from("pago")
    .select(`
      *,
      socio:socio_id (
        id_socio,
        nombre_completo,
        email
      ),
      cuota:cuota_id (
        id,
        descripcion,
        monto,
        periodo,
        fecha_fin
      ),
      registrado_por:registrado_por (
        id,
        nombre
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.log(error.message);
    throw new Error("No se encontró el pago con ese id");
  }

  return responsePago(data as PagoRow);
};

// Funciones para métricas de pagos
export const dataAnalisisConductaPagos = async (user: any) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("sp_analisis_conducta_pagos");

  if (error) throw new Error(error.message);

  return data;
};

export const dataProyeccionIngresos = async (user: any) => {
  // TODO IMPLEMENTAR LÓGICA DE PROYECCIÓN DE INGRESOS
  throw new Error("Funcionalidad no implementada");
};