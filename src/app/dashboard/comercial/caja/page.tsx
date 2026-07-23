'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  Calculator,
  CreditCard,
  FileText,
  Loader2,
  Lock,
  Printer,
  RefreshCw,
  Store,
  TrendingDown,
  TrendingUp,
  Unlock,
} from 'lucide-react';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';
import type { ComercialCajaDashboard, ComercialCajaMovimiento, ComercialCajaSesion } from '@/interfaces/comercialCaja.interface';
import { ejecutarComercialCajaAction, getComercialCajaDashboard } from '@/services/comercialCajaService';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { toast } from 'sonner';

const initialDashboard: ComercialCajaDashboard = {
  cajaAbierta: null,
  sesionesRecientes: [],
  movimientos: [],
  ventasTurno: [],
  ventasSinCaja: [],
  metricas: {
    cajaAbierta: false,
    ventasTurno: 0,
    totalVentasTurno: 0,
    totalIngresos: 0,
    totalRetiros: 0,
    totalEsperado: 0,
    sesionesCerradas: 0,
    ventasSinCaja: 0,
  },
};

function getDifferenceClass(value?: number | null) {
  const numeric = Number(value ?? 0);
  if (numeric === 0) return 'text-emerald-700';
  if (numeric > 0) return 'text-sky-700';
  return 'text-red-700';
}

