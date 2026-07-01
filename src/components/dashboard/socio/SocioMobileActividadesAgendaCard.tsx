'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type {
  ActividadTurno,
  ActividadTurnosCuposDashboard,
} from '@/interfaces/actividadTurnosCupos.interface';
import { fetchActividadesTurnosCuposDashboard } from '@/services/actividadTurnosCuposService';
import { formatFrontendDate } from '@/utils/dateFormat';

const DIAS_SEMANA: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

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
  if (!value) return '--:--';
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

function cupoLabel(turno: ActividadTurno) {
  const disponibles = Number(turno.cupos_disponibles ?? 0);
  const maximo = Number(turno.cupo_maximo ?? 0);

  if (!maximo) return 'Cupo a confirmar';
  if (disponibles <= 0) return 'Sin cupos';
  if (disponibles === 1) return '1 cupo libre';
  return `${disponibles} cupos libres`;
}

function sortByNextOccurrence(a: ActividadTurno, b: ActividadTurno) {
  const diffA = daysUntilTurno(a.dia_semana);
  const diffB = daysUntilTurno(b.dia_semana);
  if (diffA !== diffB) return diffA - diffB;
  return String(a.hora_inicio ?? '').localeCompare(String(b.hora_inicio ?? ''));
}

function dayBadge(turno: ActividadTurno) {
  const diff = daysUntilTurno(turno.dia_semana);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return DIAS_SEMANA[turno.dia_semana] ?? 'Agenda';
}

