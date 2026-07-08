"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Dumbbell,
  Loader2,
  MapPin,
  MessageSquare,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type {
  ActividadTurno,
  ActividadTurnoInscripcion,
  ActividadTurnosCuposDashboard,
} from "@/interfaces/actividadTurnosCupos.interface";
import { fetchActividadesTurnosCuposDashboard } from "@/services/actividadTurnosCuposService";
import { formatFrontendDate } from "@/utils/dateFormat";
import { useI18n } from "@/i18n/I18nProvider";

function getDiaSemanaLabel(day: number | undefined | null, t: (key: string) => string) {
  const normalized = Number(day ?? 0);
  if (normalized >= 1 && normalized <= 7) {
    return t(`socioDashboard.activities.day${normalized}`);
  }
  return t("socioDashboard.activities.agenda");
}

function getTodayDiaSemana() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function normalizeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isTurnoInDateRange(turno: ActividadTurno) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = normalizeDate(turno.fecha_inicio);
  const endDate = normalizeDate(turno.fecha_fin);

  if (endDate && endDate < today) return false;
  if (startDate && startDate > today) return true;

  return true;
}

function daysUntilTurno(diaSemana?: number | null) {
  const today = getTodayDiaSemana();
  const target = Number(diaSemana ?? today);
  const diff = target - today;
  return diff >= 0 ? diff : diff + 7;
}

function formatTime(value?: string | null) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}

function formatTimeRange(turno: ActividadTurno) {
  return `${formatTime(turno.hora_inicio)} - ${formatTime(turno.hora_fin)}`;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  try {
    return formatFrontendDate(value);
  } catch {
    return value;
  }
}

function cupoLabel(turno: ActividadTurno, t: (key: string, params?: Record<string, string | number | boolean | null | undefined>) => string) {
  const disponibles = Number(turno.cupos_disponibles ?? 0);
  const maximo = Number(turno.cupo_maximo ?? 0);

  if (!maximo) return t("socioDashboard.activities.capacityToConfirm");
  if (disponibles <= 0) return t("socioDashboard.activities.noCapacity");
  if (disponibles === 1) return t("socioDashboard.activities.oneSlot");
  return t("socioDashboard.activities.slots", { count: disponibles });
}

function inscripcionEstadoLabel(
  estado: ActividadTurnoInscripcion["estado"] | null | undefined,
  t: (key: string) => string,
) {
  if (estado === "lista_espera") return t("socioDashboard.activities.waitlist");
  if (estado === "inscripto") return t("socioDashboard.activities.enrolled");
  if (estado === "asistio") return t("socioDashboard.activities.attended");
  if (estado === "ausente") return t("socioDashboard.activities.absent");
  if (estado === "cancelado") return t("socioDashboard.activities.cancelled");
  return t("socioDashboard.activities.noStatus");
}

function inscripcionEstadoClass(
  estado?: ActividadTurnoInscripcion["estado"] | null,
) {
  if (estado === "lista_espera")
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-100";
  if (estado === "inscripto" || estado === "asistio")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200";
  if (estado === "cancelado" || estado === "ausente")
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200";
  return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200";
}

function sortByNextOccurrence(a: ActividadTurno, b: ActividadTurno) {
  const diffA = daysUntilTurno(a.dia_semana);
  const diffB = daysUntilTurno(b.dia_semana);
  if (diffA !== diffB) return diffA - diffB;
  return String(a.hora_inicio ?? "").localeCompare(String(b.hora_inicio ?? ""));
}

function dayBadge(turno: ActividadTurno, t: (key: string) => string) {
  const diff = daysUntilTurno(turno.dia_semana);
  if (diff === 0) return t("socioDashboard.activities.today");
  if (diff === 1) return t("socioDashboard.activities.tomorrow");
  return getDiaSemanaLabel(turno.dia_semana, t);
}

function titleCaseLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (match) => match.toUpperCase())
    .trim();
}

function localizeActivityName(value: string | null | undefined, locale: string) {
  if (!value) return value;
  if (locale !== 'en') return value;

  const trimmed = value.trim();
  const normalized = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized === 'funcional tarde' || normalized === 'functional tarde') {
    return 'Functional afternoon';
  }

  if (normalized === 'funcional manana' || normalized === 'functional manana') {
    return 'Functional morning';
  }

  if (normalized === 'funcional noche' || normalized === 'functional noche') {
    return 'Functional evening';
  }

  if (/^(.+)\s+inicial$/i.test(trimmed)) {
    return trimmed.replace(/^(.+)\s+inicial$/i, (_match, base) => `Beginner ${titleCaseLabel(String(base))}`);
  }

  if (/^(.+)\s+intermedio$/i.test(trimmed)) {
    return trimmed.replace(/^(.+)\s+intermedio$/i, (_match, base) => `Intermediate ${titleCaseLabel(String(base))}`);
  }

  if (/^(.+)\s+avanzado$/i.test(trimmed)) {
    return trimmed.replace(/^(.+)\s+avanzado$/i, (_match, base) => `Advanced ${titleCaseLabel(String(base))}`);
  }

  return value
    .replace(/\btarde\b/gi, 'afternoon')
    .replace(/\bmañana\b/gi, 'morning')
    .replace(/\bmanana\b/gi, 'morning')
    .replace(/\bnoche\b/gi, 'evening');
}