function formatCajaDateTime(value: string | null | undefined, locale: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatCajaStatus(value: string, c: (text: string) => string) {
  if (value === 'abierta') return c('Abierta');
  if (value === 'cerrada') return c('Cerrada');
  return c(value);
}

function formatCajaMovementType(value: ComercialCajaMovimiento['tipo'], c: (text: string) => string) {
  if (value === 'apertura') return c('Apertura de caja');
  if (value === 'ingreso') return c('Ingreso');
  if (value === 'retiro') return c('Retiro');
  if (value === 'cierre') return c('Cierre de caja');
  if (value === 'ajuste') return c('Ajuste');
  return c(value);
}

function formatCajaMovementConcept(
  movement: ComercialCajaMovimiento,
  locale: string,
  c: (text: string) => string
) {
  const concept = String(movement.concepto ?? '').trim();

  if (movement.tipo === 'apertura' && concept === 'Apertura de caja') {
    return c('Apertura de caja');
  }

  if (movement.tipo === 'cierre') {
    const match = /^Cierre de caja\. Diferencia:\s*(-?\d+(?:[.,]\d+)?)$/i.exec(concept);
    if (match) {
      const difference = Number(match[1].replace(',', '.'));
      if (Number.isFinite(difference)) {
        return `${c('Cierre de caja. Diferencia:')} ${formatCurrencyARS(difference, locale)}`;
      }
    }

    if (concept === 'Cierre de caja') return c('Cierre de caja');
  }

  // Los conceptos manuales pertenecen al gimnasio y se conservan en su idioma original.
  return concept;
}

function buildCajaReportHtml(
  session: ComercialCajaSesion,
  dashboard: ComercialCajaDashboard,
  locale: string,
  c: (text: string) => string
) {
  const ventasRows = dashboard.ventasTurno
    .map(
      (venta) =>
        `<tr><td>${venta.comprobante_codigo || venta.id}</td><td>${c(venta.metodo_pago)}</td><td style="text-align:right">${formatCurrencyARS(venta.total, locale)}</td></tr>`
    )
    .join('');
  const movimientoRows = dashboard.movimientos
    .map(
      (mov) =>
        `<tr><td>${formatCajaMovementType(mov.tipo, c)}</td><td>${formatCajaMovementConcept(mov, locale, c)}</td><td style="text-align:right">${formatCurrencyARS(mov.monto, locale)}</td></tr>`
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8" />
  <title>${c('Reporte Caja')} ${session.codigo}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:24px;color:#111} h1{margin:0 0 4px}.muted{color:#666;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px} th,td{border-bottom:1px solid #ddd;padding:6px;text-align:left}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}.box{border:1px solid #ddd;padding:10px;border-radius:8px}.box b{display:block;font-size:14px}
  </style></head><body>
  <h1>${c('Gym Master - Reporte X/Z de Caja')}</h1>
  <div class="muted">${session.codigo} · ${c('Estado')}: ${formatCajaStatus(session.estado, c)} · ${c('Apertura')}: ${formatCajaDateTime(session.fecha_apertura, locale)} · ${c('Cierre')}: ${session.fecha_cierre ? formatCajaDateTime(session.fecha_cierre, locale) : c('Pendiente')}</div>
  <div class="grid">
    <div class="box">${c('Inicial')}<b>${formatCurrencyARS(session.monto_inicial, locale)}</b></div>
    <div class="box">${c('Ventas')}<b>${formatCurrencyARS(dashboard.metricas.totalVentasTurno, locale)}</b></div>
    <div class="box">${c('Esperado')}<b>${formatCurrencyARS(dashboard.metricas.totalEsperado, locale)}</b></div>
    <div class="box">${c('Diferencia')}<b>${formatCurrencyARS(session.diferencia ?? 0, locale)}</b></div>
  </div>
  <h2>${c('Ventas del turno')}</h2><table><thead><tr><th>${c('Comprobante')}</th><th>${c('Pago')}</th><th>${c('Total')}</th></tr></thead><tbody>${ventasRows || `<tr><td colspan="3">${c('Sin ventas')}</td></tr>`}</tbody></table>
  <h2>${c('Movimientos de caja')}</h2><table><thead><tr><th>${c('Tipo')}</th><th>${c('Concepto')}</th><th>${c('Monto')}</th></tr></thead><tbody>${movimientoRows || `<tr><td colspan="3">${c('Sin movimientos')}</td></tr>`}</tbody></table>
  <script>window.print();</script>
  </body></html>`;
}

export default function ComercialCajaPage() {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ComercialCajaDashboard>(initialDashboard);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [montoInicial, setMontoInicial] = useState('0');
  const [observacionesApertura, setObservacionesApertura] = useState('');
  const [movimientoTipo, setMovimientoTipo] = useState<'ingreso' | 'retiro'>('ingreso');
  const [movimientoMonto, setMovimientoMonto] = useState('0');
  const [movimientoConcepto, setMovimientoConcepto] = useState('');
  const [montoContado, setMontoContado] = useState('0');
  const [observacionesCierre, setObservacionesCierre] = useState('');

  useEffect(() => { initializeAuth(); }, [initializeAuth]);
  useEffect(() => { if (isInitialized && !isAuthenticated) router.push('/auth/login'); }, [isAuthenticated, isInitialized, router]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await getComercialCajaDashboard();
      setDashboard(data ?? initialDashboard);
      if (data?.cajaAbierta) setMontoContado(String(data.cajaAbierta.total_esperado ?? 0));
    } catch (error: any) {
      toast.error(error?.message || c('No se pudo cargar caja comercial'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (isInitialized && isAuthenticated) loadDashboard(); }, [isInitialized, isAuthenticated]);

  const diferenciaPreview = useMemo(() => Number(montoContado || 0) - Number(dashboard.cajaAbierta?.total_esperado ?? 0), [montoContado, dashboard.cajaAbierta]);

  async function handleAbrirCaja(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await ejecutarComercialCajaAction({ action: 'abrir', monto_inicial: Number(montoInicial), observaciones_apertura: observacionesApertura });
      setDashboard(data);
      setObservacionesApertura('');
      toast.success(c('Caja abierta correctamente'));
    } catch (error: any) {
      toast.error(error?.message || c('No se pudo abrir caja'));
    } finally { setSaving(false); }
  }

  async function handleMovimiento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await ejecutarComercialCajaAction({ action: 'movimiento', tipo: movimientoTipo, monto: Number(movimientoMonto), concepto: movimientoConcepto, metodo_pago: 'efectivo' });
      setDashboard(data);
      setMovimientoMonto('0');
      setMovimientoConcepto('');
      toast.success(c('Movimiento registrado'));
    } catch (error: any) {
      toast.error(error?.message || c('No se pudo registrar movimiento'));
    } finally { setSaving(false); }
  }

  async function handleCerrarCaja(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await ejecutarComercialCajaAction({ action: 'cerrar', monto_contado: Number(montoContado), observaciones_cierre: observacionesCierre });
      setDashboard(data);
      setObservacionesCierre('');
      toast.success(c('Caja cerrada correctamente'));
    } catch (error: any) {
      toast.error(error?.message || c('No se pudo cerrar caja'));
    } finally { setSaving(false); }
  }

  function handlePrintReport(session?: ComercialCajaSesion | null) {
    const target = session ?? dashboard.cajaAbierta;
    if (!target) return;
    const popup = window.open('', '_blank', 'width=920,height=720');
    if (!popup) { toast.error(c('El navegador bloqueó la impresión')); return; }
    popup.document.write(buildCajaReportHtml(target, dashboard, locale, c));
    popup.document.close();
  }

  if (!isInitialized) return <div>{c('Cargando...')}</div>;
  if (!isAuthenticated) return null;

  const caja = dashboard.cajaAbierta;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c('Caja / Cashup')} />
          <main className='flex-1 space-y-6 p-6'>
            <section className='rounded-3xl border border-sky-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-sm dark:border-cyan-800/70'>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-sky-600'>{c('Comercial y Stock')}</p>
                  <h1 className='text-2xl font-bold'>{c('Caja / Cashup')}</h1>
                  <p className='max-w-4xl text-sm leading-relaxed text-cyan-50/85'>{c('Apertura, ingresos, retiros, ventas del turno, cierre esperado vs contado y reporte X/Z imprimible.')}</p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button variant='outline' className='border-white/30 bg-white/10 text-white hover:bg-white/20' onClick={loadDashboard} disabled={loading}>{loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}{c('Actualizar')}</Button>
                  <Button asChild variant='outline' className='border-white/30 bg-white/10 text-white hover:bg-white/20'><Link href='/dashboard/comercial/kiosco'>{c('POS / Kiosco')}</Link></Button>
                  <Button asChild className='bg-cyan-400 text-slate-950 hover:bg-cyan-300'><Link href='/dashboard/ventas'>{c('Ventas')}</Link></Button>
                </div>
              </div>
            </section>

            <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5'>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>{c('Estado')}</p><p className='text-xl font-bold'>{caja ? c('Abierta') : c('Sin caja')}</p></div>{caja ? <Unlock className='h-6 w-6 text-emerald-600' /> : <Lock className='h-6 w-6 text-slate-500' />}</CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>{c('Ventas turno')}</p><p className='text-xl font-bold'>{formatCurrencyARS(dashboard.metricas.totalVentasTurno, locale)}</p></div><CreditCard className='h-6 w-6 text-sky-600' /></CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>{c('Ingresos')}</p><p className='text-xl font-bold'>{formatCurrencyARS(dashboard.metricas.totalIngresos, locale)}</p></div><TrendingUp className='h-6 w-6 text-emerald-600' /></CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>{c('Retiros')}</p><p className='text-xl font-bold'>{formatCurrencyARS(dashboard.metricas.totalRetiros, locale)}</p></div><TrendingDown className='h-6 w-6 text-red-600' /></CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>{c('Esperado')}</p><p className='text-xl font-bold'>{formatCurrencyARS(dashboard.metricas.totalEsperado, locale)}</p></div><Calculator className='h-6 w-6 text-violet-600' /></CardContent></Card>
            </section>

            {!caja ? (
              <Card>
                <CardHeader><CardTitle className='flex items-center gap-2'><Banknote className='h-5 w-5 text-sky-600' />{c('Abrir caja')}</CardTitle></CardHeader>
                <CardContent>
                  <form className='grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr_auto]' onSubmit={handleAbrirCaja}>
                    <div className='space-y-2'><Label>{c('Monto inicial')}</Label><Input type='number' min={0} value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} /></div>
                    <div className='space-y-2'><Label>{c('Observaciones')}</Label><Input value={observacionesApertura} onChange={(e) => setObservacionesApertura(e.target.value)} placeholder={c('Ej: apertura turno mañana')} /></div>
                    <Button className='self-end bg-[#02a8e1] hover:bg-[#0288b1]' disabled={saving}>{saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Unlock className='mr-2 h-4 w-4' />}{c('Abrir caja')}</Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <section className='grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]'>
                <div className='space-y-6'>
                  <Card>
                    <CardHeader><CardTitle>{c('Caja abierta')}: {caja.codigo}</CardTitle></CardHeader>
                    <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                      <div><p className='text-sm text-muted-foreground'>{c('Inicial')}</p><p className='font-bold'>{formatCurrencyARS(caja.monto_inicial, locale)}</p></div>
                      <div><p className='text-sm text-muted-foreground'>{c('Ventas')}</p><p className='font-bold'>{formatCurrencyARS(caja.total_ventas, locale)}</p></div>
                      <div><p className='text-sm text-muted-foreground'>{c('Esperado')}</p><p className='font-bold'>{formatCurrencyARS(caja.total_esperado, locale)}</p></div>
                      <div><p className='text-sm text-muted-foreground'>{c('Apertura')}</p><p className='text-sm'>{formatCajaDateTime(caja.fecha_apertura, locale)}</p></div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>{c('Ventas del turno')}</CardTitle></CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {dashboard.ventasTurno.map((venta) => <div key={venta.id} className='flex items-center justify-between rounded-lg border p-3 text-sm'><div><p className='font-medium'>{venta.comprobante_codigo || venta.id}</p><p className='text-xs text-muted-foreground'>{venta.cliente_nombre || c('Consumidor Final')} · {c(venta.metodo_pago)}</p></div><p className='font-bold'>{formatCurrencyARS(venta.total, locale)}</p></div>)}
                        {dashboard.ventasTurno.length === 0 && <p className='text-sm text-muted-foreground'>{c('Aún no hay ventas asociadas a la caja abierta.')}</p>}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>{c('Historial de cierres')}</CardTitle></CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {dashboard.sesionesRecientes.map((sesion) => <div key={sesion.id} className='flex items-center justify-between rounded-lg border p-3 text-sm'><div><p className='font-medium'>{sesion.codigo}</p><p className='text-xs text-muted-foreground'>{formatCajaStatus(sesion.estado, c)} · {formatCajaDateTime(sesion.fecha_apertura, locale)}</p></div><div className='text-right'><p className='font-bold'>{formatCurrencyARS(sesion.total_esperado, locale)}</p><p className={`text-xs ${getDifferenceClass(sesion.diferencia)}`}>{c('Dif.')} {formatCurrencyARS(sesion.diferencia ?? 0, locale)}</p></div></div>)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className='space-y-6'>
                  <Card>
                    <CardHeader><CardTitle>{c('Ingreso / retiro')}</CardTitle></CardHeader>
                    <CardContent>
                      <form className='space-y-3' onSubmit={handleMovimiento}>
                        <div className='space-y-2'><Label>{c('Tipo')}</Label><select className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm' value={movimientoTipo} onChange={(e) => setMovimientoTipo(e.target.value as any)}><option value='ingreso'>{c('Ingreso')}</option><option value='retiro'>{c('Retiro')}</option></select></div>
                        <div className='space-y-2'><Label>{c('Monto')}</Label><Input type='number' min={0} value={movimientoMonto} onChange={(e) => setMovimientoMonto(e.target.value)} /></div>
                        <div className='space-y-2'><Label>{c('Concepto')}</Label><Input value={movimientoConcepto} onChange={(e) => setMovimientoConcepto(e.target.value)} placeholder={c('Ej: retiro para cambio, ingreso extra...')} /></div>
                        <Button className='w-full' variant='outline' disabled={saving}>{c('Registrar movimiento')}</Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>{c('Cerrar caja')}</CardTitle></CardHeader>
                    <CardContent>
                      <form className='space-y-3' onSubmit={handleCerrarCaja}>
                        <div className='rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/60'><div className='flex justify-between'><span>{c('Esperado')}</span><b>{formatCurrencyARS(caja.total_esperado, locale)}</b></div><div className={`mt-1 flex justify-between ${getDifferenceClass(diferenciaPreview)}`}><span>{c('Diferencia previa')}</span><b>{formatCurrencyARS(diferenciaPreview, locale)}</b></div></div>
                        <div className='space-y-2'><Label>{c('Monto contado')}</Label><Input type='number' min={0} value={montoContado} onChange={(e) => setMontoContado(e.target.value)} /></div>
                        <div className='space-y-2'><Label>{c('Observaciones cierre')}</Label><Input value={observacionesCierre} onChange={(e) => setObservacionesCierre(e.target.value)} placeholder={c('Ej: sin diferencias')} /></div>
                        <Button className='w-full bg-[#02a8e1] hover:bg-[#0288b1]' disabled={saving}>{saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Lock className='mr-2 h-4 w-4' />}{c('Cerrar caja')}</Button>
                        <Button type='button' variant='outline' className='w-full' onClick={() => handlePrintReport(caja)}><Printer className='mr-2 h-4 w-4' />{c('Imprimir reporte X/Z')}</Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </section>
            )}

            {dashboard.ventasSinCaja.length > 0 && (
              <Card>
                <CardHeader><CardTitle className='flex items-center gap-2'><FileText className='h-5 w-5 text-orange-600' />{c('Ventas de hoy sin caja asignada')}</CardTitle></CardHeader>
                <CardContent><p className='text-sm text-muted-foreground'>{c('Hay ')}{dashboard.ventasSinCaja.length}{c(' ventas del día sin caja asociada. En la siguiente etapa se podrá reasignarlas a una sesión.')}</p></CardContent>
              </Card>
            )}
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
