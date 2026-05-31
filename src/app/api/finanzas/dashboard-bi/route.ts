import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { conexionBD } from '@/middlewares/conexionBd.middleware';
import type {
  FinanzasCategoriaResumen,
  FinanzasDashboardResponse,
  FinanzasSerieMensual,
} from '@/interfaces/finanzas.interface';

export const dynamic = 'force-dynamic';

type BasicRow = Record<string, any>;

type MonthlyAccumulator = FinanzasSerieMensual;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfCurrentYearISO() {
  return `${new Date().getFullYear()}-01-01`;
}

function normalizeDateParam(value: string | null, fallback: string, label: string) {
  if (!value) return fallback;
  const clean = value.trim();
  if (!DATE_RE.test(clean)) {
    throw new Error(`${label} debe tener formato YYYY-MM-DD`);
  }
  return clean;
}

function toNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function monthKey(value?: string | null) {
  const raw = String(value ?? '').slice(0, 10);
  if (!DATE_RE.test(raw)) return 'sin-fecha';
  return raw.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split('-');
  if (!year || !month) return key;
  return `${month}/${year}`;
}

function createMonthEntry(periodo: string): MonthlyAccumulator {
  return {
    periodo,
    periodo_label: monthLabel(periodo),
    ingresos_cuotas: 0,
    ingresos_ventas: 0,
    ingresos_servicios: 0,
    ingresos_total: 0,
    egresos_compras: 0,
    egresos_gastos: 0,
    egresos_total: 0,
    resultado_neto: 0,
  };
}

function addMonthAmount(
  map: Map<string, MonthlyAccumulator>,
  fecha: string | null | undefined,
  key: keyof Pick<
    MonthlyAccumulator,
    | 'ingresos_cuotas'
    | 'ingresos_ventas'
    | 'ingresos_servicios'
    | 'egresos_compras'
    | 'egresos_gastos'
  >,
  amount: number
) {
  const periodo = monthKey(fecha);
  if (periodo === 'sin-fecha') return;
  const current = map.get(periodo) ?? createMonthEntry(periodo);
  current[key] = roundMoney(Number(current[key]) + amount);
  map.set(periodo, current);
}

function finalizeSeries(map: Map<string, MonthlyAccumulator>) {
  return Array.from(map.values())
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map((item) => {
      const ingresosTotal = roundMoney(item.ingresos_cuotas + item.ingresos_ventas);
      const egresosTotal = roundMoney(item.egresos_compras + item.egresos_gastos);
      return {
        ...item,
        ingresos_total: ingresosTotal,
        egresos_total: egresosTotal,
        resultado_neto: roundMoney(ingresosTotal - egresosTotal),
      };
    });
}

function upsertCategory(
  map: Map<string, FinanzasCategoriaResumen>,
  categoria: string,
  tipo: FinanzasCategoriaResumen['tipo'],
  amount: number
) {
  const clean = categoria?.trim() || 'Sin clasificar';
  const current = map.get(clean) ?? { categoria: clean, total: 0, cantidad: 0, tipo };
  current.total = roundMoney(current.total + amount);
  current.cantidad += 1;
  map.set(clean, current);
}

