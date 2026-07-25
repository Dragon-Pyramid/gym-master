"use client";

import jsPDF from "jspdf";

import type {
  RagCoachChatActionResult,
  RagCoachChatIntent,
  RagCoachChatSource,
  RagCoachContextSnapshot,
} from "@/interfaces/ragCoachChat.interface";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import {
  translateCoreDayLabel,
  translateCoreFoodItem,
  translateCoreLevel,
  translateCoreMealTitle,
  translateCoreMuscleGroup,
  translateCoreObjective,
} from "@/utils/coreSeedI18n";
import { getResolvedGimnasioBranding } from "@/utils/gimnasioBrandingClient";

export type RagCoachPdfLocale = "es" | "en";

export interface RagCoachPdfSubject {
  name: string;
  dni?: string | null;
  email?: string | null;
}

export interface RagCoachPdfMessage {
  content: string;
  createdAt?: string;
  requestMessage?: string;
  actions?: RagCoachChatActionResult[];
  suggestedReplies?: string[];
  contextSummary?: string;
  contextHints?: string[];
  coachNotes?: string[];
  nextBestStep?: string;
  safetySummary?: string;
  qaSummary?: string;
  intent?: RagCoachChatIntent;
  missingParams?: string[];
  contextSnapshot?: RagCoachContextSnapshot;
  memoryHighlights?: string[];
  memoryTrace?: string[];
  contextConfidence?: "alta" | "media" | "baja";
}

interface DescargarRagCoachPdfParams {
  message: RagCoachPdfMessage;
  subject: RagCoachPdfSubject;
  generatedBy?: string | null;
  locale?: RagCoachPdfLocale;
}

type UnknownRecord = Record<string, unknown>;
type PdfState = {
  doc: jsPDF;
  y: number;
  locale: RagCoachPdfLocale;
  brandName: string;
  brandSubtitle: string;
  logoData: string | null;
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const PAGE_MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const CONTENT_BOTTOM = 278;
const LINE_HEIGHT = 5.2;

const COLORS = {
  navy: [15, 23, 42] as const,
  cyan: [2, 168, 225] as const,
  slate: [71, 85, 105] as const,
  lightSlate: [241, 245, 249] as const,
  border: [203, 213, 225] as const,
  green: [5, 150, 105] as const,
  amber: [180, 83, 9] as const,
  violet: [109, 40, 217] as const,
};

const tx = (locale: RagCoachPdfLocale, es: string, en: string) =>
  locale === "en" ? en : es;

function safeText(value: unknown, fallback = "-"): string {
  if (value === null || value === undefined || value === "") return fallback;

  return String(value)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim() || fallback;
}

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as UnknownRecord;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function numericValue(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDateTime(value: string | undefined, locale: RagCoachPdfLocale): string {
  const parsed = value ? new Date(value) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value: unknown, locale: RagCoachPdfLocale): string {
  if (!value) return "-";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return safeText(value);

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    dateStyle: "medium",
  }).format(parsed);
}

function formatMetric(value: unknown, suffix: string, locale: RagCoachPdfLocale): string {
  const number = numericValue(value);
  if (number === null) return "-";
  const prefix = number > 0 ? "+" : "";
  return `${prefix}${number.toLocaleString(locale === "en" ? "en-US" : "es-AR", { maximumFractionDigits: 2 })}${suffix}`;
}

function formatSimilarity(value?: number): string | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return `${Math.max(0, Math.min(100, Math.round(value * 100)))}%`;
}

function normalizeImageUrl(url: string): string {
  const value = url.trim();
  if (!value || value.startsWith("data:")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return `/api/image-proxy?url=${encodeURIComponent(value)}`;
  }
  return value;
}

async function loadImageAsDataUrl(
  url: string,
  maxWidth = 600,
  maxHeight = 600,
): Promise<string | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const context = canvas.getContext("2d");

        if (!context) {
          resolve(null);
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = normalizeImageUrl(url);
  });
}

