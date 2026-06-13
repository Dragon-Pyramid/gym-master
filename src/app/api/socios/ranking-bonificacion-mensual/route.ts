import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";
import type {
  SocioRankingBonificacionItem,
  SocioRankingBonificacionMutationPayload,
  SociosRankingBonificacionKpis,
  SociosRankingBonificacionResponse,
} from "@/interfaces/sociosRankingBonificacion.interface";

export const dynamic = "force-dynamic";

type BasicRow = Record<string, any>;

type SocioRow = {
  id_socio: string;
  nombre_completo: string;
  dni?: string | null;
  email?: string | null;
  activo?: boolean | null;
  fecha_alta?: string | null;
};

type AsistenciaRow = {
  socio_id: string;
  fecha: string;
};

type PagoRow = {
  socio_id: string;
  estado?: string | null;
  activo?: boolean | null;
  fecha_pago?: string | null;
  fecha_vencimiento?: string | null;
  periodo_desde?: string | null;
  periodo_hasta?: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function unauthorized(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = "Permiso insuficiente") {
  return NextResponse.json({ error: message }, { status: 403 });
}

function getPeriod(anioParam?: string | null, mesParam?: string | null) {
  const now = new Date();
  const anio = Number(anioParam || now.getFullYear());
  const mes = Number(mesParam || now.getMonth() + 1);

  if (!Number.isInteger(anio) || anio < 2020 || anio > 2100) {
    throw new Error("El año debe ser válido");
  }

  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new Error("El mes debe estar entre 1 y 12");
  }

  const periodoDesde = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const periodoHasta = new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);

  return { anio, mes, periodoDesde, periodoHasta };
}

function normalizeDate(value?: string | null) {
  if (!value) return null;
  const clean = String(value).slice(0, 10);
  return DATE_RE.test(clean) ? clean : null;
}

function isPaymentCoveringPeriod(row: PagoRow, periodoDesde: string, periodoHasta: string) {
  if (row.activo === false) return false;
  if (row.estado && !["pagado", "aprobado", "confirmado"].includes(String(row.estado).toLowerCase())) return false;

  const periodoHastaPago = normalizeDate(row.periodo_hasta);
  const vencimiento = normalizeDate(row.fecha_vencimiento);
  const fechaPago = normalizeDate(row.fecha_pago);

  if (periodoHastaPago && periodoHastaPago >= periodoHasta) return true;
  if (vencimiento && vencimiento >= periodoHasta) return true;
  if (fechaPago && fechaPago >= periodoDesde && fechaPago <= periodoHasta) return true;

  return false;
}

function isPaymentRegisteredForBonusMonth(row: PagoRow, periodoDesde: string, periodoHasta: string) {
  if (row.activo === false) return false;
  if (row.estado && !["pagado", "aprobado", "confirmado"].includes(String(row.estado).toLowerCase())) return false;

  const desdePago = normalizeDate(row.fecha_pago);
  const periodoHastaPago = normalizeDate(row.periodo_hasta) || normalizeDate(row.fecha_vencimiento);
  const periodoDesdePago = normalizeDate((row as any).periodo_desde) || desdePago;

  if (periodoDesdePago && periodoHastaPago) {
    return periodoDesdePago <= periodoHasta && periodoHastaPago >= periodoDesde;
  }

  return Boolean(desdePago && desdePago >= periodoDesde && desdePago <= periodoHasta);
}