function sortedCategories(map: Map<string, FinanzasCategoriaResumen>) {
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function isActive(row: BasicRow) {
  return row?.activo !== false;
}

function isPagado(value: unknown) {
  return String(value ?? '').toLowerCase() === 'pagado' || String(value ?? '').toLowerCase() === 'pagada';
}

function isAnulado(value: unknown) {
  return String(value ?? '').toLowerCase() === 'anulado' || String(value ?? '').toLowerCase() === 'anulada';
}

function isPendiente(value: unknown) {
  return String(value ?? '').toLowerCase() === 'pendiente';
}

function isVencido(value: unknown) {
  return String(value ?? '').toLowerCase() === 'vencido';
}

export async function GET(req: NextRequest) {
  try {
    await authMiddleware(req);
    const supabase = conexionBD();
    const { searchParams } = new URL(req.url);

    const desde = normalizeDateParam(
      searchParams.get('desde'),
      firstDayOfCurrentYearISO(),
      'Fecha desde'
    );
    const hasta = normalizeDateParam(searchParams.get('hasta'), todayISO(), 'Fecha hasta');

    if (hasta < desde) {
      return NextResponse.json(
        { error: 'La fecha hasta no puede ser anterior a la fecha desde' },
        { status: 400 }
      );
    }

    const [pagosResult, ventasResult, comprasResult, gastosResult] = await Promise.all([
      supabase
        .from('pago')
        .select('id, fecha_pago, monto_pagado, total, estado, activo, metodo_pago')
        .gte('fecha_pago', desde)
        .lte('fecha_pago', hasta),
      supabase
        .from('venta')
        .select('id, fecha, total, estado, activo, metodo_pago')
        .gte('fecha', desde)
        .lte('fecha', hasta),
      supabase
        .from('compra')
        .select('id, fecha, total, estado, activo, medio_pago')
        .gte('fecha', desde)
        .lte('fecha', hasta),
      supabase
        .from('otros_gastos')
        .select('id, descripcion, monto, fecha, estado, activo, medio_pago, tipo_gasto:id_tipo_gasto(nombre)')
        .gte('fecha', desde)
        .lte('fecha', hasta),
    ]);

    if (pagosResult.error) throw new Error(pagosResult.error.message);
    if (ventasResult.error) throw new Error(ventasResult.error.message);
    if (comprasResult.error) throw new Error(comprasResult.error.message);
    if (gastosResult.error) throw new Error(gastosResult.error.message);

    const pagos = (pagosResult.data ?? []) as BasicRow[];
    const ventas = (ventasResult.data ?? []) as BasicRow[];
    const compras = (comprasResult.data ?? []) as BasicRow[];
    const gastos = (gastosResult.data ?? []) as BasicRow[];

    let detallesServicios: BasicRow[] = [];
    const detallesServiciosResult = await supabase
      .from('venta_detalle')
      .select('id, item_tipo, subtotal, total_linea, venta!inner(fecha, estado, activo)')
      .eq('item_tipo', 'servicio')
      .gte('venta.fecha', desde)
      .lte('venta.fecha', hasta);

    if (!detallesServiciosResult.error) {
      detallesServicios = (detallesServiciosResult.data ?? []) as BasicRow[];
    }

    const series = new Map<string, MonthlyAccumulator>();
    const ingresosCategorias = new Map<string, FinanzasCategoriaResumen>();
    const egresosCategorias = new Map<string, FinanzasCategoriaResumen>();
    const compromisosCategorias = new Map<string, FinanzasCategoriaResumen>();

    let ingresosCuotas = 0;
    let ingresosVentas = 0;
    let ingresosServicios = 0;
    let egresosCompras = 0;
    let egresosGastos = 0;
    let comprasPendientes = 0;
    let gastosPendientes = 0;

    const pagosActivos = pagos.filter((pago) => isActive(pago) && isPagado(pago.estado));
    pagosActivos.forEach((pago) => {
      const amount = toNumber(pago.total ?? pago.monto_pagado);
      ingresosCuotas += amount;
      addMonthAmount(series, pago.fecha_pago, 'ingresos_cuotas', amount);
      upsertCategory(ingresosCategorias, 'Cuotas / membresías', 'ingreso', amount);
    });

    const ventasActivas = ventas.filter(
      (venta) => isActive(venta) && !isAnulado(venta.estado) && isPagado(venta.estado)
    );
    ventasActivas.forEach((venta) => {
      const amount = toNumber(venta.total);
      ingresosVentas += amount;
      addMonthAmount(series, venta.fecha, 'ingresos_ventas', amount);
    });

    detallesServicios
      .filter((detalle) => {
        const venta = detalle.venta as BasicRow | undefined;
        return venta && isActive(venta) && !isAnulado(venta.estado) && isPagado(venta.estado);
      })
      .forEach((detalle) => {
        const amount = toNumber(detalle.total_linea ?? detalle.subtotal);
        ingresosServicios += amount;
        const venta = detalle.venta as BasicRow;
        addMonthAmount(series, venta.fecha, 'ingresos_servicios', amount);
      });

    const ingresosVentasProductos = Math.max(0, ingresosVentas - ingresosServicios);
    if (ingresosVentasProductos > 0) {
      upsertCategory(ingresosCategorias, 'Ventas de productos / kiosco', 'ingreso', ingresosVentasProductos);
    }
    if (ingresosServicios > 0) {
      upsertCategory(ingresosCategorias, 'Servicios adicionales vendidos', 'ingreso', ingresosServicios);
    }

    const comprasPagadas = compras.filter(
      (compra) => isActive(compra) && !isAnulado(compra.estado) && isPagado(compra.estado)
    );
    comprasPagadas.forEach((compra) => {
      const amount = toNumber(compra.total);
      egresosCompras += amount;
      addMonthAmount(series, compra.fecha, 'egresos_compras', amount);
      upsertCategory(egresosCategorias, 'Compras a proveedores', 'egreso', amount);
    });

    compras
      .filter((compra) => isActive(compra) && isPendiente(compra.estado))
      .forEach((compra) => {
        const amount = toNumber(compra.total);
        comprasPendientes += amount;
        upsertCategory(compromisosCategorias, 'Compras pendientes', 'pendiente', amount);
      });

    const gastosPagados = gastos.filter(
      (gasto) => isActive(gasto) && !isAnulado(gasto.estado) && isPagado(gasto.estado)
    );
    gastosPagados.forEach((gasto) => {
      const amount = toNumber(gasto.monto);
      egresosGastos += amount;
      addMonthAmount(series, gasto.fecha, 'egresos_gastos', amount);
      const tipoGasto = Array.isArray(gasto.tipo_gasto) ? gasto.tipo_gasto[0] : gasto.tipo_gasto;
      upsertCategory(egresosCategorias, tipoGasto?.nombre ?? gasto.descripcion ?? 'Gastos / Egresos', 'egreso', amount);
    });

    gastos
      .filter((gasto) => isActive(gasto) && (isPendiente(gasto.estado) || isVencido(gasto.estado)))
      .forEach((gasto) => {
        const amount = toNumber(gasto.monto);
        gastosPendientes += amount;
        const estado = isVencido(gasto.estado) ? 'Gastos vencidos' : 'Gastos pendientes';
        upsertCategory(compromisosCategorias, estado, 'pendiente', amount);
      });

    const ingresosTotal = roundMoney(ingresosCuotas + ingresosVentas);
    const egresosTotal = roundMoney(egresosCompras + egresosGastos);
    const resultadoNeto = roundMoney(ingresosTotal - egresosTotal);
    const margenResultado = ingresosTotal > 0 ? roundMoney((resultadoNeto / ingresosTotal) * 100) : null;

    const data: FinanzasDashboardResponse = {
      desde,
      hasta,
      generado_en: new Date().toISOString(),
      metricas: {
        ingresos_cuotas: roundMoney(ingresosCuotas),
        ingresos_ventas: roundMoney(ingresosVentas),
        ingresos_servicios: roundMoney(ingresosServicios),
        ingresos_total: ingresosTotal,
        egresos_compras: roundMoney(egresosCompras),
        egresos_gastos: roundMoney(egresosGastos),
        egresos_total: egresosTotal,
        resultado_neto: resultadoNeto,
        margen_resultado_porcentaje: margenResultado,
        compromisos_pendientes: roundMoney(comprasPendientes + gastosPendientes),
        compras_pendientes: roundMoney(comprasPendientes),
        gastos_pendientes: roundMoney(gastosPendientes),
        cantidad_pagos: pagosActivos.length,
        cantidad_ventas: ventasActivas.length,
        cantidad_compras: comprasPagadas.length,
        cantidad_gastos: gastosPagados.length,
      },
      serie_mensual: finalizeSeries(series),
      ingresos_por_categoria: sortedCategories(ingresosCategorias),
      egresos_por_categoria: sortedCategories(egresosCategorias),
      compromisos_por_categoria: sortedCategories(compromisosCategorias),
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener BI financiero' },
      { status: error.message?.includes('Token') ? 401 : 500 }
    );
  }
}
