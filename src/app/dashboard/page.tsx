'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import DashboardInitialContent from '@/components/dashboard/DashboardInitialContent';
import CuotasEstadoDashboard from '@/components/dashboard/cuotas/CuotasEstadoDashboard';

import { useEffect, useRef, useState } from 'react';
import QrDisplayModal from '@/components/ui/qr-display';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Megaphone,
  ShieldAlert,
  Users,
  Wrench,
} from 'lucide-react';
import { getAllEquipamientos } from '@/services/equipamientoService';
import { getAllMantenimientos } from '@/services/mantenimientoService';
import {
  getAdherenciaRutinas,
  getEvolucionPromedioRutinas,
  getConcurrenciaAsistencia,
  getTopFallosEquipamiento,
  getEstadoActualEquipamiento,
  getSegmentacionPagos,
  getHistogramaPagos,
  getDragonPyramidLicenseWarning,
} from '@/services/apiClient';

import { Equipamento } from '@/interfaces/equipamiento.interface';
import { Mantenimiento } from '@/interfaces/mantenimiento.interface';
import AsistenciasRecientesTable from '@/components/ui/asistencias-recientes-table';
import ClockCard from '@/components/ui/ClockCard';
import BienvenidaSocio from '@/components/ui/BienvenidaSocio';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useI18n } from '@/i18n/I18nProvider';
import { getToken } from '@/services/storageService';
import { getResolvedGimnasioBranding } from '@/utils/gimnasioBrandingClient';

// ⬇️ IMPORTA EL TIPO QUE EMITE LA TABLA
import type { AsistenciaReciente as AsistenciaRecienteApi } from '@/services/qrService';
import type { DragonPyramidGraceWarning } from '@/utils/dragonPyramidLicenseWarning';

type AdminAccessEventPayload = {
  event_id?: string;
  access_status?: string;
  alert_type?: 'success' | 'debt' | 'inactive' | 'error';
  mensaje_acceso?: string | null;
  socio?: {
    id_socio?: string;
    nombre_completo?: string;
    foto?: string | null;
  } | null;
};

const dashboardCurrencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function formatDashboardCurrency(value: number) {
  return dashboardCurrencyFormatter.format(Number(value ?? 0));
}

