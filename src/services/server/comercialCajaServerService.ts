import { createClient } from '@supabase/supabase-js';
import type {
  AbrirCajaDTO,
  CerrarCajaDTO,
  ComercialCajaDashboard,
  ComercialCajaMovimiento,
  ComercialCajaSesion,
  RegistrarMovimientoCajaDTO,
} from '@/interfaces/comercialCaja.interface';
import type { ComercialPosVentaResumen } from '@/interfaces/comercialPos.interface';
import type { JwtUser } from '@/interfaces/jwtUser.interface';

function getComercialDbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada para operar Caja Comercial desde API server.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseMoney(value: unknown, label: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`${label} debe ser un importe mayor o igual a 0`);
  }
  return Math.round(numeric * 100) / 100;
}

function buildCodigoCaja() {
  return `GM-CAJA-${Date.now().toString(36).toUpperCase()}`;
}

function mapVenta(venta: any): ComercialPosVentaResumen {
  const detalles = venta.detalles ?? venta.venta_detalle ?? [];
  return {
    id: venta.id,
    cliente_tipo: venta.cliente_tipo ?? 'consumidor_final',
    cliente_nombre: venta.cliente_nombre ?? null,
    cliente_documento: venta.cliente_documento ?? null,
    metodo_pago: venta.metodo_pago ?? 'efectivo',
    total: asNumber(venta.total, 0),
    fecha: venta.fecha,
    comprobante_codigo: venta.comprobante_codigo ?? null,
    estado: venta.estado ?? 'pagada',
    creado_en: venta.creado_en ?? null,
    venta_detalle: detalles,
    detalles,
  };
}

