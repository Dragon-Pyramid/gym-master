import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";
import {
  buildPagoVerificationCode,
  isPagoVerificationCodeValid,
  normalizePagoVerificationCode,
} from "@/utils/pagoReciboCodigo";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const codigo = normalizePagoVerificationCode(url.searchParams.get("codigo"));

    if (!id) {
      return NextResponse.json(
        {
          valid: false,
          error: "ID de pago requerido",
        },
        { status: 400 }
      );
    }

    if (!codigo) {
      return NextResponse.json(
        {
          valid: false,
          error: "Código de verificación requerido",
        },
        { status: 400 }
      );
    }

    if (!isPagoVerificationCodeValid(id, codigo)) {
      return NextResponse.json(
        {
          valid: false,
          codigo,
          error: "Código de verificación inválido para este pago",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("pago")
      .select(
        `
        id,
        fecha_pago,
        fecha_vencimiento,
        periodo_desde,
        periodo_hasta,
        meses_cubiertos,
        monto_pagado,
        subtotal,
        descuento_porcentaje,
        descuento_monto,
        descuento_motivo,
        metodo_pago,
        estado,
        activo,
        socio:socio_id(id_socio,nombre_completo,email),
        cuota:cuota_id(id,descripcion,monto,periodo)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return NextResponse.json(
        {
          valid: false,
          codigo,
          error: "No se encontró el pago asociado al comprobante",
        },
        { status: 404 }
      );
    }

    const expectedCode = buildPagoVerificationCode(id);

    return NextResponse.json({
      valid: true,
      codigo: expectedCode,
      verificado_en: new Date().toISOString(),
      pago: {
        id: data.id,
        fecha_pago: data.fecha_pago,
        fecha_vencimiento: data.fecha_vencimiento,
        periodo_desde: data.periodo_desde,
        periodo_hasta: data.periodo_hasta,
        meses_cubiertos: data.meses_cubiertos,
        monto_pagado: Number(data.monto_pagado ?? 0),
        subtotal: data.subtotal === null || data.subtotal === undefined ? null : Number(data.subtotal),
        descuento_porcentaje:
          data.descuento_porcentaje === null || data.descuento_porcentaje === undefined
            ? null
            : Number(data.descuento_porcentaje),
        descuento_monto:
          data.descuento_monto === null || data.descuento_monto === undefined
            ? null
            : Number(data.descuento_monto),
        descuento_motivo: data.descuento_motivo ?? null,
        metodo_pago: data.metodo_pago,
        estado: data.estado,
        activo: data.activo,
        socio: data.socio,
        cuota: data.cuota,
      },
    });
  } catch (error) {
    console.error("Error al verificar recibo de pago:", error);

    return NextResponse.json(
      {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al verificar recibo de pago",
      },
      { status: 500 }
    );
  }
}