function addContinuationHeader(state: PdfState): void {
  const { doc, brandName, locale } = state;
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, PAGE_WIDTH, 15, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(safeText(brandName), PAGE_MARGIN, 9.5);
  doc.setFont("helvetica", "normal");
  doc.text(tx(locale, "Informe RAG Coach", "RAG Coach report"), PAGE_WIDTH - PAGE_MARGIN, 9.5, {
    align: "right",
  });
  state.y = 23;
}

function addPage(state: PdfState): void {
  state.doc.addPage();
  addContinuationHeader(state);
}

function ensureSpace(state: PdfState, requiredHeight: number): void {
  if (state.y + requiredHeight <= CONTENT_BOTTOM) return;
  addPage(state);
}

function addWrappedText(
  state: PdfState,
  text: unknown,
  options: {
    x?: number;
    width?: number;
    fontSize?: number;
    lineHeight?: number;
    color?: readonly [number, number, number];
    fontStyle?: "normal" | "bold" | "italic";
    gapAfter?: number;
  } = {},
): void {
  const value = safeText(text, "");
  if (!value) return;

  const x = options.x ?? PAGE_MARGIN;
  const width = options.width ?? CONTENT_WIDTH;
  const fontSize = options.fontSize ?? 9.4;
  const lineHeight = options.lineHeight ?? LINE_HEIGHT;
  const lines = state.doc.splitTextToSize(value, width) as string[];
  const requiredHeight = Math.max(lineHeight, lines.length * lineHeight) + (options.gapAfter ?? 2);

  ensureSpace(state, requiredHeight);
  state.doc.setFont("helvetica", options.fontStyle ?? "normal");
  state.doc.setFontSize(fontSize);
  state.doc.setTextColor(...(options.color ?? COLORS.slate));
  state.doc.text(lines, x, state.y);
  state.y += requiredHeight;
}

function addSectionTitle(
  state: PdfState,
  title: string,
  color: readonly [number, number, number] = COLORS.cyan,
): void {
  ensureSpace(state, 13);
  state.doc.setFillColor(248, 250, 252);
  state.doc.setDrawColor(...COLORS.border);
  state.doc.roundedRect(PAGE_MARGIN, state.y - 4.2, CONTENT_WIDTH, 9, 2, 2, "FD");
  state.doc.setFillColor(...color);
  state.doc.roundedRect(PAGE_MARGIN, state.y - 4.2, 3, 9, 1, 1, "F");
  state.doc.setFont("helvetica", "bold");
  state.doc.setFontSize(10.5);
  state.doc.setTextColor(...COLORS.navy);
  state.doc.text(safeText(title), PAGE_MARGIN + 6, state.y + 1.5);
  state.y += 12;
}

function addLabelValue(state: PdfState, label: string, value: unknown): void {
  const safeValue = safeText(value);
  const labelWidth = 42;
  const lines = state.doc.splitTextToSize(safeValue, CONTENT_WIDTH - labelWidth - 4) as string[];
  const height = Math.max(7, lines.length * 4.7 + 2);
  ensureSpace(state, height);

  state.doc.setFont("helvetica", "bold");
  state.doc.setFontSize(8.3);
  state.doc.setTextColor(...COLORS.navy);
  state.doc.text(safeText(label), PAGE_MARGIN, state.y);

  state.doc.setFont("helvetica", "normal");
  state.doc.setTextColor(...COLORS.slate);
  state.doc.text(lines, PAGE_MARGIN + labelWidth, state.y);
  state.y += height;
}

