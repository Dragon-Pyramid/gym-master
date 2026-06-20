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
import type { ComercialCajaDashboard, ComercialCajaSesion } from '@/interfaces/comercialCaja.interface';
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

function buildCajaReportHtml(session: ComercialCajaSesion, dashboard: ComercialCajaDashboard) {
  const ventasRows = dashboard.ventasTurno
    .map((venta) => `<tr><td>${venta.comprobante_codigo || venta.id}</td><td>${venta.metodo_pago}</td><td style="text-align:right">${formatCurrencyARS(venta.total)}</td></tr>`)
    .join('');
  const movimientoRows = dashboard.movimientos
    .map((mov) => `<tr><td>${mov.tipo}</td><td>${mov.concepto}</td><td style="text-align:right">${formatCurrencyARS(mov.monto)}</td></tr>`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8" />
  <title>Reporte Caja ${session.codigo}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:24px;color:#111} h1{margin:0 0 4px}.muted{color:#666;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px} th,td{border-bottom:1px solid #ddd;padding:6px;text-align:left}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}.box{border:1px solid #ddd;padding:10px;border-radius:8px}.box b{display:block;font-size:14px}
  </style></head><body>
  <h1>Gym Master - Reporte X/Z de Caja</h1>
  <div class="muted">${session.codigo} · Estado: ${session.estado} · Apertura: ${session.fecha_apertura || ''} · Cierre: ${session.fecha_cierre || 'Caja abierta'}</div>
  <div class="grid">
    <div class="box">Inicial<b>${formatCurrencyARS(session.monto_inicial)}</b></div>
    <div class="box">Ventas<b>${formatCurrencyARS(dashboard.metricas.totalVentasTurno)}</b></div>
    <div class="box">Esperado<b>${formatCurrencyARS(dashboard.metricas.totalEsperado)}</b></div>
    <div class="box">Diferencia<b>${formatCurrencyARS(session.diferencia ?? 0)}</b></div>
  </div>
  <h2>Ventas del turno</h2><table><thead><tr><th>Comprobante</th><th>Pago</th><th>Total</th></tr></thead><tbody>${ventasRows || '<tr><td colspan="3">Sin ventas</td></tr>'}</tbody></table>
  <h2>Movimientos de caja</h2><table><thead><tr><th>Tipo</th><th>Concepto</th><th>Monto</th></tr></thead><tbody>${movimientoRows || '<tr><td colspan="3">Sin movimientos</td></tr>'}</tbody></table>
  <script>window.print();</script>
  </body></html>`;
}

export default function ComercialCajaPage() {
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
      toast.error(error?.message || 'No se pudo cargar caja comercial');
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
      toast.success('Caja abierta correctamente');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo abrir caja');
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
      toast.success('Movimiento registrado');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo registrar movimiento');
    } finally { setSaving(false); }
  }

  async function handleCerrarCaja(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await ejecutarComercialCajaAction({ action: 'cerrar', monto_contado: Number(montoContado), observaciones_cierre: observacionesCierre });
      setDashboard(data);
      setObservacionesCierre('');
      toast.success('Caja cerrada correctamente');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cerrar caja');
    } finally { setSaving(false); }
  }

  function handlePrintReport(session?: ComercialCajaSesion | null) {
    const target = session ?? dashboard.cajaAbierta;
    if (!target) return;
    const popup = window.open('', '_blank', 'width=920,height=720');
    if (!popup) { toast.error('El navegador bloqueó la impresión'); return; }
    popup.document.write(buildCajaReportHtml(target, dashboard));
    popup.document.close();
  }

  if (!isInitialized) return <div>Cargando...</div>;
  if (!isAuthenticated) return null;

  const caja = dashboard.cajaAbierta;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Caja / Cashup' />
          <main className='flex-1 space-y-6 p-6'>
            <section className='rounded-2xl border bg-white p-6 shadow-sm'>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-sky-600'>Comercial y Stock</p>
                  <h1 className='text-2xl font-bold'>Caja / Cashup</h1>
                  <p className='max-w-4xl text-sm leading-relaxed text-muted-foreground'>Apertura, ingresos, retiros, ventas del turno, cierre esperado vs contado y reporte X/Z imprimible.</p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button variant='outline' onClick={loadDashboard} disabled={loading}>{loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}Actualizar</Button>
                  <Button asChild variant='outline'><Link href='/dashboard/comercial/kiosco'>POS / Kiosco</Link></Button>
                  <Button asChild className='bg-[#02a8e1] hover:bg-[#0288b1]'><Link href='/dashboard/ventas'>Ventas</Link></Button>
                </div>
              </div>
            </section>

            <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5'>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>Estado</p><p className='text-xl font-bold'>{caja ? 'Abierta' : 'Sin caja'}</p></div>{caja ? <Unlock className='h-6 w-6 text-emerald-600' /> : <Lock className='h-6 w-6 text-slate-500' />}</CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>Ventas turno</p><p className='text-xl font-bold'>{formatCurrencyARS(dashboard.metricas.totalVentasTurno)}</p></div><CreditCard className='h-6 w-6 text-sky-600' /></CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>Ingresos</p><p className='text-xl font-bold'>{formatCurrencyARS(dashboard.metricas.totalIngresos)}</p></div><TrendingUp className='h-6 w-6 text-emerald-600' /></CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>Retiros</p><p className='text-xl font-bold'>{formatCurrencyARS(dashboard.metricas.totalRetiros)}</p></div><TrendingDown className='h-6 w-6 text-red-600' /></CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>Esperado</p><p className='text-xl font-bold'>{formatCurrencyARS(dashboard.metricas.totalEsperado)}</p></div><Calculator className='h-6 w-6 text-violet-600' /></CardContent></Card>
            </section>

            {!caja ? (
              <Card>
                <CardHeader><CardTitle className='flex items-center gap-2'><Banknote className='h-5 w-5 text-sky-600' />Abrir caja</CardTitle></CardHeader>
                <CardContent>
                  <form className='grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr_auto]' onSubmit={handleAbrirCaja}>
                    <div className='space-y-2'><Label>Monto inicial</Label><Input type='number' min={0} value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} /></div>
                    <div className='space-y-2'><Label>Observaciones</Label><Input value={observacionesApertura} onChange={(e) => setObservacionesApertura(e.target.value)} placeholder='Ej: apertura turno mañana' /></div>
                    <Button className='self-end bg-[#02a8e1] hover:bg-[#0288b1]' disabled={saving}>{saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Unlock className='mr-2 h-4 w-4' />}Abrir caja</Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <section className='grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]'>
                <div className='space-y-6'>
                  <Card>
                    <CardHeader><CardTitle>Caja abierta: {caja.codigo}</CardTitle></CardHeader>
                    <CardContent className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                      <div><p className='text-sm text-muted-foreground'>Inicial</p><p className='font-bold'>{formatCurrencyARS(caja.monto_inicial)}</p></div>
                      <div><p className='text-sm text-muted-foreground'>Ventas</p><p className='font-bold'>{formatCurrencyARS(caja.total_ventas)}</p></div>
                      <div><p className='text-sm text-muted-foreground'>Esperado</p><p className='font-bold'>{formatCurrencyARS(caja.total_esperado)}</p></div>
                      <div><p className='text-sm text-muted-foreground'>Apertura</p><p className='text-sm'>{new Date(caja.fecha_apertura).toLocaleString()}</p></div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Ventas del turno</CardTitle></CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {dashboard.ventasTurno.map((venta) => <div key={venta.id} className='flex items-center justify-between rounded-lg border p-3 text-sm'><div><p className='font-medium'>{venta.comprobante_codigo || venta.id}</p><p className='text-xs text-muted-foreground'>{venta.cliente_nombre || 'Consumidor Final'} · {venta.metodo_pago}</p></div><p className='font-bold'>{formatCurrencyARS(venta.total)}</p></div>)}
                        {dashboard.ventasTurno.length === 0 && <p className='text-sm text-muted-foreground'>Aún no hay ventas asociadas a la caja abierta.</p>}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Historial de cierres</CardTitle></CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        {dashboard.sesionesRecientes.map((sesion) => <div key={sesion.id} className='flex items-center justify-between rounded-lg border p-3 text-sm'><div><p className='font-medium'>{sesion.codigo}</p><p className='text-xs text-muted-foreground'>{sesion.estado} · {new Date(sesion.fecha_apertura).toLocaleString()}</p></div><div className='text-right'><p className='font-bold'>{formatCurrencyARS(sesion.total_esperado)}</p><p className={`text-xs ${getDifferenceClass(sesion.diferencia)}`}>Dif. {formatCurrencyARS(sesion.diferencia ?? 0)}</p></div></div>)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className='space-y-6'>
                  <Card>
                    <CardHeader><CardTitle>Ingreso / retiro</CardTitle></CardHeader>
                    <CardContent>
                      <form className='space-y-3' onSubmit={handleMovimiento}>
                        <div className='space-y-2'><Label>Tipo</Label><select className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm' value={movimientoTipo} onChange={(e) => setMovimientoTipo(e.target.value as any)}><option value='ingreso'>Ingreso</option><option value='retiro'>Retiro</option></select></div>
                        <div className='space-y-2'><Label>Monto</Label><Input type='number' min={0} value={movimientoMonto} onChange={(e) => setMovimientoMonto(e.target.value)} /></div>
                        <div className='space-y-2'><Label>Concepto</Label><Input value={movimientoConcepto} onChange={(e) => setMovimientoConcepto(e.target.value)} placeholder='Ej: retiro para cambio, ingreso extra...' /></div>
                        <Button className='w-full' variant='outline' disabled={saving}>Registrar movimiento</Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Cerrar caja</CardTitle></CardHeader>
                    <CardContent>
                      <form className='space-y-3' onSubmit={handleCerrarCaja}>
                        <div className='rounded-lg bg-slate-50 p-3 text-sm'><div className='flex justify-between'><span>Esperado</span><b>{formatCurrencyARS(caja.total_esperado)}</b></div><div className={`mt-1 flex justify-between ${getDifferenceClass(diferenciaPreview)}`}><span>Diferencia previa</span><b>{formatCurrencyARS(diferenciaPreview)}</b></div></div>
                        <div className='space-y-2'><Label>Monto contado</Label><Input type='number' min={0} value={montoContado} onChange={(e) => setMontoContado(e.target.value)} /></div>
                        <div className='space-y-2'><Label>Observaciones cierre</Label><Input value={observacionesCierre} onChange={(e) => setObservacionesCierre(e.target.value)} placeholder='Ej: sin diferencias' /></div>
                        <Button className='w-full bg-[#02a8e1] hover:bg-[#0288b1]' disabled={saving}>{saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Lock className='mr-2 h-4 w-4' />}Cerrar caja</Button>
                        <Button type='button' variant='outline' className='w-full' onClick={() => handlePrintReport(caja)}><Printer className='mr-2 h-4 w-4' />Imprimir reporte X/Z</Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </section>
            )}

            {dashboard.ventasSinCaja.length > 0 && (
              <Card>
                <CardHeader><CardTitle className='flex items-center gap-2'><FileText className='h-5 w-5 text-orange-600' />Ventas de hoy sin caja asignada</CardTitle></CardHeader>
                <CardContent><p className='text-sm text-muted-foreground'>Hay {dashboard.ventasSinCaja.length} ventas del día sin caja asociada. En la siguiente etapa se podrá reasignarlas a una sesión.</p></CardContent>
              </Card>
            )}
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
