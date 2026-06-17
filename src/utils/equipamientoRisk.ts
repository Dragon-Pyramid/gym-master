import { Equipamento } from "@/interfaces/equipamiento.interface";
import { EquipamientoMantenimientoRankingItem } from "@/interfaces/equipamientoMantenimientoBi.interface";

export type EquipamientoRiskLevel = "bajo" | "medio" | "alto" | "critico";

export interface EquipamientoRiskAssessment {
  id: string;
  nombre: string;
  tipo?: string | null;
  ubicacion?: string | null;
  estado?: string | null;
  score: number;
  nivel: EquipamientoRiskLevel;
  diasParaRevision: number | null;
  mensaje: string;
  acciones: string[];
  factores: string[];
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getDaysUntil(value?: string | null) {
  const date = parseDate(value);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getRiskLevel(score: number): EquipamientoRiskLevel {
  if (score >= 75) return "critico";
  if (score >= 50) return "alto";
  if (score >= 25) return "medio";
  return "bajo";
}

function clampScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function buildMessage(nivel: EquipamientoRiskLevel) {
  if (nivel === "critico") return "Intervención prioritaria: el equipo puede afectar operación, seguridad o costos.";
  if (nivel === "alto") return "Planificar revisión técnica: hay señales de mantenimiento o reemplazo.";
  if (nivel === "medio") return "Mantener seguimiento preventivo y revisar en la próxima ronda técnica.";
  return "Equipo sin señales críticas con los datos disponibles.";
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function calculateEquipamientoRisk(
  equipo: Equipamento,
  rankingItem?: Partial<EquipamientoMantenimientoRankingItem> | null,
): EquipamientoRiskAssessment {
  let score = 0;
  const factores: string[] = [];
  const acciones: string[] = [];
  const estado = String(equipo.estado ?? "").toLowerCase();
  const diasParaRevision = getDaysUntil(equipo.proxima_revision);

  if (estado === "fuera de servicio") {
    score += 35;
    factores.push("fuera de servicio");
    acciones.push("Priorizar diagnóstico y decisión de reparación o baja temporal.");
  } else if (estado === "en mantenimiento") {
    score += 20;
    factores.push("en mantenimiento");
    acciones.push("Hacer seguimiento de cierre para reducir tiempo fuera de operación.");
  }

  if (diasParaRevision === null) {
    score += 15;
    factores.push("sin próxima revisión");
    acciones.push("Definir una próxima revisión preventiva.");
  } else if (diasParaRevision < 0) {
    score += 35;
    factores.push("revisión vencida");
    acciones.push("Crear o programar orden preventiva vencida.");
  } else if (diasParaRevision <= 5) {
    score += 25;
    factores.push("revisión urgente");
    acciones.push("Confirmar técnico, repuestos y fecha de intervención.");
  } else if (diasParaRevision <= 30) {
    score += 10;
    factores.push("revisión próxima");
    acciones.push("Incluir en planificación mensual de mantenimiento.");
  }

  if (rankingItem) {
    const scoreReemplazo = Number(rankingItem.score_reemplazo ?? 0);
    const correctivos = Number(rankingItem.correctivos_180_dias ?? 0);
    const costo180 = Number(rankingItem.costo_180_dias ?? 0);

    if (scoreReemplazo > 0) {
      score += Math.min(25, Math.round(scoreReemplazo / 4));
      factores.push("score de reemplazo");
      acciones.push("Evaluar si conviene reparar, renovar o vender usado.");
    }

    if (correctivos >= 3) {
      score += Math.min(20, correctivos * 4);
      factores.push("fallas repetidas");
      acciones.push("Revisar causa raíz y plan preventivo específico por equipo.");
    }

    if (costo180 > 0) {
      score += Math.min(15, Math.ceil(costo180 / 50000));
      factores.push("costo reciente");
      acciones.push("Comparar costo acumulado contra valor estimado de reemplazo.");
    }
  }

  const finalScore = clampScore(score);
  const nivel = getRiskLevel(finalScore);

  return {
    id: equipo.id,
    nombre: equipo.nombre,
    tipo: String(equipo.tipo ?? "") || null,
    ubicacion: equipo.ubicacion,
    estado: equipo.estado,
    score: finalScore,
    nivel,
    diasParaRevision,
    mensaje: buildMessage(nivel),
    acciones: unique(acciones).slice(0, 3),
    factores: unique(factores).slice(0, 4),
  };
}

export function buildEquipamientoRiskRadar(
  equipos: Equipamento[],
  recomendaciones: EquipamientoMantenimientoRankingItem[] = [],
) {
  const recomendacionesPorEquipo = new Map(
    recomendaciones.map((item) => [item.id_equipamiento, item] as const),
  );

  return equipos
    .map((equipo) => calculateEquipamientoRisk(equipo, recomendacionesPorEquipo.get(equipo.id)))
    .sort((a, b) => b.score - a.score || a.nombre.localeCompare(b.nombre));
}

export const equipamientoRiskTone: Record<EquipamientoRiskLevel, string> = {
  critico: "bg-red-100 text-red-700 border-red-200",
  alto: "bg-amber-100 text-amber-700 border-amber-200",
  medio: "bg-blue-100 text-blue-700 border-blue-200",
  bajo: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
