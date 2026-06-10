import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { conexionBD } from '@/middlewares/conexionBd.middleware';
import type {
  GeneroBi,
  SociosBiAsistenciaSegmento,
  SociosBiConsumoSegmento,
  SociosBiFranjaEtariaResumen,
  SociosBiGeneroResumen,
  SociosBiProductoServicioRanking,
  SociosBiPromocionSugerida,
  SociosBiSerieAltaMensual,
  SociosDemografiaBiResponse,
} from '@/interfaces/sociosDemografiaBi.interface';

export const dynamic = 'force-dynamic';

type BasicRow = Record<string, any>;

type SocioRow = {
  id_socio: string;
  nombre_completo: string;
  sexo?: string | null;
  fecnac?: string | null;
  fecha_alta?: string | null;
  activo?: boolean | null;
};

type SocioSegmento = {
  socio: SocioRow;
  genero: GeneroBi;
  labelGenero: string;
  edad: number | null;
  franja: string;
  ordenFranja: number;
  segmento: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const AGE_BANDS = [
  { franja: 'Menores de 18', min: 0, max: 17, orden: 1 },
  { franja: '18 a 24', min: 18, max: 24, orden: 2 },
  { franja: '25 a 34', min: 25, max: 34, orden: 3 },
  { franja: '35 a 44', min: 35, max: 44, orden: 4 },
  { franja: '45 a 54', min: 45, max: 54, orden: 5 },
  { franja: '55 o más', min: 55, max: 999, orden: 6 },
  { franja: 'Sin fecha de nacimiento', min: null, max: null, orden: 7 },
];

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

function normalizeGenero(value?: string | null): GeneroBi {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized === 'M') return 'M';
  if (normalized === 'F') return 'F';
  return 'sin_dato';
}

function labelGenero(genero: GeneroBi) {
  if (genero === 'M') return 'Hombres';
  if (genero === 'F') return 'Mujeres';
  return 'Sin dato';
}

function calculateAge(birthDate?: string | null, referenceDate = new Date()) {
  if (!birthDate) return null;
  const date = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  let age = referenceDate.getFullYear() - date.getFullYear();
  const monthDiff = referenceDate.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 0 && age < 120 ? age : null;
}

function resolveAgeBand(age: number | null) {
  if (age === null) {
    return AGE_BANDS[AGE_BANDS.length - 1];
  }

  return AGE_BANDS.find((band) => band.min !== null && age >= band.min && age <= (band.max ?? 999)) ?? AGE_BANDS[AGE_BANDS.length - 1];
}

function monthKey(date?: string | null) {
  if (!date || date.length < 7) return null;
  return date.slice(0, 7);
}

function monthLabel(periodo: string) {
  const [year, month] = periodo.split('-');
  return `${month}/${year}`;
}

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

function isActive(row: BasicRow) {
  return row.activo !== false;
}

function isAnulado(estado?: unknown) {
  return String(estado ?? '').toLowerCase() === 'anulada' || String(estado ?? '').toLowerCase() === 'cancelado';
}

function isPagado(estado?: unknown) {
  const value = String(estado ?? '').toLowerCase();
  return value === 'pagado' || value === 'pagada' || value === 'completado' || value === 'aprobado';
}

function buildSocioSegments(socios: SocioRow[], referenceDate: Date) {
  return socios.map((socio) => {
    const genero = normalizeGenero(socio.sexo);
    const edad = calculateAge(socio.fecnac, referenceDate);
    const band = resolveAgeBand(edad);
    return {
      socio,
      genero,
      labelGenero: labelGenero(genero),
      edad,
      franja: band.franja,
      ordenFranja: band.orden,
      segmento: `${band.franja} · ${labelGenero(genero)}`,
    } satisfies SocioSegmento;
  });
}

