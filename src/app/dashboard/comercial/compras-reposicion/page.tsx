'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Loader2,
  PackagePlus,
  RefreshCw,
  Save,
  ShoppingCart,
  Truck,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';
import type {
  ComercialComprasReposicionDashboard,
  ComercialOrdenCompra,
  ComercialOrdenCompraDetalle,
  CreateOrdenCompraDetalleDTO,
} from '@/interfaces/comercialComprasReposicion.interface';
import {
  createComercialOrdenCompra,
  getComercialComprasReposicionDashboard,
  recibirComercialOrdenCompra,
  upsertComercialProveedorProducto,
} from '@/services/comercialComprasReposicionService';
import { formatCurrencyARS } from '@/lib/comercial/productos';

const emptyDashboard: ComercialComprasReposicionDashboard = {
  proveedores: [],
  productos: [],
  ubicaciones: [],
  relaciones: [],
  reposicionSugerida: [],
  ordenes: [],
  metricas: {
    productosAReponer: 0,
    costoReposicionSugerida: 0,
    ordenesAbiertas: 0,
    ordenesParciales: 0,
    proveedoresActivos: 0,
  },
};

type OrdenItemForm = {
  producto_id: string;
  cantidad_solicitada: string;
  costo_unitario: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: string | number | null | undefined) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function createEmptyItem(): OrdenItemForm {
  return { producto_id: '', cantidad_solicitada: '1', costo_unitario: '' };
}

function estadoLabel(estado: string) {
  const labels: Record<string, string> = {
    borrador: 'Borrador',
    pedida: 'Pedida',
    parcial: 'Parcial',
    recibida: 'Recibida',
    anulada: 'Anulada',
  };
  return labels[estado] ?? estado;
}

