'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Maximize2,
  Megaphone,
  Monitor,
  QrCode,
  ShieldAlert,
  Smartphone,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileImage from '@/components/perfil/ProfileImage';
import { supabaseBrowser } from '@/lib/supabase-browser';
import {
  fetchAsistenciasRecientes,
  fetchQrDiario,
  fetchTerminalNotificaciones,
  isTerminalSessionError,
  refreshTerminalSession,
  type AsistenciaReciente,
  type TerminalNotificacion,
  type RegistroAsistenciaAlertType,
} from '@/services/qrService';
import { formatFrontendDate, formatFrontendTime } from '@/utils/dateFormat';
import { useAuthStore } from '@/stores/authStore';
import { getToken, logoutSession } from '@/services/storageService';
import { jwtDecode } from 'jwt-decode';

type TerminalVariant = 'idle' | 'success' | 'debt' | 'inactive' | 'error';

type AccessBroadcastPayload = {
  event_id?: string;
  access_status?: string;
  alert_type?: RegistroAsistenciaAlertType;
  mensaje_acceso?: string | null;
  socio?: {
    id_socio?: string;
    nombre_completo?: string;
    foto?: string | null;
  } | null;
};

type TerminalEvent = {
  id: string;
  variant: TerminalVariant;
  nombre: string;
  foto?: string | null;
  idSocio?: string;
  title: string;
  message: string;
  timestamp: Date;
};

const RESULT_VISIBLE_MS = 5000;
const TERMINAL_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const TERMINAL_REFRESH_THRESHOLD_MS = 30 * 60 * 1000;

type TerminalSessionState = {
  status: 'checking' | 'ok' | 'warning' | 'expired';
  message: string;
  expiresAt?: Date | null;
};

const variantStyles: Record<
  TerminalVariant,
  {
    container: string;
    badge: string;
    icon: string;
    title: string;
    glow: string;
  }
> = {
  idle: {
    container: 'border-cyan-300 bg-cyan-50 text-slate-950 dark:border-cyan-700 dark:bg-slate-950/90 dark:text-white',
    badge: 'border-cyan-300 bg-cyan-100 text-cyan-900 dark:border-cyan-600 dark:bg-cyan-950 dark:text-cyan-100',
    icon: 'text-cyan-700 dark:text-cyan-200',
    title: 'text-slate-950 dark:text-white',
    glow: 'shadow-cyan-300/40 dark:shadow-cyan-900/60',
  },
  success: {
    container: 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/90 dark:text-emerald-50',
    badge: 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-900 dark:text-emerald-100',
    icon: 'text-emerald-600 dark:text-emerald-300',
    title: 'text-emerald-950 dark:text-emerald-50',
    glow: 'shadow-emerald-300/50 dark:shadow-emerald-900/60',
  },
  debt: {
    container: 'border-red-300 bg-red-50 text-red-950 dark:border-red-700 dark:bg-red-950/90 dark:text-red-50',
    badge: 'border-red-300 bg-red-100 text-red-800 dark:border-red-600 dark:bg-red-900 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-300',
    title: 'text-red-950 dark:text-red-50',
    glow: 'shadow-red-300/50 dark:shadow-red-900/60',
  },
  inactive: {
    container: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/90 dark:text-amber-50',
    badge: 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-600 dark:bg-amber-900 dark:text-amber-100',
    icon: 'text-amber-600 dark:text-amber-300',
    title: 'text-amber-950 dark:text-amber-50',
    glow: 'shadow-amber-300/50 dark:shadow-amber-900/60',
  },
  error: {
    container: 'border-slate-300 bg-slate-50 text-slate-950 dark:border-slate-700 dark:bg-slate-950/90 dark:text-white',
    badge: 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
    icon: 'text-slate-700 dark:text-slate-200',
    title: 'text-slate-950 dark:text-white',
    glow: 'shadow-slate-300/50 dark:shadow-slate-900/60',
  },
};


const terminalNeonClasses: Record<string, string> = {
  rosa: 'text-pink-200 drop-shadow-[0_0_14px_rgba(244,114,182,0.95)]',
  verde_fluo: 'text-lime-200 drop-shadow-[0_0_14px_rgba(163,230,53,0.95)]',
  naranja_fluo: 'text-orange-200 drop-shadow-[0_0_14px_rgba(251,146,60,0.95)]',
  amarillo_fluo: 'text-yellow-200 drop-shadow-[0_0_14px_rgba(250,204,21,0.95)]',
  rojo_fluo: 'text-red-200 drop-shadow-[0_0_14px_rgba(248,113,113,0.95)]',
};

