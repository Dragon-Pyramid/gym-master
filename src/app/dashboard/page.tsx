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

import { useEffect, useState } from 'react';
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

  const userType = user?.rol;

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
          <QrDisplayModal open={showQr} onClose={() => setShowQr(false)} />
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
                      <CardTitle>
                        Costo Total de Mantenimiento Mensual
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-3xl font-bold'>
                        ${costoMantenimientoMensual}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        Costo estimado para este mes
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Equipos Fuera de Servicio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-3xl font-bold'>
                        {equiposFueraDeServicio}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        Equipos no operativos actualmente
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
                  <Card className='col-span-12 lg:col-span-6'>
                    <CardHeader>
                      <CardTitle>Adherencia a Rutinas</CardTitle>
                    </CardHeader>
                    <CardContent className='h-[300px]'>
                      <Line
                        data={{
                          labels: adherenciaRutinas.map(
                            (item) => item.anio_mes
                          ),
                          datasets: [
                            {
                              label: 'Porcentaje Adherencia',
                              data: adherenciaRutinas.map(
                                (item) => item.porcentaje_adherencia
                              ),
                              borderColor: '#0088FE',
                              backgroundColor: 'rgba(0, 136, 254, 0.1)',
                              tension: 0.1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card className='col-span-12 lg:col-span-6'>
                    <CardHeader>
                      <CardTitle>Evolución Promedio por Objetivo</CardTitle>
                    </CardHeader>
                    <CardContent className='h-[300px]'>
                      <Line
                        data={{
                          labels: evolucionRutinas.map((item) => item.año_mes),
                          datasets: [
                            {
                              label: 'Promedio Asistencias',
                              data: evolucionRutinas.map(
                                (item) => item.promedio_asistencias
                              ),
                              borderColor: '#00C49F',
                              backgroundColor: 'rgba(0, 196, 159, 0.1)',
                              tension: 0.1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card className='col-span-12 lg:col-span-8'>
                    <CardHeader>
                      <CardTitle>Concurrencia Semanal</CardTitle>
                    </CardHeader>
                    <CardContent className='h-[300px]'>
                      <Line
                        data={{
                          labels: concurrenciaSemanal.map(
                            (item) => `${item.anio}-S${item.semana}`
                          ),
                          datasets: [
                            {
                              label: 'Asistencias',
                              data: concurrenciaSemanal.map(
                                (item) => item.asistencias
                              ),
                              borderColor: '#FFBB28',
                              backgroundColor: 'rgba(255, 187, 40, 0.1)',
                              tension: 0.1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card className='col-span-12 lg:col-span-4'>
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
                                labels: {
                                  usePointStyle: true,
                                  padding: 10,
                                },
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
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
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
                          labels: segmentacionPagos.map(
                            (item) => item.anio_mes
                          ),
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
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                          },
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
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
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