function StockStateBadge({ estado }: { estado: string }) {
  const className =
    estado === 'sin_stock'
      ? 'bg-red-100 text-red-700'
      : estado === 'critico'
        ? 'bg-orange-100 text-orange-700'
        : estado === 'bajo_minimo'
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-emerald-100 text-emerald-700';
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{estado.replace('_', ' ')}</span>;
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
        <div className='rounded-full bg-sky-50 p-3 text-sky-600'>
          <Icon className='h-5 w-5' />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComercialComprasReposicionPage() {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ComercialComprasReposicionDashboard>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [savingRelation, setSavingRelation] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const [relProductoId, setRelProductoId] = useState('');
  const [relProveedorId, setRelProveedorId] = useState('');
  const [relCosto, setRelCosto] = useState('');
  const [relCompraMinima, setRelCompraMinima] = useState('1');
  const [relLeadTime, setRelLeadTime] = useState('0');
  const [relPrincipal, setRelPrincipal] = useState(true);

  const [ordenProveedorId, setOrdenProveedorId] = useState('');
  const [ordenUbicacionId, setOrdenUbicacionId] = useState('');
  const [ordenFecha, setOrdenFecha] = useState(todayIso());
  const [ordenFechaEstimada, setOrdenFechaEstimada] = useState('');
  const [ordenObservaciones, setOrdenObservaciones] = useState('');
  const [ordenItems, setOrdenItems] = useState<OrdenItemForm[]>([createEmptyItem()]);
  const [recepciones, setRecepciones] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, isInitialized, router]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await getComercialComprasReposicionDashboard();
      setDashboard(data);
      if (!ordenUbicacionId && data.ubicaciones[0]?.id) setOrdenUbicacionId(data.ubicaciones[0].id);
      if (!relProveedorId && data.proveedores[0]?.id) setRelProveedorId(data.proveedores[0].id);
      if (!ordenProveedorId && data.proveedores[0]?.id) setOrdenProveedorId(data.proveedores[0].id);
    } catch (error: any) {
      toast.error(error.message || c('No se pudo cargar compras/reposición'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isAuthenticated]);

  const proveedoresActivos = useMemo(
    () => dashboard.proveedores.filter((proveedor) => proveedor.estado !== 'inactivo' && proveedor.estado !== 'discontinuado'),
    [dashboard.proveedores]
  );
  const productosActivos = useMemo(() => dashboard.productos.filter((producto) => producto.activo !== false), [dashboard.productos]);
  const productoById = useMemo(() => new Map(productosActivos.map((producto) => [producto.id, producto])), [productosActivos]);
  const sugerenciasPendientes = useMemo(
    () => dashboard.reposicionSugerida.filter((item) => Number(item.cantidad_sugerida ?? 0) > 0),
    [dashboard.reposicionSugerida]
  );
  const ordenesAbiertas = useMemo(
    () => dashboard.ordenes.filter((orden) => orden.estado === 'pedida' || orden.estado === 'parcial'),
    [dashboard.ordenes]
  );

  const ordenTotal = useMemo(
    () =>
      ordenItems.reduce((acc, item) => acc + toNumber(item.cantidad_solicitada) * toNumber(item.costo_unitario), 0),
    [ordenItems]
  );

  function updateItem(index: number, next: Partial<OrdenItemForm>) {
    setOrdenItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const updated = { ...item, ...next };
        if (next.producto_id) {
          const producto = productoById.get(next.producto_id);
          const relacion = dashboard.relaciones.find(
            (row) => row.producto_id === next.producto_id && row.proveedor_id === ordenProveedorId
          );
          updated.costo_unitario = String(Number(relacion?.costo_unitario ?? producto?.costo ?? 0) || '');
        }
        return updated;
      })
    );
  }

  function addSuggestedToOrder(productoId: string, cantidad: number, costo: number, proveedorId?: string | null) {
    if (proveedorId) setOrdenProveedorId(proveedorId);
    setOrdenItems((prev) => [
      ...prev.filter((item) => item.producto_id),
      {
        producto_id: productoId,
        cantidad_solicitada: String(Math.max(1, Math.round(cantidad))),
        costo_unitario: String(Math.max(0, costo)),
      },
    ]);
    toast.success(c('Producto agregado a la orden'));
  }

  async function handleSaveRelation(event: React.FormEvent) {
    event.preventDefault();
    setSavingRelation(true);
    try {
      await upsertComercialProveedorProducto({
        producto_id: relProductoId,
        proveedor_id: relProveedorId,
        costo_unitario: Number(relCosto),
        compra_minima: Number(relCompraMinima || 1),
        lead_time_dias: Number(relLeadTime || 0),
        principal: relPrincipal,
      });
      toast.success(c('Proveedor asociado al producto'));
      setRelProductoId('');
      setRelCosto('');
      await loadDashboard();
    } catch (error: any) {
      toast.error(error.message || c('No se pudo asociar proveedor'));
    } finally {
      setSavingRelation(false);
    }
  }

  async function handleCreateOrder(event: React.FormEvent) {
    event.preventDefault();
    setSavingOrder(true);
    try {
      const detalles: CreateOrdenCompraDetalleDTO[] = ordenItems
        .filter((item) => item.producto_id)
        .map((item, index) => {
          const cantidad = Number(item.cantidad_solicitada);
          const costo = Number(item.costo_unitario);
          if (!Number.isInteger(cantidad) || cantidad <= 0) throw new Error(`${c('Cantidad inválida en ítem')} ${index + 1}`);
          if (!Number.isFinite(costo) || costo < 0) throw new Error(`${c('Costo inválido en ítem')} ${index + 1}`);
          return { producto_id: item.producto_id, cantidad_solicitada: cantidad, costo_unitario: costo };
        });
      if (!detalles.length) throw new Error(c('La orden debe tener al menos un producto'));

      await createComercialOrdenCompra({
        proveedor_id: ordenProveedorId,
        fecha_orden: ordenFecha,
        fecha_estimada_recepcion: ordenFechaEstimada || null,
        ubicacion_destino_id: ordenUbicacionId || null,
        observaciones: ordenObservaciones.trim() || null,
        detalles,
      });
      toast.success(c('Orden de compra creada'));
      setOrdenItems([createEmptyItem()]);
      setOrdenObservaciones('');
      await loadDashboard();
    } catch (error: any) {
      toast.error(error.message || c('No se pudo crear la orden'));
    } finally {
      setSavingOrder(false);
    }
  }

  async function handleReceiveOrder(orden: ComercialOrdenCompra) {
    setReceivingId(orden.id);
    try {
      const orderRecepciones = recepciones[orden.id] ?? {};
      const detalles = (orden.detalles ?? [])
        .map((detalle) => {
          const pendiente = Number(detalle.cantidad_solicitada ?? 0) - Number(detalle.cantidad_recibida ?? 0);
          const cantidad = Number(orderRecepciones[detalle.id] ?? pendiente);
          return { detalle_id: detalle.id, cantidad_recibir: Number.isFinite(cantidad) ? cantidad : 0 };
        })
        .filter((item) => item.cantidad_recibir > 0);

      await recibirComercialOrdenCompra({
        orden_compra_id: orden.id,
        ubicacion_destino_id: orden.ubicacion_destino_id || ordenUbicacionId || null,
        detalles,
      });
      toast.success(c('Recepción registrada y stock actualizado'));
      setRecepciones((prev) => ({ ...prev, [orden.id]: {} }));
      await loadDashboard();
    } catch (error: any) {
      toast.error(error.message || c('No se pudo recibir la orden'));
    } finally {
      setReceivingId(null);
    }
  }

  if (!isInitialized) return <div>{c('Cargando...')}</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c('Compras / Reposición')} />
          <main className='flex-1 space-y-6 p-6'>
            <section className='rounded-3xl border border-sky-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-sm dark:border-cyan-800/70'>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-sky-600'>{c('Comercial y Stock')}</p>
                  <h1 className='text-2xl font-bold'>{c('Compras, proveedores y reposición')}</h1>
                  <p className='max-w-3xl text-sm leading-relaxed text-muted-foreground'>
                    {c('Gestioná proveedores por producto, compras sugeridas, órdenes de compra y recepción de mercadería integrada al Stock Ledger.')}
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button variant='outline' className='border-white/30 bg-white/10 text-white hover:bg-white/20' onClick={loadDashboard} disabled={loading}>
                    {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}
                    {c('Actualizar')}
                  </Button>
                  <Button asChild variant='outline' className='border-white/30 bg-white/10 text-white hover:bg-white/20'><Link href='/dashboard/comercial/stock-ledger'>Stock Ledger</Link></Button>
                  <Button asChild variant='outline' className='border-white/30 bg-white/10 text-white hover:bg-white/20'><Link href='/dashboard/comercial/kiosco'>{c('POS / Kiosco')}</Link></Button>
                </div>
              </div>
            </section>

            <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5'>
              <MetricCard title={c('A reponer')} value={String(dashboard.metricas.productosAReponer)} description={c('Productos bajo mínimo u objetivo.')} icon={AlertTriangle} />
              <MetricCard title={c('Costo sugerido')} value={formatCurrencyARS(dashboard.metricas.costoReposicionSugerida)} description={c('Estimación de reposición.')} icon={ShoppingCart} />
              <MetricCard title={c('Órdenes abiertas')} value={String(dashboard.metricas.ordenesAbiertas)} description={c('Pedidas o parciales.')} icon={ClipboardList} />
              <MetricCard title={c('Parciales')} value={String(dashboard.metricas.ordenesParciales)} description={c('Con recepción pendiente.')} icon={PackagePlus} />
              <MetricCard title={c('Proveedores')} value={String(dashboard.metricas.proveedoresActivos)} description={c('Activos para compras.')} icon={Truck} />
            </section>

            <section className='grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
              <Card>
                <CardHeader><CardTitle>{c('Reposición sugerida')}</CardTitle></CardHeader>
                <CardContent className='space-y-3'>
                  {sugerenciasPendientes.length === 0 ? (
                    <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>{c('No hay productos sugeridos para reposición.')}</div>
                  ) : (
                    sugerenciasPendientes.slice(0, 12).map((item) => (
                      <div key={item.producto_id} className='grid grid-cols-1 gap-3 rounded-lg border p-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr_auto] lg:items-center'>
                        <div>
                          <p className='font-semibold'>{item.producto_nombre}</p>
                          <p className='text-xs text-muted-foreground'>{c('Stock')} {item.stock_total} · {c('mínimo')} {item.stock_minimo} · {c('objetivo')} {item.stock_objetivo}</p>
                          <p className='text-xs text-muted-foreground'>{item.proveedor_sugerido_nombre ?? c('Sin proveedor sugerido')}</p>
                        </div>
                        <div><StockStateBadge estado={item.estado_stock} /></div>
                        <div className='text-sm'>
                          <p className='font-semibold'>{c('Comprar')} {item.cantidad_sugerida}</p>
                          <p className='text-xs text-muted-foreground'>{formatCurrencyARS(item.costo_estimado_reposicion)}</p>
                        </div>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => addSuggestedToOrder(item.producto_id, item.cantidad_sugerida, item.costo_sugerido, item.proveedor_sugerido_id)}
                        >
                          Agregar
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>{c('Proveedor por producto')}</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveRelation} className='space-y-4'>
                    <div className='space-y-1.5'>
                      <Label>{c('Producto')}</Label>
                      <select className='h-10 w-full rounded-md border px-3 text-sm' value={relProductoId} onChange={(e) => setRelProductoId(e.target.value)} required>
                        <option value=''>{c('Seleccionar producto')}</option>
                        {productosActivos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
                      </select>
                    </div>
                    <div className='space-y-1.5'>
                      <Label>{c('Proveedor')}</Label>
                      <select className='h-10 w-full rounded-md border px-3 text-sm' value={relProveedorId} onChange={(e) => setRelProveedorId(e.target.value)} required>
                        <option value=''>Seleccionar proveedor</option>
                        {proveedoresActivos.map((proveedor) => <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>)}
                      </select>
                    </div>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
                      <div className='space-y-1.5'><Label>{c('Costo')}</Label><Input type='number' min='0' step='0.01' value={relCosto} onChange={(e) => setRelCosto(e.target.value)} required /></div>
                      <div className='space-y-1.5'><Label>{c('Compra mínima')}</Label><Input type='number' min='1' value={relCompraMinima} onChange={(e) => setRelCompraMinima(e.target.value)} /></div>
                      <div className='space-y-1.5'><Label>{c('Lead time días')}</Label><Input type='number' min='0' value={relLeadTime} onChange={(e) => setRelLeadTime(e.target.value)} /></div>
                    </div>
                    <label className='flex items-center gap-2 text-sm'>
                      <input type='checkbox' checked={relPrincipal} onChange={(e) => setRelPrincipal(e.target.checked)} />
                      Marcar como proveedor principal
                    </label>
                    <Button type='submit' disabled={savingRelation}>
                      {savingRelation ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}
                      {c('Guardar relación')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader><CardTitle>{c('Nueva orden de compra')}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOrder} className='space-y-5'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                    <div className='space-y-1.5'>
                      <Label>{c('Proveedor')}</Label>
                      <select className='h-10 w-full rounded-md border px-3 text-sm' value={ordenProveedorId} onChange={(e) => setOrdenProveedorId(e.target.value)} required>
                        <option value=''>Seleccionar proveedor</option>
                        {proveedoresActivos.map((proveedor) => <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>)}
                      </select>
                    </div>
                    <div className='space-y-1.5'>
                      <Label>{c('Ubicación destino')}</Label>
                      <select className='h-10 w-full rounded-md border px-3 text-sm' value={ordenUbicacionId} onChange={(e) => setOrdenUbicacionId(e.target.value)}>
                        {dashboard.ubicaciones.map((ubicacion) => <option key={ubicacion.id} value={ubicacion.id}>{ubicacion.nombre}</option>)}
                      </select>
                    </div>
                    <div className='space-y-1.5'><Label>{c('Fecha orden')}</Label><Input type='date' value={ordenFecha} onChange={(e) => setOrdenFecha(e.target.value)} /></div>
                    <div className='space-y-1.5'><Label>{c('Recepción estimada')}</Label><Input type='date' value={ordenFechaEstimada} onChange={(e) => setOrdenFechaEstimada(e.target.value)} /></div>
                  </div>

                  <div className='space-y-3'>
                    {ordenItems.map((item, index) => (
                      <div key={index} className='grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 lg:grid-cols-[1.4fr_0.45fr_0.55fr_0.55fr_auto] lg:items-end'>
                        <div className='space-y-1.5'>
                          <Label>{c('Producto')}</Label>
                          <select className='h-10 w-full rounded-md border px-3 text-sm' value={item.producto_id} onChange={(e) => updateItem(index, { producto_id: e.target.value })} required>
                            <option value=''>{c('Seleccionar producto')}</option>
                            {productosActivos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre} · stock {producto.stock ?? 0}</option>)}
                          </select>
                        </div>
                        <div className='space-y-1.5'><Label>{c('Cantidad')}</Label><Input type='number' min='1' value={item.cantidad_solicitada} onChange={(e) => updateItem(index, { cantidad_solicitada: e.target.value })} required /></div>
                        <div className='space-y-1.5'><Label>{c('Costo')}</Label><Input type='number' min='0' step='0.01' value={item.costo_unitario} onChange={(e) => updateItem(index, { costo_unitario: e.target.value })} required /></div>
                        <div className='text-sm font-semibold'>{formatCurrencyARS(toNumber(item.cantidad_solicitada) * toNumber(item.costo_unitario))}</div>
                        <Button type='button' variant='ghost' onClick={() => setOrdenItems((prev) => prev.filter((_, idx) => idx !== index))} disabled={ordenItems.length === 1}>{c('Quitar')}</Button>
                      </div>
                    ))}
                  </div>
                  <div className='flex flex-col justify-between gap-3 rounded-lg border bg-sky-50 p-3 md:flex-row md:items-center dark:border-sky-900/60 dark:bg-sky-950/20'>
                    <div>
                      <p className='text-sm text-muted-foreground'>{c('Total estimado')}</p>
                      <p className='text-xl font-bold'>{formatCurrencyARS(ordenTotal)}</p>
                    </div>
                    <div className='flex gap-2'>
                      <Button type='button' variant='outline' onClick={() => setOrdenItems((prev) => [...prev, createEmptyItem()])}>{c('Agregar ítem')}</Button>
                      <Button type='submit' disabled={savingOrder}>
                        {savingOrder ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <ShoppingCart className='mr-2 h-4 w-4' />}
                        {c('Crear orden')}
                      </Button>
                    </div>
                  </div>
                  <div className='space-y-1.5'>
                    <Label>{c('Observaciones')}</Label>
                    <Input value={ordenObservaciones} onChange={(e) => setOrdenObservaciones(e.target.value)} placeholder={c('Notas internas de compra o reposición')} />
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{c('Órdenes abiertas y recepción')}</CardTitle></CardHeader>
              <CardContent className='space-y-4'>
                {ordenesAbiertas.length === 0 ? (
                  <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>{c('No hay órdenes abiertas.')}</div>
                ) : (
                  ordenesAbiertas.map((orden) => (
                    <div key={orden.id} className='space-y-3 rounded-xl border p-4'>
                      <div className='flex flex-col justify-between gap-3 lg:flex-row lg:items-start'>
                        <div>
                          <p className='font-semibold'>{orden.numero_orden}</p>
                          <p className='text-sm text-muted-foreground'>{orden.proveedor?.nombre ?? c('Proveedor')} · {c(estadoLabel(orden.estado))} · {formatCurrencyARS(orden.total_estimado)}</p>
                          <p className='text-xs text-muted-foreground'>{c('Destino')}: {orden.ubicacion_destino?.nombre ?? c('Sin ubicación fija')}</p>
                        </div>
                        <Button onClick={() => handleReceiveOrder(orden)} disabled={receivingId === orden.id}>
                          {receivingId === orden.id ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <CheckCircle2 className='mr-2 h-4 w-4' />}
                          Recibir cantidades
                        </Button>
                      </div>
                      <div className='space-y-2'>
                        {(orden.detalles ?? []).map((detalle: ComercialOrdenCompraDetalle) => {
                          const pendiente = Number(detalle.cantidad_solicitada ?? 0) - Number(detalle.cantidad_recibida ?? 0);
                          return (
                            <div key={detalle.id} className='grid grid-cols-1 gap-3 rounded-lg bg-muted/30 p-3 md:grid-cols-[1.4fr_0.5fr_0.5fr_0.5fr] md:items-center'>
                              <div>
                                <p className='font-medium'>{detalle.producto?.nombre ?? c('Producto')}</p>
                                <p className='text-xs text-muted-foreground'>{c('Solicitado')} {detalle.cantidad_solicitada} · {c('recibido')} {detalle.cantidad_recibida} · {c('pendiente')} {pendiente}</p>
                              </div>
                              <div className='text-sm'>{formatCurrencyARS(detalle.costo_unitario)}</div>
                              <div className='text-sm'>{formatCurrencyARS(detalle.subtotal_estimado)}</div>
                              <Input
                                type='number'
                                min='0'
                                max={pendiente}
                                value={recepciones[orden.id]?.[detalle.id] ?? String(Math.max(0, pendiente))}
                                onChange={(e) => setRecepciones((prev) => ({
                                  ...prev,
                                  [orden.id]: { ...(prev[orden.id] ?? {}), [detalle.id]: e.target.value },
                                }))}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{c('Órdenes recientes')}</CardTitle></CardHeader>
              <CardContent className='space-y-2'>
                {dashboard.ordenes.slice(0, 10).map((orden) => (
                  <div key={orden.id} className='flex flex-col justify-between gap-2 rounded-lg border p-3 md:flex-row md:items-center'>
                    <div>
                      <p className='font-semibold'>{orden.numero_orden}</p>
                      <p className='text-sm text-muted-foreground'>{orden.proveedor?.nombre ?? c('Proveedor')} · {c(estadoLabel(orden.estado))}</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold'>{formatCurrencyARS(orden.total_estimado)}</p>
                      <p className='text-xs text-muted-foreground'>{String(orden.fecha_orden ?? '').slice(0, 10)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
