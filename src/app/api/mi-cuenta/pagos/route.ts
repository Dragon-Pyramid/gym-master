import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { getSocioByIdUsuario } from '@/services/socioService';

export const dynamic = 'force-dynamic';

function normalizePago(row: any) {
  return {
    id: row.id,
    fecha_pago: row.fecha_pago,
    fecha_vencimiento: row.fecha_vencimiento,
    periodo_desde: row.periodo_desde ?? null,
    periodo_hasta: row.periodo_hasta ?? null,
    meses_cubiertos: row.meses_cubiertos ?? null,
    monto_pagado: row.monto_pagado ?? 0,
    total: row.total ?? null,
    metodo_pago: row.metodo_pago ?? null,
    estado: row.estado ?? null,
    observaciones: row.observaciones ?? null,
    stripe_session_id: row.stripe_session_id ?? null,
    stripe_payment_intent_id: row.stripe_payment_intent_id ?? null,
    cuota: row.cuota ?? null,
    registrado_por: row.registrado_por ?? null,
  };
}

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);

    if (user.rol !== 'socio') {
      return NextResponse.json(
        { error: 'Este endpoint corresponde al historial del socio autenticado' },
        { status: 403 }
      );
    }

    let socioId = user.id_socio;

    if (!socioId) {
      const socio = await getSocioByIdUsuario(user.id);
      socioId = socio.id_socio;
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
        total,
        metodo_pago,
        estado,
        observaciones,
        stripe_session_id,
        stripe_payment_intent_id,
        activo,
        cuota:cuota_id (
          id,
          descripcion,
          periodo,
          monto,
          fecha_inicio,
          fecha_fin
        ),
        registrado_por:registrado_por (
          id,
          nombre
        )
      `
      )
      .eq('socio_id', socioId)
      .eq('activo', true)
      .order('fecha_pago', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(
      { data: (data ?? []).map(normalizePago) },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('ERROR al obtener historial de pagos del socio:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener historial de pagos' },
      { status: 500 }
    );
  }
}