function getTerminalNeonClass(color?: string | null) {
  return terminalNeonClasses[color || 'verde_fluo'] || terminalNeonClasses.verde_fluo;
}

function decodeTokenExpiration(token?: string | null): Date | null {
  if (!token) return null;

  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    return decoded.exp ? new Date(decoded.exp * 1000) : null;
  } catch {
    return null;
  }
}

function isTokenCloseToExpiring(expiresAt: Date | null) {
  if (!expiresAt) return true;
  return expiresAt.getTime() - Date.now() <= TERMINAL_REFRESH_THRESHOLD_MS;
}

function formatTime(date: Date) {
  return formatFrontendTime(date);
}

function formatDate(date: Date) {
  return formatFrontendDate(date);
}

function getVariantFromAccess(alertType?: string, accessStatus?: string): TerminalVariant {
  if (alertType === 'inactive' || accessStatus === 'desactivado') return 'inactive';
  if (alertType === 'debt' || accessStatus === 'deuda') return 'debt';
  if (alertType === 'error' || accessStatus === 'qr_expirado' || accessStatus === 'sin_socio') return 'error';
  if (alertType === 'success' || accessStatus === 'al_dia') return 'success';
  return 'success';
}

function buildTerminalEventFromAsistencia(row: AsistenciaReciente): TerminalEvent {
  const variant = getVariantFromAccess(row.alert_type, row.access_status);
  const nombre = row.socio?.nombre_completo ?? 'Socio';
  const timestamp = new Date();
  const [year, month, day] = (row.fecha ?? '').split('-').map(Number);
  const [hour = 0, minute = 0, second = 0] = (row.hora_ingreso ?? '').split(':').map(Number);

  if (year && month && day) {
    timestamp.setFullYear(year, month - 1, day);
    timestamp.setHours(
      Number.isFinite(hour) ? hour : 0,
      Number.isFinite(minute) ? minute : 0,
      Number.isFinite(second) ? second : 0,
      0
    );
  }

  return {
    id: `asistencia-${row.id}`,
    variant,
    nombre,
    foto: row.socio?.foto ?? null,
    idSocio: row.socio?.id_socio ?? row.socio_id,
    title:
      variant === 'debt'
        ? 'Debe regularizar'
        : variant === 'inactive'
        ? 'Acceso bloqueado'
        : 'Acceso permitido',
    message:
      row.mensaje_acceso ||
      (variant === 'debt'
        ? 'El socio debe dirigirse a administración para regularizar su situación.'
        : variant === 'inactive'
        ? 'El socio está desactivado. Debe dirigirse a administración.'
        : 'Asistencia registrada correctamente. Bienvenido al gimnasio.'),
    timestamp,
  };
}

function buildTerminalEventFromBroadcast(payload: AccessBroadcastPayload): TerminalEvent {
  const variant = getVariantFromAccess(payload.alert_type, payload.access_status);
  const nombre = payload.socio?.nombre_completo ?? 'Socio';

  return {
    id: payload.event_id || `${variant}-${payload.socio?.id_socio ?? 'socio'}-${Date.now()}`,
    variant,
    nombre,
    foto: payload.socio?.foto ?? null,
    idSocio: payload.socio?.id_socio,
    title:
      variant === 'debt'
        ? 'Debe regularizar'
        : variant === 'inactive'
        ? 'Acceso bloqueado'
        : variant === 'error'
        ? 'No se pudo registrar'
        : 'Acceso permitido',
    message:
      payload.mensaje_acceso ||
      (variant === 'debt'
        ? 'El socio debe dirigirse a administración para regularizar su situación.'
        : variant === 'inactive'
        ? 'El socio está desactivado. Debe dirigirse a administración.'
        : variant === 'error'
        ? 'No se pudo registrar la asistencia.'
        : 'Asistencia registrada correctamente. Bienvenido al gimnasio.'),
    timestamp: new Date(),
  };
}

function getIdleEvent(): TerminalEvent {
  return {
    id: 'idle',
    variant: 'idle',
    nombre: 'Escaneo disponible',
    title: 'Escaneá el QR para registrar asistencia',
    message: 'Abrí la cámara de tu celular, escaneá el código y seguí el flujo de ingreso desde Gym Master.',
    timestamp: new Date(),
  };
}