function formatDashboardPercent(value?: number | null) {
  const normalized = Number(value ?? 0);
  if (!Number.isFinite(normalized)) return '0%';
  return `${normalized.toFixed(0)}%`;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface MetricaAdherencia {
  anio_mes: string;
  asistencias_registradas: number;
  porcentaje_adherencia: number;
  sesiones_recomendadas: number;
  socio_id: string;
  usuario_id: string;
}
interface MetricaEvolucion {
  id_objetivo: number;
  año_mes: string;
  promedio_asistencias: number;
}
interface MetricaConcurrencia {
  anio: number;
  semana: number;
  sexo: string;
  asistencias: number;
}
interface MetricaFallos {
  id_equipamiento: string;
  nombre: string;
  total_fallos: number;
  costo_total: number;
  ranking: number;
}
interface MetricaEstadoEquipamiento {
  id: string;
  nombre: string;
  estado_semaforo: string;
  costo_ultimos_3m: number;
  mantenimientos_ultimos_3m: number;
  proxima_revision: string;
  ultima_revision: string;
}
interface MetricaSegmentacionPagos {
  anio_mes: string;
  cantidad_pagos: number;
  pagos_leve_retraso: number;
  pagos_morosos: number;
  pagos_puntuales: number;
  porcentaje_morosidad: number;
  porcentaje_puntualidad: number;
  socio_id: string;
  total_descuento: number;
  total_pagado: number;
}
interface MetricaHistogramaPagos {
  anio_mes: string;
  cantidad_pagos: number;
  pagos_leve_retraso: number;
  pagos_morosos: number;
  pagos_puntuales: number;
  porcentaje_morosidad: number;
  porcentaje_puntualidad: number;
  socio_id: string;
  total_descuento: number;
  total_pagado: number;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [equipos, setEquipos] = useState<Equipamento[]>([]);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [mensajesPendientes, setMensajesPendientes] = useState(0);
  const [mensajesSinResponder, setMensajesSinResponder] = useState(0);
  const [loadingMensajesPendientes, setLoadingMensajesPendientes] = useState(false);
  const [gimnasioParametrizacionStatus, setGimnasioParametrizacionStatus] = useState<{
    completa: boolean;
    faltantes: string[];
  } | null>(null);
  const [dragonPyramidLicenseWarning, setDragonPyramidLicenseWarning] =
    useState<DragonPyramidGraceWarning | null>(null);
  const [loadingDragonPyramidWarning, setLoadingDragonPyramidWarning] = useState(false);

  // Overlay de bienvenida
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeData, setWelcomeData] = useState<{
    nombre?: string;
    foto?: string | null;
    id_socio?: string;
    variant?: 'success' | 'debt' | 'inactive';
    message?: string | null;
  }>({});
  const lastAdminAccessEventRef = useRef<string | null>(null);
  const adminWelcomeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [adherenciaRutinas, setAdherenciaRutinas] = useState<
    MetricaAdherencia[]
  >([]);
  const [evolucionRutinas, setEvolucionRutinas] = useState<MetricaEvolucion[]>(
    []
  );
  const [concurrenciaSemanal, setConcurrenciaSemanal] = useState<
    MetricaConcurrencia[]
  >([]);
  const [topFallos, setTopFallos] = useState<MetricaFallos[]>([]);
  const [estadoEquipamiento, setEstadoEquipamiento] = useState<
    MetricaEstadoEquipamiento[]
  >([]);
  const [segmentacionPagos, setSegmentacionPagos] = useState<
    MetricaSegmentacionPagos[]
  >([]);
  const [histogramaPagos, setHistogramaPagos] = useState<
    MetricaHistogramaPagos[]
  >([]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      setLoadingDatos(false);
      return;
    }

    let cancelled = false;

    function withDashboardTimeout<T>(
      promise: Promise<T>,
      label: string,
      timeoutMs = 10000,
    ): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new Error(`Dashboard load timeout: ${label}`));
        }, timeoutMs);

        promise
          .then((value) => {
            window.clearTimeout(timeoutId);
            resolve(value);
          })
          .catch((error) => {
            window.clearTimeout(timeoutId);
            reject(error);
          });
      });
    }

    async function fetchData() {
      setLoadingDatos(true);

      try {
        const [equiposResult, mantenimientosResult] = await Promise.allSettled([
          withDashboardTimeout(getAllEquipamientos(), 'equipamientos'),
          withDashboardTimeout(getAllMantenimientos(), 'mantenimientos'),
        ]);

        if (cancelled) return;

        setEquipos(
          equiposResult.status === 'fulfilled' ? equiposResult.value || [] : [],
        );
        setMantenimientos(
          mantenimientosResult.status === 'fulfilled'
            ? mantenimientosResult.value || []
            : [],
        );

        if (user?.rol === 'admin') {
          const [
            adherenciaResult,
            evolucionResult,
            concurrenciaResult,
            fallosResult,
            estadoResult,
            segmentacionResult,
            histogramaResult,
          ] = await Promise.allSettled([
            withDashboardTimeout(getAdherenciaRutinas(), 'adherencia rutinas'),
            withDashboardTimeout(getEvolucionPromedioRutinas(), 'evolución rutinas'),
            withDashboardTimeout(getConcurrenciaAsistencia('semanal'), 'concurrencia asistencia'),
            withDashboardTimeout(getTopFallosEquipamiento(), 'top fallos equipamiento'),
            withDashboardTimeout(getEstadoActualEquipamiento(), 'estado actual equipamiento'),
            withDashboardTimeout(getSegmentacionPagos(), 'segmentación pagos'),
            withDashboardTimeout(getHistogramaPagos(), 'histograma pagos'),
          ]);

          if (cancelled) return;

          const adherencia =
            adherenciaResult.status === 'fulfilled' ? adherenciaResult.value : null;
          const evolucion =
            evolucionResult.status === 'fulfilled' ? evolucionResult.value : null;
          const concurrencia =
            concurrenciaResult.status === 'fulfilled' ? concurrenciaResult.value : null;
          const fallos =
            fallosResult.status === 'fulfilled' ? fallosResult.value : null;
          const estado =
            estadoResult.status === 'fulfilled' ? estadoResult.value : null;
          const segmentacion =
            segmentacionResult.status === 'fulfilled' ? segmentacionResult.value : null;
          const histograma =
            histogramaResult.status === 'fulfilled' ? histogramaResult.value : null;

          setAdherenciaRutinas(
            adherencia?.ok && adherencia.data ? adherencia.data : [],
          );
          setEvolucionRutinas(
            evolucion?.ok && evolucion.data ? evolucion.data : [],
          );
          setConcurrenciaSemanal(
            concurrencia?.ok && concurrencia.data ? concurrencia.data : [],
          );
          setTopFallos(fallos?.ok && fallos.data ? fallos.data : []);
          setEstadoEquipamiento(estado?.ok && estado.data ? estado.data : []);
          setSegmentacionPagos(
            segmentacion?.ok && segmentacion.data ? segmentacion.data : [],
          );
          setHistogramaPagos(
            histograma?.ok && histograma.data ? histograma.data : [],
          );
        }
      } catch (error) {
        console.error('Error cargando dashboard:', error);

        if (!cancelled) {
          setEquipos([]);
          setMantenimientos([]);
          setAdherenciaRutinas([]);
          setEvolucionRutinas([]);
          setConcurrenciaSemanal([]);
          setTopFallos([]);
          setEstadoEquipamiento([]);
          setSegmentacionPagos([]);
          setHistogramaPagos([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingDatos(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isInitialized, user?.rol]);

  useEffect(() => {
    if (user?.rol !== 'admin') {
      setMensajesPendientes(0);
      setMensajesSinResponder(0);
      return;
    }

    let cancelled = false;

    async function fetchMensajesPendientes() {
      try {
        setLoadingMensajesPendientes(true);

        const token = getToken();
        const response = await fetch('/api/admin/socios-mensajes/resumen', {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          if (!cancelled) {
            setMensajesPendientes(0);
            setMensajesSinResponder(0);
          }
          return;
        }

        const payload = await response.json();
        const resumen = payload?.data ?? {};

        if (!cancelled) {
          setMensajesPendientes(Number(resumen.nuevos ?? 0));
          setMensajesSinResponder(Number(resumen.sin_responder ?? 0));
        }
      } catch (error) {
        console.error('Error cargando resumen de mensajes:', error);
        if (!cancelled) {
          setMensajesPendientes(0);
          setMensajesSinResponder(0);
        }
      } finally {
        if (!cancelled) setLoadingMensajesPendientes(false);
      }
    }

    fetchMensajesPendientes();

    const interval = window.setInterval(fetchMensajesPendientes, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user?.rol]);


  useEffect(() => {
    if (user?.rol !== 'admin') {
      setGimnasioParametrizacionStatus(null);
      return;
    }

    let cancelled = false;

    async function fetchGimnasioParametrizacionStatus() {
      try {
        const branding = await getResolvedGimnasioBranding();
        if (!cancelled) {
          setGimnasioParametrizacionStatus({
            completa: branding.parametrizacionCompleta,
            faltantes: branding.camposFaltantes,
          });
        }
      } catch {
        if (!cancelled) {
          setGimnasioParametrizacionStatus({
            completa: false,
            faltantes: [t('adminDashboard.gymSetup.defaultMissingField')],
          });
        }
      }
    }

    fetchGimnasioParametrizacionStatus();

    return () => {
      cancelled = true;
    };
  }, [t, user?.rol]);


  useEffect(() => {
    if (user?.rol !== 'admin') {
      setDragonPyramidLicenseWarning(null);
      return;
    }

    let cancelled = false;

    async function fetchDragonPyramidLicenseWarning() {
      try {
        setLoadingDragonPyramidWarning(true);
        const response = await getDragonPyramidLicenseWarning();
        if (!cancelled) {
          setDragonPyramidLicenseWarning(response.ok ? response.data ?? null : null);
        }
      } catch (error) {
        console.error('Error cargando aviso de licencia Dragon Pyramid:', error);
        if (!cancelled) setDragonPyramidLicenseWarning(null);
      } finally {
        if (!cancelled) setLoadingDragonPyramidWarning(false);
      }
    }

    fetchDragonPyramidLicenseWarning();

    const interval = window.setInterval(fetchDragonPyramidLicenseWarning, 300000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user?.rol]);

  const equiposTotales = equipos.length;
  const equiposEnRevision = equipos.filter(
    (e) => e.estado === 'en mantenimiento'
  ).length;
  const equiposFueraDeServicio = equipos.filter(
    (e) => e.estado === 'fuera de servicio'
  ).length;
  const proximosMantenimientos = equipos.filter((e) => {
    if (!e.proxima_revision) return false;
    const fecha = new Date(e.proxima_revision);
    const hoy = new Date();
    const en30dias = new Date();
    en30dias.setDate(hoy.getDate() + 30);
    return fecha >= hoy && fecha <= en30dias;
  }).length;
  const mesActual = new Date().toISOString().slice(0, 7);
  const costoMantenimientoMensual = mantenimientos
    .filter(
      (m) =>
        m.fecha_mantenimiento && m.fecha_mantenimiento.startsWith(mesActual)
    )
    .reduce((acc, m) => acc + (m.costo || 0), 0);


  const userType = user?.rol;
  const latestPaymentSegment =
    segmentacionPagos.length > 0
      ? segmentacionPagos[segmentacionPagos.length - 1]
      : null;
  const latestPaymentHistogram =
    histogramaPagos.length > 0
      ? histogramaPagos[histogramaPagos.length - 1]
      : null;
  const adminOperationalAlerts =
    mensajesSinResponder +
    equiposEnRevision +
    equiposFueraDeServicio +
    proximosMantenimientos +
    (dragonPyramidLicenseWarning?.visible ? 1 : 0) +
    (gimnasioParametrizacionStatus && !gimnasioParametrizacionStatus.completa
      ? 1
      : 0);
  const adminHealthLabel =
    adminOperationalAlerts === 0
      ? t('adminDashboard.health.stable')
      : adminOperationalAlerts <= 3
      ? t('adminDashboard.health.moderate')
      : t('adminDashboard.health.highPriority');

  const showAdminAccessFeedback = (payload: {
    event_id?: string;
    nombre?: string;
    foto?: string | null;
    id_socio?: string;
    variant?: 'success' | 'debt' | 'inactive';
    message?: string | null;
  }) => {
    const eventId =
      payload.event_id ||
      `${payload.variant ?? 'success'}-${payload.id_socio ?? payload.nombre}-${Date.now()}`;

    if (lastAdminAccessEventRef.current === eventId) return;
    lastAdminAccessEventRef.current = eventId;

    if (adminWelcomeTimeoutRef.current) {
      clearTimeout(adminWelcomeTimeoutRef.current);
    }

    setWelcomeData({
      nombre: payload.nombre ?? t('socioDashboard.greeting.memberRole'),
      foto: payload.foto ?? null,
      id_socio: payload.id_socio,
      variant: payload.variant ?? 'success',
      message: payload.message ?? null,
    });

    setShowWelcome(true);
    adminWelcomeTimeoutRef.current = setTimeout(() => {
      setShowWelcome(false);
    }, 3500);
  };

  const handleNewAsistencia = (a: AsistenciaRecienteApi) => {
    const variant =
      a.alert_type === 'debt' || a.access_status === 'deuda'
        ? 'debt'
        : a.alert_type === 'inactive' || a.access_status === 'desactivado'
        ? 'inactive'
        : 'success';

    showAdminAccessFeedback({
      event_id: `asistencia-${a.id}-${variant}`,
      nombre: a.socio?.nombre_completo ?? t('socioDashboard.greeting.memberRole'),
      foto: a.socio?.foto ?? null,
      id_socio: a.socio?.id_socio ?? a.socio_id,
      variant,
      message:
        variant === 'debt'
          ? a.mensaje_acceso ||
            t('adminDashboard.accessFeedback.debtMessage')
          : variant === 'inactive'
          ? a.mensaje_acceso ||
            t('adminDashboard.accessFeedback.inactiveMessage')
          : null,
    });
  };

  useEffect(() => {
    if (user?.rol !== 'admin') return;

    const channel = supabaseBrowser
      .channel('gym-master-asistencia-access-events')
      .on(
        'broadcast',
        { event: 'access_event' },
        ({ payload }: { payload: AdminAccessEventPayload }) => {
          const variant =
            payload.alert_type === 'inactive' ||
            payload.access_status === 'desactivado'
              ? 'inactive'
              : payload.alert_type === 'debt' ||
                payload.access_status === 'deuda'
              ? 'debt'
              : 'success';

          if (variant === 'success') return;

          showAdminAccessFeedback({
            event_id: payload.event_id,
            nombre: payload.socio?.nombre_completo ?? t('socioDashboard.greeting.memberRole'),
            foto: payload.socio?.foto ?? null,
            id_socio: payload.socio?.id_socio,
            variant,
            message:
              payload.mensaje_acceso ||
              t('adminDashboard.accessFeedback.debtMessage'),
          });
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);

      if (adminWelcomeTimeoutRef.current) {
        clearTimeout(adminWelcomeTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.rol]);

  if (!isInitialized) {
    return (
      <div className='flex items-center justify-center h-screen'>
        {t('common.loadingDashboard')}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='gm-dashboard-scroll-root relative flex min-h-[100dvh] w-full items-stretch overflow-x-hidden'>
        {showQr && (
          <div
            className='fixed inset-0 z-50 transition-opacity duration-300 bg-black'
            style={{ pointerEvents: 'auto', opacity: 1 }}
          />
        )}
        <AppSidebar />
        <div className='grid h-[100dvh] max-h-[100dvh] min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden w-full'>
          <AppHeader title={t('adminDashboard.headerTitle')} />

          {showQr && (
            <div className='fixed inset-0 z-[60] flex items-center justify-center p-6'>
              <div className='grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 h-[85vh]'>
                {/* Columna izquierda: QR */}
                <div className='flex flex-col w-full h-full p-4 overflow-hidden border rounded-lg shadow-xl bg-background'>
                  <QrDisplayModal
                    open={true}
                    onClose={() => setShowQr(false)}
                    embedded
                  />
                </div>

                {/* Columna derecha: asistencias + reloj */}
                <div className='flex flex-col w-full h-full p-4 overflow-auto border rounded-lg shadow-xl bg-background'>
                  <AsistenciasRecientesTable
                    onNewAsistencia={handleNewAsistencia}
                  />
                  <ClockCard />
                </div>
              </div>

              {/* Overlay de bienvenida por arriba de todo */}
              {showWelcome && (
                <div className='fixed inset-0 z-[80] flex items-center justify-center'>
                  <BienvenidaSocio
                    nombre={welcomeData.nombre}
                    foto={welcomeData.foto ?? undefined}
                    id_socio={welcomeData.id_socio}
                    isAdminView
                    variant={welcomeData.variant}
                    message={welcomeData.message}
                    onClose={() => setShowWelcome(false)}
                  />
                </div>
              )}
            </div>
          )}

          <main data-gm-dashboard-content='true' className='min-h-0 w-full min-w-0 max-w-full overflow-y-auto overflow-x-hidden px-3 py-4 pb-8 space-y-5 sm:px-4 md:px-8 md:py-6 md:pb-10 md:space-y-6'>
            {(userType === 'socio' || userType === 'usuario') && (
              <DashboardInitialContent />
            )}

            {userType === 'admin' && (
              <>
                {dragonPyramidLicenseWarning?.visible && (
                  <Card
                    className={`border shadow-sm ${
                      dragonPyramidLicenseWarning.severity === 'critical'
                        ? 'border-red-300 bg-red-50 text-red-950 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-50'
                        : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-50'
                    }`}
                  >
                    <CardContent className='flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-start md:justify-between'>
                      <div className='flex min-w-0 gap-3'>
                        <AlertTriangle className='mt-1 h-5 w-5 shrink-0' />
                        <div className='min-w-0'>
                          <p className='text-xs font-semibold uppercase tracking-[0.22em] opacity-80'>
                            {t('adminDashboard.license.eyebrow')}
                          </p>
                          <h2 className='mt-1 text-base font-black sm:text-lg'>
                            {dragonPyramidLicenseWarning.title}
                          </h2>
                          <p className='mt-1 text-sm leading-6'>
                            {dragonPyramidLicenseWarning.message}
                          </p>
                          <ul className='mt-2 list-disc space-y-1 pl-4 text-xs leading-5 sm:text-sm'>
                            {dragonPyramidLicenseWarning.details.slice(0, 4).map((detail) => (
                              <li key={detail}>{detail}</li>
                            ))}
                          </ul>
                          <p className='mt-2 text-xs opacity-80'>
                            {t('adminDashboard.license.nonBlockingNote')}
                          </p>
                        </div>
                      </div>
                      <div className='rounded-xl border border-current/20 px-3 py-2 text-xs font-semibold md:max-w-[240px]'>
                        {t('adminDashboard.license.client', { client: dragonPyramidLicenseWarning.clientName ?? t('adminDashboard.license.defaultClient') })}
                        {loadingDragonPyramidWarning ? ` · ${t('adminDashboard.common.updating')}` : ''}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {gimnasioParametrizacionStatus && !gimnasioParametrizacionStatus.completa && (
                  <Card className='border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-50'>
                    <CardContent className='flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between'>
                      <div className='flex gap-3'>
                        <AlertTriangle className='mt-1 h-5 w-5 shrink-0 text-amber-600' />
                        <div>
                          <h2 className='text-base font-semibold'>{t('adminDashboard.gymSetup.title')}</h2>
                          <p className='mt-1 text-sm leading-6'>
                            {t('adminDashboard.gymSetup.description')}
                          </p>
                          <p className='mt-2 text-xs'>
                            {t('adminDashboard.gymSetup.missingFields', { fields: gimnasioParametrizacionStatus.faltantes.slice(0, 6).join(', ') })}
                            {gimnasioParametrizacionStatus.faltantes.length > 6 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        type='button'
                        variant='outline'
                        className='w-full border-amber-300 bg-white text-amber-900 hover:bg-amber-100 sm:w-auto'
                        onClick={() => router.push('/dashboard/gimnasio-parametrizacion')}
                      >
                        {t('adminDashboard.gymSetup.action')}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <section className='rounded-2xl border bg-gradient-to-r from-slate-950 via-slate-900 to-sky-900 p-4 text-white shadow-sm sm:p-6'>
                  <div className='flex flex-col justify-between gap-5 xl:flex-row xl:items-center'>
                    <div className='space-y-2'>
                      <p className='text-xs font-semibold uppercase tracking-[0.24em] text-sky-200'>
                        {t('adminDashboard.hero.eyebrow')}
                      </p>
                      <h1 className='text-2xl font-bold leading-tight sm:text-3xl'>{t('adminDashboard.hero.title')}</h1>
                      <p className='max-w-3xl text-sm leading-6 text-slate-200'>
                        {t('adminDashboard.hero.description')}
                      </p>
                    </div>
                    <div className='grid grid-cols-1 gap-2 sm:flex sm:flex-wrap'>
                      <Button
                        className='w-full bg-[#02a8e1] text-white hover:bg-[#0288b1] sm:w-auto'
                        onClick={() => {
                          setShowQr(true);
                          const url = new URL(window.location.href);
                          url.searchParams.set('qr', 'open');
                          window.history.pushState({}, '', url);
                        }}
                      >
                        {t('adminDashboard.hero.actions.dayQr')}
                      </Button>
                      <Button
                        variant='secondary'
                        className='w-full sm:w-auto'
                        onClick={() => window.open('/dashboard/asistencias/terminal', '_blank', 'noopener,noreferrer')}
                      >
                        {t('adminDashboard.hero.actions.terminal')}
                      </Button>
                      <Button variant='secondary' className='w-full sm:w-auto' onClick={() => router.push('/dashboard/finanzas')}>
                        {t('adminDashboard.hero.actions.financeBi')}
                      </Button>
                      <Button variant='secondary' className='w-full sm:w-auto' onClick={() => router.push('/dashboard/comercial')}>
                        {t('adminDashboard.hero.actions.commercial')}
                      </Button>
                      <Button variant='secondary' className='w-full sm:w-auto' onClick={() => router.push('/dashboard/bi-socios-demografia-promociones')}>
                        {t('adminDashboard.hero.actions.memberBi')}
                      </Button>
                    </div>
                  </div>

                  <div className='mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                    <div className='rounded-xl border border-white/10 bg-white/10 p-4'>
                      <div className='flex items-center gap-2 text-sky-100'>
                        <Megaphone className='h-4 w-4' />
                        <p className='text-sm font-medium'>{t('adminDashboard.metrics.unansweredMessages')}</p>
                      </div>
                      <p className='mt-2 text-2xl font-bold'>{loadingMensajesPendientes ? '...' : mensajesSinResponder}</p>
                    </div>
                    <div className='rounded-xl border border-white/10 bg-white/10 p-4'>
                      <div className='flex items-center gap-2 text-sky-100'>
                        <Wrench className='h-4 w-4' />
                        <p className='text-sm font-medium'>{t('adminDashboard.metrics.equipmentInReview')}</p>
                      </div>
                      <p className='mt-2 text-2xl font-bold'>{equiposEnRevision}</p>
                    </div>
                    <div className='rounded-xl border border-white/10 bg-white/10 p-4'>
                      <div className='flex items-center gap-2 text-sky-100'>
                        <BarChart3 className='h-4 w-4' />
                        <p className='text-sm font-medium'>{t('adminDashboard.metrics.upcomingMaintenance')}</p>
                      </div>
                      <p className='mt-2 text-2xl font-bold'>{proximosMantenimientos}</p>
                    </div>
                    <div className='rounded-xl border border-white/10 bg-white/10 p-4'>
                      <div className='flex items-center gap-2 text-sky-100'>
                        <DollarSign className='h-4 w-4' />
                        <p className='text-sm font-medium'>{t('adminDashboard.metrics.monthlyMaintenanceCost')}</p>
                      </div>
                      <p className='mt-2 text-2xl font-bold'>{formatDashboardCurrency(costoMantenimientoMensual)}</p>
                    </div>
                  </div>
                </section>

                <section className='grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
                  <Card className='border-sky-200/70 bg-sky-50/70 dark:border-sky-900/60 dark:bg-sky-950/30'>
                    <CardContent className='flex items-start gap-3 p-4'>
                      <div className='rounded-2xl bg-sky-500/10 p-2 text-sky-600 dark:text-sky-300'>
                        <Activity className='h-5 w-5' />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
                          {t('adminDashboard.cards.operationalStatus')}
                        </p>
                        <h3 className='mt-1 text-xl font-black'>{adminHealthLabel}</h3>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {t('adminDashboard.cards.alertSignals', { count: adminOperationalAlerts })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30'>
                    <CardContent className='flex items-start gap-3 p-4'>
                      <div className='rounded-2xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-300'>
                        <CheckCircle2 className='h-5 w-5' />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
                          {t('adminDashboard.cards.paymentPunctuality')}
                        </p>
                        <h3 className='mt-1 text-xl font-black'>
                          {latestPaymentSegment
                            ? formatDashboardPercent(latestPaymentSegment.porcentaje_puntualidad)
                            : t('adminDashboard.common.noData')}
                        </h3>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {t('adminDashboard.cards.latestCut', { period: latestPaymentSegment?.anio_mes ?? t('adminDashboard.common.pendingData') })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='border-violet-200/70 bg-violet-50/70 dark:border-violet-900/60 dark:bg-violet-950/30'>
                    <CardContent className='flex items-start gap-3 p-4'>
                      <div className='rounded-2xl bg-violet-500/10 p-2 text-violet-600 dark:text-violet-300'>
                        <Users className='h-5 w-5' />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
                          {t('adminDashboard.cards.periodIncome')}
                        </p>
                        <h3 className='mt-1 text-xl font-black'>
                          {latestPaymentHistogram
                            ? formatDashboardCurrency(latestPaymentHistogram.total_pagado)
                            : formatDashboardCurrency(0)}
                        </h3>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {t('adminDashboard.cards.latestHistogramBase')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='border-amber-200/70 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30'>
                    <CardContent className='flex items-start gap-3 p-4'>
                      <div className='rounded-2xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-300'>
                        <ShieldAlert className='h-5 w-5' />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
                          {t('adminDashboard.cards.technicalRisk')}
                        </p>
                        <h3 className='mt-1 text-xl font-black'>{equiposFueraDeServicio}</h3>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {t('adminDashboard.cards.outOfServiceDescription')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section className='rounded-2xl border bg-card p-4 shadow-sm sm:p-5'>
                  <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='min-w-0'>
                      <p className='text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground'>
                        {t('adminDashboard.quickAccess.eyebrow')}
                      </p>
                      <h2 className='mt-1 text-lg font-black sm:text-xl'>
                        {t('adminDashboard.quickAccess.title')}
                      </h2>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {t('adminDashboard.quickAccess.description')}
                      </p>
                    </div>
                    <div className='grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-3'>
                      {[
                        { label: t('adminDashboard.quickAccess.members'), href: '/dashboard/socios' },
                        { label: t('adminDashboard.quickAccess.payments'), href: '/dashboard/pagos' },
                        { label: t('adminDashboard.quickAccess.messages'), href: '/dashboard/mensajes-admin' },
                        { label: t('adminDashboard.quickAccess.equipment'), href: '/dashboard/equipamientos' },
                        { label: t('adminDashboard.quickAccess.commercial'), href: '/dashboard/comercial/kiosco' },
                        { label: t('adminDashboard.quickAccess.parameters'), href: '/dashboard/gimnasio-parametrizacion' },
                      ].map((item) => (
                        <Button
                          key={item.href}
                          type='button'
                          variant='outline'
                          className='w-full justify-between gap-3'
                          onClick={() => router.push(item.href)}
                        >
                          <span>{item.label}</span>
                          <ArrowRight className='h-4 w-4' />
                        </Button>
                      ))}
                    </div>
                  </div>
                </section>

                <div className='grid min-w-0 grid-cols-1 gap-4 mt-6 md:grid-cols-2 xl:grid-cols-3'>
                  <CuotasEstadoDashboard />

                  <Card
                    className='transition-shadow cursor-pointer hover:shadow-md'
                    onClick={() => router.push('/dashboard/mensajes-admin')}
                  >
                    <CardHeader>
                      <CardTitle>{t('adminDashboard.inbox.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <div className='text-3xl font-bold'>
                            {loadingMensajesPendientes ? '...' : mensajesPendientes}
                          </div>
                          <p className='text-sm text-muted-foreground'>
                            {t('adminDashboard.inbox.newWaiting')}
                          </p>
                        </div>
                        <div>
                          <div className='text-3xl font-bold'>
                            {loadingMensajesPendientes ? '...' : mensajesSinResponder}
                          </div>
                          <p className='text-sm text-muted-foreground'>
                            {t('adminDashboard.inbox.unanswered')}
                          </p>
                        </div>
                      </div>
                      <p className='mt-3 text-xs text-muted-foreground'>
                        {t('adminDashboard.inbox.description')}
                      </p>
                      <Button
                        type='button'
                        variant='outline'
                        className='mt-4 w-full sm:w-auto'
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push('/dashboard/mensajes-admin');
                        }}
                      >
                        {t('adminDashboard.inbox.action')}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('adminDashboard.equipment.totalTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-3xl font-bold'>{equiposTotales}</div>
                      <p className='text-sm text-muted-foreground'>
                        {t('adminDashboard.equipment.totalDescription')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('adminDashboard.equipment.reviewTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-3xl font-bold'>
                        {equiposEnRevision}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {t('adminDashboard.equipment.reviewDescription')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('adminDashboard.equipment.maintenanceTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-3xl font-bold'>
                        {proximosMantenimientos}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {t('adminDashboard.equipment.maintenanceDescription')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('adminDashboard.equipment.statusTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className='h-[260px] overflow-y-auto sm:h-[300px] md:h-[420px] lg:h-[300px]'>
                      <div className='h-full min-h-[240px]'>
                        {estadoEquipamiento.length === 0 ? (
                          <div className='flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground'>
                            <ClipboardList className='mb-2 h-7 w-7 opacity-60' />
                            {t('adminDashboard.equipment.noEquipmentData')}
                          </div>
                        ) : (
                        <Pie
                          data={{
                            labels: estadoEquipamiento.map(
                              (item) => item.nombre
                            ),
                            datasets: [
                              {
                                label: t('adminDashboard.charts.last3MonthsCost'),
                                data: estadoEquipamiento.map(
                                  (item) => item.costo_ultimos_3m
                                ),
                                backgroundColor: [
                                  '#0088FE',
                                  '#00C49F',
                                  '#FFBB28',
                                  '#FF8042',
                                  '#8884d8',
                                  '#82ca9d',
                                ],
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom' as const,
                                labels: { usePointStyle: true, padding: 10 },
                              },
                            },
                          }}
                        />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='md:col-span-2 xl:col-span-3'>
                    <CardHeader>
                      <CardTitle>{t('adminDashboard.charts.topFailures')}</CardTitle>
                    </CardHeader>
                    <CardContent className='h-[260px] sm:h-[300px]'>
                      {topFallos.length === 0 ? (
                        <div className='flex h-full flex-col items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground'>
                          <ClipboardList className='mb-2 h-7 w-7 opacity-60' />
                          {t('adminDashboard.charts.noFailures')}
                        </div>
                      ) : (
                      <Bar
                        data={{
                          labels: topFallos.map((item) => item.nombre),
                          datasets: [
                            {
                              label: t('adminDashboard.charts.totalFailures'),
                              data: topFallos.map((item) => item.total_fallos),
                              backgroundColor: '#FF8042',
                              borderColor: '#FF8042',
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'top' as const } },
                          scales: { y: { beginAtZero: true } },
                        }}
                      />
                      )}
                    </CardContent>
                  </Card>

                  <Card className='md:col-span-2 xl:col-span-3'>
                    <CardHeader>
                      <CardTitle>{t('adminDashboard.charts.paymentSegmentation')}</CardTitle>
                    </CardHeader>
                    <CardContent className='h-[260px] sm:h-[300px]'>
                      {segmentacionPagos.length === 0 ? (
                        <div className='flex h-full flex-col items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground'>
                          <ClipboardList className='mb-2 h-7 w-7 opacity-60' />
                          {t('adminDashboard.charts.noPaymentsSegmentation')}
                        </div>
                      ) : (
                      <Pie
                        data={{
                          labels: segmentacionPagos.map((item) => item.anio_mes),
                          datasets: [
                            {
                              label: t('adminDashboard.charts.totalPaid'),
                              data: segmentacionPagos.map(
                                (item) => item.total_pagado
                              ),
                              backgroundColor: [
                                '#0088FE',
                                '#00C49F',
                                '#FFBB28',
                                '#FF8042',
                                '#8884d8',
                                '#82ca9d',
                              ],
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'bottom' as const } },
                        }}
                      />
                      )}
                    </CardContent>
                  </Card>

                  <Card className='md:col-span-2 xl:col-span-3'>
                    <CardHeader>
                      <CardTitle>{t('adminDashboard.charts.paymentHistogram')}</CardTitle>
                    </CardHeader>
                    <CardContent className='h-[260px] sm:h-[300px]'>
                      {histogramaPagos.length === 0 ? (
                        <div className='flex h-full flex-col items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground'>
                          <ClipboardList className='mb-2 h-7 w-7 opacity-60' />
                          {t('adminDashboard.charts.noPaymentHistory')}
                        </div>
                      ) : (
                      <Bar
                        data={{
                          labels: histogramaPagos.map((item) => item.anio_mes),
                          datasets: [
                            {
                              label: t('adminDashboard.charts.totalPaid'),
                              data: histogramaPagos.map(
                                (item) => item.total_pagado
                              ),
                              backgroundColor: '#82ca9d',
                              borderColor: '#82ca9d',
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'top' as const } },
                          scales: { y: { beginAtZero: true } },
                        }}
                      />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </main>
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}