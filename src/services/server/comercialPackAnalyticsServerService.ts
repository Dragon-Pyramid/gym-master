import { createClient } from '@supabase/supabase-js';
import type {
  ComercialPackAnalyticsCuponUso,
  ComercialPackAnalyticsDashboard,
  ComercialPackAnalyticsMes,
  ComercialPackAnalyticsTopPack,
  ComercialPackVentaRegistro,
} from '@/interfaces/comercialPackAnalytics.interface';

function getComercialDbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada para consultar analítica comercial.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeDate(value: string | null | undefined) {
  const raw = String(value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function monthKey(dateValue?: string | null) {
  const raw = String(dateValue ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw.slice(0, 7) : 'sin-fecha';
}

function isActiveSale(row: ComercialPackVentaRegistro) {
  return row.venta?.estado !== 'anulada' && row.venta?.activo !== false;
}

function mapRegistro(row: any): ComercialPackVentaRegistro {
  const venta = row.venta ?? null;
  return {
    id: row.id,
    venta_id: row.venta_id,
    pack_id: row.pack_id ?? null,
    pack_codigo: row.pack_codigo ?? '',
    pack_nombre: row.pack_nombre ?? 'Pack sin nombre',
    cantidad: asNumber(row.cantidad, 0),
    precio_unitario: asNumber(row.precio_unitario, 0),
    descuento_pack: asNumber(row.descuento_pack, 0),
    total_pack: asNumber(row.total_pack, 0),
    cupon_id: row.cupon_id ?? null,
    cupon_codigo: row.cupon_codigo ?? null,
    promocion_id: row.promocion_id ?? null,
    promocion_nombre: row.promocion_nombre ?? null,
    descuento_cupon_estimado: asNumber(row.descuento_cupon_estimado, 0),
    componentes: Array.isArray(row.componentes) ? row.componentes : [],
    creado_en: row.creado_en ?? null,
    actualizado_en: row.actualizado_en ?? null,
    venta: venta ? {
      id: venta.id,
      fecha: venta.fecha ?? null,
      total: asNumber(venta.total, 0),
      estado: venta.estado ?? null,
      activo: venta.activo ?? null,
      cliente_tipo: venta.cliente_tipo ?? null,
      cliente_nombre: venta.cliente_nombre ?? null,
      cliente_documento: venta.cliente_documento ?? null,
      metodo_pago: venta.metodo_pago ?? null,
      comprobante_codigo: venta.comprobante_codigo ?? null,
      creado_en: venta.creado_en ?? null,
    } : null,
  };
}

export async function getComercialPackAnalyticsDashboard(filters?: {
  desde?: string | null;
  hasta?: string | null;
}): Promise<ComercialPackAnalyticsDashboard> {
  const supabase = getComercialDbClient();
  const desde = normalizeDate(filters?.desde);
  const hasta = normalizeDate(filters?.hasta);

  let query = supabase
    .from('comercial_pack_venta')
    .select(`
      *,
      venta:venta_id(
        id,
        fecha,
        total,
        estado,
        activo,
        cliente_tipo,
        cliente_nombre,
        cliente_documento,
        metodo_pago,
        comprobante_codigo,
        creado_en
      )
    `)
    .order('creado_en', { ascending: false })
    .limit(500);

  if (desde) query = query.gte('creado_en', `${desde}T00:00:00`);
  if (hasta) query = query.lte('creado_en', `${hasta}T23:59:59`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const registros = (data ?? []).map(mapRegistro);
  const activos = registros.filter(isActiveSale);

  const ventaIds = new Set(activos.map((row) => row.venta_id));
  const packIds = new Set(activos.map((row) => row.pack_id ?? row.pack_codigo).filter(Boolean));
  const cuponIds = new Set(activos.map((row) => row.cupon_id ?? row.cupon_codigo).filter(Boolean));
  const packsVendidos = activos.reduce((sum, row) => sum + row.cantidad, 0);
  const ingresoPacks = roundMoney(activos.reduce((sum, row) => sum + row.total_pack, 0));
  const descuentoCuponEstimado = roundMoney(activos.reduce((sum, row) => sum + row.descuento_cupon_estimado, 0));

  const topMap = new Map<string, ComercialPackAnalyticsTopPack>();
  const cuponMap = new Map<string, ComercialPackAnalyticsCuponUso>();
  const monthMap = new Map<string, ComercialPackAnalyticsMes>();

  for (const row of activos) {
    const packKey = row.pack_id ?? row.pack_codigo;
    const top = topMap.get(packKey) ?? {
      pack_id: row.pack_id ?? null,
      pack_codigo: row.pack_codigo,
      pack_nombre: row.pack_nombre,
      cantidad_vendida: 0,
      ventas: 0,
      ingreso_total: 0,
      descuento_cupon_estimado: 0,
      ultima_venta: row.venta?.fecha ?? row.creado_en ?? null,
    };
    top.cantidad_vendida += row.cantidad;
    top.ventas += 1;
    top.ingreso_total = roundMoney(top.ingreso_total + row.total_pack);
    top.descuento_cupon_estimado = roundMoney(top.descuento_cupon_estimado + row.descuento_cupon_estimado);
    if (String(row.venta?.fecha ?? row.creado_en ?? '') > String(top.ultima_venta ?? '')) {
      top.ultima_venta = row.venta?.fecha ?? row.creado_en ?? null;
    }
    topMap.set(packKey, top);

    if (row.cupon_codigo) {
      const cuponKey = row.cupon_id ?? row.cupon_codigo;
      const cupon = cuponMap.get(cuponKey) ?? {
        cupon_id: row.cupon_id ?? null,
        cupon_codigo: row.cupon_codigo,
        promocion_id: row.promocion_id ?? null,
        promocion_nombre: row.promocion_nombre ?? null,
        usos: 0,
        packs_vendidos: 0,
        descuento_estimado: 0,
        ingreso_asociado: 0,
      };
      cupon.usos += 1;
      cupon.packs_vendidos += row.cantidad;
      cupon.descuento_estimado = roundMoney(cupon.descuento_estimado + row.descuento_cupon_estimado);
      cupon.ingreso_asociado = roundMoney(cupon.ingreso_asociado + row.total_pack);
      cuponMap.set(cuponKey, cupon);
    }

    const month = monthKey(row.venta?.fecha ?? row.creado_en);
    const monthly = monthMap.get(month) ?? {
      periodo: month,
      packs_vendidos: 0,
      ventas: 0,
      ingreso_total: 0,
      descuento_cupon_estimado: 0,
    };
    monthly.packs_vendidos += row.cantidad;
    monthly.ventas += 1;
    monthly.ingreso_total = roundMoney(monthly.ingreso_total + row.total_pack);
    monthly.descuento_cupon_estimado = roundMoney(monthly.descuento_cupon_estimado + row.descuento_cupon_estimado);
    monthMap.set(month, monthly);
  }

  return {
    registros,
    topPacks: Array.from(topMap.values()).sort((a, b) => b.ingreso_total - a.ingreso_total).slice(0, 20),
    cupones: Array.from(cuponMap.values()).sort((a, b) => b.descuento_estimado - a.descuento_estimado).slice(0, 20),
    mensual: Array.from(monthMap.values()).sort((a, b) => a.periodo.localeCompare(b.periodo)),
    metricas: {
      ventasConPack: ventaIds.size,
      packsVendidos,
      ingresoPacks,
      ticketPromedioPack: packsVendidos > 0 ? roundMoney(ingresoPacks / packsVendidos) : 0,
      descuentoCuponEstimado,
      packsDistintos: packIds.size,
      cuponesUsados: cuponIds.size,
    },
    filtros: { desde, hasta },
  };
}