function TerminalIcon({ variant }: { variant: TerminalVariant }) {
  if (variant === 'success') return <CheckCircle2 className='h-20 w-20 md:h-28 md:w-28' />;
  if (variant === 'debt') return <AlertTriangle className='h-20 w-20 md:h-28 md:w-28' />;
  if (variant === 'inactive') return <ShieldAlert className='h-20 w-20 md:h-28 md:w-28' />;
  return <Monitor className='h-20 w-20 md:h-28 md:w-28' />;
}

export default function AsistenciaTerminalDisplay() {
  const [event, setEvent] = useState<TerminalEvent>(() => getIdleEvent());
  const [recent, setRecent] = useState<AsistenciaReciente[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [checkInUrl, setCheckInUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(true);
  const [terminalAds, setTerminalAds] = useState<TerminalNotificacion[]>([]);
  const [showTerminalAd, setShowTerminalAd] = useState(false);
  const [terminalAdIndex, setTerminalAdIndex] = useState(0);
  const lastEventIdRef = useRef<string>('idle');
  const lastAsistenciaIdRef = useRef<string | null>(null);
  const initialRecentLoadedRef = useRef(false);
  const resultTimeoutRef = useRef<number | null>(null);
  const adShowTimeoutRef = useRef<number | null>(null);
  const adHideTimeoutRef = useRef<number | null>(null);
  const terminalRefreshInFlightRef = useRef(false);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const logout = useAuthStore((state) => state.logout);
  const [sessionState, setSessionState] = useState<TerminalSessionState>(() => ({
    status: 'checking',
    message: 'Preparando sesión extendida de Terminal...',
    expiresAt: null,
  }));

  const styles = variantStyles[event.variant];

  const markTerminalSessionExpired = useCallback((message?: string) => {
    setSessionState({
      status: 'expired',
      message:
        message ||
        'La sesión de Terminal expiró. Iniciá sesión nuevamente para reactivar la pantalla.',
      expiresAt: null,
    });
    setError('Sesión de Terminal expirada.');
  }, []);

  const ensureTerminalSession = useCallback(async (force = false) => {
    const currentToken = getToken();
    const currentExpiresAt = decodeTokenExpiration(currentToken);

    if (!currentToken) {
      markTerminalSessionExpired('No hay sesión activa para la Terminal. Iniciá sesión nuevamente.');
      return false;
    }

    if (!force && currentExpiresAt && !isTokenCloseToExpiring(currentExpiresAt)) {
      setSessionState({
        status: 'ok',
        message: 'Sesión de Terminal activa.',
        expiresAt: currentExpiresAt,
      });
      return true;
    }

    if (terminalRefreshInFlightRef.current) return true;

    try {
      terminalRefreshInFlightRef.current = true;
      setSessionState((prev) => ({
        ...prev,
        status: 'checking',
        message: 'Renovando sesión segura de Terminal...',
      }));

      const refreshed = await refreshTerminalSession();
      refreshSession(refreshed.token);

      const expiresAt = refreshed.expires_at
        ? new Date(refreshed.expires_at)
        : decodeTokenExpiration(refreshed.token);

      setSessionState({
        status: 'ok',
        message: 'Sesión de Terminal renovada correctamente.',
        expiresAt,
      });
      setError(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      markTerminalSessionExpired(message);
      return false;
    } finally {
      terminalRefreshInFlightRef.current = false;
    }
  }, [markTerminalSessionExpired, refreshSession]);

  const handleTerminalError = useCallback((err: unknown, fallback: string) => {
    if (isTerminalSessionError(err)) {
      markTerminalSessionExpired(err.message);
      return;
    }

    setError(err instanceof Error ? err.message : fallback);
  }, [markTerminalSessionExpired]);

  const clearAdTimers = () => {
    if (adShowTimeoutRef.current) {
      window.clearTimeout(adShowTimeoutRef.current);
      adShowTimeoutRef.current = null;
    }

    if (adHideTimeoutRef.current) {
      window.clearTimeout(adHideTimeoutRef.current);
      adHideTimeoutRef.current = null;
    }
  };

  const scheduleIdleReset = () => {
    if (resultTimeoutRef.current) {
      window.clearTimeout(resultTimeoutRef.current);
    }

    resultTimeoutRef.current = window.setTimeout(() => {
      setEvent(getIdleEvent());
      resultTimeoutRef.current = null;
    }, RESULT_VISIBLE_MS);
  };

  const applyEvent = (nextEvent: TerminalEvent) => {
    if (lastEventIdRef.current === nextEvent.id) return;
    lastEventIdRef.current = nextEvent.id;
    setShowTerminalAd(false);
    clearAdTimers();
    setEvent(nextEvent);

    if (nextEvent.variant !== 'idle') {
      scheduleIdleReset();
    }
  };

  const loadRecent = async () => {
    try {
      setError(null);
      const rows = await fetchAsistenciasRecientes();
      const cleanRows = Array.isArray(rows) ? rows : [];
      setRecent(cleanRows.slice(0, 4));

      const latest = cleanRows[0];
      if (!initialRecentLoadedRef.current) {
        lastAsistenciaIdRef.current = latest?.id ?? null;
        initialRecentLoadedRef.current = true;
        return;
      }

      if (latest && latest.id !== lastAsistenciaIdRef.current) {
        lastAsistenciaIdRef.current = latest.id;
        applyEvent(buildTerminalEventFromAsistencia(latest));
      }
    } catch (err) {
      handleTerminalError(err, 'No se pudieron cargar las asistencias recientes.');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadDailyQr = async () => {
      try {
        setQrLoading(true);
        const qr = await fetchQrDiario();

        if (cancelled) return;

        setQrDataUrl(qr.qrCode);
        setCheckInUrl(qr.url);
      } catch (err) {
        if (cancelled) return;

        handleTerminalError(err, 'No se pudo cargar el QR diario de asistencia.');
      } finally {
        if (!cancelled) {
          setQrLoading(false);
        }
      }
    };

    ensureTerminalSession(true).then((ready) => {
      if (!cancelled && ready) loadDailyQr();
    });
    const qrRefreshInterval = window.setInterval(() => {
      ensureTerminalSession().then((ready) => {
        if (ready) loadDailyQr();
      });
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(qrRefreshInterval);
    };
  }, [ensureTerminalSession, handleTerminalError]);

  useEffect(() => {
    ensureTerminalSession(true);
    const terminalSessionInterval = window.setInterval(() => {
      ensureTerminalSession();
    }, TERMINAL_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(terminalSessionInterval);
  }, [ensureTerminalSession]);

  useEffect(() => {
    let cancelled = false;

    const loadTerminalAds = async () => {
      try {
        const rows = await fetchTerminalNotificaciones();
        if (cancelled) return;
        setTerminalAds(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (!cancelled) {
          if (isTerminalSessionError(err)) {
            markTerminalSessionExpired(err.message);
          } else {
            console.warn('No se pudieron cargar avisos de Terminal:', err);
            setTerminalAds([]);
          }
        }
      }
    };

    loadTerminalAds();
    const adsRefreshInterval = window.setInterval(loadTerminalAds, 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(adsRefreshInterval);
    };
  }, [markTerminalSessionExpired]);

  useEffect(() => {
    clearAdTimers();
    setShowTerminalAd(false);

    if (event.variant !== 'idle' || terminalAds.length === 0) return;

    const currentAd = terminalAds[terminalAdIndex % terminalAds.length];
    const frequencyMs = Math.max(5, Number(currentAd.terminal_frecuencia_segundos || 15)) * 1000;
    const durationMs = Math.max(3, Number(currentAd.terminal_duracion_segundos || 8)) * 1000;

    adShowTimeoutRef.current = window.setTimeout(() => {
      setShowTerminalAd(true);
      adHideTimeoutRef.current = window.setTimeout(() => {
        setShowTerminalAd(false);
        setTerminalAdIndex((prev) => (prev + 1) % Math.max(terminalAds.length, 1));
      }, durationMs);
    }, frequencyMs);

    return clearAdTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.variant, terminalAds, terminalAdIndex]);

  useEffect(() => {
    ensureTerminalSession().then((ready) => {
      if (ready) loadRecent();
    });

    const clockInterval = window.setInterval(() => setNow(new Date()), 1000);
    const pollInterval = window.setInterval(() => {
      if (sessionState.status !== 'expired') loadRecent();
    }, 3000);

    const realtimeChannel = supabaseBrowser
      .channel('asistencias-terminal-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'asistencia' },
        () => {
          if (sessionState.status !== 'expired') loadRecent();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'asistencia' },
        () => {
          if (sessionState.status !== 'expired') loadRecent();
        }
      )
      .subscribe();

    const broadcastChannel = supabaseBrowser
      .channel('gym-master-asistencia-access-events')
      .on(
        'broadcast',
        { event: 'access_event' },
        ({ payload }: { payload: AccessBroadcastPayload }) => {
          applyEvent(buildTerminalEventFromBroadcast(payload));
        }
      )
      .subscribe();

    return () => {
      window.clearInterval(clockInterval);
      window.clearInterval(pollInterval);
      if (resultTimeoutRef.current) {
        window.clearTimeout(resultTimeoutRef.current);
      }
      clearAdTimers();
      supabaseBrowser.removeChannel(realtimeChannel);
      supabaseBrowser.removeChannel(broadcastChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentItems = useMemo(
    () =>
      recent.map((row) => ({
        id: row.id,
        nombre: row.socio?.nombre_completo ?? 'Socio',
        status: getVariantFromAccess(row.alert_type, row.access_status),
        hora: row.hora_ingreso?.slice(0, 5) || '--:--',
        foto: row.socio?.foto ?? null,
      })),
    [recent]
  );

  const requestFullscreen = () => {
    const request = document.documentElement.requestFullscreen?.();
    request?.catch(() => {});
  };

  const isIdle = event.variant === 'idle';
  const activeTerminalAd = terminalAds[terminalAdIndex % Math.max(terminalAds.length, 1)] ?? null;
  const shouldShowTerminalAd = isIdle && showTerminalAd && Boolean(activeTerminalAd);

  return (
    <main className='h-screen max-h-screen overflow-hidden bg-slate-950 text-white'>
      <section className='relative flex h-screen max-h-screen min-h-0 flex-col overflow-hidden p-3 md:p-4 2xl:p-5'>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(2,168,225,0.20),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.14),_transparent_32%)]' />

        <header className='relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3'>
          <div className='flex items-center gap-3 2xl:gap-4'>
            <div className='flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg md:h-16 md:w-16'>
              <Image src='/gm_logo.svg' alt='Gym Master' width={60} height={60} priority />
            </div>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300 md:text-sm'>Gym Master</p>
              <h1 className='text-2xl font-black tracking-tight md:text-3xl 2xl:text-4xl'>Terminal de asistencia</h1>
            </div>
          </div>

          <div className='flex items-center gap-3 text-right'>
            <div>
              <p className='text-sm capitalize text-slate-300'>{formatDate(now)}</p>
              <p className='font-mono text-2xl font-bold text-white md:text-3xl 2xl:text-4xl'>{formatTime(now)}</p>
            </div>
            <Button
              type='button'
              variant='outline'
              onClick={requestFullscreen}
              className='border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white'
              title='Pantalla completa'
            >
              <Maximize2 className='h-5 w-5' />
            </Button>
          </div>
        </header>

        {sessionState.status !== 'ok' && (
          <div
            className={`relative z-20 mt-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
              sessionState.status === 'expired'
                ? 'border-red-400/40 bg-red-500/15 text-red-100'
                : 'border-amber-300/40 bg-amber-400/10 text-amber-100'
            }`}
          >
            <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
              <span>{sessionState.message}</span>
              {sessionState.status === 'expired' && (
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => ensureTerminalSession(true)}
                    className='border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white'
                  >
                    Reintentar renovación
                  </Button>
                  <Button
                    type='button'
                    onClick={() => {
                      logoutSession();
                      logout();
                      window.location.href = '/auth/login/admin';
                    }}
                    className='bg-white text-slate-950 hover:bg-slate-100'
                  >
                    Iniciar sesión
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className='relative z-10 grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden py-3 xl:grid-cols-2 2xl:gap-5'>
          <section
            className={`flex min-h-0 flex-col justify-center overflow-hidden rounded-[1.5rem] border p-4 shadow-2xl transition-all duration-300 md:p-5 2xl:p-6 ${styles.container} ${styles.glow}`}
          >
            {isIdle ? (
              <div className='grid h-full min-h-0 items-center gap-5 lg:grid-cols-[minmax(260px,380px)_1fr] 2xl:grid-cols-[minmax(300px,420px)_1fr]'>
                <div className='mx-auto w-full max-w-[360px] rounded-[1.5rem] border border-cyan-200 bg-white p-4 shadow-2xl dark:border-cyan-600/40 2xl:max-w-[410px]'>
                  <div className='flex aspect-square items-center justify-center rounded-[1.25rem] bg-white'>
                    {qrDataUrl ? (
                      <Image src={qrDataUrl} alt='QR diario para registrar asistencia' width={410} height={410} priority />
                    ) : (
                      <div className='flex flex-col items-center gap-3 text-slate-900'>
                        <QrCode className='h-40 w-40' />
                        <span className='text-sm font-bold'>
                          {qrLoading ? 'Cargando QR diario...' : 'QR no disponible'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className='mt-3 rounded-2xl bg-slate-950 p-3 text-center text-white'>
                    <p className='text-xs font-bold uppercase tracking-[0.24em] text-cyan-300'>Ingreso con celular</p>
                    <p className='mt-1 text-base font-black 2xl:text-lg'>Escaneá este QR</p>
                  </div>
                </div>

                <div className='w-full min-w-0 text-center lg:text-left'>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] 2xl:px-4 2xl:py-2 2xl:text-sm ${styles.badge}`}>
                    <Smartphone className='h-4 w-4' />
                    Terminal listo
                  </span>

                  <h2 className={`mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl 2xl:text-6xl ${styles.title}`}>
                    {event.title}
                  </h2>

                  <p className='mt-4 max-w-4xl text-xl font-semibold leading-relaxed md:text-2xl 2xl:text-3xl'>
                    {event.message}
                  </p>

                  <div className='mt-5 space-y-2 rounded-3xl border border-cyan-200 bg-white/70 p-4 text-left text-slate-800 dark:border-cyan-700/60 dark:bg-slate-900/70 dark:text-slate-100 2xl:mt-6 2xl:space-y-3'>
                    <p className='flex items-start gap-3 text-base font-bold 2xl:text-lg'>
                      <span className='mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm text-white'>1</span>
                      El socio escanea el QR con su celular.
                    </p>
                    <p className='flex items-start gap-3 text-base font-bold 2xl:text-lg'>
                      <span className='mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm text-white'>2</span>
                      Gym Master valida su cuota y registra la asistencia.
                    </p>
                    <p className='flex items-start gap-3 text-base font-bold 2xl:text-lg'>
                      <span className='mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm text-white'>3</span>
                      Esta pantalla muestra bienvenida, deuda o bloqueo.
                    </p>
                  </div>

                  {checkInUrl && (
                    <p className='mt-5 break-all rounded-2xl bg-black/10 p-3 text-xs font-semibold opacity-70 dark:bg-white/10'>
                      Token diario activo: {checkInUrl}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left'>
                <div className={`flex shrink-0 items-center justify-center ${styles.icon}`}>
                  {event.variant === 'error' ? (
                    <TerminalIcon variant={event.variant} />
                  ) : (
                    <ProfileImage
                      foto={event.foto ?? null}
                      alt={event.nombre}
                      size={260}
                      showButton={false}
                    />
                  )}
                </div>

                <div className='w-full min-w-0 flex-1'>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] 2xl:px-4 2xl:py-2 2xl:text-sm ${styles.badge}`}>
                    {event.variant === 'success'
                      ? 'Ingreso autorizado'
                      : event.variant === 'debt'
                      ? 'Cuota pendiente'
                      : event.variant === 'inactive'
                      ? 'Ingreso bloqueado'
                      : 'Atención'}
                  </span>

                  <h2 className={`mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl 2xl:text-6xl ${styles.title}`}>
                    {event.variant === 'success' ? `¡Bienvenido, ${event.nombre}!` : event.title}
                  </h2>

                  {event.variant !== 'success' && (
                    <p className='mt-4 text-3xl font-black md:text-5xl'>{event.nombre}</p>
                  )}

                  <p className='mt-4 max-w-4xl text-xl font-semibold leading-relaxed md:text-2xl 2xl:text-3xl'>
                    {event.message}
                  </p>

                  <div className='mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold opacity-80 lg:justify-start'>
                    <span className='inline-flex items-center gap-2 rounded-full bg-black/10 px-4 py-2 dark:bg-white/10'>
                      <Clock className='h-4 w-4' />
                      Evento: {formatTime(event.timestamp)}
                    </span>
                    {event.idSocio && (
                      <span className='rounded-full bg-black/10 px-4 py-2 dark:bg-white/10'>ID socio: {event.idSocio}</span>
                    )}
                    <span className='rounded-full bg-black/10 px-4 py-2 dark:bg-white/10'>
                      Volviendo al QR en 5 segundos
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className='flex min-h-0 flex-col gap-3 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur md:p-5 2xl:p-6'>
            <div className='flex shrink-0 items-center justify-between gap-3 border-b border-white/10 pb-3'>
              <div>
                <p className='text-sm font-bold uppercase tracking-[0.25em] text-cyan-300'>Monitor externo</p>
                <h3 className='text-2xl font-black leading-tight 2xl:text-3xl'>Actividad reciente</h3>
              </div>
              <Wifi className='h-8 w-8 text-emerald-300' />
            </div>

            {error && (
              <div className='rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100'>
                {error}
              </div>
            )}

            <div className='min-h-0 flex-1 space-y-3 overflow-hidden'>
              {shouldShowTerminalAd && activeTerminalAd ? (
                <div className='overflow-hidden rounded-[1.75rem] border border-white/15 bg-black/35 shadow-2xl'>
                  <div
                    className='relative flex h-[23vh] min-h-[140px] max-h-[225px] items-end rounded-t-[1.5rem] bg-slate-900 bg-center p-3 2xl:h-[25vh] 2xl:max-h-[260px]'
                    style={{
                      backgroundImage: `linear-gradient(to top, rgba(2,6,23,0.92), rgba(2,6,23,0.18)), url("${activeTerminalAd.terminal_imagen_url || '/gm_logo.svg'}")`,
                      backgroundSize: 'cover, contain',
                      backgroundRepeat: 'no-repeat, no-repeat',
                      backgroundPosition: 'center, center',
                    }}
                  >
                    <span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-100 backdrop-blur 2xl:px-4 2xl:py-2 2xl:text-sm'>
                      <Megaphone className='h-4 w-4' /> Aviso
                    </span>
                  </div>
                  <div className='space-y-3 p-5 pt-4 text-center 2xl:space-y-4 2xl:p-6 2xl:pt-5'>
                    <h3 className={`text-3xl font-black leading-tight 2xl:text-4xl ${getTerminalNeonClass(activeTerminalAd.terminal_color_neon)}`}>
                      {activeTerminalAd.asunto || activeTerminalAd.titulo}
                    </h3>
                    <p className='line-clamp-4 whitespace-pre-line text-xl font-semibold leading-relaxed text-slate-100 2xl:text-2xl'>
                      {activeTerminalAd.cuerpo}
                    </p>
                    <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 2xl:text-sm'>
                      El QR permanece activo para asistencia
                    </p>
                  </div>
                </div>
              ) : recentItems.length === 0 ? (
                <p className='rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300'>
                  Todavía no hay ingresos recientes para mostrar.
                </p>
              ) : (
                recentItems.map((item) => (
                  <div key={item.id} className='rounded-2xl border border-white/10 bg-black/25 p-3 shadow-lg 2xl:p-4'>
                    <div className='flex items-center gap-3 2xl:gap-4'>
                      <div className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white p-1 shadow-lg 2xl:h-18 2xl:w-18'>
                        {item.foto ? (
                          <img
                            src={item.foto}
                            alt={item.nombre}
                            className='h-full w-full rounded-full object-cover'
                          />
                        ) : (
                          <Image src='/gm_logo.svg' alt='Gym Master' width={72} height={72} className='h-full w-full rounded-full object-contain' />
                        )}
                      </div>

                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center justify-between gap-3'>
                          <p className='truncate text-xl font-black leading-tight 2xl:text-2xl'>{item.nombre}</p>
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-black uppercase ${
                              item.status === 'success'
                                ? 'bg-emerald-400/20 text-emerald-200'
                                : item.status === 'debt'
                                ? 'bg-red-400/20 text-red-200'
                                : item.status === 'inactive'
                                ? 'bg-amber-400/20 text-amber-200'
                                : 'bg-slate-400/20 text-slate-200'
                            }`}
                          >
                            {item.status === 'success'
                              ? 'OK'
                              : item.status === 'debt'
                              ? 'Deuda'
                              : item.status === 'inactive'
                              ? 'Bloqueado'
                              : 'Info'}
                          </span>
                        </div>
                        <p className='mt-1 font-mono text-base font-bold text-slate-200 2xl:text-lg'>Ingreso: {item.hora}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className='mt-auto shrink-0 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm font-semibold leading-6 text-cyan-50 2xl:p-4 2xl:text-base'>
              Esta pantalla está pensada para el monitor externo. Muestra el QR de ingreso y luego el resultado de la asistencia sin exponer menú, pagos, usuarios ni datos administrativos.
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
