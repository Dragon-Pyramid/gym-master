import { authMiddleware } from '@/middlewares/auth.middleware';
import { NextResponse } from 'next/server';
import { conexionBD } from '@/middlewares/conexionBd.middleware';


export const dynamic = 'force-dynamic';

type EstadoCuotaAcceso = {
  estado_cuota?: string | null;
  dias_vencido?: number;
  periodo_hasta?: string | null;
  ultimo_vencimiento?: string | null;
};

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeEstadoCuota(row: any): EstadoCuotaAcceso | null {
  if (!row) return null;

  return {
    estado_cuota: row.estado_cuota ?? null,
    dias_vencido: toNumber(row.dias_vencido),
    periodo_hasta: row.periodo_hasta ?? null,
    ultimo_vencimiento: row.ultimo_vencimiento ?? null,
  };
}

function isCuotaConDeuda(estado: EstadoCuotaAcceso | null) {
  return estado?.estado_cuota === 'vencido' || estado?.estado_cuota === 'sin_pagos';
}

function buildMensajeDeuda(estado: EstadoCuotaAcceso | null) {
  if (estado?.estado_cuota === 'sin_pagos') {
    return 'El socio no registra pagos activos. Debe dirigirse a administración para regularizar su situación.';
  }

  const periodo = estado?.periodo_hasta || estado?.ultimo_vencimiento;
  const periodoTexto = periodo ? ` con vencimiento ${periodo}` : ' correspondiente';

  return `El socio adeuda la cuota${periodoTexto}. Debe dirigirse a administración para regularizar su situación.`;
}

async function enrichAsistenciaConEstadoCuota(supabase: any, row: any) {
  const { data, error } = await supabase.rpc('obtener_estado_cuota_socio', {
    p_id_socio: row.socio_id,
  });

  if (error) {
    console.warn(
      'No se pudo enriquecer asistencia reciente con estado de cuota:',
      error.message
    );

    return {
      ...row,
      access_status: 'al_dia',
      alert_type: 'success',
      mensaje_acceso: null,
      estado_cuota: null,
    };
  }

  const estado = normalizeEstadoCuota(Array.isArray(data) ? data[0] : data);
  const tieneDeuda = isCuotaConDeuda(estado);

  return {
    ...row,
    access_status: tieneDeuda ? 'deuda' : 'al_dia',
    alert_type: tieneDeuda ? 'debt' : 'success',
    mensaje_acceso: tieneDeuda ? buildMensajeDeuda(estado) : null,
    estado_cuota: estado,
  };
}

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = conexionBD();

    // Últimas 4 asistencias con datos del socio.
    // Se enriquecen con estado de cuota para que el dashboard admin no muestre
    // bienvenida cuando el ingreso corresponde a un socio sin pagos o moroso.
    const { data, error } = await supabase
      .from('asistencia')
      .select(`
        id,
        socio_id,
        fecha,
        hora_ingreso,
        socio:socio_id (
          id_socio,
          nombre_completo,
          foto
        )
      `)
      .order('fecha', { ascending: false })
      .order('hora_ingreso', { ascending: false })
      .order('id', { ascending: false }) // ← tiebreaker estable
      .limit(4);

    if (error) throw new Error(error.message);

    const enriched = await Promise.all(
      (data ?? []).map((row) => enrichAsistenciaConEstadoCuota(supabase, row))
    );

    return NextResponse.json(enriched, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