function calculateRanking(
  socios: SocioRow[],
  asistencias: AsistenciaRow[],
  pagos: PagoRow[],
  bonificaciones: BasicRow[],
  periodoDesde: string,
  periodoHasta: string,
) {
  const asistenciaPorSocio = new Map<string, Set<string>>();
  asistencias.forEach((row) => {
    if (!row.socio_id || !row.fecha) return;
    const fecha = normalizeDate(row.fecha);
    if (!fecha) return;
    if (!asistenciaPorSocio.has(row.socio_id)) asistenciaPorSocio.set(row.socio_id, new Set());
    asistenciaPorSocio.get(row.socio_id)?.add(fecha);
  });

  const pagosPorSocio = new Map<string, PagoRow[]>();
  pagos.forEach((row) => {
    if (!row.socio_id) return;
    if (!pagosPorSocio.has(row.socio_id)) pagosPorSocio.set(row.socio_id, []);
    pagosPorSocio.get(row.socio_id)?.push(row);
  });

  const bonificacionPorSocio = new Map<string, BasicRow>();
  bonificaciones.forEach((row) => {
    if (row.socio_id) bonificacionPorSocio.set(row.socio_id, row);
  });

  const items = socios.map((socio) => {
    const asistenciasSocio = asistenciaPorSocio.get(socio.id_socio)?.size ?? 0;
    const pagosSocio = pagosPorSocio.get(socio.id_socio) ?? [];
    const cuotaAlDia = pagosSocio.some((pago) => isPaymentCoveringPeriod(pago, periodoDesde, periodoHasta));
    const socioActivo = socio.activo !== false;
    const score = asistenciasSocio * 10 + (cuotaAlDia ? 20 : 0) + (socioActivo ? 5 : 0);
    const bonificacion = bonificacionPorSocio.get(socio.id_socio);

    return {
      socio_id: socio.id_socio,
      nombre_completo: socio.nombre_completo,
      dni: socio.dni ?? null,
      email: socio.email ?? null,
      activo: socioActivo,
      fecha_alta: socio.fecha_alta ?? null,
      asistencias: asistenciasSocio,
      cuota_al_dia: cuotaAlDia,
      ultimo_periodo_hasta: (() => {
        const fechas = pagosSocio
          .map((pago) => normalizeDate(pago.periodo_hasta) || normalizeDate(pago.fecha_vencimiento))
          .filter(Boolean)
          .sort();
        return fechas.length ? fechas[fechas.length - 1] : null;
      })(),
      score,
      ranking: 0,
      bonificado: Boolean(bonificacion?.bonificado),
      descuento_porcentaje: Number(bonificacion?.descuento_porcentaje ?? 0),
      motivo: bonificacion?.motivo ?? null,
      observaciones: bonificacion?.observaciones ?? null,
      generado_en: bonificacion?.generado_en ?? null,
      bonificacion_bloqueada: pagosSocio.some((pago) => isPaymentRegisteredForBonusMonth(pago, periodoDesde, periodoHasta)),
      bloqueo_motivo: pagosSocio.some((pago) => isPaymentRegisteredForBonusMonth(pago, periodoDesde, periodoHasta))
        ? "Ya existe un pago registrado para este socio y mes. La bonificación quedó bloqueada para conservar el snapshot comercial del pago."
        : null,
    } satisfies SocioRankingBonificacionItem;
  });

  items.sort((a, b) => {
    if (b.asistencias !== a.asistencias) return b.asistencias - a.asistencias;
    if (Number(b.cuota_al_dia) !== Number(a.cuota_al_dia)) return Number(b.cuota_al_dia) - Number(a.cuota_al_dia);
    if (b.score !== a.score) return b.score - a.score;
    return a.nombre_completo.localeCompare(b.nombre_completo, "es");
  });

  items.forEach((item, index) => {
    item.ranking = index + 1;
  });

  return items;
}

function calculateKpis(ranking: SocioRankingBonificacionItem[]): SociosRankingBonificacionKpis {
  const sociosActivos = ranking.filter((item) => item.activo).length;
  const sociosConAsistencia = ranking.filter((item) => item.asistencias > 0).length;
  const sociosCuotaAlDia = ranking.filter((item) => item.cuota_al_dia).length;
  const bonificados = ranking.filter((item) => item.bonificado).length;
  const asistenciaTotal = ranking.reduce((acc, item) => acc + item.asistencias, 0);

  return {
    socios_activos: sociosActivos,
    socios_con_asistencia: sociosConAsistencia,
    socios_cuota_al_dia: sociosCuotaAlDia,
    bonificados,
    asistencia_total: asistenciaTotal,
    asistencia_promedio: ranking.length ? Number((asistenciaTotal / ranking.length).toFixed(2)) : 0,
  };
}

async function tableExists(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const { error } = await supabase
    .from("socio_ranking_bonificacion_mensual")
    .select("id")
    .limit(1);

  if (!error) return true;
  if (error.code === "42P01" || /does not exist|schema cache/i.test(error.message ?? "")) return false;
  return false;
}