async function getOpenSession(supabase: ReturnType<typeof getComercialDbClient>) {
  const { data, error } = await supabase
    .from('comercial_caja_sesion')
    .select('*')
    .eq('estado', 'abierta')
    .order('fecha_apertura', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as ComercialCajaSesion | null;
}

async function getVentasByCaja(supabase: ReturnType<typeof getComercialDbClient>, cajaId: string) {
  const { data, error } = await supabase
    .from('venta')
    .select(
      `
      *,
      detalles:venta_detalle!venta_detalle_venta_id_fkey(
        id,
        item_tipo,
        producto_id,
        servicio_id,
        cantidad,
        precio_unitario,
        descuento,
        subtotal,
        total_linea,
        producto:producto_id(id, nombre),
        servicio:servicio_id(id, nombre)
      )
    `
    )
    .eq('caja_sesion_id', cajaId)
    .eq('activo', true)
    .neq('estado', 'anulada')
    .order('creado_en', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapVenta);
}

async function getVentasSinCaja(supabase: ReturnType<typeof getComercialDbClient>) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('venta')
    .select('id, cliente_tipo, cliente_nombre, cliente_documento, metodo_pago, total, fecha, comprobante_codigo, estado, creado_en')
    .is('caja_sesion_id', null)
    .eq('activo', true)
    .neq('estado', 'anulada')
    .gte('fecha', today)
    .order('creado_en', { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapVenta);
}

async function getMovimientosByCaja(supabase: ReturnType<typeof getComercialDbClient>, cajaId?: string | null) {
  if (!cajaId) return [];
  const { data, error } = await supabase
    .from('comercial_caja_movimiento')
    .select('*')
    .eq('caja_sesion_id', cajaId)
    .order('creado_en', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ComercialCajaMovimiento[];
}

async function getRecentSessions(supabase: ReturnType<typeof getComercialDbClient>) {
  const { data, error } = await supabase
    .from('comercial_caja_sesion')
    .select('*')
    .order('fecha_apertura', { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as ComercialCajaSesion[];
}

function calculateCajaTotals(caja: ComercialCajaSesion | null, ventas: ComercialPosVentaResumen[], movimientos: ComercialCajaMovimiento[]) {
  const totalVentas = ventas.reduce((total, venta) => total + Number(venta.total ?? 0), 0);
  const totalIngresos = movimientos.filter((mov) => mov.tipo === 'ingreso').reduce((total, mov) => total + Number(mov.monto ?? 0), 0);
  const totalRetiros = movimientos.filter((mov) => mov.tipo === 'retiro').reduce((total, mov) => total + Number(mov.monto ?? 0), 0);
  const totalEsperado = Number(caja?.monto_inicial ?? 0) + totalVentas + totalIngresos - totalRetiros;
  return { totalVentas, totalIngresos, totalRetiros, totalEsperado };
}

export async function getComercialCajaDashboard(): Promise<ComercialCajaDashboard> {
  const supabase = getComercialDbClient();
  const cajaAbierta = await getOpenSession(supabase);
  const ventasTurno = cajaAbierta ? await getVentasByCaja(supabase, cajaAbierta.id) : [];
  const movimientos = cajaAbierta ? await getMovimientosByCaja(supabase, cajaAbierta.id) : [];
  const sesionesRecientes = await getRecentSessions(supabase);
  const ventasSinCaja = await getVentasSinCaja(supabase);
  const totals = calculateCajaTotals(cajaAbierta, ventasTurno, movimientos);

  return {
    cajaAbierta: cajaAbierta
      ? {
          ...cajaAbierta,
          total_ventas: totals.totalVentas,
          total_ingresos: totals.totalIngresos,
          total_retiros: totals.totalRetiros,
          total_esperado: totals.totalEsperado,
        }
      : null,
    sesionesRecientes,
    movimientos,
    ventasTurno,
    ventasSinCaja,
    metricas: {
      cajaAbierta: Boolean(cajaAbierta),
      ventasTurno: ventasTurno.length,
      totalVentasTurno: totals.totalVentas,
      totalIngresos: totals.totalIngresos,
      totalRetiros: totals.totalRetiros,
      totalEsperado: totals.totalEsperado,
      sesionesCerradas: sesionesRecientes.filter((sesion) => sesion.estado === 'cerrada').length,
      ventasSinCaja: ventasSinCaja.length,
    },
  };
}

export async function abrirCaja(payload: AbrirCajaDTO, user?: JwtUser | null) {
  const supabase = getComercialDbClient();
  const cajaExistente = await getOpenSession(supabase);
  if (cajaExistente) throw new Error(`Ya existe una caja abierta: ${cajaExistente.codigo}`);

  const montoInicial = parseMoney(payload.monto_inicial, 'Monto inicial');
  const codigo = buildCodigoCaja();

  const { data: caja, error } = await supabase
    .from('comercial_caja_sesion')
    .insert({
      codigo,
      estado: 'abierta',
      monto_inicial: montoInicial,
      observaciones_apertura: payload.observaciones_apertura?.trim() || null,
      usuario_apertura: user?.id ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  await supabase.from('comercial_caja_movimiento').insert({
    caja_sesion_id: caja.id,
    tipo: 'apertura',
    monto: montoInicial,
    metodo_pago: 'efectivo',
    concepto: 'Apertura de caja',
    creado_por: user?.id ?? null,
  });

  return getComercialCajaDashboard();
}

export async function registrarMovimientoCaja(payload: RegistrarMovimientoCajaDTO, user?: JwtUser | null) {
  const supabase = getComercialDbClient();
  const caja = await getOpenSession(supabase);
  if (!caja) throw new Error('No hay caja abierta para registrar movimientos');

  if (payload.tipo !== 'ingreso' && payload.tipo !== 'retiro') {
    throw new Error('Tipo de movimiento inválido');
  }

  const monto = parseMoney(payload.monto, 'Monto');
  if (monto <= 0) throw new Error('El monto debe ser mayor a 0');
  const concepto = payload.concepto?.trim();
  if (!concepto || concepto.length < 4) throw new Error('Debe indicar un concepto claro');

  const { error } = await supabase.from('comercial_caja_movimiento').insert({
    caja_sesion_id: caja.id,
    tipo: payload.tipo,
    monto,
    metodo_pago: payload.metodo_pago || 'efectivo',
    concepto,
    creado_por: user?.id ?? null,
  });
  if (error) throw new Error(error.message);

  return getComercialCajaDashboard();
}

export async function cerrarCaja(payload: CerrarCajaDTO, user?: JwtUser | null) {
  const supabase = getComercialDbClient();
  const caja = await getOpenSession(supabase);
  if (!caja) throw new Error('No hay caja abierta para cerrar');

  const ventas = await getVentasByCaja(supabase, caja.id);
  const movimientos = await getMovimientosByCaja(supabase, caja.id);
  const totals = calculateCajaTotals(caja, ventas, movimientos);
  const montoContado = parseMoney(payload.monto_contado, 'Monto contado');
  const diferencia = Math.round((montoContado - totals.totalEsperado) * 100) / 100;

  const { error } = await supabase
    .from('comercial_caja_sesion')
    .update({
      estado: 'cerrada',
      fecha_cierre: new Date().toISOString(),
      usuario_cierre: user?.id ?? null,
      monto_contado: montoContado,
      total_ventas: totals.totalVentas,
      total_ingresos: totals.totalIngresos,
      total_retiros: totals.totalRetiros,
      total_esperado: totals.totalEsperado,
      diferencia,
      observaciones_cierre: payload.observaciones_cierre?.trim() || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', caja.id);

  if (error) throw new Error(error.message);

  await supabase.from('comercial_caja_movimiento').insert({
    caja_sesion_id: caja.id,
    tipo: 'cierre',
    monto: montoContado,
    metodo_pago: 'efectivo',
    concepto: `Cierre de caja. Diferencia: ${diferencia}`,
    creado_por: user?.id ?? null,
  });

  return getComercialCajaDashboard();
}
