'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, CalendarDays, Gift, Loader2, PackageCheck, ReceiptText, RefreshCw, Tags, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import type { ComercialPackAnalyticsDashboard } from '@/interfaces/comercialPackAnalytics.interface';
import { getComercialPackAnalytics } from '@/services/comercialPackAnalyticsService';
import { formatCurrencyARS } from '@/lib/comercial/productos';

const emptyDashboard: ComercialPackAnalyticsDashboard = {
  registros: [],
  topPacks: [],
  cupones: [],
  mensual: [],
  metricas: {
    ventasConPack: 0,
    packsVendidos: 0,
    ingresoPacks: 0,
    ticketPromedioPack: 0,
    descuentoCuponEstimado: 0,
    packsDistintos: 0,
    cuponesUsados: 0,
  },
  filtros: {},
};

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = String(value).slice(0, 10);
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function MetricCard({ title, value, description, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className='flex items-center justify-between gap-4 p-5'>
        <div className='space-y-1'>
          <p className='text-sm text-muted-foreground'>{title}</p>
          <p className='text-2xl font-bold'>{value}</p>
          <p className='text-xs text-muted-foreground'>{description}</p>
        </div>
        <div className='rounded-full bg-fuchsia-50 p-3 text-fuchsia-600'>
          <Icon className='h-5 w-5' />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComercialPackAnalyticsPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ComercialPackAnalyticsDashboard>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState(firstDayOfMonth());
  const [hasta, setHasta] = useState(todayInput());

  useEffect(() => { initializeAuth(); }, [initializeAuth]);
  useEffect(() => { if (isInitialized && !isAuthenticated) router.push('/auth/login'); }, [isAuthenticated, isInitialized, router]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await getComercialPackAnalytics({ desde, hasta });
      setDashboard(data);
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cargar analítica de packs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isInitialized && isAuthenticated) loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isAuthenticated]);

  const latestRows = useMemo(() => dashboard.registros.slice(0, 20), [dashboard.registros]);

  if (!isInitialized) return <div>Cargando...</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='BI Packs / Promos' />
          <main className='flex-1 space-y-6 p-6'>
            <section className='rounded-2xl border bg-white p-6 shadow-sm'>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-600'>Comercial y Stock</p>
                  <h1 className='text-2xl font-bold'>Analítica de packs, promociones y cupones</h1>
                  <p className='max-w-3xl text-sm leading-relaxed text-muted-foreground'>
                    Medí qué packs se venden, cuántas unidades se movieron, qué cupones se usaron y cuánto ingreso generan las promociones del POS/Kiosco.
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button asChild variant='outline'><Link href='/dashboard/comercial/kiosco'>Abrir POS</Link></Button>
                  <Button asChild variant='outline'><Link href='/dashboard/comercial/servicios-promociones'>Gestionar packs</Link></Button>
                  <Button onClick={loadDashboard} disabled={loading} className='bg-[#02a8e1] hover:bg-[#0288b1]'>
                    {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}
                    Actualizar
                  </Button>
                </div>
              </div>
            </section>

            <Card>
              <CardContent className='grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end'>
                <div className='space-y-2'>
                  <Label>Desde</Label>
                  <Input type='date' value={desde} onChange={(event) => setDesde(event.target.value)} />
                </div>
                <div className='space-y-2'>
                  <Label>Hasta</Label>
                  <Input type='date' value={hasta} onChange={(event) => setHasta(event.target.value)} />
                </div>
                <Button onClick={loadDashboard} disabled={loading} variant='outline'>Aplicar filtros</Button>
              </CardContent>
            </Card>

            <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <MetricCard title='Ventas con pack' value={loading ? '...' : String(dashboard.metricas.ventasConPack)} description='Ventas POS que incluyeron al menos un pack' icon={ReceiptText} />
              <MetricCard title='Packs vendidos' value={loading ? '...' : String(dashboard.metricas.packsVendidos)} description='Unidades vendidas en el período' icon={PackageCheck} />
              <MetricCard title='Ingreso packs' value={loading ? '...' : formatCurrencyARS(dashboard.metricas.ingresoPacks)} description='Ingreso atribuido a packs activos' icon={TrendingUp} />
              <MetricCard title='Cupones usados' value={loading ? '...' : String(dashboard.metricas.cuponesUsados)} description={`Descuento estimado: ${formatCurrencyARS(dashboard.metricas.descuentoCuponEstimado)}`} icon={Gift} />
            </section>

            <section className='grid gap-4 xl:grid-cols-2'>
              <Card>
                <CardHeader><CardTitle className='flex items-center gap-2'><BarChart3 className='h-5 w-5 text-fuchsia-600' /> Top packs vendidos</CardTitle></CardHeader>
                <CardContent className='space-y-3'>
                  {dashboard.topPacks.length === 0 && <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>Todavía no hay packs vendidos para el período seleccionado.</p>}
                  {dashboard.topPacks.map((pack) => (
                    <div key={`${pack.pack_id ?? pack.pack_codigo}`} className='rounded-xl border p-4'>
                      <div className='flex items-start justify-between gap-4'>
                        <div>
                          <p className='font-semibold'>{pack.pack_nombre}</p>
                          <p className='text-xs text-muted-foreground'>{pack.pack_codigo} · Última venta: {formatDate(pack.ultima_venta)}</p>
                        </div>
                        <p className='font-bold'>{formatCurrencyARS(pack.ingreso_total)}</p>
                      </div>
                      <div className='mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3'>
                        <span>{pack.cantidad_vendida} unidades</span>
                        <span>{pack.ventas} registros</span>
                        <span>{formatCurrencyARS(pack.descuento_cupon_estimado)} desc.</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className='flex items-center gap-2'><Tags className='h-5 w-5 text-fuchsia-600' /> Cupones y promociones</CardTitle></CardHeader>
                <CardContent className='space-y-3'>
                  {dashboard.cupones.length === 0 && <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>No hay cupones aplicados a packs en el período.</p>}
                  {dashboard.cupones.map((cupon) => (
                    <div key={`${cupon.cupon_id ?? cupon.cupon_codigo}`} className='rounded-xl border p-4'>
                      <div className='flex items-start justify-between gap-4'>
                        <div>
                          <p className='font-semibold'>{cupon.cupon_codigo}</p>
                          <p className='text-xs text-muted-foreground'>{cupon.promocion_nombre ?? 'Promoción sin nombre'}</p>
                        </div>
                        <p className='font-bold text-emerald-600'>-{formatCurrencyARS(cupon.descuento_estimado)}</p>
                      </div>
                      <p className='mt-2 text-sm text-muted-foreground'>{cupon.usos} usos · {cupon.packs_vendidos} packs · {formatCurrencyARS(cupon.ingreso_asociado)} asociado</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader><CardTitle className='flex items-center gap-2'><CalendarDays className='h-5 w-5 text-fuchsia-600' /> Evolución mensual</CardTitle></CardHeader>
              <CardContent className='overflow-x-auto'>
                <table className='w-full min-w-[720px] text-sm'>
                  <thead className='border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500'>
                    <tr><th className='p-3'>Período</th><th className='p-3'>Packs vendidos</th><th className='p-3'>Ventas</th><th className='p-3'>Ingreso</th><th className='p-3'>Descuento</th></tr>
                  </thead>
                  <tbody>
                    {dashboard.mensual.map((row) => (
                      <tr key={row.periodo} className='border-b last:border-0'>
                        <td className='p-3 font-medium'>{row.periodo}</td>
                        <td className='p-3'>{row.packs_vendidos}</td>
                        <td className='p-3'>{row.ventas}</td>
                        <td className='p-3'>{formatCurrencyARS(row.ingreso_total)}</td>
                        <td className='p-3'>{formatCurrencyARS(row.descuento_cupon_estimado)}</td>
                      </tr>
                    ))}
                    {dashboard.mensual.length === 0 && <tr><td colSpan={5} className='p-6 text-center text-muted-foreground'>Sin datos mensuales para mostrar.</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Últimas ventas con packs</CardTitle></CardHeader>
              <CardContent className='overflow-x-auto'>
                <table className='w-full min-w-[960px] text-sm'>
                  <thead className='border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500'>
                    <tr><th className='p-3'>Fecha</th><th className='p-3'>Pack</th><th className='p-3'>Cantidad</th><th className='p-3'>Total pack</th><th className='p-3'>Cupón</th><th className='p-3'>Venta</th><th className='p-3'>Componentes</th></tr>
                  </thead>
                  <tbody>
                    {latestRows.map((row) => (
                      <tr key={row.id} className='border-b align-top last:border-0'>
                        <td className='p-3'>{formatDate(row.venta?.fecha ?? row.creado_en)}</td>
                        <td className='p-3'><p className='font-medium'>{row.pack_nombre}</p><p className='text-xs text-muted-foreground'>{row.pack_codigo}</p></td>
                        <td className='p-3'>{row.cantidad}</td>
                        <td className='p-3'>{formatCurrencyARS(row.total_pack)}</td>
                        <td className='p-3'>{row.cupon_codigo ? `${row.cupon_codigo} · -${formatCurrencyARS(row.descuento_cupon_estimado)}` : '-'}</td>
                        <td className='p-3'><p>{row.venta?.comprobante_codigo ?? row.venta_id}</p><p className='text-xs text-muted-foreground'>{row.venta?.cliente_nombre ?? row.venta?.cliente_tipo ?? 'Cliente'}</p></td>
                        <td className='p-3 text-xs text-muted-foreground'>{row.componentes?.map((item) => `${item.cantidad} x ${item.nombre}`).join(' · ') || '-'}</td>
                      </tr>
                    ))}
                    {latestRows.length === 0 && <tr><td colSpan={7} className='p-6 text-center text-muted-foreground'>No hay ventas con packs en el período.</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
