'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  RefreshCcw,
  TrendingUp,
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
import { FinanzasDashboardResponse } from '@/interfaces/finanzas.interface';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { useAuthStore } from '@/stores/authStore';
import { getFinanzasDashboardBi } from '@/services/finanzasService';
import { downloadCommercialReportPdf } from '@/utils/commercialReportPdf';
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import { formatFrontendDate } from '@/utils/dateFormat';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfCurrentYearISO() {
  return `${new Date().getFullYear()}-01-01`;
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return `${Number(value).toFixed(1)}%`;
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
  tone?: 'default' | 'income' | 'expense' | 'warning' | 'result';
}) {
  const toneClass = {
    default: 'bg-slate-100 text-slate-700',
    income: 'bg-emerald-50 text-emerald-700',
    expense: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-700',
    result: 'bg-sky-50 text-sky-700',
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

function CategoryList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: Array<{ categoria: string; total: number; cantidad: number }>;
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>{title}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {items.length === 0 ? (
          <p className='text-sm text-muted-foreground'>{emptyLabel}</p>
        ) : (
          items.slice(0, 8).map((item) => (
            <div key={`${title}-${item.categoria}`} className='rounded-xl border p-3'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='font-medium'>{item.categoria}</p>
                  <p className='text-xs text-muted-foreground'>{item.cantidad} registros</p>
                </div>
                <p className='font-semibold'>{formatCurrencyARS(item.total)}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function FinanzasIngresosEgresosBiPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [desde, setDesde] = useState(firstDayOfCurrentYearISO());
  const [hasta, setHasta] = useState(todayISO());
  const [data, setData] = useState<FinanzasDashboardResponse | null>(null);
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
      const response = await getFinanzasDashboardBi({ desde, hasta });
      setData(response);
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cargar el BI financiero');
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

  const chartData = useMemo(() => data?.serie_mensual ?? [], [data]);
  const metricas = data?.metricas;

  const handleExportExcel = async () => {
    if (!data) return;

    const workbook = new ExcelJS.Workbook();
    const resumen = workbook.addWorksheet('Resumen mensual');

    resumen.columns = [
      { header: 'Período', key: 'periodo', width: 16 },
      { header: 'Ingresos cuotas', key: 'ingresos_cuotas', width: 18 },
      { header: 'Ingresos ventas', key: 'ingresos_ventas', width: 18 },
      { header: 'Ingresos servicios', key: 'ingresos_servicios', width: 18 },
      { header: 'Ingresos total', key: 'ingresos_total', width: 18 },
      { header: 'Egresos compras', key: 'egresos_compras', width: 18 },
      { header: 'Egresos gastos', key: 'egresos_gastos', width: 18 },
      { header: 'Egresos total', key: 'egresos_total', width: 18 },
      { header: 'Resultado neto', key: 'resultado_neto', width: 18 },
    ];

    data.serie_mensual.forEach((item) => resumen.addRow(item));

    const categorias = workbook.addWorksheet('Categorías');
    categorias.columns = [
      { header: 'Tipo', key: 'tipo', width: 16 },
      { header: 'Categoría', key: 'categoria', width: 34 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Total', key: 'total', width: 18 },
    ];

    [...data.ingresos_por_categoria, ...data.egresos_por_categoria, ...data.compromisos_por_categoria].forEach((item) => {
      categorias.addRow(item);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildTimestampedDownloadFileName('bi-finanzas-ingresos-egresos', 'xlsx');
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!data) return;

    try {
      await downloadCommercialReportPdf({
        title: 'BI Finanzas',
        subtitle: 'Ingresos, egresos, resultado neto y compromisos del gimnasio.',
        fileName: 'bi-finanzas-ingresos-egresos',
        rows: data.serie_mensual,
        metrics: [
          { label: 'Ingresos', value: formatCurrencyARS(data.metricas.ingresos_total) },
          { label: 'Egresos', value: formatCurrencyARS(data.metricas.egresos_total) },
          { label: 'Resultado', value: formatCurrencyARS(data.metricas.resultado_neto) },
          { label: 'Pendientes', value: formatCurrencyARS(data.metricas.compromisos_pendientes) },
        ],
        filtersLabel: `Período: ${formatFrontendDate(data.desde)} al ${formatFrontendDate(data.hasta)}`,
        charts: [
          {
            title: 'Evolución mensual: ingresos vs egresos',
            kind: 'bars',
            data: data.serie_mensual.map((item) => ({ ...item })) as Record<string, string | number | null | undefined>[],
            labelKey: 'periodo_label',
            series: [
              { key: 'ingresos_total', label: 'Ingresos', color: [22, 163, 74] },
              { key: 'egresos_total', label: 'Egresos', color: [220, 38, 38] },
            ],
          },
          {
            title: 'Resultado neto mensual',
            kind: 'line',
            data: data.serie_mensual.map((item) => ({ ...item })) as Record<string, string | number | null | undefined>[],
            labelKey: 'periodo_label',
            series: [
              { key: 'resultado_neto', label: 'Resultado', color: [2, 132, 199] },
            ],
          },
        ],
        columns: [
          { header: 'Período', width: 22, getValue: (row) => row.periodo_label },
          { header: 'Ingresos', width: 28, getValue: (row) => formatCurrencyARS(row.ingresos_total), align: 'right' },
          { header: 'Egresos', width: 28, getValue: (row) => formatCurrencyARS(row.egresos_total), align: 'right' },
          { header: 'Resultado', width: 30, getValue: (row) => formatCurrencyARS(row.resultado_neto), align: 'right' },
          { header: 'Cuotas', width: 26, getValue: (row) => formatCurrencyARS(row.ingresos_cuotas), align: 'right' },
          { header: 'Ventas', width: 26, getValue: (row) => formatCurrencyARS(row.ingresos_ventas), align: 'right' },
          { header: 'Compras', width: 26, getValue: (row) => formatCurrencyARS(row.egresos_compras), align: 'right' },
          { header: 'Gastos', width: 26, getValue: (row) => formatCurrencyARS(row.egresos_gastos), align: 'right' },
        ],
      });
    } catch {
      toast.error('No se pudo generar el PDF financiero');
    }
  };

  if (!isInitialized) return <div>Cargando...</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Finanzas / BI' />
          <main className='flex-1 space-y-6 p-6'>
            <section className='rounded-2xl border bg-white p-6 shadow-sm'>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-sky-600'>
                    Business Intelligence financiero
                  </p>
                  <h1 className='text-2xl font-bold'>Ingresos, egresos y resultado neto</h1>
                  <p className='max-w-3xl text-sm leading-relaxed text-muted-foreground'>
                    Consolidá cuotas, ventas, compras y gastos para obtener una vista financiera operativa del gimnasio.
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button asChild variant='outline'>
                    <Link href='/dashboard/comercial'>Comercial</Link>
                  </Button>
                  <Button asChild variant='outline'>
                    <Link href='/dashboard/pagos'>Pagos</Link>
                  </Button>
                  <Button asChild variant='outline'>
                    <Link href='/dashboard/otros-gastos'>Gastos</Link>
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
                title='Ingresos totales'
                value={loading || !metricas ? '...' : formatCurrencyARS(metricas.ingresos_total)}
                description='Cuotas, ventas y servicios vendidos.'
                icon={ArrowUpCircle}
                tone='income'
              />
              <MetricCard
                title='Egresos totales'
                value={loading || !metricas ? '...' : formatCurrencyARS(metricas.egresos_total)}
                description='Compras pagadas y gastos pagados.'
                icon={ArrowDownCircle}
                tone='expense'
              />
              <MetricCard
                title='Resultado neto'
                value={loading || !metricas ? '...' : formatCurrencyARS(metricas.resultado_neto)}
                description={`Margen operativo: ${metricas ? formatPercent(metricas.margen_resultado_porcentaje) : '-'}`}
                icon={TrendingUp}
                tone='result'
              />
              <MetricCard
                title='Compromisos pendientes'
                value={loading || !metricas ? '...' : formatCurrencyARS(metricas.compromisos_pendientes)}
                description='Compras pendientes y gastos pendientes/vencidos.'
                icon={AlertTriangle}
                tone='warning'
              />
            </section>

            <section className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
              <Card className='xl:col-span-2'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <WalletCards className='h-5 w-5 text-sky-600' />
                    Evolución mensual
                  </CardTitle>
                </CardHeader>
                <CardContent className='h-[360px]'>
                  {chartData.length === 0 ? (
                    <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
                      No hay datos financieros para el período seleccionado.
                    </div>
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='periodo_label' />
                        <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                        <Tooltip formatter={(value) => formatCurrencyARS(Number(value))} />
                        <Legend />
                        <Bar dataKey='ingresos_total' name='Ingresos' fill='#16a34a' radius={[6, 6, 0, 0]} />
                        <Bar dataKey='egresos_total' name='Egresos' fill='#dc2626' radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <CalendarDays className='h-5 w-5 text-sky-600' />
                    Resultado neto
                  </CardTitle>
                </CardHeader>
                <CardContent className='h-[360px]'>
                  {chartData.length === 0 ? (
                    <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
                      Sin resultados para graficar.
                    </div>
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='periodo_label' />
                        <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                        <Tooltip formatter={(value) => formatCurrencyARS(Number(value))} />
                        <Area type='monotone' dataKey='resultado_neto' name='Resultado' stroke='#0284c7' fill='#e0f2fe' />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
              <CategoryList
                title='Ingresos por categoría'
                items={data?.ingresos_por_categoria ?? []}
                emptyLabel='No hay ingresos para el período.'
              />
              <CategoryList
                title='Egresos por categoría'
                items={data?.egresos_por_categoria ?? []}
                emptyLabel='No hay egresos para el período.'
              />
              <CategoryList
                title='Pendientes y vencidos'
                items={data?.compromisos_por_categoria ?? []}
                emptyLabel='No hay compromisos pendientes para el período.'
              />
            </section>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Resumen mensual detallado</CardTitle>
              </CardHeader>
              <CardContent className='overflow-x-auto'>
                <table className='w-full min-w-[980px] text-sm'>
                  <thead>
                    <tr className='border-b bg-slate-50 text-left'>
                      <th className='p-3'>Período</th>
                      <th className='p-3 text-right'>Cuotas</th>
                      <th className='p-3 text-right'>Ventas</th>
                      <th className='p-3 text-right'>Servicios</th>
                      <th className='p-3 text-right'>Ingresos</th>
                      <th className='p-3 text-right'>Compras</th>
                      <th className='p-3 text-right'>Gastos</th>
                      <th className='p-3 text-right'>Egresos</th>
                      <th className='p-3 text-right'>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.length === 0 ? (
                      <tr>
                        <td colSpan={9} className='p-6 text-center text-muted-foreground'>
                          No hay registros para el período seleccionado.
                        </td>
                      </tr>
                    ) : (
                      chartData.map((item) => (
                        <tr key={item.periodo} className='border-b'>
                          <td className='p-3 font-medium'>{item.periodo_label}</td>
                          <td className='p-3 text-right'>{formatCurrencyARS(item.ingresos_cuotas)}</td>
                          <td className='p-3 text-right'>{formatCurrencyARS(item.ingresos_ventas)}</td>
                          <td className='p-3 text-right'>{formatCurrencyARS(item.ingresos_servicios)}</td>
                          <td className='p-3 text-right font-semibold'>{formatCurrencyARS(item.ingresos_total)}</td>
                          <td className='p-3 text-right'>{formatCurrencyARS(item.egresos_compras)}</td>
                          <td className='p-3 text-right'>{formatCurrencyARS(item.egresos_gastos)}</td>
                          <td className='p-3 text-right font-semibold'>{formatCurrencyARS(item.egresos_total)}</td>
                          <td className='p-3 text-right font-semibold'>{formatCurrencyARS(item.resultado_neto)}</td>
                        </tr>
                      ))
                    )}
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
