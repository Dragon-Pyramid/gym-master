'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Barcode,
  CreditCard,
  Loader2,
  PackagePlus,
  Printer,
  RefreshCw,
  Smartphone,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Warehouse,
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
import type {
  ComercialPosDashboard,
  ComercialPosProducto,
  ComercialPosVentaResumen,
} from '@/interfaces/comercialPos.interface';
import {
  createComercialKioscoPosVenta,
  getComercialKioscoPosDashboard,
} from '@/services/comercialKioscoPosService';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { toast } from 'sonner';
import type { ComercialScannerEvent, ComercialScannerSession } from '@/interfaces/comercialMobileScanner.interface';
import {
  closeComercialMobileScannerSession,
  createComercialMobileScannerSession,
  getComercialMobileScannerState,
  markComercialMobileScannerEventProcessed,
} from '@/services/comercialMobileScannerService';

const initialDashboard: ComercialPosDashboard = {
  productos: [],
  stockPorUbicacion: [],
  ubicaciones: [],
  ventasRecientes: [],
  ubicacionDefaultId: null,
  metricas: {
    ventasHoy: 0,
    totalHoy: 0,
    itemsHoy: 0,
    productosDisponibles: 0,
    productosCriticos: 0,
  },
};

type CartItem = {
  key: string;
  item_tipo: 'producto' | 'servicio';
  producto_id?: string | null;
  servicio_id?: string | null;
  nombre: string;
  sku?: string | null;
  codigo_barras?: string | null;
  precio_unitario: number;
  cantidad: number;
  descuento: number;
  stockDisponible: number;
};

const metodoPagoOptions = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'otro', label: 'Otro' },
];

function getStockForLocation(productoId: string, ubicacionId: string, dashboard: ComercialPosDashboard) {
  return dashboard.stockPorUbicacion
    .filter((item) => item.producto_id === productoId && item.ubicacion_id === ubicacionId)
    .reduce((total, item) => total + Number(item.cantidad ?? 0), 0);
}

