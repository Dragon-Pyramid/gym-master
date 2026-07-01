'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileWarning,
  HeartPulse,
  Loader2,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { FichaMedica } from '@/interfaces/fichaMedica.interface';
import { getFichaMedicaActual } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatFrontendDate } from '@/utils/dateFormat';

function normalizeFicha(raw: unknown): FichaMedica | null {
  const value = Array.isArray(raw) ? raw[raw.length - 1] : raw;
  if (!value || typeof value !== 'object') return null;
  return value as FichaMedica;
}

function hasFichaData(ficha: FichaMedica | null) {
  if (!ficha) return false;
  return Object.values(ficha).some((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}

function safeDateLabel(value?: Date | string | null) {
  if (!value) return 'Sin fecha registrada';
  try {
    return formatFrontendDate(String(value));
  } catch {
    return String(value);
  }
}

function isPastDate(value?: Date | string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
}

function compactText(value?: string | null, fallback = 'Sin datos') {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  return text.length > 56 ? `${text.slice(0, 56).trim()}...` : text;
}

function buildPreventiveItems(ficha: FichaMedica | null) {
  if (!ficha) return [];

  const items: string[] = [];

  if (ficha.alergias?.trim()) items.push(`Alergias: ${compactText(ficha.alergias)}`);
  if (ficha.medicacion?.trim()) items.push(`Medicación: ${compactText(ficha.medicacion)}`);
  if (ficha.lesiones_previas?.trim()) items.push(`Lesiones: ${compactText(ficha.lesiones_previas)}`);
  if (ficha.enfermedades_cronicas?.trim()) {
    items.push(`Enfermedades crónicas: ${compactText(ficha.enfermedades_cronicas)}`);
  }
  if (ficha.problemas_cardiacos) items.push('Declaró problemas cardíacos.');
  if (ficha.problemas_respiratorios) items.push('Declaró problemas respiratorios.');

  return items.slice(0, 3);
}

export default function SocioMobileSaludFichaMedicaCard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [ficha, setFicha] = useState<FichaMedica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socioId = user?.id_socio ?? user?.id;

  useEffect(() => {
    if (!socioId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadFicha = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getFichaMedicaActual(socioId);
        if (cancelled) return;

        if (!response.ok) {
          throw new Error('No se pudo consultar la ficha médica.');
        }

        const normalized = normalizeFicha(response.data);
        setFicha(hasFichaData(normalized) ? normalized : null);
      } catch (err) {
        if (cancelled) return;
        setFicha(null);
        setError(err instanceof Error ? err.message : 'No se pudo consultar la ficha médica.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFicha();

    return () => {
      cancelled = true;
    };
  }, [socioId]);

  const preventiveItems = useMemo(() => buildPreventiveItems(ficha), [ficha]);
  const hasFicha = Boolean(ficha);
  const hasApproval = Boolean(ficha?.aprobacion_medica);
  const revisionOverdue = isPastDate(ficha?.proxima_revision);

  if (loading) {
    return (
      <Card className='border-rose-100 bg-white/95 p-4 shadow-sm dark:border-rose-900/60 dark:bg-slate-950/70'>
        <div className='flex items-center gap-3'>
          <div className='rounded-2xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200'>
            <Loader2 className='h-5 w-5 animate-spin' />
          </div>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-300'>
              Mi salud
            </p>
            <p className='mt-1 text-sm font-semibold'>Consultando ficha médica...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20'>
        <div className='flex items-start gap-3'>
          <AlertCircle className='mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300' />
          <div className='min-w-0 flex-1'>
            <p className='font-semibold text-amber-900 dark:text-amber-100'>No pudimos consultar tu ficha</p>
            <p className='mt-1 text-sm leading-5 text-amber-800 dark:text-amber-200'>{error}</p>
            <button
              type='button'
              onClick={() => router.push('/dashboard/ficha-medica')}
              className='mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white active:scale-[0.98]'
            >
              Abrir ficha médica
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (!hasFicha) {
    return (
      <Card className='overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-4 shadow-sm dark:border-amber-900/70 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-slate-950/70'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300'>
              Mi salud
            </p>
            <h2 className='mt-1 text-xl font-black leading-tight text-amber-950 dark:text-amber-50'>
              Ficha médica pendiente
            </h2>
            <p className='mt-2 text-sm leading-5 text-amber-800 dark:text-amber-200'>
              Completala para que el gimnasio conozca antecedentes, lesiones, alergias y datos preventivos antes de entrenar.
            </p>
          </div>
          <div className='shrink-0 rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'>
            <FileWarning className='h-6 w-6' />
          </div>
        </div>

        <button
          type='button'
          onClick={() => router.push('/dashboard/ficha-medica')}
          className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-amber-900/10 transition active:scale-[0.98]'
        >
          Cargar ficha médica
          <ChevronRight className='h-4 w-4' />
        </button>
      </Card>
    );
  }

  return (
    <Card className='overflow-hidden border-rose-100 bg-gradient-to-br from-white via-rose-50 to-sky-50 p-4 shadow-sm dark:border-rose-900/60 dark:from-slate-950 dark:via-rose-950/20 dark:to-sky-950/20'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-xs font-semibold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-300'>
            Mi salud
          </p>
          <h2 className='mt-1 text-xl font-black leading-tight'>Ficha médica</h2>
          <p className='mt-2 text-sm leading-5 text-muted-foreground'>
            Resumen preventivo para entrenar con más seguridad.
          </p>
        </div>
        <div className='shrink-0 rounded-2xl bg-rose-100 p-3 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200'>
          <HeartPulse className='h-6 w-6' />
        </div>
      </div>

      <div className='mt-4 grid grid-cols-2 gap-3'>
        <div className={`rounded-2xl border p-3 ${hasApproval ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100' : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100'}`}>
          <div className='flex items-center gap-2'>
            {hasApproval ? <ShieldCheck className='h-4 w-4' /> : <AlertCircle className='h-4 w-4' />}
            <span className='text-xs font-semibold uppercase'>Apto médico</span>
          </div>
          <p className='mt-1 text-sm font-black'>{hasApproval ? 'Presentado' : 'A revisar'}</p>
        </div>

        <div className={`rounded-2xl border p-3 ${revisionOverdue ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100' : 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-100'}`}>
          <div className='flex items-center gap-2'>
            <CalendarDays className='h-4 w-4' />
            <span className='text-xs font-semibold uppercase'>Revisión</span>
          </div>
          <p className='mt-1 text-sm font-black'>{safeDateLabel(ficha?.proxima_revision)}</p>
        </div>
      </div>

      <div className='mt-4 grid grid-cols-3 gap-2 text-center'>
        <div className='rounded-2xl border border-border/70 bg-background/70 p-2'>
          <p className='text-[11px] text-muted-foreground'>Peso</p>
          <p className='text-sm font-black'>{ficha?.peso ? `${ficha.peso} kg` : '—'}</p>
        </div>
        <div className='rounded-2xl border border-border/70 bg-background/70 p-2'>
          <p className='text-[11px] text-muted-foreground'>Altura</p>
          <p className='text-sm font-black'>{ficha?.altura ? `${ficha.altura} cm` : '—'}</p>
        </div>
        <div className='rounded-2xl border border-border/70 bg-background/70 p-2'>
          <p className='text-[11px] text-muted-foreground'>IMC</p>
          <p className='text-sm font-black'>{ficha?.imc ?? '—'}</p>
        </div>
      </div>

      {preventiveItems.length > 0 ? (
        <div className='mt-4 rounded-2xl border border-rose-100 bg-white/70 p-3 text-sm dark:border-rose-900/50 dark:bg-slate-950/40'>
          <div className='mb-2 flex items-center gap-2 font-bold'>
            <Stethoscope className='h-4 w-4 text-rose-600 dark:text-rose-300' />
            Datos preventivos
          </div>
          <ul className='space-y-1.5 text-muted-foreground'>
            {preventiveItems.map((item) => (
              <li key={item} className='flex gap-2'>
                <CheckCircle2 className='mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600' />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className='mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100'>
          No hay alertas preventivas declaradas en la ficha actual.
        </div>
      )}

      <button
        type='button'
        onClick={() => router.push('/dashboard/ficha-medica')}
        className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/10 transition active:scale-[0.98]'
      >
        Ver ficha médica
        <ChevronRight className='h-4 w-4' />
      </button>
    </Card>
  );
}