export default function SocioMobileActividadesAgendaCard() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [dashboard, setDashboard] =
    useState<ActividadTurnosCuposDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAgenda = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchActividadesTurnosCuposDashboard();
        if (cancelled) return;
        setDashboard(response);
      } catch (err) {
        if (cancelled) return;
        setDashboard(null);
        setError(
          err instanceof Error
            ? err.message
            : t("socioDashboard.activities.fetchError"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAgenda();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const turnosActivos = useMemo(() => {
    const turnos = dashboard?.turnos ?? [];
    return turnos
      .filter((turno) => turno.estado === "activo")
      .filter(isTurnoInDateRange)
      .sort(sortByNextOccurrence);
  }, [dashboard?.turnos]);

  const turnosHoy = useMemo(() => {
    const today = getTodayDiaSemana();
    return turnosActivos.filter((turno) => turno.dia_semana === today);
  }, [turnosActivos]);

  const proximosTurnos = turnosActivos.slice(0, 3);
  const hasTurnos = proximosTurnos.length > 0;
  const availableSlots = turnosActivos.reduce(
    (total, turno) => total + Math.max(0, Number(turno.cupos_disponibles ?? 0)),
    0,
  );

  const turnoById = useMemo(() => {
    return new Map(turnosActivos.map((turno) => [turno.id, turno]));
  }, [turnosActivos]);

  const activeInscripciones = useMemo(() => {
    return (dashboard?.inscripciones ?? []).filter(
      (inscripcion) => inscripcion.estado !== "cancelado",
    );
  }, [dashboard?.inscripciones]);

  const visibleActiveInscripciones = activeInscripciones.slice(0, 3);

  const inscripcionByTurno = useMemo(() => {
    return new Map(
      activeInscripciones.map((inscripcion) => [
        inscripcion.turno_id,
        inscripcion,
      ]),
    );
  }, [activeInscripciones]);

  const pendingInscripciones = activeInscripciones.filter(
    (inscripcion) => inscripcion.estado === "lista_espera",
  ).length;
  const approvedInscripciones = activeInscripciones.filter(
    (inscripcion) =>
      inscripcion.estado === "inscripto" || inscripcion.estado === "asistio",
  ).length;

  const statusLabel = loading
    ? t("socioDashboard.activities.loading")
    : error
      ? t("socioDashboard.activities.unavailable")
      : hasTurnos
        ? approvedInscripciones > 0
          ? t(
              approvedInscripciones === 1
                ? "socioDashboard.activities.approvedCount"
                : "socioDashboard.activities.approvedCountPlural",
              { count: approvedInscripciones },
            )
          : pendingInscripciones > 0
            ? t(
                pendingInscripciones === 1
                  ? "socioDashboard.activities.pendingCount"
                  : "socioDashboard.activities.pendingCountPlural",
                { count: pendingInscripciones },
              )
            : turnosHoy.length > 0
              ? t(
                  turnosHoy.length === 1
                    ? "socioDashboard.activities.todayCount"
                    : "socioDashboard.activities.todayCountPlural",
                  { count: turnosHoy.length },
                )
              : t("socioDashboard.activities.nextAvailable")
        : t("socioDashboard.activities.empty");

  const statusDescription = loading
    ? t("socioDashboard.activities.loadingDescription")
    : error
      ? t("socioDashboard.activities.errorDescription")
      : hasTurnos
        ? activeInscripciones.length > 0
          ? t("socioDashboard.activities.enrolledDescription")
          : t("socioDashboard.activities.availableDescription")
        : t("socioDashboard.activities.emptyDescription");

  const handleVerActividades = () => {
    router.push("/dashboard/actividades");
  };

  const handleContactarAdministracion = () => {
    router.push("/dashboard/mensajes");
  };

  return (
    <Card className="overflow-hidden border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-cyan-50 p-4 shadow-sm dark:border-indigo-900/60 dark:from-slate-950 dark:via-indigo-950/20 dark:to-cyan-950/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-300">
            {t("socioDashboard.activities.eyebrow")}
          </p>
          <h2 className="mt-1 text-xl font-black leading-tight">
            {t("socioDashboard.activities.title")}
          </h2>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {t("socioDashboard.activities.description")}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
          <CalendarDays className="h-6 w-6" />
        </div>
      </div>

      <div
        className={`mt-4 rounded-2xl border p-3 ${error ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-50" : "border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-50"}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white p-2 shadow-sm dark:bg-slate-950">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-700 dark:text-indigo-300" />
            ) : error ? (
              <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            ) : hasTurnos ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            ) : (
              <CalendarDays className="h-4 w-4 text-indigo-700 dark:text-indigo-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black">{statusLabel}</p>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-200">
                {loading ? "..." : t("socioDashboard.activities.slotsShort", { count: availableSlots })}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 opacity-80">
              {statusDescription}
            </p>
          </div>
        </div>
      </div>

      {activeInscripciones.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-900/70 dark:bg-emerald-950/20">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-200">
              {t("socioDashboard.activities.mySlots")}
            </p>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-200">
              {t("socioDashboard.activities.activeCount", { count: activeInscripciones.length })}
            </span>
          </div>
          <div className="space-y-2">
            {visibleActiveInscripciones.map((inscripcion) => {
              const turno = turnoById.get(inscripcion.turno_id);

              return (
                <div
                  key={inscripcion.id}
                  className="rounded-xl bg-white/90 p-3 text-xs shadow-sm dark:bg-slate-950/70"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-black text-slate-950 dark:text-slate-50">
                        {localizeActivityName(
                          inscripcion.actividad_nombre || turno?.actividad_nombre,
                          locale,
                        ) || t("socioDashboard.activities.activity")}
                      </p>
                      <p className="mt-1 line-clamp-1 text-muted-foreground">
                        {turno
                          ? `${dayBadge(turno, t)} · ${formatTimeRange(turno)}`
                          : localizeActivityName(inscripcion.turno_nombre, locale) || t("socioDashboard.activities.shift")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 font-black ${inscripcionEstadoClass(inscripcion.estado)}`}
                    >
                      {inscripcionEstadoLabel(inscripcion.estado, t)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasTurnos ? (
        <div className="mt-4 space-y-3">
          {proximosTurnos.map((turno) => {
            const sinCupo = Number(turno.cupos_disponibles ?? 0) <= 0;
            const currentInscripcion = inscripcionByTurno.get(turno.id);
            const startDate = formatDate(turno.fecha_inicio);
            const endDate = formatDate(turno.fecha_fin);

            return (
              <div
                key={turno.id}
                className="w-full rounded-2xl border border-white/80 bg-white/85 p-3 text-left shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                        {dayBadge(turno, t)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${sinCupo ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"}`}
                      >
                        {cupoLabel(turno, t)}
                      </span>
                      {currentInscripcion ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black ${inscripcionEstadoClass(currentInscripcion.estado)}`}
                        >
                          {inscripcionEstadoLabel(currentInscripcion.estado, t)}
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-1 text-sm font-black text-slate-950 dark:text-slate-50">
                      {localizeActivityName(
                        turno.actividad_nombre || turno.nombre_turno,
                        locale,
                      ) || t("socioDashboard.activities.activity")}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-muted-foreground">
                      {turno.nombre_turno}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTimeRange(turno)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {t("socioDashboard.activities.enrolledShort", { current: Number(turno.inscriptos ?? 0), max: Number(turno.cupo_maximo ?? 0) })}
                  </div>
                  {turno.ubicacion ? (
                    <div className="col-span-2 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{turno.ubicacion}</span>
                    </div>
                  ) : null}
                  {startDate || endDate ? (
                    <div className="col-span-2 text-[11px] text-muted-foreground/80">
                      {startDate ? t("socioDashboard.activities.from", { date: startDate }) : ""}
                      {startDate && endDate ? " · " : ""}
                      {endDate ? t("socioDashboard.activities.until", { date: endDate }) : ""}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-4 text-center dark:border-indigo-900 dark:bg-slate-950/50">
          <Dumbbell className="mx-auto h-7 w-7 text-indigo-400" />
          <p className="mt-2 text-sm font-bold">
            {t("socioDashboard.activities.agendaAvailable")}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {loading
              ? t("socioDashboard.activities.loadingActivities")
              : error
                ? t("socioDashboard.activities.loadFailed")
                : t("socioDashboard.activities.noActiveTurns")}
          </p>
        </div>
      )}

      {dashboard?.warnings?.length ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
          {dashboard.warnings[0]}
        </div>
      ) : null}

      <div className="mt-3 rounded-xl border border-indigo-200 bg-white/75 p-3 text-xs leading-5 text-indigo-950 dark:border-indigo-900 dark:bg-slate-950/60 dark:text-indigo-100">
        {t("socioDashboard.activities.help")}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleVerActividades}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#02a8e1] px-3 py-3 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
        >
          <MessageSquare className="h-4 w-4" />
          {t("socioDashboard.activities.enroll")}
        </button>
        <button
          type="button"
          onClick={handleContactarAdministracion}
          className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 shadow-sm transition active:scale-[0.98] dark:border-indigo-900 dark:bg-slate-950 dark:text-slate-100"
        >
          {t("socioDashboard.common.administration")}
          <MessageSquare className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
