import type { SupabaseClient } from '@supabase/supabase-js';

export const DIAS_TOLERANCIA_MORA = 7;

export type EstadoCuotaMorosidad = {
  estado_cuota: string | null;
  dias_vencido: number;
  periodo_hasta: string | null;
  ultimo_vencimiento: string | null;
};

export type MorosidadOrigen =
  | 'login'
  | 'asistencia_qr'
  | 'pago_manual'
  | 'stripe_webhook'
  | 'pago_update'
  | 'pago_cancelado'
  | 'scheduler'
  | 'sistema';

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeEstadoCuotaMorosidad(
  row: any
): EstadoCuotaMorosidad | null {
  if (!row) return null;

  return {
    estado_cuota: row.estado_cuota ?? null,
    dias_vencido: toNumber(row.dias_vencido),
    periodo_hasta: row.periodo_hasta ?? null,
    ultimo_vencimiento: row.ultimo_vencimiento ?? null,
  };
}

export async function getEstadoCuotaMorosidad(
  supabase: SupabaseClient,
  socioId: string
): Promise<EstadoCuotaMorosidad | null> {
  const { data, error } = await supabase.rpc('obtener_estado_cuota_socio', {
    p_id_socio: socioId,
  });

  if (error) {
    console.warn('No se pudo consultar el estado de cuota del socio:', error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return normalizeEstadoCuotaMorosidad(row);
}

export function debeBloquearAccesoPorMorosidad(
  estado: EstadoCuotaMorosidad | null
): boolean {
  if (!estado?.estado_cuota) return false;

  if (estado.estado_cuota === 'sin_pagos') return true;

  return (
    estado.estado_cuota === 'vencido' &&
    toNumber(estado.dias_vencido) > DIAS_TOLERANCIA_MORA
  );
}

export function isCuotaConDeuda(estado: EstadoCuotaMorosidad | null): boolean {
  return estado?.estado_cuota === 'vencido' || estado?.estado_cuota === 'sin_pagos';
}

export function buildMensajeDesactivacionMora(
  estado: EstadoCuotaMorosidad | null
): string {
  if (estado?.estado_cuota === 'sin_pagos') {
    return 'Usted fue desactivado del sistema porque no registra pagos activos. Diríjase a administración para regularizar su situación.';
  }

  const dias = Math.max(estado?.dias_vencido ?? 0, DIAS_TOLERANCIA_MORA + 1);

  return `Usted fue desactivado del sistema porque pasaron ${dias} días desde el vencimiento de su cuota. Diríjase a administración para regularizar su situación.`;
}

export function buildMensajeDeuda(estado: EstadoCuotaMorosidad | null): string {
  if (estado?.estado_cuota === 'sin_pagos') {
    return 'Usted no registra pagos activos. Regularice su situación en administración.';
  }

  const periodo = estado?.periodo_hasta || estado?.ultimo_vencimiento;
  const periodoTexto = periodo ? ` con vencimiento ${periodo}` : ' correspondiente';

  return `Usted adeuda la cuota${periodoTexto}. Regularice su situación en administración.`;
}

export async function registrarDesactivacionPorMorosidad(
  supabase: SupabaseClient,
  socioId: string,
  origen: MorosidadOrigen,
  usuarioId?: string | null
) {
  const { data, error } = await supabase.rpc('desactivar_socio_por_morosidad', {
    p_id_socio: socioId,
    p_origen: origen,
    p_usuario_id: usuarioId ?? null,
  });

  if (error) {
    throw new Error(`No se pudo desactivar al socio por morosidad: ${error.message}`);
  }

  return Array.isArray(data) ? data[0] : data;
}

export async function reactivarSocioPorPago(
  supabase: SupabaseClient,
  socioId: string,
  pagoId: string | null,
  origen: MorosidadOrigen,
  usuarioId?: string | null
) {
  const { data, error } = await supabase.rpc('reactivar_socio_por_pago', {
    p_id_socio: socioId,
    p_pago_id: pagoId,
    p_origen: origen,
    p_usuario_id: usuarioId ?? null,
  });

  if (error) {
    throw new Error(`No se pudo sincronizar la reactivación del socio: ${error.message}`);
  }

  return Array.isArray(data) ? data[0] : data;
}
