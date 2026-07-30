import { noStoreJson } from '@/lib/security/httpRuntimeSecurity';
import {
  isPagoReceiptVerificationCodeValid,
  normalizePagoReceiptVerificationCode,
} from '@/lib/security/pagoReceiptVerification';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';

export const dynamic = 'force-dynamic';

// AUTH POLICY: PUBLIC_SIGNED_VERIFICATION_CODE
// This endpoint is intentionally public so a receipt QR can be verified without
// an authenticated Gym Master session. Access requires a server-signed HMAC V2
// code that cannot be derived from the payment ID.
const MAX_PAYMENT_ID_LENGTH = 128;
const MAX_VERIFICATION_CODE_LENGTH = 128;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = String(rawId ?? '').trim();

    const url = new URL(req.url);
    const codigo = normalizePagoReceiptVerificationCode(
      url.searchParams.get('codigo'),
    );

    if (!id || id.length > MAX_PAYMENT_ID_LENGTH) {
      return noStoreJson(
        {
          valid: false,
          error: 'ID de pago requerido',
        },
        400,
      );
    }

    if (!codigo || codigo.length > MAX_VERIFICATION_CODE_LENGTH) {
      return noStoreJson(
        {
          valid: false,
          error: 'Código de verificación requerido',
        },
        400,
      );
    }

    if (!isPagoReceiptVerificationCodeValid(id, codigo)) {
      return noStoreJson(
        {
          valid: false,
          error: 'Código de verificación inválido para este pago',
        },
        400,
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('pago')
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
        socio:socio_id(id_socio,nombre_completo),
        cuota:cuota_id(id,descripcion,monto,periodo)
      `,
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error al consultar comprobante de pago:', {
        code: error.code ?? 'PAYMENT_VERIFICATION_QUERY_ERROR',
      });

      return noStoreJson(
        {
          valid: false,
          error: 'No se pudo verificar el comprobante',
        },
        500,
      );
    }

    if (!data) {
      return noStoreJson(
        {
          valid: false,
          error: 'No se encontró el pago asociado al comprobante',
        },
        404,
      );
    }

    return noStoreJson(
      {
        valid: true,
        verificado_en: new Date().toISOString(),
        pago: {
          id: data.id,
          fecha_pago: data.fecha_pago,
          fecha_vencimiento: data.fecha_vencimiento,
          periodo_desde: data.periodo_desde,
          periodo_hasta: data.periodo_hasta,
          meses_cubiertos: data.meses_cubiertos,
          monto_pagado: Number(data.monto_pagado ?? 0),
          subtotal:
            data.subtotal === null || data.subtotal === undefined
              ? null
              : Number(data.subtotal),
          descuento_porcentaje:
            data.descuento_porcentaje === null ||
            data.descuento_porcentaje === undefined
              ? null
              : Number(data.descuento_porcentaje),
          descuento_monto:
            data.descuento_monto === null ||
            data.descuento_monto === undefined
              ? null
              : Number(data.descuento_monto),
          descuento_motivo: data.descuento_motivo ?? null,
          metodo_pago: data.metodo_pago,
          estado: data.estado,
          activo: data.activo,
          socio: data.socio,
          cuota: data.cuota,
        },
      },
      200,
    );
  } catch (error) {
    console.error('Error al verificar recibo de pago:', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });

    return noStoreJson(
      {
        valid: false,
        error: 'No se pudo verificar el comprobante',
      },
      500,
    );
  }
}
