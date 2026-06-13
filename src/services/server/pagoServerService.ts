import { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  CreatePagoDto,
  Pago,
  PagoManualFormOptions,
  ResponsePago,
  UpdatePagoDto,
} from '@/interfaces/pago.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import {
  reactivarSocioPorPago,
  registrarDesactivacionPorMorosidad,
} from '@/services/morosidadService';
import { calcularDescuentoPago } from '@/lib/cuotas/descuentoPago';
import { fetchCuotaDescuentoConfig } from '@/services/cuotaDescuentoService';
import { combinarDescuentosPago } from '@/lib/cuotas/descuentoPagoBonificacion';
import type { PagoBonificacionMensualSocio } from '@/interfaces/pago.interface';

const allowedManagerRoles = new Set(['admin', 'usuario']);

function assertCanManagePayments(user: JwtUser) {
  if (!allowedManagerRoles.has(user.rol)) {
    throw new Error('No autorizado para administrar pagos');
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsIso(dateIso: string, months: number) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPositiveInteger(value: unknown, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeUuidString(value: unknown): string | null {
  const normalized = normalizeString(value);
  if (!normalized) return null;
  return uuidRegex.test(normalized) ? normalized : null;
}

function getYearMonthFromDate(dateIso: string) {
  const clean = dateIso.slice(0, 10);
  const [anio, mes] = clean.split('-').map(Number);
  return {
    anio: Number.isInteger(anio) ? anio : new Date().getFullYear(),
    mes: Number.isInteger(mes) ? mes : new Date().getMonth() + 1,
  };
}

function normalizeBonificacionRow(row: any): PagoBonificacionMensualSocio {
  return {
    socio_id: row.socio_id,
    anio: Number(row.anio),
    mes: Number(row.mes),
    ranking: row.ranking ?? null,
    bonificado: Boolean(row.bonificado),
    descuento_porcentaje: Number(row.descuento_porcentaje ?? 0),
    motivo: row.motivo ?? null,
    observaciones: row.observaciones ?? null,
  };
}

async function fetchBonificacionesMensuales(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const { data, error } = await supabase
    .from('socio_ranking_bonificacion_mensual')
    .select('socio_id,anio,mes,ranking,bonificado,descuento_porcentaje,motivo,observaciones')
    .eq('bonificado', true)
    .gt('descuento_porcentaje', 0);

  if (error) {
    if (error.code === '42P01' || /schema cache|does not exist/i.test(error.message ?? '')) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map(normalizeBonificacionRow);
}

async function fetchBonificacionMensualForPago(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  socioId: string,
  fechaReferencia: string,
): Promise<PagoBonificacionMensualSocio | null> {
  const { anio, mes } = getYearMonthFromDate(fechaReferencia);
  const { data, error } = await supabase
    .from('socio_ranking_bonificacion_mensual')
    .select('socio_id,anio,mes,ranking,bonificado,descuento_porcentaje,motivo,observaciones')
    .eq('socio_id', socioId)
    .eq('anio', anio)
    .eq('mes', mes)
    .eq('bonificado', true)
    .gt('descuento_porcentaje', 0)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01' || /schema cache|does not exist/i.test(error.message ?? '')) {
      return null;
    }
    throw new Error(error.message);
  }

  return data ? normalizeBonificacionRow(data) : null;
}

function normalizePago(row: any): ResponsePago {
  return {
    id: row.id,
    fecha_pago: row.fecha_pago,
    fecha_vencimiento: row.fecha_vencimiento,
    periodo_desde: row.periodo_desde ?? null,
    periodo_hasta: row.periodo_hasta ?? null,
    meses_cubiertos: row.meses_cubiertos ?? null,
    monto_pagado: Number(row.monto_pagado ?? 0),
    subtotal: row.subtotal === null || row.subtotal === undefined ? null : Number(row.subtotal),
    descuento_porcentaje:
      row.descuento_porcentaje === null || row.descuento_porcentaje === undefined
        ? null
        : Number(row.descuento_porcentaje),
    descuento_monto:
      row.descuento_monto === null || row.descuento_monto === undefined
        ? null
        : Number(row.descuento_monto),
    descuento_motivo: row.descuento_motivo ?? null,
    total: row.total === null || row.total === undefined ? null : Number(row.total),
    metodo_pago: row.metodo_pago ?? null,
    id_medio_pago: row.id_medio_pago ?? null,
    estado: row.estado ?? null,
    observaciones: row.observaciones ?? null,
    enviar_email: Boolean(row.enviar_email),
    activo: row.activo ?? null,
    registrado_por: row.registrado_por
      ? {
          id: row.registrado_por.id,
          nombre: row.registrado_por.nombre,
        }
      : null,
    socio: {
      id_socio: row.socio?.id_socio ?? row.socio_id,
      nombre_completo: row.socio?.nombre_completo ?? 'Socio sin nombre',
      email: row.socio?.email ?? null,
    },
    cuota: {
      id: row.cuota?.id ?? row.cuota_id,
      descripcion: row.cuota?.descripcion ?? 'Cuota',
      monto: row.cuota?.monto ?? null,
    },
  };
}

const pagoSelect = `
  *,
  socio:socio_id(id_socio,nombre_completo,email),
  cuota:cuota_id(id,descripcion,monto,fecha_fin),
  registrado_por:registrado_por(id,nombre)
`;

export async function fetchPagosServer(user: JwtUser): Promise<ResponsePago[]> {
  assertCanManagePayments(user);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('pago')
    .select(pagoSelect)
    .eq('activo', true)
    .order('fecha_pago', { ascending: false })
    .order('creado_en', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizePago);
}

export async function fetchPagoFormOptionsServer(
  user: JwtUser
): Promise<PagoManualFormOptions> {
  assertCanManagePayments(user);
  const supabase = getSupabaseServerClient();

  const [sociosResult, cuotasResult, bonificacionesMensuales] = await Promise.all([
    supabase
      .from('socio')
      .select('id_socio,nombre_completo,email,activo,descuento_activo')
      .order('activo', { ascending: false })
      .order('nombre_completo', { ascending: true }),
    supabase
      .from('cuota')
      .select('id,descripcion,monto,periodo,fecha_inicio,fecha_fin,activo')
      .eq('activo', true)
      .order('fecha_inicio', { ascending: false }),
    fetchBonificacionesMensuales(supabase),
  ]);

  if (sociosResult.error) throw new Error(sociosResult.error.message);
  if (cuotasResult.error) throw new Error(cuotasResult.error.message);

  const descuentoConfig = await fetchCuotaDescuentoConfig(supabase);

  return {
    socios: sociosResult.data ?? [],
    cuotas: cuotasResult.data ?? [],
    descuento_config: descuentoConfig,
    bonificaciones_mensuales: bonificacionesMensuales,
  };
}

async function resolveCuota(cuotaId?: string | null) {
  const supabase = getSupabaseServerClient();

  if (cuotaId) {
    const { data, error } = await supabase
      .from('cuota')
      .select('id,descripcion,monto,fecha_inicio,fecha_fin,activo')
      .eq('id', cuotaId)
      .single();

    if (error || !data) throw new Error('No se encontró la cuota seleccionada');
    return data;
  }

  const today = todayIso();
  const current = await supabase
    .from('cuota')
    .select('id,descripcion,monto,fecha_inicio,fecha_fin,activo')
    .eq('activo', true)
    .lte('fecha_inicio', today)
    .gte('fecha_fin', today)
    .order('fecha_inicio', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (current.error) throw new Error(current.error.message);
  if (current.data) return current.data;

  const latest = await supabase
    .from('cuota')
    .select('id,descripcion,monto,fecha_inicio,fecha_fin,activo')
    .eq('activo', true)
    .order('fecha_inicio', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest.error) throw new Error(latest.error.message);
  if (!latest.data) throw new Error('No existe una cuota activa para registrar el pago');
  return latest.data;
}

async function resolveSocio(socioId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('socio')
    .select('id_socio,nombre_completo,activo,descuento_activo')
    .eq('id_socio', socioId)
    .single();

  if (error || !data) throw new Error('No se encontró el socio seleccionado');
  return data;
}

export async function createPagoManualServer(
  user: JwtUser,
  payload: CreatePagoDto
): Promise<ResponsePago> {
  assertCanManagePayments(user);

  if (!payload.socio_id) throw new Error('El socio es obligatorio');

  const supabase = getSupabaseServerClient();
  const cuota = await resolveCuota(payload.cuota_id);
  const socio = await resolveSocio(payload.socio_id);

  const fechaPago = normalizeString(payload.fecha_pago) ?? todayIso();
  const mesesCubiertos = Math.min(
    Math.max(toPositiveInteger(payload.meses_cubiertos, 1), 1),
    24
  );
  const periodoDesde = normalizeString(payload.periodo_desde) ?? fechaPago;
  const periodoHasta =
    normalizeString(payload.periodo_hasta) ?? addMonthsIso(periodoDesde, mesesCubiertos);

  const descuentoConfig = await fetchCuotaDescuentoConfig(supabase);
  const previewPagoAdelantado = calcularDescuentoPago({
    cuotaMonto: toNumber(cuota.monto, 0),
    mesesCubiertos,
    config: descuentoConfig,
  });
  const bonificacionMensual = await fetchBonificacionMensualForPago(
    supabase,
    payload.socio_id,
    periodoDesde,
  );
  const previewDescuento = combinarDescuentosPago({
    previewPagoAdelantado,
    bonificacionMensual,
  });
  const montoPagadoCalculado = toNumber(payload.monto_pagado, previewDescuento.total);
  const montoPagado = montoPagadoCalculado > 0 ? montoPagadoCalculado : previewDescuento.total;
  const descuentoMonto =
    payload.descuento_monto === undefined || payload.descuento_monto === null
      ? Math.max(previewDescuento.subtotal - montoPagado, 0)
      : toNumber(payload.descuento_monto, previewDescuento.descuento_monto);
  const descuentoPorcentaje =
    payload.descuento_porcentaje === undefined || payload.descuento_porcentaje === null
      ? previewDescuento.descuento_porcentaje
      : toNumber(payload.descuento_porcentaje, previewDescuento.descuento_porcentaje);

  if (montoPagado <= 0) throw new Error('El monto pagado debe ser mayor a 0');

  const insertPayload = {
    socio_id: payload.socio_id,
    cuota_id: cuota.id,
    fecha_pago: fechaPago,
    fecha_vencimiento: periodoHasta,
    periodo_desde: periodoDesde,
    periodo_hasta: periodoHasta,
    meses_cubiertos: mesesCubiertos,
    monto_pagado: montoPagado,
    subtotal: toNumber(payload.subtotal, previewDescuento.subtotal),
    descuento_porcentaje: descuentoPorcentaje,
    descuento_monto: descuentoMonto,
    descuento_motivo:
      normalizeString(payload.descuento_motivo) ?? previewDescuento.mensaje ?? null,
    registrado_por: user.id,
    metodo_pago: payload.metodo_pago ?? 'efectivo',
    id_medio_pago: normalizeUuidString(payload.id_medio_pago),
    estado: 'pagado',
    observaciones: normalizeString(payload.observaciones),
    enviar_email: payload.enviar_email ?? true,
    activo: true,
  };

  const { data, error } = await supabase
    .from('pago')
    .insert(insertPayload)
    .select(pagoSelect)
    .single();

  if (error) throw new Error(error.message);

  await reactivarSocioPorPago(
    supabase,
    payload.socio_id,
    data.id,
    'pago_manual',
    user.id
  );

  return normalizePago(data);
}

export async function updatePagoServer(
  user: JwtUser,
  id: string,
  updateData: UpdatePagoDto
): Promise<ResponsePago> {
  assertCanManagePayments(user);
  if (!id) throw new Error('ID de pago requerido');

  const supabase = getSupabaseServerClient();
  const payload: Record<string, unknown> = { ...updateData };
  delete payload.total;

  if (payload.periodo_hasta) {
    payload.fecha_vencimiento = payload.periodo_hasta;
  }

  const { data, error } = await supabase
    .from('pago')
    .update(payload)
    .eq('id', id)
    .select(pagoSelect)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el pago');

  if (data.socio_id && data.estado === 'pagado' && data.activo !== false) {
    await reactivarSocioPorPago(
      supabase,
      data.socio_id,
      data.id,
      'pago_update',
      user.id
    );
  }

  return normalizePago(data);
}

export async function deactivatePagoServer(
  user: JwtUser,
  id: string
): Promise<ResponsePago> {
  assertCanManagePayments(user);
  if (!id) throw new Error('ID de pago requerido');

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('pago')
    .update({ activo: false, estado: 'cancelado' })
    .eq('id', id)
    .select(pagoSelect)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el pago');

  if (data.socio_id) {
    await registrarDesactivacionPorMorosidad(
      supabase,
      data.socio_id,
      'pago_cancelado',
      user.id
    );
  }

  return normalizePago(data);
}