function addBulletList(
  state: PdfState,
  values: unknown[] | undefined,
  emptyLabel?: string,
): void {
  const items = (values ?? []).map((value) => safeText(value, "")).filter(Boolean);
  if (items.length === 0) {
    if (emptyLabel) addWrappedText(state, emptyLabel, { fontStyle: "italic" });
    return;
  }

  for (const item of items) {
    const lines = state.doc.splitTextToSize(item, CONTENT_WIDTH - 7) as string[];
    const height = Math.max(5.2, lines.length * 5.2) + 1.5;
    ensureSpace(state, height);
    state.doc.setFont("helvetica", "bold");
    state.doc.setFontSize(9.2);
    state.doc.setTextColor(...COLORS.cyan);
    state.doc.text("•", PAGE_MARGIN + 1, state.y);
    state.doc.setFont("helvetica", "normal");
    state.doc.setTextColor(...COLORS.slate);
    state.doc.text(lines, PAGE_MARGIN + 7, state.y);
    state.y += height;
  }
}

function actionLabel(type: RagCoachChatActionResult["type"], locale: RagCoachPdfLocale): string {
  if (type === "routine_generated") return tx(locale, "Rutina generada", "Generated routine");
  if (type === "diet_generated") return tx(locale, "Dieta generada", "Generated diet");
  if (type === "evolution_analyzed") return tx(locale, "Evolución analizada", "Analyzed evolution");
  return tx(locale, "Orientación", "Guidance");
}

function intentLabel(intent: RagCoachChatIntent | undefined, locale: RagCoachPdfLocale): string {
  if (intent === "routine_request") return tx(locale, "Solicitud de rutina", "Routine request");
  if (intent === "diet_request") return tx(locale, "Solicitud de dieta", "Diet request");
  if (intent === "routine_and_diet_request") return tx(locale, "Solicitud de rutina y dieta", "Routine and diet request");
  if (intent === "evolution_analysis_request") return tx(locale, "Análisis de evolución", "Evolution analysis");
  if (intent === "general_guidance") return tx(locale, "Orientación general", "General guidance");
  if (intent === "unknown") return tx(locale, "Intención pendiente", "Pending intent");
  return "-";
}

function confidenceLabel(value: RagCoachPdfMessage["contextConfidence"], locale: RagCoachPdfLocale): string {
  if (value === "alta") return tx(locale, "Alta", "High");
  if (value === "media") return tx(locale, "Media", "Medium");
  if (value === "baja") return tx(locale, "Baja", "Low");
  return tx(locale, "No informada", "Not reported");
}

function addContextSnapshot(state: PdfState, snapshot: RagCoachContextSnapshot): void {
  addSectionTitle(state, tx(state.locale, "Contexto operativo aplicado", "Applied operational context"), COLORS.green);
  addLabelValue(state, tx(state.locale, "Socio", "Member"), snapshot.socioName || "-");
  addLabelValue(state, tx(state.locale, "Objetivo", "Goal"), translateCoreObjective(snapshot.objetivoLabel, state.locale));
  addLabelValue(state, tx(state.locale, "Nivel", "Level"), translateCoreLevel(snapshot.nivelLabel, state.locale));
  addLabelValue(state, tx(state.locale, "Días por semana", "Days per week"), snapshot.diasPorSemana ?? "-");
  addLabelValue(state, tx(state.locale, "Rutinas / Dietas / Evolución", "Routines / Diets / Evolution"), `${snapshot.rutinasTotal} / ${snapshot.dietasTotal} / ${snapshot.evolucionTotal}`);
  addLabelValue(state, tx(state.locale, "Asistencia 7 / 30 días", "7 / 30 day attendance"), `${snapshot.asistencia7Dias} / ${snapshot.asistencia30Dias}`);
  addLabelValue(state, tx(state.locale, "Ficha médica", "Medical record"), snapshot.fichaMedicaExiste ? tx(state.locale, "Disponible", "Available") : tx(state.locale, "No disponible", "Not available"));
  addLabelValue(state, tx(state.locale, "Restricciones médicas", "Medical restrictions"), snapshot.restriccionesMedicas);
  addLabelValue(state, tx(state.locale, "Preparación contextual", "Context readiness"), `${snapshot.readinessScore}% · ${safeText(snapshot.readinessLabel)}`);
}

