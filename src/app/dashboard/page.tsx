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
} from '@/services/apiClient';

import { Equipamento } from '@/interfaces/equipamiento.interface';
import { Mantenimiento } from '@/interfaces/mantenimiento.interface';
import AsistenciasRecientesTable from '@/components/ui/asistencias-recientes-table';
import ClockCard from '@/components/ui/ClockCard';
import BienvenidaSocio from '@/components/ui/BienvenidaSocio';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { getToken } from '@/services/storageService';

// ⬇️ IMPORTA EL TIPO QUE EMITE LA TABLA
import type { AsistenciaReciente as AsistenciaRecienteApi } from '@/services/qrService';

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
    async function fetchData() {
      setLoadingDatos(true);
      const eqs = await getAllEquipamientos();
      const mants = await getAllMantenimientos();
      setEquipos(eqs || []);
      setMantenimientos(mants || []);

      if (user?.rol === 'admin') {
        const [
          adherencia,
          evolucion,
          concurrencia,
          fallos,
          estado,
          segmentacion,
          histograma,
        ] = await Promise.all([
          getAdherenciaRutinas(),
          getEvolucionPromedioRutinas(),
          getConcurrenciaAsistencia('semanal'),
          getTopFallosEquipamiento(),
          getEstadoActualEquipamiento(),
          getSegmentacionPagos(),
          getHistogramaPagos(),
        ]);

        setAdherenciaRutinas(
          adherencia.ok && adherencia.data ? adherencia.data : []
        );
        setEvolucionRutinas(
          evolucion.ok && evolucion.data ? evolucion.data : []
        );
        setConcurrenciaSemanal(
          concurrencia.ok && concurrencia.data ? concurrencia.data : []
        );
        setTopFallos(fallos.ok && fallos.data ? fallos.data : []);
        setEstadoEquipamiento(estado.ok && estado.data ? estado.data : []);
        setSegmentacionPagos(
          segmentacion.ok && segmentacion.data ? segmentacion.data : []
        );
        setHistogramaPagos(
          histograma.ok && histograma.data ? histograma.data : []
        );
      }

      setLoadingDatos(false);
    }
    fetchData();
  }, [user?.rol]);

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
      nombre: payload.nombre ?? 'Socio',
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
      nombre: a.socio?.nombre_completo ?? 'Socio',
      foto: a.socio?.foto ?? null,
      id_socio: a.socio?.id_socio ?? a.socio_id,
      variant,
      message:
        variant === 'debt'
          ? a.mensaje_acceso ||
            'El socio debe dirigirse a administración para regularizar su situación.'
          : variant === 'inactive'
          ? a.mensaje_acceso ||
            'El socio está desactivado. Debe dirigirse a administración para regularizar su situación.'
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
            nombre: payload.socio?.nombre_completo ?? 'Socio',
            foto: payload.socio?.foto ?? null,
            id_socio: payload.socio?.id_socio,
            variant,
            message:
              payload.mensaje_acceso ||
              'El socio debe dirigirse a administración para regularizar su situación.',
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

  if (loadingDatos || !isInitialized) {
    return (
      <div className='flex items-center justify-center h-screen'>
        Cargando dashboard...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='relative flex w-full min-h-screen'>
        {showQr && (
          <div
            className='fixed inset-0 z-50 transition-opacity duration-300 bg-black'
            style={{ pointerEvents: 'auto', opacity: 1 }}
          />
        )}
        <AppSidebar />
        <div className='flex flex-col flex-1 w-full'>
          <AppHeader title='Dashboard' />

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

          <main className='flex-1 w-full max-w-full px-4 py-6 space-y-6 md:px-8'>
            {(userType === 'socio' || userType === 'usuario') && (
              <DashboardInitialContent />
            )}

            {userType === 'admin' && (
              <>
                <div className='p-5'>
                  <h1 className='mb-4 text-3xl font-bold'>
                    Bienvenido al Panel de Control
                  </h1>
                  <p className='text-lg text-gray-700 dark:text-gray-300'>
                    Este es tu panel de control administrativo.
                  </p>
                  <div className='flex items-center justify-start w-full mt-6'>
                    <Button
                      className='px-6 py-3 text-base font-medium'
                      onClick={() => {
                        setShowQr(true);
                        const url = new URL(window.location.href);
                        url.searchParams.set('qr', 'open');
                        window.history.pushState({}, '', url);
                      }}
                    >
                      QR del Día
                    </Button>
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 xl:grid-cols-3'>
                  <CuotasEstadoDashboard />

                  <Card
                    className='transition-shadow cursor-pointer hover:shadow-md'
                    onClick={() => router.push('/dashboard/mensajes-admin')}
                  >
                    <CardHeader>
                      <CardTitle>Bandeja de entrada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <div className='text-3xl font-bold'>
                            {loadingMensajesPendientes ? '...' : mensajesPendientes}
                          </div>
                          <p className='text-sm text-muted-foreground'>
                            Nuevos / en espera
                          </p>
                        </div>
                        <div>
                          <div className='text-3xl font-bold'>
                            {loadingMensajesPendientes ? '...' : mensajesSinResponder}
                          </div>
                          <p className='text-sm text-muted-foreground'>
                            Sin responder
                          </p>
                        </div>
                      </div>
                      <p className='mt-3 text-xs text-muted-foreground'>
                        Sin responder incluye mensajes pendientes y leídos que todavía no tienen respuesta.
                      </p>
                      <Button
                        type='button'
                        variant='outline'
                        className='mt-4'
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push('/dashboard/mensajes-admin');
                        }}
                      >
                        Abrir bandeja
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Equipos Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-3xl font-bold'>{equiposTotales}</div>
                      <p className='text-sm text-muted-foreground'>
                        Total de equipos registrados
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Equipos en Revisión</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-3xl font-bold'>
                        {equiposEnRevision}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        Actualmente en proceso de revisión
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Próximos Mantenimientos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-3xl font-bold'>
                        {proximosMantenimientos}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        Equipos con mantenimiento programado
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Estado de Equipamiento</CardTitle>
                    </CardHeader>
                    <CardContent className='lg:h-[300px] md:h-[600px] overflow-y-auto'>
                      <div className='lg:h-[500px] md:h-[500px]'>
                        <Pie
                          data={{
                            labels: estadoEquipamiento.map(
                              (item) => item.nombre
                            ),
                            datasets: [
                              {
                                label: 'Costo Últimos 3M',
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
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='col-span-12 lg:col-span-6'>
                    <CardHeader>
                      <CardTitle>Top Fallos de Equipamiento</CardTitle>
                    </CardHeader>
                    <CardContent className='h-[300px]'>
                      <Bar
                        data={{
                          labels: topFallos.map((item) => item.nombre),
                          datasets: [
                            {
                              label: 'Total Fallos',
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
                    </CardContent>
                  </Card>

                  <Card className='col-span-12 lg:col-span-6'>
                    <CardHeader>
                      <CardTitle>Segmentación de Pagos</CardTitle>
                    </CardHeader>
                    <CardContent className='h-[300px]'>
                      <Pie
                        data={{
                          labels: segmentacionPagos.map((item) => item.anio_mes),
                          datasets: [
                            {
                              label: 'Total Pagado',
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
                    </CardContent>
                  </Card>

                  <Card className='col-span-12'>
                    <CardHeader>
                      <CardTitle>Histograma de Pagos</CardTitle>
                    </CardHeader>
                    <CardContent className='h-[300px]'>
                      <Bar
                        data={{
                          labels: histogramaPagos.map((item) => item.anio_mes),
                          datasets: [
                            {
                              label: 'Total Pagado',
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