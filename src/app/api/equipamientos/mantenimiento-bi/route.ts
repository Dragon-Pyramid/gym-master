import { NextResponse } from "next/server";
import { supabase } from "@/services/supabaseClient";
import {
  EquipamientoMantenimientoBiResponse,
  EquipamientoMantenimientoBucket,
  EquipamientoMantenimientoRankingItem,
  EquipamientoMantenimientoReciente,
  EquipamientoMantenimientoSerieMensual,
} from "@/interfaces/equipamientoMantenimientoBi.interface";

export const dynamic = "force-dynamic";

type EquipoRow = {
  id: string;
  nombre: string | null;
  tipo: string | null;
  marca?: string | null;
  modelo?: string | null;
  ubicacion: string | null;
  estado: string | null;
  fecha_adquisicion?: string | null;
  ultima_revision: string | null;
  proxima_revision: string | null;
  activo: boolean | null;
};

type MantenimientoRow = {
  id: string;
  id_equipamiento: string | null;
  tipo_mantenimiento: string | null;
  fecha_mantenimiento: string | null;
  costo: number | string | null;
  estado: string | null;
  descripcion?: string | null;
  tecnico_responsable?: string | null;
  observaciones?: string | null;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function diffDays(target: Date, base: Date): number {
  return Math.ceil((target.getTime() - base.getTime()) / MS_PER_DAY);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeLabel(value?: string | null, fallback = "Sin dato") {
  const clean = String(value ?? "").trim();
  return clean.length > 0 ? clean : fallback;
}

function addBucket(map: Map<string, EquipamientoMantenimientoBucket>, label: string, costo = 0) {
  const current = map.get(label) ?? { label, total: 0, costo: 0 };
  current.total += 1;
  current.costo = numberValue(current.costo) + costo;
  map.set(label, current);
}

function buildEmptyMonths(): Map<string, EquipamientoMantenimientoSerieMensual> {
  const map = new Map<string, EquipamientoMantenimientoSerieMensual>();
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(cursor);
    date.setMonth(cursor.getMonth() - i);
    const periodo = monthKey(date);
    map.set(periodo, {
      periodo,
      costo: 0,
      mantenimientos: 0,
      correctivos: 0,
      preventivos: 0,
    });
  }

  return map;
}

function buildRecommendation(score: number, row: EquipamientoMantenimientoRankingItem) {
  if (score >= 75) {
    return "Evaluar reemplazo o venta: alto costo/frecuencia de mantenimiento.";
  }

  if (score >= 55) {
    return "Revisar costo-beneficio: programar inspección técnica y decisión comercial.";
  }

  if ((row.correctivos_180_dias ?? 0) >= 2) {
    return "Atención: acumula correctivos recientes, conviene seguimiento.";
  }

  return "Mantener control preventivo normal.";
}

function buildRiskScore(args: {
  equipo: EquipoRow;
  proximaRevision: Date | null;
  today: Date;
  correctivos180: number;
  mantenimientos180: number;
  costo180: number;
}) {
  let score = 0;
  const estado = String(args.equipo.estado ?? "").toLowerCase();

  if (estado === "fuera de servicio") score += 30;
  if (estado === "en mantenimiento") score += 15;

  if (args.proximaRevision) {
    const days = diffDays(args.proximaRevision, args.today);
    if (days < 0) score += 15;
    else if (days <= 30) score += 8;
  } else {
    score += 8;
  }

  score += Math.min(args.correctivos180 * 18, 36);
  score += Math.min(Math.max(args.mantenimientos180 - 2, 0) * 8, 24);

  if (args.costo180 >= 2500) score += 20;
  else if (args.costo180 >= 1200) score += 12;
  else if (args.costo180 >= 600) score += 6;

  return Math.min(score, 100);
}

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const since90 = new Date(today);
    since90.setDate(today.getDate() - 90);
    const since180 = new Date(today);
    since180.setDate(today.getDate() - 180);

    const [{ data: equiposData, error: equiposError }, { data: mantenimientosData, error: mantenimientosError }] =
      await Promise.all([
        supabase
          .from("equipamiento")
          .select("id,nombre,tipo,marca,modelo,ubicacion,estado,fecha_adquisicion,ultima_revision,proxima_revision,activo")
          .eq("activo", true),
        supabase
          .from("mantenimiento")
          .select("id,id_equipamiento,tipo_mantenimiento,fecha_mantenimiento,costo,estado,descripcion,tecnico_responsable,observaciones"),
      ]);

    if (equiposError) throw new Error(equiposError.message);
    if (mantenimientosError) throw new Error(mantenimientosError.message);

    const equipos = (equiposData ?? []) as EquipoRow[];
    const mantenimientos = (mantenimientosData ?? []) as MantenimientoRow[];

    const mantenimientosPorEquipo = new Map<string, MantenimientoRow[]>();
    mantenimientos.forEach((m) => {
      if (!m.id_equipamiento) return;
      const current = mantenimientosPorEquipo.get(m.id_equipamiento) ?? [];
      current.push(m);
      mantenimientosPorEquipo.set(m.id_equipamiento, current);
    });

    const estadoMap = new Map<string, EquipamientoMantenimientoBucket>();
    const tipoMap = new Map<string, EquipamientoMantenimientoBucket>();
    const ubicacionMap = new Map<string, EquipamientoMantenimientoBucket>();
    const monthlyMap = buildEmptyMonths();

    let operativos = 0;
    let enMantenimiento = 0;
    let fueraDeServicio = 0;
    let vencidos = 0;
    let proximos30 = 0;
    let sinFechaRevision = 0;
    let costoTotal = 0;
    let costo90 = 0;
    let preventivos90 = 0;
    let correctivos90 = 0;

    mantenimientos.forEach((m) => {
      const costo = numberValue(m.costo);
      costoTotal += costo;

      const fecha = dateOnly(m.fecha_mantenimiento);
      const tipo = String(m.tipo_mantenimiento ?? "").toLowerCase();

      if (fecha && fecha >= since90) {
        costo90 += costo;
        if (tipo.includes("correctivo")) correctivos90 += 1;
        if (tipo.includes("preventivo")) preventivos90 += 1;
      }

      if (fecha) {
        const key = monthKey(fecha);
        const current = monthlyMap.get(key);
        if (current) {
          current.costo += costo;
          current.mantenimientos += 1;
          if (tipo.includes("correctivo")) current.correctivos += 1;
          if (tipo.includes("preventivo")) current.preventivos += 1;
        }
      }
    });

    const ranking: EquipamientoMantenimientoRankingItem[] = equipos.map((equipo) => {
      const equipoMantenimientos = mantenimientosPorEquipo.get(equipo.id) ?? [];
      const totalMantenimientos = equipoMantenimientos.length;
      const costoEquipoTotal = equipoMantenimientos.reduce((acc, m) => acc + numberValue(m.costo), 0);
      const recientes180 = equipoMantenimientos.filter((m) => {
        const fecha = dateOnly(m.fecha_mantenimiento);
        return Boolean(fecha && fecha >= since180);
      });
      const correctivos180 = recientes180.filter((m) =>
        String(m.tipo_mantenimiento ?? "").toLowerCase().includes("correctivo"),
      ).length;
      const costoEquipo180 = recientes180.reduce((acc, m) => acc + numberValue(m.costo), 0);
      const proximaRevision = dateOnly(equipo.proxima_revision);
      const estado = normalizeLabel(equipo.estado, "Sin estado");

      if (estado.toLowerCase() === "operativo") operativos += 1;
      if (estado.toLowerCase() === "en mantenimiento") enMantenimiento += 1;
      if (estado.toLowerCase() === "fuera de servicio") fueraDeServicio += 1;

      if (!proximaRevision) {
        sinFechaRevision += 1;
      } else {
        const days = diffDays(proximaRevision, today);
        if (days < 0) vencidos += 1;
        if (days >= 0 && days <= 30) proximos30 += 1;
      }

      addBucket(estadoMap, estado);
      addBucket(tipoMap, normalizeLabel(equipo.tipo, "Sin tipo"));
      addBucket(ubicacionMap, normalizeLabel(equipo.ubicacion, "Sin ubicación"));

      const itemBase = {
        id_equipamiento: equipo.id,
        nombre: normalizeLabel(equipo.nombre, "Equipo sin nombre"),
        tipo: equipo.tipo,
        ubicacion: equipo.ubicacion,
        estado: equipo.estado,
        total_mantenimientos: totalMantenimientos,
        correctivos_180_dias: correctivos180,
        costo_total: Number(costoEquipoTotal.toFixed(2)),
        costo_180_dias: Number(costoEquipo180.toFixed(2)),
        ultima_revision: equipo.ultima_revision,
        proxima_revision: equipo.proxima_revision,
        score_reemplazo: 0,
        recomendacion: "",
      } satisfies EquipamientoMantenimientoRankingItem;

      const score = buildRiskScore({
        equipo,
        proximaRevision,
        today,
        correctivos180,
        mantenimientos180: recientes180.length,
        costo180: costoEquipo180,
      });

      return {
        ...itemBase,
        score_reemplazo: score,
        recomendacion: buildRecommendation(score, { ...itemBase, score_reemplazo: score }),
      };
    });

    const recomendaciones = ranking
      .filter((item) => item.score_reemplazo >= 55)
      .sort((a, b) => b.score_reemplazo - a.score_reemplazo)
      .slice(0, 8);


    const equiposById = new Map<string, EquipoRow>(equipos.map((equipo) => [equipo.id, equipo]));
    const mantenimientosRecientes: EquipamientoMantenimientoReciente[] = [...mantenimientos]
      .sort((a, b) =>
        String(b.fecha_mantenimiento ?? "").localeCompare(String(a.fecha_mantenimiento ?? "")),
      )
      .slice(0, 30)
      .map((mantenimiento) => {
        const equipo = mantenimiento.id_equipamiento
          ? equiposById.get(mantenimiento.id_equipamiento)
          : null;

        return {
          id: mantenimiento.id,
          id_equipamiento: mantenimiento.id_equipamiento,
          equipo_nombre: normalizeLabel(equipo?.nombre, "Equipo no identificado"),
          equipo_tipo: equipo?.tipo ?? null,
          equipo_ubicacion: equipo?.ubicacion ?? null,
          tipo_mantenimiento: mantenimiento.tipo_mantenimiento,
          fecha_mantenimiento: mantenimiento.fecha_mantenimiento,
          tecnico_responsable: mantenimiento.tecnico_responsable ?? null,
          costo: Number(numberValue(mantenimiento.costo).toFixed(2)),
          estado: mantenimiento.estado,
          descripcion: mantenimiento.descripcion ?? null,
          observaciones: mantenimiento.observaciones ?? null,
        };
      });

    const response: EquipamientoMantenimientoBiResponse = {
      generated_at: new Date().toISOString(),
      resumen: {
        total_equipos: equipos.length,
        operativos,
        en_mantenimiento: enMantenimiento,
        fuera_de_servicio: fueraDeServicio,
        vencidos,
        proximos_30_dias: proximos30,
        sin_fecha_revision: sinFechaRevision,
        mantenimientos_total: mantenimientos.length,
        costo_total_mantenimiento: Number(costoTotal.toFixed(2)),
        costo_ultimos_90_dias: Number(costo90.toFixed(2)),
        preventivos_90_dias: preventivos90,
        correctivos_90_dias: correctivos90,
        equipos_revisar_reemplazo: recomendaciones.length,
      },
      por_estado: Array.from(estadoMap.values()).sort((a, b) => b.total - a.total),
      por_tipo: Array.from(tipoMap.values()).sort((a, b) => b.total - a.total),
      por_ubicacion: Array.from(ubicacionMap.values()).sort((a, b) => b.total - a.total),
      costo_mensual: Array.from(monthlyMap.values()),
      top_costo: [...ranking].sort((a, b) => b.costo_total - a.costo_total).slice(0, 8),
      top_frecuencia: [...ranking]
        .sort((a, b) => b.total_mantenimientos - a.total_mantenimientos)
        .slice(0, 8),
      recomendaciones_reemplazo: recomendaciones,
      mantenimientos_recientes: mantenimientosRecientes,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error al obtener BI de mantenimiento de equipamiento:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener BI de mantenimiento de equipamiento",
      },
      { status: 500 },
    );
  }
}