export default function SocioMobileActividadesAgendaCard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ActividadTurnosCuposDashboard | null>(null);
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
        setError(err instanceof Error ? err.message : 'No se pudo consultar la agenda de actividades.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAgenda();

    return () => {
      cancelled = true;
    };
  }, []);

  const turnosActivos = useMemo(() => {
    const turnos = dashboard?.turnos ?? [];
    return turnos
      .filter((turno) => turno.estado === 'activo')
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
    0
  );

  const statusLabel = loading
    ? 'Consultando agenda...'
    : error
      ? 'No se pudo consultar'
      : hasTurnos
        ? turnosHoy.length > 0
          ? `${turnosHoy.length} actividad${turnosHoy.length === 1 ? '' : 'es'} hoy`
          : 'Próximas actividades disponibles'
        : 'Sin actividades activas';

  const statusDescription = loading
    ? 'Estamos revisando los turnos y cupos del gimnasio.'
    : error
      ? 'Podés consultar con administración para confirmar horarios o inscripción.'
      : hasTurnos
        ? 'Revisá horarios, cupos y ubicación antes de ir al gimnasio.'
        : 'Cuando el gimnasio cargue clases o turnos activos, aparecerán en esta tarjeta.';

  const handleContactarAdministracion = () => {
    router.push('/dashboard/mensajes');
  };

  return (
    <Card className='overflow-hidden border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-cyan-50 p-4 shadow-sm dark:border-indigo-900/60 dark:from-slate-950 dark:via-indigo-950/20 dark:to-cyan-950/20'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-300'>
            Actividades
          </p>
          <h2 className='mt-1 text-xl font-black leading-tight'>Agenda del gimnasio</h2>
          <p className='mt-2 text-sm leading-5 text-muted-foreground'>
            Mirá clases, horarios y cupos disponibles. Para inscribirte, consultá con administración.
          </p>
        </div>
        <div className='shrink-0 rounded-2xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200'>
          <CalendarDays className='h-6 w-6' />
        </div>
      </div>

      <div className={`mt-4 rounded-2xl border p-3 ${error ? 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-50' : 'border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-50'}`}>
        <div className='flex items-start gap-3'>
          <div className='mt-0.5 rounded-full bg-white p-2 shadow-sm dark:bg-slate-950'>
            {loading ? (
              <Loader2 className='h-4 w-4 animate-spin text-indigo-700 dark:text-indigo-300' />
            ) : error ? (
              <AlertCircle className='h-4 w-4 text-amber-700 dark:text-amber-300' />
            ) : hasTurnos ? (
              <CheckCircle2 className='h-4 w-4 text-emerald-700 dark:text-emerald-300' />
            ) : (
              <CalendarDays className='h-4 w-4 text-indigo-700 dark:text-indigo-300' />
            )}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-sm font-black'>{statusLabel}</p>
              <span className='shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-200'>
                {loading ? '...' : `${availableSlots} cupos`}
              </span>
            </div>
            <p className='mt-1 text-xs leading-5 opacity-80'>{statusDescription}</p>
          </div>
        </div>
      </div>

      {hasTurnos ? (
        <div className='mt-4 space-y-3'>
          {proximosTurnos.map((turno) => {
            const sinCupo = Number(turno.cupos_disponibles ?? 0) <= 0;
            const startDate = formatDate(turno.fecha_inicio);
            const endDate = formatDate(turno.fecha_fin);

            return (
              <div
                key={turno.id}
                className='w-full rounded-2xl border border-white/80 bg-white/85 p-3 text-left shadow-sm dark:border-slate-800 dark:bg-slate-950/70'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <div className='mb-2 flex flex-wrap items-center gap-2'>
                      <span className='rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'>
                        {dayBadge(turno)}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${sinCupo ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'}`}>
                        {cupoLabel(turno)}
                      </span>
                    </div>
                    <p className='line-clamp-1 text-sm font-black text-slate-950 dark:text-slate-50'>
                      {turno.actividad_nombre || turno.nombre_turno || 'Actividad'}
                    </p>
                    <p className='mt-1 line-clamp-1 text-xs font-semibold text-muted-foreground'>
                      {turno.nombre_turno}
                    </p>
                  </div>
                </div>

                <div className='mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
                  <div className='flex items-center gap-1.5'>
                    <Clock className='h-3.5 w-3.5' />
                    {formatTimeRange(turno)}
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <Users className='h-3.5 w-3.5' />
                    {Number(turno.inscriptos ?? 0)}/{Number(turno.cupo_maximo ?? 0)} inscriptos
                  </div>
                  {turno.ubicacion ? (
                    <div className='col-span-2 flex items-center gap-1.5'>
                      <MapPin className='h-3.5 w-3.5' />
                      <span className='line-clamp-1'>{turno.ubicacion}</span>
                    </div>
                  ) : null}
                  {startDate || endDate ? (
                    <div className='col-span-2 text-[11px] text-muted-foreground/80'>
                      {startDate ? `Desde ${startDate}` : ''}{startDate && endDate ? ' · ' : ''}{endDate ? `Hasta ${endDate}` : ''}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className='mt-4 rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-4 text-center dark:border-indigo-900 dark:bg-slate-950/50'>
          <Dumbbell className='mx-auto h-7 w-7 text-indigo-400' />
          <p className='mt-2 text-sm font-bold'>Agenda disponible para consultar</p>
          <p className='mt-1 text-xs leading-5 text-muted-foreground'>
            {loading ? 'Cargando actividades...' : error ? 'No pudimos cargar la agenda en este momento.' : 'Todavía no hay turnos activos para mostrar.'}
          </p>
        </div>
      )}

      {dashboard?.warnings?.length ? (
        <div className='mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100'>
          {dashboard.warnings[0]}
        </div>
      ) : null}

      <div className='mt-3 rounded-xl border border-indigo-200 bg-white/75 p-3 text-xs leading-5 text-indigo-950 dark:border-indigo-900 dark:bg-slate-950/60 dark:text-indigo-100'>
        Para inscribirte, cambiar un turno o confirmar disponibilidad, escribile a administración desde mensajes.
      </div>

      <div className='mt-4 grid grid-cols-2 gap-2'>
        <button
          type='button'
          onClick={handleContactarAdministracion}
          className='flex items-center justify-center gap-2 rounded-xl bg-[#02a8e1] px-3 py-3 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]'
        >
          <MessageSquare className='h-4 w-4' />
          Consultar
        </button>
        <button
          type='button'
          onClick={handleContactarAdministracion}
          className='flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 shadow-sm transition active:scale-[0.98] dark:border-indigo-900 dark:bg-slate-950 dark:text-slate-100'
        >
          Administración
          <MessageSquare className='h-4 w-4' />
        </button>
      </div>
    </Card>
  );
}
