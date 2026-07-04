'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Loader2,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { getDietasPorSocio, getHistorialRutinas } from '@/services/apiClient';
import type { Dieta } from '@/interfaces/dieta.interface';
import type { Rutina } from '@/interfaces/rutina.interface';
import { formatFrontendDate } from '@/utils/dateFormat';

type TodayRoutineSummary = {
  rutina: Rutina;
  title: string;
  dayLabel: string;
  exerciseCount: number;
  fallbackToLatest: boolean;
};

type TodayDietSummary = {
  dieta: Dieta;
  title: string;
  objective: string;
  periodLabel: string;
  isActiveToday: boolean;
};

const DAY_LABELS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

const WEEKDAY_LABELS = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseMaybeJson(value: unknown) {
  if (!value) return null;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getRoutineTitle(rutina?: Rutina | null) {
  if (!rutina) return 'Sin rutina activa';
  if (rutina.nombre) return rutina.nombre;
  if (rutina.semana) return `Rutina semana ${rutina.semana}`;
  return `Rutina #${rutina.id_rutina}`;
}

function getDayNameFromRoutineDay(dayData: any, index: number) {
  const directName =
    dayData?.dia ?? dayData?.nombre_dia ?? dayData?.dia_semana ?? dayData?.nombre;

  if (typeof directName === 'number') {
    return WEEKDAY_LABELS[directName - 1] ?? `día ${directName}`;
  }

  if (typeof directName === 'string' && directName.trim()) {
    return directName;
  }

  return WEEKDAY_LABELS[index] ?? `día ${index + 1}`;
}

function getExercisesFromDay(dayData: any): any[] {
  if (Array.isArray(dayData)) return dayData;
  if (Array.isArray(dayData?.ejercicios)) return dayData.ejercicios;
  if (Array.isArray(dayData?.items)) return dayData.items;
  if (Array.isArray(dayData?.bloques)) {
    return dayData.bloques.flatMap((block: any) =>
      Array.isArray(block?.ejercicios) ? block.ejercicios : []
    );
  }
  if (Array.isArray(dayData?.grupos)) {
    return dayData.grupos.flatMap((group: any) =>
      Array.isArray(group?.ejercicios) ? group.ejercicios : []
    );
  }
  return [];
}

function extractRoutineDays(rutina: Rutina) {
  const parsed = parseMaybeJson(rutina.rutina_desc ?? rutina.contenido);

  if (!parsed || typeof parsed !== 'object') return [];

  const parsedRecord = parsed as Record<string, any>;

  if (Array.isArray(parsedRecord.dias)) {
    return parsedRecord.dias.map((dayData: any, index: number) => ({
      label: getDayNameFromRoutineDay(dayData, index),
      exercises: getExercisesFromDay(dayData),
    }));
  }

  if (parsedRecord.semana && typeof parsedRecord.semana === 'object') {
    return Object.entries(parsedRecord.semana).map(([label, value]) => ({
      label,
      exercises: getExercisesFromDay(value),
    }));
  }

  const directDays = WEEKDAY_LABELS.filter((day) => Array.isArray(parsedRecord[day]));

  if (directDays.length > 0) {
    return directDays.map((day) => ({
      label: day,
      exercises: getExercisesFromDay(parsedRecord[day]),
    }));
  }

  return [];
}

function buildTodayRoutineSummary(rutinas: Rutina[]): TodayRoutineSummary | null {
  const latest = rutinas[0];
  if (!latest) return null;

  const todayLabel = DAY_LABELS[new Date().getDay()];
  const todayNormalized = normalizeText(todayLabel);
  const days = extractRoutineDays(latest);
  const todayDay = days.find((day) => normalizeText(day.label) === todayNormalized);
  const fallbackDay = days[0];
  const selectedDay = todayDay ?? fallbackDay;

  return {
    rutina: latest,
    title: getRoutineTitle(latest),
    dayLabel: selectedDay?.label ?? todayLabel,
    exerciseCount: selectedDay?.exercises?.length ?? 0,
    fallbackToLatest: !todayDay,
  };
}

function getDateOnly(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function isDateWithinRange(date: Date, start?: string | null, end?: string | null) {
  const startDate = getDateOnly(start);
  const endDate = getDateOnly(end);

  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return Boolean(startDate || endDate);
}

function formatDateSafe(value?: string | null) {
  if (!value) return 'sin fecha';
  try {
    return formatFrontendDate(value);
  } catch {
    return value;
  }
}


function countDietMeals(observaciones?: string | null) {
  if (!observaciones?.trim()) return 0;

  try {
    const parsed = JSON.parse(observaciones);
    if (Array.isArray(parsed)) return parsed.length;
    if (typeof parsed === 'object' && parsed !== null) return Object.keys(parsed).length;
  } catch {
    return observaciones.trim() ? 1 : 0;
  }

  return 0;
}

function getTodayStorageKey(dietaId: string | number) {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `gym-master:dieta-followup:${dietaId}:${year}-${month}-${day}`;
}

function getDietFollowupLabel(dieta?: Dieta | null) {
  if (!dieta || typeof window === 'undefined') return null;
  const total = countDietMeals(dieta.observaciones);
  if (!total) return null;

  try {
    const raw = window.localStorage.getItem(getTodayStorageKey(dieta.id));
    const completedMeals = raw ? JSON.parse(raw)?.completedMeals : [];
    const completed = Array.isArray(completedMeals) ? completedMeals.length : 0;
    return `${Math.min(completed, total)}/${total} comidas hoy`;
  } catch {
    return `0/${total} comidas hoy`;
  }
}

function buildTodayDietSummary(dietas: Dieta[]): TodayDietSummary | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const active = dietas.find((dieta) =>
    isDateWithinRange(today, dieta.fecha_inicio, dieta.fecha_fin)
  );
  const latest = active ?? dietas[0];

  if (!latest) return null;

  return {
    dieta: latest,
    title: latest.nombre_plan || 'Plan alimentario',
    objective: latest.objetivo || 'Objetivo no especificado',
    periodLabel: `${formatDateSafe(latest.fecha_inicio)} al ${formatDateSafe(latest.fecha_fin)}`,
    isActiveToday: Boolean(active),
  };
}

export default function SocioMobileTodayPlan() {
  const router = useRouter();
  const { user } = useAuthStore();
  const socioId = user?.id_socio ?? user?.id;
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [dietas, setDietas] = useState<Dieta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTodayPlan = async () => {
      try {
        setLoading(true);
        setError(null);

        const [rutinasRes, dietasRes] = await Promise.all([
          getHistorialRutinas(),
          socioId ? getDietasPorSocio(socioId) : Promise.resolve({ ok: false, data: [] }),
        ]);

        if (cancelled) return;

        const nextRutinas = Array.isArray(rutinasRes.data)
          ? (rutinasRes.data as Rutina[])
          : [];
        const nextDietas = Array.isArray(dietasRes.data)
          ? (dietasRes.data as Dieta[])
          : [];

        setRutinas(nextRutinas);
        setDietas(
          [...nextDietas].sort((a, b) =>
            String(b.fecha_inicio ?? b.created_at ?? '').localeCompare(
              String(a.fecha_inicio ?? a.created_at ?? '')
            )
          )
        );
      } catch {
        if (!cancelled) {
          setError('No pudimos cargar tu rutina y dieta en este momento.');
          setRutinas([]);
          setDietas([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTodayPlan();

    return () => {
      cancelled = true;
    };
  }, [socioId]);

  const routineSummary = useMemo(() => buildTodayRoutineSummary(rutinas), [rutinas]);
  const dietSummary = useMemo(() => buildTodayDietSummary(dietas), [dietas]);
  const dietFollowupLabel = useMemo(
    () => getDietFollowupLabel(dietSummary?.dieta),
    [dietSummary]
  );

  return (
    <Card className='overflow-hidden border-slate-200 bg-gradient-to-br from-white to-slate-50 p-0 shadow-sm dark:from-slate-950 dark:to-slate-900'>
      <div className='border-b border-slate-100 bg-slate-950 px-4 py-4 text-white dark:border-slate-800'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.22em] text-sky-200'>
              Hoy
            </p>
            <h2 className='mt-1 text-lg font-black'>Tu plan de acción</h2>
            <p className='mt-1 text-xs text-slate-300'>
              Entrenamiento, nutrición y coach IA en un solo lugar.
            </p>
          </div>
          <div className='rounded-2xl bg-white/10 p-2'>
            <Sparkles className='h-5 w-5 text-sky-200' />
          </div>
        </div>
      </div>

      <div className='space-y-3 p-4'>
        {loading ? (
          <div className='flex items-center gap-2 rounded-2xl border bg-white px-4 py-4 text-sm text-muted-foreground dark:bg-slate-950'>
            <Loader2 className='h-4 w-4 animate-spin' />
            Consultando tu rutina y dieta...
          </div>
        ) : error ? (
          <div className='rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
            {error}
          </div>
        ) : null}

        {!loading ? (
          <>
            <button
              type='button'
              onClick={() => router.push('/dashboard/rutinas')}
              className='flex w-full items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-left shadow-sm transition active:scale-[0.98] dark:border-orange-900/60 dark:bg-orange-950/20'
            >
              <span className='flex min-w-0 items-start gap-3'>
                <span className='rounded-xl bg-orange-100 p-2 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200'>
                  <Dumbbell className='h-5 w-5' />
                </span>
                <span className='min-w-0'>
                  <span className='block text-sm font-black text-orange-950 dark:text-orange-100'>
                    {routineSummary ? routineSummary.title : 'Sin rutina asignada'}
                  </span>
                  <span className='mt-0.5 block text-xs leading-5 text-orange-800/80 dark:text-orange-200/80'>
                    {routineSummary
                      ? routineSummary.exerciseCount > 0
                        ? `${routineSummary.dayLabel}: ${routineSummary.exerciseCount} ejercicios${routineSummary.fallbackToLatest ? ' de tu última rutina' : ''}`
                        : 'Última rutina disponible para consultar'
                      : 'Generá o solicitá una rutina desde el asistente'}
                  </span>
                </span>
              </span>
              <ChevronRight className='h-4 w-4 shrink-0 text-orange-700' />
            </button>

            <button
              type='button'
              onClick={() => router.push('/dashboard/dietas')}
              className='flex w-full items-center justify-between gap-3 rounded-2xl border border-lime-100 bg-lime-50 px-4 py-3 text-left shadow-sm transition active:scale-[0.98] dark:border-lime-900/60 dark:bg-lime-950/20'
            >
              <span className='flex min-w-0 items-start gap-3'>
                <span className='rounded-xl bg-lime-100 p-2 text-lime-700 dark:bg-lime-900/50 dark:text-lime-200'>
                  <Utensils className='h-5 w-5' />
                </span>
                <span className='min-w-0'>
                  <span className='block text-sm font-black text-lime-950 dark:text-lime-100'>
                    {dietSummary ? dietSummary.title : 'Sin dieta asignada'}
                  </span>
                  <span className='mt-0.5 block text-xs leading-5 text-lime-800/80 dark:text-lime-200/80'>
                    {dietSummary
                      ? `${dietSummary.isActiveToday ? 'Activa' : 'Última registrada'} · ${dietSummary.objective} · ${dietSummary.periodLabel}${dietFollowupLabel ? ` · ${dietFollowupLabel}` : ''}`
                      : 'Consultá o generá un plan alimentario'}
                  </span>
                </span>
              </span>
              <ChevronRight className='h-4 w-4 shrink-0 text-lime-700' />
            </button>
          </>
        ) : null}

        <div className='grid grid-cols-2 gap-2 pt-1'>
          <button
            type='button'
            onClick={() => router.push('/dashboard/rutinas/asistente')}
            className='flex items-center justify-center gap-2 rounded-xl bg-[#02a8e1] px-3 py-2.5 text-xs font-bold text-white shadow-sm active:scale-[0.98]'
          >
            <Dumbbell className='h-4 w-4' />
            Asistente
          </button>
          <button
            type='button'
            onClick={() => router.push('/dashboard/coach')}
            className='flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs font-bold text-sky-900 shadow-sm active:scale-[0.98] dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100'
          >
            <Bot className='h-4 w-4' />
            Coach IA
          </button>
        </div>

        {routineSummary || dietSummary ? (
          <div className='flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100'>
            <CheckCircle2 className='h-4 w-4 shrink-0' />
            Tenés información disponible para entrenar y seguir tu progreso.
          </div>
        ) : (
          <div className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground dark:border-slate-800 dark:bg-slate-950'>
            <CalendarDays className='h-4 w-4 shrink-0' />
            Cuando tengas rutina o dieta asignada, aparecerán acá.
          </div>
        )}
      </div>
    </Card>
  );
}