async function buildResponse(anio: number, mes: number): Promise<SociosRankingBonificacionResponse> {
  const supabase = getSupabaseServerClient();
  const { periodoDesde, periodoHasta } = getPeriod(String(anio), String(mes));
  const warnings: string[] = [];

  const [sociosResult, asistenciasResult, pagosResult] = await Promise.all([
    supabase
      .from("socio")
      .select("id_socio,nombre_completo,dni,email,activo,fecha_alta")
      .order("nombre_completo", { ascending: true }),
    supabase
      .from("asistencia")
      .select("socio_id,fecha")
      .gte("fecha", periodoDesde)
      .lte("fecha", periodoHasta),
    supabase
      .from("pago")
      .select("socio_id,estado,activo,fecha_pago,fecha_vencimiento,periodo_desde,periodo_hasta")
      .or(`periodo_hasta.gte.${periodoDesde},fecha_vencimiento.gte.${periodoDesde},fecha_pago.gte.${periodoDesde}`),
  ]);

  if (sociosResult.error) throw new Error(sociosResult.error.message);
  if (asistenciasResult.error) throw new Error(asistenciasResult.error.message);
  if (pagosResult.error) throw new Error(pagosResult.error.message);

  const schemaReady = await tableExists(supabase);
  let bonificaciones: BasicRow[] = [];

  if (schemaReady) {
    const { data, error } = await supabase
      .from("socio_ranking_bonificacion_mensual")
      .select("*")
      .eq("anio", anio)
      .eq("mes", mes);

    if (error) {
      warnings.push(`No se pudo leer bonificaciones guardadas: ${error.message}`);
    } else {
      bonificaciones = data ?? [];
    }
  } else {
    warnings.push("La tabla socio_ranking_bonificacion_mensual todavía no está disponible. Aplicar migración para guardar bonificaciones.");
  }

  const ranking = calculateRanking(
    (sociosResult.data ?? []) as SocioRow[],
    (asistenciasResult.data ?? []) as AsistenciaRow[],
    (pagosResult.data ?? []) as PagoRow[],
    bonificaciones,
    periodoDesde,
    periodoHasta,
  );

  return {
    generated_at: new Date().toISOString(),
    anio,
    mes,
    periodo_desde: periodoDesde,
    periodo_hasta: periodoHasta,
    schema_ready: schemaReady,
    warnings,
    kpis: calculateKpis(ranking),
    ranking,
    reglas: [
      "Mayor cantidad de días asistidos en el mes.",
      "Primer desempate: cuota al día al cierre del período.",
      "Segundo desempate: score operativo.",
      "Último desempate: orden alfabético.",
    ],
  };
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
    if (!user || !["admin", "usuario"].includes(user.rol)) return forbidden();

    const { searchParams } = new URL(req.url);
    const { anio, mes } = getPeriod(searchParams.get("anio"), searchParams.get("mes"));
    const response = await buildResponse(anio, mes);

    return NextResponse.json(response);
  } catch (error: any) {
    if (error?.message === "Token no proporcionado" || error?.message === "Token inválido") {
      return unauthorized(error.message);
    }

    return NextResponse.json({ error: error?.message || "Error al calcular ranking mensual" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
    if (!user || !["admin", "usuario"].includes(user.rol)) return forbidden();

    const payload = (await req.json()) as SocioRankingBonificacionMutationPayload;
    const { anio, mes } = getPeriod(String(payload.anio), String(payload.mes));

    if (!payload.socio_id) {
      return NextResponse.json({ error: "socio_id es obligatorio" }, { status: 400 });
    }

    const descuento = Number(payload.descuento_porcentaje ?? 0);
    if (payload.bonificado && (Number.isNaN(descuento) || descuento < 0 || descuento > 100)) {
      return NextResponse.json({ error: "El descuento debe estar entre 0 y 100" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const schemaReady = await tableExists(supabase);
    if (!schemaReady) {
      return NextResponse.json(
        { error: "La tabla de bonificaciones mensuales todavía no está disponible. Aplicar migración." },
        { status: 409 },
      );
    }

    const current = await buildResponse(anio, mes);
    const item = current.ranking.find((row) => row.socio_id === payload.socio_id);

    if (!item) {
      return NextResponse.json({ error: "Socio no encontrado en el ranking" }, { status: 404 });
    }

    if (item.bonificacion_bloqueada) {
      return NextResponse.json(
        {
          error:
            "No se puede modificar la bonificación de este mes porque ya existe un pago registrado para el período. El pago conserva el snapshot de bonificación aplicado.",
        },
        { status: 409 },
      );
    }

    const { error: upsertError } = await supabase
      .from("socio_ranking_bonificacion_mensual")
      .upsert(
        {
          socio_id: payload.socio_id,
          anio,
          mes,
          ranking: item.ranking,
          asistencias: item.asistencias,
          cuota_al_dia: item.cuota_al_dia,
          socio_activo: item.activo,
          score: item.score,
          bonificado: payload.bonificado,
          descuento_porcentaje: payload.bonificado ? descuento : 0,
          motivo: payload.motivo || (payload.bonificado ? "Bonificación mensual por ranking" : "Bonificación removida"),
          observaciones: payload.observaciones || null,
          generado_por: user.id || null,
          generado_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: "socio_id,anio,mes" },
      );

    if (upsertError) throw new Error(upsertError.message);

    const { error: socioError } = await supabase
      .from("socio")
      .update({ descuento_activo: Boolean(payload.bonificado), actualizado_en: new Date().toISOString() })
      .eq("id_socio", payload.socio_id);

    if (socioError) throw new Error(socioError.message);

    const refreshed = await buildResponse(anio, mes);
    return NextResponse.json(refreshed);
  } catch (error: any) {
    if (error?.message === "Token no proporcionado" || error?.message === "Token inválido") {
      return unauthorized(error.message);
    }

    return NextResponse.json({ error: error?.message || "Error al actualizar bonificación mensual" }, { status: 500 });
  }
}
