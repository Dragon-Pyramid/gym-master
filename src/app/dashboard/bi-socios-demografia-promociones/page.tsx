'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Megaphone,
  Percent,
  RefreshCcw,
  TrendingUp,
  Users,
  VenusAndMars,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SociosDemografiaBiResponse } from '@/interfaces/sociosDemografiaBi.interface';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { getSociosDemografiaPromocionesBi } from '@/services/sociosDemografiaBiService';
import { useAuthStore } from '@/stores/authStore';
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import { downloadCommercialReportPdf } from '@/utils/commercialReportPdf';
import { formatFrontendDate } from '@/utils/dateFormat';

const CHART_COLORS = ['#0284c7', '#ec4899', '#64748b', '#16a34a', '#f97316', '#7c3aed', '#dc2626'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfCurrentYearISO() {
  return `${new Date().getFullYear()}-01-01`;
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toFixed(1)}%`;
}

function formatAge(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return `${Number(value).toFixed(1)} años`;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = 'default',
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: 'default' | 'blue' | 'green' | 'pink' | 'warning';
}) {
  const toneClass = {
    default: 'bg-slate-100 text-slate-700',
    blue: 'bg-sky-50 text-sky-700',
    green: 'bg-emerald-50 text-emerald-700',
    pink: 'bg-pink-50 text-pink-700',
    warning: 'bg-amber-50 text-amber-700',
  }[tone];

  return (
    <Card>
      <CardContent className='flex items-center justify-between gap-4 p-5'>
        <div className='space-y-1'>
          <p className='text-sm text-muted-foreground'>{title}</p>
          <p className='text-2xl font-bold'>{value}</p>
          <p className='text-xs text-muted-foreground'>{description}</p>
        </div>
        <div className={`rounded-full p-3 ${toneClass}`}>
          <Icon className='h-5 w-5' />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className='flex h-full items-center justify-center text-center text-sm text-muted-foreground'>
      {label}
    </div>
  );
}

export default function BiSociosDemografiaPromocionesPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [desde, setDesde] = useState(firstDayOfCurrentYearISO());
  const [hasta, setHasta] = useState(todayISO());
  const [data, setData] = useState<SociosDemografiaBiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await getSociosDemografiaPromocionesBi({ desde, hasta });
      setData(response);
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cargar el BI demográfico de socios');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isInitialized]);

  const metricas = data?.metricas;
  const generoData = useMemo(
    () => (data?.distribucion_genero ?? []).filter((item) => item.cantidad > 0),
    [data]
  );
  const franjasData = useMemo(() => data?.franjas_etarias ?? [], [data]);
  const altasData = useMemo(() => data?.altas_mensuales ?? [], [data]);
  const asistenciaData = useMemo(() => data?.asistencia_por_segmento.slice(0, 10) ?? [], [data]);
  const consumoData = useMemo(() => data?.consumo_por_segmento.slice(0, 10) ?? [], [data]);
  const rankingData = useMemo(() => data?.ranking_productos_servicios.slice(0, 8) ?? [], [data]);

  const handleExportExcel = async () => {
    if (!data) return;

    const workbook = new ExcelJS.Workbook();
    const resumen = workbook.addWorksheet('Resumen');
    resumen.columns = [
      { header: 'Métrica', key: 'metrica', width: 34 },
      { header: 'Valor', key: 'valor', width: 18 },
    ];
    resumen.addRows([
      { metrica: 'Total socios', valor: data.metricas.total_socios },
      { metrica: 'Socios activos', valor: data.metricas.socios_activos },
      { metrica: 'Hombres', valor: data.metricas.hombres },
      { metrica: 'Mujeres', valor: data.metricas.mujeres },
      { metrica: 'Edad promedio', valor: data.metricas.edad_promedio ?? '-' },
      { metrica: 'Altas período', valor: data.metricas.altas_periodo },
      { metrica: 'Asistencias período', valor: data.metricas.asistencias_periodo },
      { metrica: 'Pagos período', valor: data.metricas.pagos_periodo },
      { metrica: 'Consumo período', valor: data.metricas.consumo_periodo },
    ]);

    const franjas = workbook.addWorksheet('Franjas etarias');
    franjas.columns = [
      { header: 'Franja', key: 'franja', width: 24 },
      { header: 'Socios', key: 'cantidad_socios', width: 12 },
      { header: '% socios', key: 'porcentaje_socios', width: 12 },
      { header: 'Hombres', key: 'hombres', width: 12 },
      { header: 'Mujeres', key: 'mujeres', width: 12 },
      { header: 'Altas', key: 'altas_periodo', width: 12 },
      { header: 'Asistencias', key: 'asistencias_periodo', width: 14 },
      { header: 'Pagos', key: 'pagos_periodo', width: 18 },
      { header: 'Consumo', key: 'consumo_periodo', width: 18 },
    ];
    data.franjas_etarias.forEach((item) => franjas.addRow(item));

    const ranking = workbook.addWorksheet('Ranking consumo');
    ranking.columns = [
      { header: 'Item', key: 'item', width: 34 },
      { header: 'Tipo', key: 'tipo', width: 14 },
      { header: 'Segmento', key: 'segmento', width: 34 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Total', key: 'total', width: 18 },
    ];
    data.ranking_productos_servicios.forEach((item) => ranking.addRow(item));

    const promociones = workbook.addWorksheet('Promociones sugeridas');
    promociones.columns = [
      { header: 'Título', key: 'titulo', width: 36 },
      { header: 'Segmento', key: 'segmento', width: 32 },
      { header: 'Prioridad', key: 'prioridad', width: 12 },
      { header: 'Acción sugerida', key: 'accion_sugerida', width: 60 },
    ];
    data.promociones_sugeridas.forEach((item) => promociones.addRow(item));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildTimestampedDownloadFileName('bi-socios-demografia-promociones', 'xlsx');
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!data) return;

    try {
      await downloadCommercialReportPdf({
        title: 'BI Socios',
        subtitle: 'Demografía, asistencia, consumo y oportunidades comerciales.',
        fileName: 'bi-socios-demografia-promociones',
        rows: data.franjas_etarias,
        metrics: [
          { label: 'Socios', value: formatNumber(data.metricas.total_socios) },
          { label: 'Hombres', value: `${formatNumber(data.metricas.hombres)} (${formatPercent(data.metricas.porcentaje_hombres)})` },
          { label: 'Mujeres', value: `${formatNumber(data.metricas.mujeres)} (${formatPercent(data.metricas.porcentaje_mujeres)})` },
          { label: 'Edad prom.', value: formatAge(data.metricas.edad_promedio) },
        ],
        filtersLabel: `Período: ${formatFrontendDate(data.desde)} al ${formatFrontendDate(data.hasta)}`,
        charts: [
          {
            title: 'Socios por franja etaria',
            kind: 'bars',
            data: data.franjas_etarias.map((item) => ({ ...item })),
            labelKey: 'franja',
            series: [{ key: 'cantidad_socios', label: 'Socios', color: [2, 132, 199] }],
          },
          {
            title: 'Altas mensuales',
            kind: 'line',
            data: data.altas_mensuales.map((item) => ({ ...item })),
            labelKey: 'periodo_label',
            series: [{ key: 'total', label: 'Altas', color: [22, 163, 74] }],
          },
        ],
        columns: [
          { header: 'Franja', width: 34, getValue: (row) => row.franja },
          { header: 'Socios', width: 22, getValue: (row) => row.cantidad_socios, align: 'right' },
          { header: '%', width: 18, getValue: (row) => formatPercent(row.porcentaje_socios), align: 'right' },
          { header: 'Hombres', width: 22, getValue: (row) => row.hombres, align: 'right' },
          { header: 'Mujeres', width: 22, getValue: (row) => row.mujeres, align: 'right' },
          { header: 'Altas', width: 22, getValue: (row) => row.altas_periodo, align: 'right' },
          { header: 'Asist.', width: 22, getValue: (row) => row.asistencias_periodo, align: 'right' },
          { header: 'Consumo', width: 28, getValue: (row) => formatCurrencyARS(row.consumo_periodo), align: 'right' },
        ],
      });
    } catch {
      toast.error('No se pudo generar el PDF de BI de socios');
    }
  };

  if (!isInitialized) return <div>Cargando...</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='BI Socios / Promociones' />
          <main className='flex-1 space-y-6 p-6'>
            <section className='rounded-2xl border bg-white p-6 shadow-sm'>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-sky-600'>
                    Business Intelligence comercial
                  </p>
                  <h1 className='text-2xl font-bold'>Socios, demografía y promociones</h1>
                  <p className='max-w-3xl text-sm leading-relaxed text-muted-foreground'>
                    Analizá género, edad, altas, asistencia, pagos y consumo para tomar decisiones comerciales basadas en datos reales del gimnasio.
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button asChild variant='outline'>
                    <Link href='/dashboard/socios'>Socios</Link>
                  </Button>
                  <Button asChild variant='outline'>
                    <Link href='/dashboard/finanzas'>Finanzas</Link>
                  </Button>
                  <Button asChild variant='outline'>
                    <Link href='/dashboard/notificaciones'>Campañas</Link>
                  </Button>
                </div>
              </div>
            </section>

            <Card>
              <CardContent className='flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between'>
                <div className='grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 lg:max-w-xl'>
                  <div className='space-y-2'>
                    <Label htmlFor='fecha-desde'>Fecha desde</Label>
                    <Input id='fecha-desde' type='date' value={desde} onChange={(event) => setDesde(event.target.value)} />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='fecha-hasta'>Fecha hasta</Label>
                    <Input id='fecha-hasta' type='date' value={hasta} onChange={(event) => setHasta(event.target.value)} />
                  </div>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button type='button' onClick={loadData} disabled={loading} className='bg-[#02a8e1] hover:bg-[#0288b1]'>
                    <RefreshCcw className='mr-2 h-4 w-4' />
                    {loading ? 'Actualizando...' : 'Actualizar'}
                  </Button>
                  <Button type='button' variant='outline' onClick={handleDownloadPdf} disabled={!data} className='border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]'>
                    <FileText className='mr-2 h-4 w-4' />
                    Descargar PDF
                  </Button>
                  <Button type='button' variant='outline' onClick={handleExportExcel} disabled={!data} className='border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]'>
                    <FileSpreadsheet className='mr-2 h-4 w-4' />
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <MetricCard
                title='Socios activos'
                value={loading || !metricas ? '...' : formatNumber(metricas.socios_activos)}
                description={`${metricas ? formatNumber(metricas.total_socios) : '-'} socios totales`}
                icon={Users}
                tone='blue'
              />
              <MetricCard
                title='Distribución'
                value={loading || !metricas ? '...' : `${formatPercent(metricas.porcentaje_hombres)} / ${formatPercent(metricas.porcentaje_mujeres)}`}
                description='Hombres / mujeres registrados.'
                icon={VenusAndMars}
                tone='pink'
              />
              <MetricCard
                title='Edad promedio'
                value={loading || !metricas ? '...' : formatAge(metricas.edad_promedio)}
                description={`${metricas ? formatNumber(metricas.altas_periodo) : '-'} altas en el período`}
                icon={CalendarDays}
                tone='green'
              />
              <MetricCard
                title='Consumo socio'
                value={loading || !metricas ? '...' : formatCurrencyARS(metricas.consumo_periodo)}
                description={`${metricas ? formatNumber(metricas.asistencias_periodo) : '-'} asistencias analizadas`}
                icon={WalletCards}
                tone='warning'
              />
            </section>

            <section className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <Percent className='h-5 w-5 text-sky-600' />
                    Género
                  </CardTitle>
                </CardHeader>
                <CardContent className='h-[320px]'>
                  {generoData.length === 0 ? (
                    <EmptyChart label='Sin datos de género para graficar.' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie data={generoData} dataKey='cantidad' nameKey='label' innerRadius={55} outerRadius={95} paddingAngle={3} label>
                          {generoData.map((_, index) => (
                            <Cell key={`genero-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNumber(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className='xl:col-span-2'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <Users className='h-5 w-5 text-sky-600' />
                    Franjas etarias
                  </CardTitle>
                </CardHeader>
                <CardContent className='h-[320px]'>
                  {franjasData.length === 0 ? (
                    <EmptyChart label='Sin franjas etarias para graficar.' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart data={franjasData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='franja' />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey='hombres' name='Hombres' stackId='a' fill='#0284c7' radius={[6, 6, 0, 0]} />
                        <Bar dataKey='mujeres' name='Mujeres' stackId='a' fill='#ec4899' radius={[6, 6, 0, 0]} />
                        <Bar dataKey='sin_genero' name='Sin dato' stackId='a' fill='#64748b' radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <TrendingUp className='h-5 w-5 text-sky-600' />
                    Altas mensuales
                  </CardTitle>
                </CardHeader>
                <CardContent className='h-[320px]'>
                  {altasData.length === 0 ? (
                    <EmptyChart label='No hay altas para el período seleccionado.' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <LineChart data={altasData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='periodo_label' />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type='monotone' dataKey='total' name='Altas' stroke='#16a34a' strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <Megaphone className='h-5 w-5 text-sky-600' />
                    Asistencia por segmento
                  </CardTitle>
                </CardHeader>
                <CardContent className='h-[320px]'>
                  {asistenciaData.length === 0 ? (
                    <EmptyChart label='Sin asistencias segmentadas para el período.' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart data={asistenciaData} layout='vertical' margin={{ left: 70 }}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis type='number' />
                        <YAxis type='category' dataKey='segmento' width={130} />
                        <Tooltip />
                        <Bar dataKey='asistencias' name='Asistencias' fill='#7c3aed' radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Consumo por segmento</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {consumoData.length === 0 ? (
                    <p className='text-sm text-muted-foreground'>No hay ventas asociadas a socios para el período.</p>
                  ) : (
                    consumoData.map((item) => (
                      <div key={item.segmento} className='rounded-xl border p-3'>
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <p className='font-medium'>{item.segmento}</p>
                            <p className='text-xs text-muted-foreground'>{item.cantidad_ventas} ventas registradas</p>
                          </div>
                          <p className='font-semibold'>{formatCurrencyARS(item.total)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Ranking productos / servicios</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {rankingData.length === 0 ? (
                    <p className='text-sm text-muted-foreground'>No hay detalle de productos o servicios consumidos por socios.</p>
                  ) : (
                    rankingData.map((item) => (
                      <div key={`${item.tipo}-${item.item}-${item.segmento}`} className='rounded-xl border p-3'>
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <p className='font-medium'>{item.item}</p>
                            <p className='text-xs text-muted-foreground'>{item.tipo} · {item.segmento} · {formatNumber(item.cantidad)} unidades</p>
                          </div>
                          <p className='font-semibold'>{formatCurrencyARS(item.total)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <Megaphone className='h-5 w-5 text-sky-600' />
                  Promociones sugeridas
                </CardTitle>
              </CardHeader>
              <CardContent className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                {(data?.promociones_sugeridas ?? []).length === 0 ? (
                  <p className='text-sm text-muted-foreground'>No hay sugerencias suficientes para el período seleccionado.</p>
                ) : (
                  data!.promociones_sugeridas.map((item) => (
                    <div key={`${item.titulo}-${item.segmento}`} className='rounded-2xl border bg-slate-50 p-4'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <p className='font-semibold'>{item.titulo}</p>
                          <p className='mt-1 text-sm text-muted-foreground'>{item.descripcion}</p>
                        </div>
                        <span className='rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-sky-700'>
                          {item.prioridad}
                        </span>
                      </div>
                      <p className='mt-3 text-sm'><strong>Segmento:</strong> {item.segmento}</p>
                      <p className='mt-1 text-sm'><strong>Acción:</strong> {item.accion_sugerida}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Resumen por franja etaria</CardTitle>
              </CardHeader>
              <CardContent className='overflow-x-auto'>
                <table className='w-full min-w-[980px] text-sm'>
                  <thead>
                    <tr className='border-b bg-slate-50 text-left'>
                      <th className='p-3'>Franja</th>
                      <th className='p-3 text-right'>Socios</th>
                      <th className='p-3 text-right'>%</th>
                      <th className='p-3 text-right'>Hombres</th>
                      <th className='p-3 text-right'>Mujeres</th>
                      <th className='p-3 text-right'>Edad prom.</th>
                      <th className='p-3 text-right'>Altas</th>
                      <th className='p-3 text-right'>Asistencias</th>
                      <th className='p-3 text-right'>Pagos</th>
                      <th className='p-3 text-right'>Consumo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {franjasData.map((item) => (
                      <tr key={item.franja} className='border-b'>
                        <td className='p-3 font-medium'>{item.franja}</td>
                        <td className='p-3 text-right'>{formatNumber(item.cantidad_socios)}</td>
                        <td className='p-3 text-right'>{formatPercent(item.porcentaje_socios)}</td>
                        <td className='p-3 text-right'>{formatNumber(item.hombres)}</td>
                        <td className='p-3 text-right'>{formatNumber(item.mujeres)}</td>
                        <td className='p-3 text-right'>{formatAge(item.edad_promedio)}</td>
                        <td className='p-3 text-right'>{formatNumber(item.altas_periodo)}</td>
                        <td className='p-3 text-right'>{formatNumber(item.asistencias_periodo)}</td>
                        <td className='p-3 text-right'>{formatCurrencyARS(item.pagos_periodo)}</td>
                        <td className='p-3 text-right'>{formatCurrencyARS(item.consumo_periodo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