function emptyFranjaMap() {
  const map = new Map<string, SociosBiFranjaEtariaResumen>();
  AGE_BANDS.forEach((band) => {
    map.set(band.franja, {
      franja: band.franja,
      orden: band.orden,
      cantidad_socios: 0,
      porcentaje_socios: 0,
      edad_promedio: null,
      hombres: 0,
      mujeres: 0,
      sin_genero: 0,
      altas_periodo: 0,
      asistencias_periodo: 0,
      pagos_periodo: 0,
      consumo_periodo: 0,
    });
  });
  return map;
}

function buildPromotions(params: {
  franjas: SociosBiFranjaEtariaResumen[];
  asistencia: SociosBiAsistenciaSegmento[];
  consumo: SociosBiConsumoSegmento[];
  ranking: SociosBiProductoServicioRanking[];
}) {
  const promociones: SociosBiPromocionSugerida[] = [];
  const franjasConSocios = params.franjas.filter((item) => item.cantidad_socios > 0);
  const topAsistencia = [...params.asistencia].sort((a, b) => b.asistencias - a.asistencias)[0];
  const bajaAsistencia = [...params.asistencia]
    .filter((item) => item.socios >= 3)
    .sort((a, b) => a.asistencias / Math.max(a.socios, 1) - b.asistencias / Math.max(b.socios, 1))[0];
  const topConsumo = [...params.consumo].sort((a, b) => b.total - a.total)[0];
  const franjaDominante = [...franjasConSocios].sort((a, b) => b.cantidad_socios - a.cantidad_socios)[0];
  const itemTop = params.ranking[0];

  if (topAsistencia) {
    promociones.push({
      titulo: 'Campaña de fidelización para el segmento más activo',
      descripcion: `${topAsistencia.segmento} concentra ${topAsistencia.asistencias} asistencias en el período.` ,
      segmento: topAsistencia.segmento,
      accion_sugerida: 'Ofrecer beneficio por continuidad, desafío mensual o programa de referidos para capitalizar el hábito de asistencia.',
      prioridad: 'alta',
    });
  }

  if (bajaAsistencia) {
    promociones.push({
      titulo: 'Reactivación de socios con baja asistencia',
      descripcion: `${bajaAsistencia.segmento} muestra baja asistencia relativa durante el período analizado.`,
      segmento: bajaAsistencia.segmento,
      accion_sugerida: 'Enviar campaña de motivación, rutina breve de reinicio o promoción de acompañamiento por entrenador.',
      prioridad: 'media',
    });
  }

  if (topConsumo) {
    promociones.push({
      titulo: 'Promoción cruzada para segmento con mayor consumo',
      descripcion: `${topConsumo.segmento} generó consumo por ${topConsumo.total.toLocaleString('es-AR')} ARS.`,
      segmento: topConsumo.segmento,
      accion_sugerida: 'Crear combo de producto/servicio asociado al comportamiento de compra del segmento.',
      prioridad: 'alta',
    });
  }

  if (franjaDominante) {
    promociones.push({
      titulo: 'Oferta principal para la franja demográfica dominante',
      descripcion: `${franjaDominante.franja} reúne ${franjaDominante.cantidad_socios} socios activos/demo.`,
      segmento: franjaDominante.franja,
      accion_sugerida: 'Ajustar comunicación, horarios y beneficios comerciales a la franja con mayor presencia.',
      prioridad: 'media',
    });
  }

  if (itemTop) {
    promociones.push({
      titulo: 'Impulsar producto o servicio de mayor tracción',
      descripcion: `${itemTop.item} lidera el ranking de consumo para ${itemTop.segmento}.`,
      segmento: itemTop.segmento,
      accion_sugerida: 'Usar este item como gancho comercial, pack mensual o beneficio de renovación.',
      prioridad: 'baja',
    });
  }

  return promociones.slice(0, 5);
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await authMiddleware(request);

    if (user.rol !== 'admin' && user.rol !== 'usuario') {
      return NextResponse.json({ error: 'No autorizado para consultar BI de socios' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const desde = normalizeDateParam(searchParams.get('desde'), firstDayOfCurrentYearISO(), 'Fecha desde');
    const hasta = normalizeDateParam(searchParams.get('hasta'), todayISO(), 'Fecha hasta');

    if (hasta < desde) {
      return NextResponse.json(
        { error: 'La fecha hasta no puede ser anterior a la fecha desde' },
        { status: 400 }
      );
    }

    const supabase = conexionBD();

    const [sociosResult, asistenciasResult, pagosResult, ventasResult] = await Promise.all([
      supabase
        .from('socio')
        .select('id_socio, nombre_completo, sexo, fecnac, fecha_alta, activo'),
      supabase
        .from('asistencia')
        .select('id, socio_id, fecha')
        .gte('fecha', desde)
        .lte('fecha', hasta),
      supabase
        .from('pago')
        .select('id, socio_id, fecha_pago, total, monto_pagado, estado, activo')
        .gte('fecha_pago', desde)
        .lte('fecha_pago', hasta),
      supabase
        .from('venta')
        .select('id, socio_id, fecha, total, estado, activo, cliente_tipo')
        .gte('fecha', desde)
        .lte('fecha', hasta),
    ]);

    if (sociosResult.error) throw new Error(sociosResult.error.message);
    if (asistenciasResult.error) throw new Error(asistenciasResult.error.message);
    if (pagosResult.error) throw new Error(pagosResult.error.message);
    if (ventasResult.error) throw new Error(ventasResult.error.message);

    const socios = (sociosResult.data ?? []) as SocioRow[];
    const asistencias = (asistenciasResult.data ?? []) as BasicRow[];
    const pagos = (pagosResult.data ?? []) as BasicRow[];
    const ventas = (ventasResult.data ?? []) as BasicRow[];

    const ventaIds = ventas.map((venta) => venta.id).filter(Boolean);
    let detallesVenta: BasicRow[] = [];
    if (ventaIds.length > 0) {
      const detallesResult = await supabase
        .from('venta_detalle')
        .select('id, venta_id, item_tipo, cantidad, total_linea, subtotal, producto:producto_id(nombre), servicio:servicio_id(nombre)')
        .in('venta_id', ventaIds);

      if (!detallesResult.error) {
        detallesVenta = (detallesResult.data ?? []) as BasicRow[];
      }
    }

    const referenceDate = new Date(`${hasta}T12:00:00`);
    const segmentos = buildSocioSegments(socios, referenceDate);
    const segmentoBySocioId = new Map(segmentos.map((item) => [item.socio.id_socio, item]));
    const totalSocios = socios.length;
    const sociosActivos = socios.filter((socio) => socio.activo !== false).length;
    const sociosInactivos = totalSocios - sociosActivos;
    const edades = segmentos.map((item) => item.edad).filter((edad): edad is number => edad !== null);

    const generoCounts: Record<GeneroBi, number> = {
      M: 0,
      F: 0,
      sin_dato: 0,
    };

    segmentos.forEach((item) => {
      generoCounts[item.genero] += 1;
    });

    const distribucionGenero: SociosBiGeneroResumen[] = [
      { genero: 'M', label: 'Hombres', cantidad: generoCounts.M, porcentaje: percent(generoCounts.M, totalSocios) },
      { genero: 'F', label: 'Mujeres', cantidad: generoCounts.F, porcentaje: percent(generoCounts.F, totalSocios) },
      { genero: 'sin_dato', label: 'Sin dato', cantidad: generoCounts.sin_dato, porcentaje: percent(generoCounts.sin_dato, totalSocios) },
    ];

    const franjaMap = emptyFranjaMap();
    const franjaEdadAccumulator = new Map<string, { totalEdad: number; cantidad: number }>();
    segmentos.forEach((item) => {
      const current = franjaMap.get(item.franja);
      if (!current) return;
      current.cantidad_socios += 1;
      if (item.genero === 'M') current.hombres += 1;
      if (item.genero === 'F') current.mujeres += 1;
      if (item.genero === 'sin_dato') current.sin_genero += 1;
      if (item.edad !== null) {
        const acc = franjaEdadAccumulator.get(item.franja) ?? { totalEdad: 0, cantidad: 0 };
        acc.totalEdad += item.edad;
        acc.cantidad += 1;
        franjaEdadAccumulator.set(item.franja, acc);
      }
      if (item.socio.fecha_alta && item.socio.fecha_alta >= desde && item.socio.fecha_alta <= hasta) {
        current.altas_periodo += 1;
      }
    });

    const altasSeries = new Map<string, SociosBiSerieAltaMensual>();
    segmentos.forEach((item) => {
      const periodo = monthKey(item.socio.fecha_alta);
      if (!periodo || item.socio.fecha_alta! < desde || item.socio.fecha_alta! > hasta) return;
      const current = altasSeries.get(periodo) ?? {
        periodo,
        periodo_label: monthLabel(periodo),
        total: 0,
        hombres: 0,
        mujeres: 0,
        sin_genero: 0,
      };
      current.total += 1;
      if (item.genero === 'M') current.hombres += 1;
      if (item.genero === 'F') current.mujeres += 1;
      if (item.genero === 'sin_dato') current.sin_genero += 1;
      altasSeries.set(periodo, current);
    });

    const asistenciaSegmentoMap = new Map<string, SociosBiAsistenciaSegmento>();
    asistencias.forEach((asistencia) => {
      const segmento = segmentoBySocioId.get(asistencia.socio_id);
      if (!segmento) return;
      const key = segmento.segmento;
      const current = asistenciaSegmentoMap.get(key) ?? {
        segmento: segmento.segmento,
        franja: segmento.franja,
        genero: segmento.genero,
        label_genero: segmento.labelGenero,
        asistencias: 0,
        socios: 0,
      };
      current.asistencias += 1;
      asistenciaSegmentoMap.set(key, current);
      const franja = franjaMap.get(segmento.franja);
      if (franja) franja.asistencias_periodo += 1;
    });

    const sociosPorSegmento = new Map<string, Set<string>>();
    segmentos.forEach((segmento) => {
      const set = sociosPorSegmento.get(segmento.segmento) ?? new Set<string>();
      set.add(segmento.socio.id_socio);
      sociosPorSegmento.set(segmento.segmento, set);
    });
    asistenciaSegmentoMap.forEach((value, key) => {
      value.socios = sociosPorSegmento.get(key)?.size ?? 0;
    });

    const pagosActivos = pagos.filter((pago) => isActive(pago) && isPagado(pago.estado));
    pagosActivos.forEach((pago) => {
      const segmento = segmentoBySocioId.get(pago.socio_id);
      if (!segmento) return;
      const franja = franjaMap.get(segmento.franja);
      if (franja) franja.pagos_periodo += toNumber(pago.total ?? pago.monto_pagado);
    });

    const ventasActivas = ventas.filter(
      (venta) => isActive(venta) && !isAnulado(venta.estado) && isPagado(venta.estado) && venta.socio_id
    );
    const ventaById = new Map(ventasActivas.map((venta) => [venta.id, venta]));
    const consumoSegmentoMap = new Map<string, SociosBiConsumoSegmento>();
    ventasActivas.forEach((venta) => {
      const segmento = segmentoBySocioId.get(venta.socio_id);
      if (!segmento) return;
      const key = segmento.segmento;
      const current = consumoSegmentoMap.get(key) ?? {
        segmento: segmento.segmento,
        franja: segmento.franja,
        genero: segmento.genero,
        label_genero: segmento.labelGenero,
        total: 0,
        cantidad_ventas: 0,
      };
      current.total += toNumber(venta.total);
      current.cantidad_ventas += 1;
      consumoSegmentoMap.set(key, current);
      const franja = franjaMap.get(segmento.franja);
      if (franja) franja.consumo_periodo += toNumber(venta.total);
    });

    const rankingMap = new Map<string, SociosBiProductoServicioRanking>();
    detallesVenta.forEach((detalle) => {
      const venta = ventaById.get(detalle.venta_id);
      if (!venta) return;
      const segmento = segmentoBySocioId.get(venta.socio_id);
      if (!segmento) return;
      const tipo = detalle.item_tipo === 'servicio' ? 'servicio' : 'producto';
      const related = tipo === 'servicio' ? detalle.servicio : detalle.producto;
      const item = Array.isArray(related) ? related[0]?.nombre : related?.nombre;
      const nombre = item || (tipo === 'servicio' ? 'Servicio sin nombre' : 'Producto sin nombre');
      const key = `${tipo}:${nombre}:${segmento.segmento}`;
      const current = rankingMap.get(key) ?? {
        item: nombre,
        tipo,
        segmento: segmento.segmento,
        franja: segmento.franja,
        genero: segmento.genero,
        label_genero: segmento.labelGenero,
        total: 0,
        cantidad: 0,
      };
      current.total += toNumber(detalle.total_linea ?? detalle.subtotal);
      current.cantidad += toNumber(detalle.cantidad);
      rankingMap.set(key, current);
    });

    const franjasEtarias = Array.from(franjaMap.values()).map((item) => {
      const acc = franjaEdadAccumulator.get(item.franja);
      item.porcentaje_socios = percent(item.cantidad_socios, totalSocios);
      item.edad_promedio = acc?.cantidad ? Number((acc.totalEdad / acc.cantidad).toFixed(1)) : null;
      return item;
    }).sort((a, b) => a.orden - b.orden);

    const asistenciaPorSegmento = Array.from(asistenciaSegmentoMap.values()).sort((a, b) => b.asistencias - a.asistencias);
    const consumoPorSegmento = Array.from(consumoSegmentoMap.values()).sort((a, b) => b.total - a.total);
    const rankingProductosServicios = Array.from(rankingMap.values()).sort((a, b) => b.total - a.total).slice(0, 12);
    const promocionesSugeridas = buildPromotions({
      franjas: franjasEtarias,
      asistencia: asistenciaPorSegmento,
      consumo: consumoPorSegmento,
      ranking: rankingProductosServicios,
    });

    const response: SociosDemografiaBiResponse = {
      desde,
      hasta,
      generado_en: new Date().toISOString(),
      metricas: {
        total_socios: totalSocios,
        socios_activos: sociosActivos,
        socios_inactivos: sociosInactivos,
        hombres: generoCounts.M,
        mujeres: generoCounts.F,
        sin_genero: generoCounts.sin_dato,
        porcentaje_hombres: percent(generoCounts.M, totalSocios),
        porcentaje_mujeres: percent(generoCounts.F, totalSocios),
        porcentaje_sin_genero: percent(generoCounts.sin_dato, totalSocios),
        edad_promedio: edades.length ? Number((edades.reduce((sum, edad) => sum + edad, 0) / edades.length).toFixed(1)) : null,
        altas_periodo: segmentos.filter((item) => item.socio.fecha_alta && item.socio.fecha_alta >= desde && item.socio.fecha_alta <= hasta).length,
        asistencias_periodo: asistencias.length,
        pagos_periodo: pagosActivos.reduce((sum, pago) => sum + toNumber(pago.total ?? pago.monto_pagado), 0),
        consumo_periodo: ventasActivas.reduce((sum, venta) => sum + toNumber(venta.total), 0),
      },
      distribucion_genero: distribucionGenero,
      franjas_etarias: franjasEtarias,
      altas_mensuales: Array.from(altasSeries.values()).sort((a, b) => a.periodo.localeCompare(b.periodo)),
      asistencia_por_segmento: asistenciaPorSegmento,
      consumo_por_segmento: consumoPorSegmento,
      ranking_productos_servicios: rankingProductosServicios,
      promociones_sugeridas: promocionesSugeridas,
    };

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error: any) {
    console.error('ERROR en BI demográfico de socios:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener BI demográfico de socios' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}