function getProductStatusClass(product: ComercialPosProducto) {
  if (product.estado_stock === 'sin_stock') return 'bg-red-100 text-red-700';
  if (product.estado_stock === 'critico') return 'bg-orange-100 text-orange-700';
  if (product.estado_stock === 'bajo_minimo') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function getClientLabel(sale: ComercialPosVentaResumen) {
  if (sale.cliente_nombre) return sale.cliente_nombre;
  if (sale.cliente_tipo === 'visitante') return 'Visitante';
  return 'Consumidor Final';
}

function buildTicketHtml(sale: ComercialPosVentaResumen) {
  const detalles = sale.venta_detalle ?? sale.detalles ?? [];
  const rows = detalles
    .map((detalle) => {
      const nombre = detalle.producto?.nombre || detalle.servicio?.nombre || (detalle.item_tipo === 'servicio' ? 'Servicio' : 'Producto');
      const lineTotal = Number(detalle.total_linea ?? (Number(detalle.cantidad) * Number(detalle.precio_unitario) - Number(detalle.descuento ?? 0)));
      return `<tr><td>${detalle.cantidad} x ${nombre}</td><td style="text-align:right">${formatCurrencyARS(lineTotal)}</td></tr>`;
    })
    .join('');

  return `<!doctype html>
  <html><head><meta charset="utf-8" />
  <title>Ticket ${sale.comprobante_codigo || ''}</title>
  <style>
    body { font-family: Arial, sans-serif; width: 280px; margin: 0 auto; padding: 16px; color: #111; }
    h1 { font-size: 18px; text-align: center; margin: 0 0 4px; }
    .sub { text-align: center; font-size: 11px; color: #555; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    td { padding: 4px 0; border-bottom: 1px dotted #ccc; vertical-align: top; }
    .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 12px; }
    .footer { text-align: center; font-size: 10px; margin-top: 14px; color: #555; }
  </style></head>
  <body>
    <h1>Gym Master</h1>
    <div class="sub">POS / Kiosco<br/>${sale.comprobante_codigo || ''}<br/>${sale.fecha || ''}</div>
    <div style="font-size:11px;margin-bottom:8px">Cliente: ${getClientLabel(sale)}<br/>Pago: ${sale.metodo_pago}</div>
    <table>${rows}</table>
    <div class="total">Total: ${formatCurrencyARS(sale.total)}</div>
    <div class="footer">Gracias por tu compra</div>
    <script>window.print();</script>
  </body></html>`;
}

export default function ComercialKioscoPosPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ComercialPosDashboard>(initialDashboard);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeTerm, setBarcodeTerm] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clienteTipo, setClienteTipo] = useState<'consumidor_final' | 'visitante'>('consumidor_final');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [lastSale, setLastSale] = useState<ComercialPosVentaResumen | null>(null);
  const [scannerSession, setScannerSession] = useState<ComercialScannerSession | null>(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerEvents, setScannerEvents] = useState<ComercialScannerEvent[]>([]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await getComercialKioscoPosDashboard();
      setDashboard(data ?? initialDashboard);
      setUbicacionId((current) => current || data?.ubicacionDefaultId || data?.ubicaciones?.[0]?.id || '');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar POS/Kiosco');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadDashboard();
    }
  }, [isInitialized, isAuthenticated]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const products = dashboard.productos.map((product) => ({
      ...product,
      stock_ubicacion: ubicacionId ? getStockForLocation(product.producto_id, ubicacionId, dashboard) : product.stock_total,
    }));

    if (!query) return products.slice(0, 80);

    return products
      .filter((product) =>
        [product.producto_nombre, product.sku, product.codigo_barras]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      )
      .slice(0, 80);
  }, [dashboard, searchTerm, ubicacionId]);

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
    const descuento = cart.reduce((sum, item) => sum + Number(item.descuento ?? 0), 0);
    return {
      subtotal,
      descuento,
      total: Math.max(subtotal - descuento, 0),
      items: cart.reduce((sum, item) => sum + item.cantidad, 0),
    };
  }, [cart]);

  function addToCart(product: ComercialPosProducto & { stock_ubicacion?: number }) {
    const stockDisponible = Number(product.stock_ubicacion ?? product.stock_total ?? 0);
    if (stockDisponible <= 0) {
      toast.error('Producto sin stock en la ubicación seleccionada');
      return;
    }

    setCart((current) => {
      const key = `producto:${product.producto_id}`;
      const existing = current.find((item) => item.key === key);
      if (existing) {
        if (existing.cantidad + 1 > existing.stockDisponible) {
          toast.error('No hay stock suficiente en la ubicación seleccionada');
          return current;
        }
        return current.map((item) =>
          item.key === key ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }

      return [
        ...current,
        {
          key,
          item_tipo: 'producto',
          producto_id: product.producto_id,
          servicio_id: null,
          nombre: product.producto_nombre,
          sku: product.sku,
          codigo_barras: product.codigo_barras,
          precio_unitario: Number(product.precio ?? 0),
          cantidad: 1,
          descuento: 0,
          stockDisponible,
        },
      ];
    });
  }

  function addServiceToCart(event: ComercialScannerEvent) {
    if (!event.servicio_id) return;
    const key = `servicio:${event.servicio_id}`;
    const servicePayload = (event.payload?.servicio || {}) as any;
    const precio = Number(servicePayload.precio ?? 0);

    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) => item.key === key ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [
        ...current,
        {
          key,
          item_tipo: 'servicio',
          producto_id: null,
          servicio_id: event.servicio_id,
          nombre: event.item_nombre || 'Servicio',
          precio_unitario: precio,
          cantidad: 1,
          descuento: 0,
          stockDisponible: 999999,
        },
      ];
    });
  }

  function updateCartQuantity(key: string, quantity: number) {
    setCart((current) =>
      current.map((item) => {
        if (item.key !== key) return item;
        const cantidad = Math.max(1, Math.min(Number(quantity) || 1, item.stockDisponible));
        return { ...item, cantidad };
      })
    );
  }

  function removeFromCart(key: string) {
    setCart((current) => current.filter((item) => item.key !== key));
  }

  function handleBarcodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = barcodeTerm.trim().toLowerCase();
    if (!query) return;

    const match = dashboard.productos.find((product) =>
      [product.codigo_barras, product.sku]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase() === query)
    );

    if (!match) {
      toast.error('No se encontró producto por código/SKU');
      return;
    }

    addToCart({
      ...match,
      stock_ubicacion: ubicacionId ? getStockForLocation(match.producto_id, ubicacionId, dashboard) : match.stock_total,
    });
    setBarcodeTerm('');
  }

  async function handleSubmitSale() {
    if (!ubicacionId) {
      toast.error('Seleccioná una ubicación de stock');
      return;
    }
    if (!cart.length) {
      toast.error('Agregá al menos un producto al carrito');
      return;
    }

    setSaving(true);
    try {
      const sale = await createComercialKioscoPosVenta({
        cliente_tipo: clienteTipo,
        cliente_nombre: clienteNombre,
        cliente_documento: clienteDocumento,
        metodo_pago: metodoPago as any,
        ubicacion_stock_id: ubicacionId,
        observaciones: 'Venta rápida POS/Kiosco',
        items: cart.map((item) => ({
          item_tipo: item.item_tipo,
          producto_id: item.producto_id ?? null,
          servicio_id: item.servicio_id ?? null,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento: item.descuento,
        })),
      });
      setLastSale(sale);
      setCart([]);
      setClienteNombre('');
      setClienteDocumento('');
      toast.success('Venta POS/Kiosco registrada');
      await loadDashboard();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo registrar venta');
    } finally {
      setSaving(false);
    }
  }

  function handlePrintTicket(sale: ComercialPosVentaResumen | null) {
    if (!sale) return;
    const ticket = window.open('', '_blank', 'width=360,height=640');
    if (!ticket) {
      toast.error('El navegador bloqueó la ventana de impresión');
      return;
    }
    ticket.document.write(buildTicketHtml(sale));
    ticket.document.close();
  }

  const scannerUrl = useMemo(() => {
    if (!scannerSession?.token) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/mobile-scanner/${scannerSession.token}`;
  }, [scannerSession?.token]);

  function buildQrImage(value: string, size = 220) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(value)}`;
  }

  async function handleCreateScannerSession() {
    setScannerLoading(true);
    try {
      const session = await createComercialMobileScannerSession();
      setScannerSession(session);
      setScannerEvents([]);
      toast.success('Scanner móvil creado. Escaneá el QR con el celular.');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo crear scanner móvil');
    } finally {
      setScannerLoading(false);
    }
  }

  async function handleCloseScannerSession() {
    if (!scannerSession) return;
    setScannerLoading(true);
    try {
      const session = await closeComercialMobileScannerSession(scannerSession.id);
      setScannerSession(session);
      toast.success('Scanner móvil cerrado');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cerrar scanner móvil');
    } finally {
      setScannerLoading(false);
    }
  }

  async function processScannerEvent(event: ComercialScannerEvent) {
    try {
      if (event.item_tipo === 'producto' && event.producto_id) {
        const product = dashboard.productos.find((item) => item.producto_id === event.producto_id);
        if (!product) {
          toast.error(`Producto escaneado no disponible en el POS: ${event.item_nombre || event.codigo}`);
        } else {
          addToCart({
            ...product,
            stock_ubicacion: ubicacionId ? getStockForLocation(product.producto_id, ubicacionId, dashboard) : product.stock_total,
          });
          toast.success(`Agregado al carrito: ${product.producto_nombre}`);
        }
      } else if (event.item_tipo === 'servicio' && event.servicio_id) {
        addServiceToCart(event);
        toast.success(`Servicio agregado al carrito: ${event.item_nombre || event.codigo}`);
      } else if (event.item_tipo === 'pack') {
        toast.info(`Pack detectado: ${event.item_nombre || event.codigo}. La venta directa de packs queda para la integración POS avanzada.`);
      } else if (event.tipo_resuelto === 'infraestructura') {
        toast.info(`Código recibido pero no es vendible en POS: ${event.item_nombre || event.codigo}`);
      } else {
        toast.error(`Código no encontrado: ${event.codigo}`);
      }

      await markComercialMobileScannerEventProcessed(event.id);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo procesar evento del scanner');
    }
  }

  async function pollScannerEvents() {
    if (!scannerSession?.id || scannerSession.estado !== 'activa') return;
    try {
      const state = await getComercialMobileScannerState(scannerSession.id);
      if (state.session) setScannerSession(state.session);
      setScannerEvents(state.recentEvents ?? []);
      for (const event of state.pendingEvents ?? []) {
        await processScannerEvent(event);
      }
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo consultar el scanner móvil');
    }
  }

  useEffect(() => {
    if (!scannerSession?.id || scannerSession.estado !== 'activa') return;
    const interval = window.setInterval(() => {
      pollScannerEvents();
    }, 1800);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerSession?.id, scannerSession?.estado, dashboard, ubicacionId]);


  if (!isInitialized) return <div>Cargando...</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='POS / Kiosco' />
          <main className='flex-1 space-y-6 p-6'>
            <section className='rounded-2xl border bg-white p-6 shadow-sm'>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-sky-600'>
                    Comercial y Stock
                  </p>
                  <h1 className='text-2xl font-bold'>Punto de Venta / Kiosco</h1>
                  <p className='max-w-4xl text-sm leading-relaxed text-muted-foreground'>
                    Venta rápida con carrito, búsqueda por producto/SKU/barcode, validación de stock por ubicación,
                    descuento por stock ledger y ticket imprimible básico.
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button variant='outline' onClick={loadDashboard} disabled={loading}>
                    {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}
                    Actualizar
                  </Button>
                  <Button variant='outline' onClick={handleCreateScannerSession} disabled={scannerLoading}>
                    {scannerLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Smartphone className='mr-2 h-4 w-4' />}
                    Conectar scanner móvil
                  </Button>
                  <Button asChild variant='outline'>
                    <Link href='/dashboard/comercial/stock-ledger'>Stock Ledger</Link>
                  </Button>
                  <Button asChild className='bg-[#02a8e1] hover:bg-[#0288b1]'>
                    <Link href='/dashboard/ventas'>Ventas</Link>
                  </Button>
                </div>
              </div>
            </section>



            {scannerSession && (
              <section className='rounded-2xl border bg-white p-5 shadow-sm'>
                <div className='grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]'>
                  <div className='flex flex-col items-center rounded-2xl border border-dashed p-4'>
                    {scannerUrl ? <img src={buildQrImage(scannerUrl, 220)} alt='QR scanner móvil POS' className='h-52 w-52 rounded-xl' /> : <div className='h-52 w-52 rounded-xl bg-slate-100' />}
                    <p className='mt-3 text-center text-xs text-muted-foreground'>Escaneá este QR con el celular para usarlo como lector del POS.</p>
                  </div>
                  <div className='space-y-4'>
                    <div className='flex flex-col justify-between gap-3 md:flex-row md:items-start'>
                      <div>
                        <p className='text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600'>Scanner móvil</p>
                        <h2 className='text-xl font-bold'>Celular conectado al POS</h2>
                        <p className='mt-1 text-sm text-muted-foreground'>El celular envía códigos al carrito en tiempo casi real. Funciona con productos por SKU/barcode y QR internos de producto o servicio.</p>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <Button variant='outline' onClick={pollScannerEvents}>Verificar ahora</Button>
                        <Button variant='outline' onClick={handleCloseScannerSession} disabled={scannerLoading || scannerSession.estado !== 'activa'}>Cerrar sesión</Button>
                      </div>
                    </div>
                    <div className='rounded-xl bg-slate-50 p-3 text-xs text-muted-foreground break-all'>
                      {scannerUrl}
                    </div>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
                      <div className='rounded-xl border p-3 text-sm'><span className='text-muted-foreground'>Estado</span><p className='font-semibold'>{scannerSession.estado}</p></div>
                      <div className='rounded-xl border p-3 text-sm'><span className='text-muted-foreground'>Eventos</span><p className='font-semibold'>{scannerEvents.length}</p></div>
                      <div className='rounded-xl border p-3 text-sm'><span className='text-muted-foreground'>Expira</span><p className='font-semibold'>{new Date(scannerSession.expira_en).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p></div>
                    </div>
                    {scannerEvents.length > 0 && (
                      <div className='space-y-2'>
                        <p className='text-sm font-semibold'>Últimos escaneos</p>
                        {scannerEvents.slice(0, 5).map((event) => (
                          <div key={event.id} className='flex items-center justify-between rounded-lg border p-2 text-sm'>
                            <span>{event.item_nombre || event.codigo}</span>
                            <span className='text-xs text-muted-foreground'>{event.estado}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5'>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>Ventas hoy</p><p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.ventasHoy}</p></div><Store className='h-6 w-6 text-sky-600' /></CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>Total hoy</p><p className='text-xl font-bold'>{loading ? '...' : formatCurrencyARS(dashboard.metricas.totalHoy)}</p></div><CreditCard className='h-6 w-6 text-emerald-600' /></CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>Ítems hoy</p><p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.itemsHoy}</p></div><ShoppingCart className='h-6 w-6 text-indigo-600' /></CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>Productos disp.</p><p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.productosDisponibles}</p></div><PackagePlus className='h-6 w-6 text-violet-600' /></CardContent></Card>
              <Card><CardContent className='flex items-center justify-between p-5'><div><p className='text-sm text-muted-foreground'>Críticos</p><p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.productosCriticos}</p></div><Warehouse className='h-6 w-6 text-orange-600' /></CardContent></Card>
            </section>

            <section className='grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]'>
              <div className='space-y-6'>
                <Card>
                  <CardHeader>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px] md:items-end'>
                      <div className='space-y-2'>
                        <Label>Buscar producto</Label>
                        <div className='relative'>
                          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                          <Input className='pl-9' value={searchTerm} placeholder='Nombre, SKU o código de barras...' onChange={(event) => setSearchTerm(event.target.value)} />
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <Label>Ubicación de venta</Label>
                        <select className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm' value={ubicacionId} onChange={(event) => setUbicacionId(event.target.value)}>
                          {dashboard.ubicaciones.map((ubicacion) => <option key={ubicacion.id} value={ubicacion.id}>{ubicacion.nombre}</option>)}
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form className='mb-4 flex gap-2' onSubmit={handleBarcodeSubmit}>
                      <div className='relative flex-1'>
                        <Barcode className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                        <Input className='pl-9' value={barcodeTerm} placeholder='Escanear o pegar código/SKU y presionar Enter' onChange={(event) => setBarcodeTerm(event.target.value)} />
                      </div>
                      <Button type='submit' variant='outline'>Agregar</Button>
                    </form>

                    <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
                      {filteredProducts.map((product) => (
                        <button key={product.producto_id} type='button' className='rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md' onClick={() => addToCart(product)}>
                          <div className='flex items-start justify-between gap-2'>
                            <div>
                              <p className='font-semibold'>{product.producto_nombre}</p>
                              <p className='text-xs text-muted-foreground'>{product.sku || 'Sin SKU'} {product.codigo_barras ? `· ${product.codigo_barras}` : ''}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-xs ${getProductStatusClass(product)}`}>{product.stock_ubicacion}</span>
                          </div>
                          <div className='mt-3 flex items-center justify-between'>
                            <span className='text-lg font-bold'>{formatCurrencyARS(product.precio)}</span>
                            <span className='text-xs text-muted-foreground'>Stock total {product.stock_total}</span>
                          </div>
                        </button>
                      ))}
                      {!loading && filteredProducts.length === 0 && <p className='text-sm text-muted-foreground'>No hay productos para mostrar.</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className='text-lg'>Ventas recientes</CardTitle></CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {dashboard.ventasRecientes.slice(0, 8).map((sale) => (
                        <div key={sale.id} className='flex items-center justify-between gap-3 rounded-lg border p-3 text-sm'>
                          <div>
                            <p className='font-medium'>{sale.comprobante_codigo || sale.id}</p>
                            <p className='text-xs text-muted-foreground'>{getClientLabel(sale)} · {sale.metodo_pago}</p>
                          </div>
                          <div className='text-right'>
                            <p className='font-semibold'>{formatCurrencyARS(sale.total)}</p>
                            <Button size='sm' variant='ghost' onClick={() => handlePrintTicket(sale)}>Imprimir</Button>
                          </div>
                        </div>
                      ))}
                      {!loading && dashboard.ventasRecientes.length === 0 && <p className='text-sm text-muted-foreground'>Aún no hay ventas recientes.</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className='h-fit'>
                <CardHeader><CardTitle className='flex items-center gap-2 text-lg'><ShoppingCart className='h-5 w-5 text-sky-600' />Carrito</CardTitle></CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 gap-3'>
                    <div className='space-y-2'>
                      <Label>Tipo cliente</Label>
                      <select className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm' value={clienteTipo} onChange={(event) => setClienteTipo(event.target.value as any)}>
                        <option value='consumidor_final'>Consumidor final</option>
                        <option value='visitante'>Visitante</option>
                      </select>
                    </div>
                    <div className='space-y-2'><Label>Nombre opcional</Label><Input value={clienteNombre} onChange={(event) => setClienteNombre(event.target.value)} placeholder='Consumidor Final' /></div>
                    <div className='space-y-2'><Label>Documento opcional</Label><Input value={clienteDocumento} onChange={(event) => setClienteDocumento(event.target.value)} placeholder='DNI / CUIT' /></div>
                    <div className='space-y-2'>
                      <Label>Método de pago</Label>
                      <select className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm' value={metodoPago} onChange={(event) => setMetodoPago(event.target.value)}>
                        {metodoPagoOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    {cart.map((item) => (
                      <div key={item.key} className='rounded-lg border p-3'>
                        <div className='flex items-start justify-between gap-2'>
                          <div><p className='font-medium'>{item.nombre}</p><p className='text-xs text-muted-foreground'>{item.item_tipo === 'servicio' ? 'Servicio escaneado' : `Disponible: ${item.stockDisponible}`}</p></div>
                          <Button size='icon' variant='ghost' onClick={() => removeFromCart(item.key)}><Trash2 className='h-4 w-4' /></Button>
                        </div>
                        <div className='mt-3 grid grid-cols-3 gap-2'>
                          <Input type='number' min={1} max={item.stockDisponible} value={item.cantidad} onChange={(event) => updateCartQuantity(item.key, Number(event.target.value))} />
                          <Input type='number' min={0} value={item.precio_unitario} onChange={(event) => setCart((current) => current.map((cartItem) => cartItem.key === item.key ? { ...cartItem, precio_unitario: Number(event.target.value) } : cartItem))} />
                          <Input type='number' min={0} value={item.descuento} onChange={(event) => setCart((current) => current.map((cartItem) => cartItem.key === item.key ? { ...cartItem, descuento: Number(event.target.value) } : cartItem))} />
                        </div>
                        <p className='mt-2 text-right text-sm font-semibold'>{formatCurrencyARS(item.cantidad * item.precio_unitario - item.descuento)}</p>
                      </div>
                    ))}
                    {cart.length === 0 && <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>Agregá productos para iniciar la venta.</p>}
                  </div>

                  <div className='rounded-lg bg-slate-50 p-4 text-sm'>
                    <div className='flex justify-between'><span>Subtotal</span><strong>{formatCurrencyARS(cartTotals.subtotal)}</strong></div>
                    <div className='flex justify-between'><span>Descuentos</span><strong>{formatCurrencyARS(cartTotals.descuento)}</strong></div>
                    <div className='mt-2 flex justify-between border-t pt-2 text-lg'><span>Total</span><strong>{formatCurrencyARS(cartTotals.total)}</strong></div>
                  </div>

                  <Button className='w-full bg-[#02a8e1] hover:bg-[#0288b1]' disabled={saving || cart.length === 0} onClick={handleSubmitSale}>
                    {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <CreditCard className='mr-2 h-4 w-4' />}
                    Confirmar venta
                  </Button>

                  {lastSale && (
                    <Button variant='outline' className='w-full' onClick={() => handlePrintTicket(lastSale)}>
                      <Printer className='mr-2 h-4 w-4' /> Imprimir último ticket
                    </Button>
                  )}
                </CardContent>
              </Card>
            </section>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
