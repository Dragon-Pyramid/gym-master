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

function normalizePago(row: any): ResponsePago {
  return {
    id: row.id,
    fecha_pago: row.fecha_pago,
    fecha_vencimiento: row.fecha_vencimiento,
    periodo_desde: row.periodo_desde ?? null,
    periodo_hasta: row.periodo_hasta ?? null,
    meses_cubiertos: row.meses_cubiertos ?? null,
    monto_pagado: Number(row.monto_pagado ?? 0),
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

  const [sociosResult, cuotasResult] = await Promise.all([
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
  ]);

  if (sociosResult.error) throw new Error(sociosResult.error.message);
  if (cuotasResult.error) throw new Error(cuotasResult.error.message);

  return {
    socios: sociosResult.data ?? [],
    cuotas: cuotasResult.data ?? [],
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

  const montoBase = toNumber(cuota.monto, 0) * mesesCubiertos;
  const montoConDescuento = socio.descuento_activo ? montoBase * 0.9 : montoBase;
  const montoPagado = toNumber(payload.monto_pagado, montoConDescuento);

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
    registrado_por: user.id,
    metodo_pago: payload.metodo_pago ?? 'efectivo',
    id_medio_pago: normalizeString(payload.id_medio_pago),
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

  if (socio.descuento_activo) {
    await supabase
      .from('socio')
      .update({ descuento_activo: false })
      .eq('id_socio', payload.socio_id);
  }

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