function sourceLine(source: RagCoachChatSource, locale: RagCoachPdfLocale): string {
  const metadata = [source.domain, source.sourceTable].filter(Boolean).join(" · ");
  const similarity = formatSimilarity(source.similarity);
  return [
    safeText(source.title),
    metadata || null,
    similarity ? `${tx(locale, "similitud", "similarity")} ${similarity}` : null,
  ].filter(Boolean).join(" · ");
}

function addSources(state: PdfState, sources: RagCoachChatSource[] | undefined): void {
  if (!sources?.length) return;

  addSectionTitle(state, tx(state.locale, "Fuentes RAG recuperadas", "Retrieved RAG sources"), COLORS.violet);
  for (const source of sources) {
    addWrappedText(state, sourceLine(source, state.locale), {
      fontStyle: "bold",
      color: COLORS.navy,
      gapAfter: 1,
    });
    if (source.contentPreview) {
      addWrappedText(state, source.contentPreview, {
        x: PAGE_MARGIN + 4,
        width: CONTENT_WIDTH - 4,
        fontSize: 8.4,
        lineHeight: 4.6,
        gapAfter: 3,
      });
    }
  }
}

function getRoutineDays(payload: UnknownRecord): Array<{ day: string; exercises: unknown[] }> {
  const generated = asRecord(payload.rutinaGenerada) ?? payload;
  const structured = parseMaybeJson(generated.rutina_desc ?? generated.contenido ?? generated);
  const record = asRecord(structured);
  if (!record) return [];

  if (Array.isArray(record.dias)) {
    return record.dias.map((dayData, index) => {
      const dayRecord = asRecord(dayData);
      const exercises = Array.isArray(dayRecord?.ejercicios)
        ? dayRecord.ejercicios
        : Array.isArray(dayRecord?.items)
          ? dayRecord.items
          : Array.isArray(dayData)
            ? dayData
            : [];
      return {
        day: safeText(dayRecord?.dia ?? dayRecord?.nombre_dia ?? dayRecord?.dia_semana ?? `${index + 1}`),
        exercises,
      };
    });
  }

  const week = asRecord(record.semana);
  if (week) {
    return Object.entries(week).map(([day, value]) => {
      const dayRecord = asRecord(value);
      const exercises = Array.isArray(value)
        ? value
        : Array.isArray(dayRecord?.ejercicios)
          ? dayRecord.ejercicios
          : Array.isArray(dayRecord?.items)
            ? dayRecord.items
            : [];
      return { day, exercises };
    });
  }

  const knownDays = ["lunes", "martes", "miercoles", "miércoles", "jueves", "viernes", "sabado", "sábado", "domingo"];
  return knownDays
    .filter((day) => Array.isArray(record[day]))
    .map((day) => ({ day, exercises: record[day] as unknown[] }));
}

function routineExerciseLine(value: unknown, locale: RagCoachPdfLocale): string {
  const exercise = asRecord(value);
  if (!exercise) return safeText(value);

  const name = safeText(exercise.nombre ?? exercise.ejercicio ?? exercise.nombre_ejercicio, tx(locale, "Ejercicio", "Exercise"));
  const group = safeText(exercise.grupo_muscular ?? exercise.grupo_nombre ?? exercise.grupo, "");
  const series = safeText(exercise.series ?? exercise.sets, "");
  const reps = safeText(exercise.reps ?? exercise.repeticiones, "");
  const restValue = exercise.descanso_seg ?? exercise.descanso;
  const rest = restValue === undefined || restValue === null || restValue === ""
    ? ""
    : `${safeText(restValue)}${exercise.descanso_seg !== undefined ? "s" : ""}`;

  return [
    name,
    group ? translateCoreMuscleGroup(group, locale) : null,
    series ? `${tx(locale, "series", "sets")}: ${series}` : null,
    reps ? `${tx(locale, "repeticiones", "repetitions")}: ${reps}` : null,
    rest ? `${tx(locale, "descanso", "rest")}: ${rest}` : null,
  ].filter(Boolean).join(" · ");
}

function addRoutinePayload(state: PdfState, payload: UnknownRecord): void {
  addLabelValue(state, tx(state.locale, "Objetivo", "Goal"), safeText(payload.objetivo));
  addLabelValue(state, tx(state.locale, "Nivel", "Level"), safeText(payload.nivel));
  addLabelValue(state, tx(state.locale, "Días", "Days"), safeText(payload.dias));
  if (payload.restricciones) {
    addLabelValue(state, tx(state.locale, "Restricciones", "Restrictions"), payload.restricciones);
  }

  const days = getRoutineDays(payload);
  if (!days.length) return;

  for (const day of days) {
    addWrappedText(state, translateCoreDayLabel(day.day, state.locale), {
      fontStyle: "bold",
      color: COLORS.navy,
      gapAfter: 2,
    });
    addBulletList(state, day.exercises.map((exercise) => routineExerciseLine(exercise, state.locale)));
    state.y += 2;
  }
}

function getDietBlocks(value: unknown): Array<{ title: string; items: string[] }> {
  const parsed = parseMaybeJson(value);

  if (Array.isArray(parsed)) {
    return parsed.map((entry, index) => {
      const record = asRecord(entry);
      const items = Array.isArray(record?.items)
        ? record.items.map((item) => safeText(item))
        : [safeText(record?.descripcion ?? record?.detalle ?? entry)];
      return {
        title: safeText(record?.title ?? record?.comida ?? `${index + 1}`),
        items,
      };
    });
  }

  const record = asRecord(parsed);
  if (!record) return typeof parsed === "string" ? [{ title: "", items: [safeText(parsed)] }] : [];

  return Object.entries(record).map(([title, rawItems]) => {
    const nested = asRecord(rawItems);
    const items = Array.isArray(rawItems)
      ? rawItems.map((item) => safeText(item))
      : Array.isArray(nested?.items)
        ? (nested.items as unknown[]).map((item) => safeText(item))
        : [safeText(nested?.descripcion ?? nested?.detalle ?? rawItems)];
    return { title, items };
  });
}

function addDietPayload(state: PdfState, payload: UnknownRecord): void {
  const generated = asRecord(payload.dietaGenerada);
  addLabelValue(state, tx(state.locale, "Objetivo", "Goal"), generated?.objetivo ?? payload.objetivo);
  addLabelValue(state, tx(state.locale, "Inicio", "Start"), formatDate(generated?.fecha_inicio ?? payload.fecha_inicio, state.locale));
  addLabelValue(state, tx(state.locale, "Fin", "End"), formatDate(generated?.fecha_fin ?? payload.fecha_fin, state.locale));
  if (generated?.nombre_plan) {
    addLabelValue(state, tx(state.locale, "Plan", "Plan"), generated.nombre_plan);
  }

  const blocks = getDietBlocks(generated?.observaciones);
  for (const block of blocks) {
    if (block.title) {
      addWrappedText(state, translateCoreMealTitle(block.title, state.locale), {
        fontStyle: "bold",
        color: COLORS.navy,
        gapAfter: 2,
      });
    }
    addBulletList(state, block.items.map((item) => translateCoreFoodItem(item, state.locale)));
    state.y += 2;
  }
}

function addEvolutionPayload(state: PdfState, payload: UnknownRecord): void {
  const progress = asRecord(payload.progreso);
  if (payload.resumen) addWrappedText(state, payload.resumen, { gapAfter: 4 });

  if (progress) {
    addLabelValue(state, tx(state.locale, "Registros analizados", "Records analyzed"), progress.totalRegistros ?? "-");
    addLabelValue(state, tx(state.locale, "Período", "Period"), `${formatDate(progress.fechaInicial, state.locale)} - ${formatDate(progress.fechaActual, state.locale)}`);
    addLabelValue(state, tx(state.locale, "Tendencia principal", "Main trend"), progress.tendenciaPrincipal ?? "-");

    const metrics: Array<[string, unknown, string]> = [
      [tx(state.locale, "Peso", "Weight"), asRecord(progress.peso)?.diferencia, " kg"],
      [tx(state.locale, "Cintura", "Waist"), asRecord(progress.cintura)?.diferencia, " cm"],
      ["IMC", asRecord(progress.imc)?.diferencia, ""],
      [tx(state.locale, "% grasa", "Fat %"), asRecord(progress.porcentajeGrasa)?.diferencia, "%"],
      [tx(state.locale, "Masa muscular", "Muscle mass"), asRecord(progress.masaMuscular)?.diferencia, " kg"],
    ];

    for (const [label, value, suffix] of metrics) {
      addLabelValue(state, label, formatMetric(value, suffix, state.locale));
    }
  }

  const recommendations = Array.isArray(payload.recomendaciones) ? payload.recomendaciones : [];
  if (recommendations.length) {
    addWrappedText(state, tx(state.locale, "Recomendaciones", "Recommendations"), {
      fontStyle: "bold",
      color: COLORS.navy,
      gapAfter: 2,
    });
    addBulletList(state, recommendations);
  }

  const alerts = Array.isArray(payload.alertas) ? payload.alertas : [];
  if (alerts.length) {
    addWrappedText(state, tx(state.locale, "Alertas y cuidados", "Alerts and precautions"), {
      fontStyle: "bold",
      color: COLORS.amber,
      gapAfter: 2,
    });
    addBulletList(state, alerts);
  }

  const disclaimers = Array.isArray(payload.disclaimers) ? payload.disclaimers : [];
  if (disclaimers.length) {
    addWrappedText(state, tx(state.locale, "Disclaimers", "Disclaimers"), {
      fontStyle: "bold",
      color: COLORS.violet,
      gapAfter: 2,
    });
    addBulletList(state, disclaimers);
  }
}

function addAction(state: PdfState, action: RagCoachChatActionResult, index: number): void {
  addSectionTitle(
    state,
    `${index + 1}. ${actionLabel(action.type, state.locale)} · ${safeText(action.title)}`,
    action.ok ? COLORS.green : COLORS.amber,
  );
  addLabelValue(state, tx(state.locale, "Estado", "Status"), action.ok ? "OK" : tx(state.locale, "Revisar", "Review"));
  addWrappedText(state, action.message, { gapAfter: 4 });

  if (action.ragSummary) {
    addLabelValue(state, tx(state.locale, "Resumen RAG", "RAG summary"), action.ragSummary);
  }

  const payload = asRecord(action.payload);
  if (payload && action.type === "routine_generated") addRoutinePayload(state, payload);
  if (payload && action.type === "diet_generated") addDietPayload(state, payload);
  if (payload && action.type === "evolution_analyzed") addEvolutionPayload(state, payload);

  if (action.qualityAudit) {
    addWrappedText(
      state,
      `${tx(state.locale, "QA de calidad", "Quality QA")}: ${action.qualityAudit.score}% · ${action.qualityAudit.statusLabel}`,
      { fontStyle: "bold", color: COLORS.green, gapAfter: 1 },
    );
    addWrappedText(state, action.qualityAudit.summary, { fontSize: 8.7, gapAfter: 2 });
    addBulletList(
      state,
      action.qualityAudit.checks.map((check) => `${check.status.toUpperCase()} · ${check.label}: ${check.detail}`),
    );
  }

  if (action.safetyNotes?.length) {
    addWrappedText(state, tx(state.locale, "Seguridad aplicada", "Applied safety"), {
      fontStyle: "bold",
      color: COLORS.amber,
      gapAfter: 2,
    });
    addBulletList(state, action.safetyNotes);
  }

  if (action.warnings?.length) {
    addWrappedText(state, tx(state.locale, "Observaciones", "Notes"), {
      fontStyle: "bold",
      color: COLORS.navy,
      gapAfter: 2,
    });
    addBulletList(state, action.warnings);
  }

  addSources(state, action.sources);
}

function addFooter(state: PdfState): void {
  const totalPages = state.doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    state.doc.setPage(page);
    state.doc.setDrawColor(...COLORS.border);
    state.doc.line(PAGE_MARGIN, 282, PAGE_WIDTH - PAGE_MARGIN, 282);
    state.doc.setFont("helvetica", "normal");
    state.doc.setFontSize(7.5);
    state.doc.setTextColor(100, 116, 139);
    state.doc.text(safeText(state.brandName), PAGE_MARGIN, 288);
    state.doc.text(
      `${tx(state.locale, "Página", "Page")} ${page} ${tx(state.locale, "de", "of")} ${totalPages}`,
      PAGE_WIDTH - PAGE_MARGIN,
      288,
      { align: "right" },
    );
  }
}

function addLegalSection(state: PdfState, values: Array<string | null | undefined>): void {
  const legal = values.map((value) => safeText(value, "")).filter(Boolean);
  if (!legal.length) return;
  addSectionTitle(state, tx(state.locale, "Información institucional", "Institutional information"));
  for (const value of legal) addWrappedText(state, value, { fontSize: 8.3, lineHeight: 4.6 });
}

export async function descargarRagCoachPdf({
  message,
  subject,
  generatedBy,
  locale = "es",
}: DescargarRagCoachPdfParams): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error(tx(locale, "La exportación PDF solo está disponible en el navegador.", "PDF export is only available in the browser."));
  }

  const branding = await getResolvedGimnasioBranding();
  const logoData = await loadImageAsDataUrl(branding.logoUrl || "/gm_logo.svg", 500, 500);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const state: PdfState = {
    doc,
    y: 0,
    locale,
    brandName: branding.nombre,
    brandSubtitle: branding.subtitulo,
    logoData,
  };

  doc.setProperties({
    title: tx(locale, "Informe RAG Coach", "RAG Coach report"),
    subject: safeText(subject.name),
    author: safeText(branding.nombre),
    creator: "Gym Master",
    keywords: "Gym Master, RAG Coach, IA, rutina, dieta, evolución",
  });

  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, PAGE_WIDTH, 44, "F");

  if (logoData) doc.addImage(logoData, "PNG", PAGE_MARGIN, 7, 25, 25);

  const titleX = logoData ? 44 : PAGE_MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16.5);
  doc.setTextColor(255, 255, 255);
  doc.text(safeText(branding.nombre), titleX, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(doc.splitTextToSize(safeText(branding.subtitulo), 145), titleX, 21);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(tx(locale, "Informe del RAG Coach", "RAG Coach report"), titleX, 35);

  state.y = 53;
  addLabelValue(state, tx(locale, "Socio", "Member"), subject.name);
  if (subject.dni) addLabelValue(state, tx(locale, "DNI", "ID"), subject.dni);
  if (subject.email) addLabelValue(state, tx(locale, "Email", "Email"), subject.email);
  addLabelValue(state, tx(locale, "Fecha de emisión", "Issue date"), formatDateTime(message.createdAt, locale));
  if (generatedBy) addLabelValue(state, tx(locale, "Emitido por", "Issued by"), generatedBy);
  addLabelValue(state, tx(locale, "Intención", "Intent"), intentLabel(message.intent, locale));
  addLabelValue(state, tx(locale, "Confianza contextual", "Context confidence"), confidenceLabel(message.contextConfidence, locale));

  if (message.requestMessage) {
    addSectionTitle(state, tx(locale, "Consulta", "Request"));
    addWrappedText(state, message.requestMessage, { fontStyle: "italic", color: COLORS.navy, gapAfter: 4 });
  }

  addSectionTitle(state, tx(locale, "Respuesta del Coach IA", "AI Coach response"), COLORS.cyan);
  addWrappedText(state, message.content, { color: COLORS.navy, fontSize: 9.8, lineHeight: 5.5, gapAfter: 4 });

  if (message.contextSummary) {
    addSectionTitle(state, tx(locale, "Contexto aplicado", "Applied context"), COLORS.green);
    addWrappedText(state, message.contextSummary);
  }

  if (message.contextSnapshot) addContextSnapshot(state, message.contextSnapshot);

  if (message.actions?.length) {
    addSectionTitle(state, tx(locale, "Resultados y acciones", "Results and actions"), COLORS.green);
    message.actions.forEach((action, index) => addAction(state, action, index));
  }

  if (message.safetySummary) {
    addSectionTitle(state, tx(locale, "Resumen de seguridad", "Safety summary"), COLORS.amber);
    addWrappedText(state, message.safetySummary);
  }

  if (message.qaSummary) {
    addSectionTitle(state, tx(locale, "QA IA / RAG", "AI / RAG QA"), COLORS.green);
    addWrappedText(state, message.qaSummary);
  }

  if (message.coachNotes?.length) {
    addSectionTitle(state, tx(locale, "Notas del Coach", "Coach notes"));
    addBulletList(state, message.coachNotes);
  }

  if (message.contextHints?.length) {
    addSectionTitle(state, tx(locale, "Pistas del contexto", "Context hints"));
    addBulletList(state, message.contextHints);
  }

  if (message.memoryHighlights?.length) {
    addSectionTitle(state, tx(locale, "Memoria recordada", "Remembered context"), COLORS.violet);
    addBulletList(state, message.memoryHighlights);
  }

  if (message.memoryTrace?.length) {
    addSectionTitle(state, tx(locale, "Trazabilidad contextual", "Context trace"), COLORS.violet);
    addBulletList(state, message.memoryTrace);
  }

  if (message.missingParams?.length) {
    addSectionTitle(state, tx(locale, "Datos pendientes", "Missing data"), COLORS.amber);
    addBulletList(state, message.missingParams);
  }

  if (message.nextBestStep) {
    addSectionTitle(state, tx(locale, "Próximo paso", "Next step"), COLORS.violet);
    addWrappedText(state, message.nextBestStep, { fontStyle: "bold", color: COLORS.navy });
  }

  if (message.suggestedReplies?.length) {
    addSectionTitle(state, tx(locale, "Sugerencias para continuar", "Suggestions to continue"));
    addBulletList(state, message.suggestedReplies);
  }

  addSectionTitle(state, tx(locale, "Aviso responsable", "Responsible notice"), COLORS.amber);
  addWrappedText(
    state,
    tx(
      locale,
      "Este informe organiza contenido generado por el RAG Coach de Gym Master. No reemplaza evaluación médica, nutricional ni profesional. Ante lesiones, síntomas, condiciones clínicas o dudas relevantes, consultá al profesional responsable.",
      "This report organizes content generated by the Gym Master RAG Coach. It does not replace medical, nutritional, or professional evaluation. For injuries, symptoms, clinical conditions, or relevant concerns, consult the responsible professional.",
    ),
    { fontSize: 8.5, lineHeight: 4.7 },
  );

  addLegalSection(state, [branding.textoLegalReportes, branding.piePagina]);
  addFooter(state);

  const subjectFileName = safeText(subject.name, tx(locale, "socio", "member"));
  doc.save(buildTimestampedDownloadFileName(`${tx(locale, "informe-rag-coach", "rag-coach-report")}-${subjectFileName}`, "pdf"));
}
