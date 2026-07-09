'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Barcode,
  CreditCard,
  Loader2,
  PackagePlus,
  Percent,
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
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';
import type {
  ComercialPosDashboard,
  ComercialPosProducto,
  ComercialPosServicio,
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
  servicios: [],
  packs: [],
  promociones: [],
  cupones: [],
  stockPorUbicacion: [],
  ubicaciones: [],
  ventasRecientes: [],
  ubicacionDefaultId: null,
  metricas: {
    ventasHoy: 0,
    totalHoy: 0,
    itemsHoy: 0,
    productosDisponibles: 0,
    serviciosDisponibles: 0,
    productosCriticos: 0,
    packsDisponibles: 0,
    promocionesActivas: 0,
  },
};

type CartItem = {
  key: string;
  item_tipo: 'producto' | 'servicio' | 'pack';
  producto_id?: string | null;
  servicio_id?: string | null;
  pack_id?: string | null;
  nombre: string;
  sku?: string | null;
  codigo_barras?: string | null;
  codigo?: string | null;
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

function getCartTypeLabel(type: CartItem['item_tipo']) {
  if (type === 'producto') return 'Producto';
  if (type === 'servicio') return 'Servicio';
  return 'Pack';
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildTicketHtml(sale: ComercialPosVentaResumen) {
  const detalles = sale.venta_detalle ?? sale.detalles ?? [];
  const rows = detalles
    .map((detalle) => {
      const nombre = escapeHtml(detalle.producto?.nombre || detalle.servicio?.nombre || (detalle.item_tipo === 'servicio' ? 'Servicio' : 'Producto'));
      const lineTotal = Number(detalle.total_linea ?? (Number(detalle.cantidad) * Number(detalle.precio_unitario) - Number(detalle.descuento ?? 0)));
      return `<tr><td>${detalle.cantidad} x ${nombre}</td><td style="text-align:right">${formatCurrencyARS(lineTotal)}</td></tr>`;
    })
    .join('');

  return `<!doctype html>
  <html><head><meta charset="utf-8" />
  <title>Ticket ${escapeHtml(sale.comprobante_codigo || '')}</title>
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
    <div class="sub">{c('POS / Kiosco')}<br/>${escapeHtml(sale.comprobante_codigo || '')}<br/>${escapeHtml(sale.fecha || '')}</div>
    <div style="font-size:11px;margin-bottom:8px">Cliente: ${escapeHtml(getClientLabel(sale))}<br/>Pago: ${escapeHtml(sale.metodo_pago)}</div>
    <table>${rows}</table>
    <div class="total">Total: ${formatCurrencyARS(sale.total)}</div>
    <div class="footer">Gracias por tu compra</div>
    <script>window.print();</script>
  </body></html>`;
}

export default function ComercialKioscoPosPage() {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
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
  const [cuponCodigo, setCuponCodigo] = useState('');
  const [lastSale, setLastSale] = useState<ComercialPosVentaResumen | null>(null);
  const [scannerSession, setScannerSession] = useState<ComercialScannerSession | null>(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerEvents, setScannerEvents] = useState<ComercialScannerEvent[]>([]);
  const scannerPollFailuresRef = useRef(0);
  const scannerPollWarningShownRef = useRef(false);

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

  const filteredServices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const services = dashboard.servicios.filter((service) => service.activo !== false);

    if (!query) return services.slice(0, 40);

    return services
      .filter((service) =>
        [service.nombre, service.codigo, service.categoria, service.descripcion]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      )
      .slice(0, 40);
  }, [dashboard.servicios, searchTerm]);

  const filteredPacks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const packs = dashboard.packs.filter((pack) => pack.activo !== false && pack.disponible_pos !== false);
    if (!query) return packs.slice(0, 30);
    return packs
      .filter((pack) => [pack.nombre, pack.codigo, pack.descripcion].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
      .slice(0, 30);
  }, [dashboard.packs, searchTerm]);

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
      toast.error(c('Producto sin stock en la ubicación seleccionada'));
      return;
    }

    setCart((current) => {
      const key = `producto:${product.producto_id}`;
      const existing = current.find((item) => item.key === key);
      if (existing) {
        if (existing.cantidad + 1 > existing.stockDisponible) {
          toast.error(c('No hay stock suficiente en la ubicación seleccionada'));
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

  function addServiceToCart(service: ComercialPosServicio) {
    if (!service?.id) return;
    if (service.activo === false) {
      toast.error(c('El servicio no está activo'));
      return;
    }

    const key = `servicio:${service.id}`;
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
          servicio_id: service.id,
          nombre: service.nombre,
          codigo: service.codigo,
          precio_unitario: Number(service.precio ?? 0),
          cantidad: 1,
          descuento: 0,
          stockDisponible: 999999,
        },
      ];
    });
  }

  function addScannedServiceToCart(event: ComercialScannerEvent) {
    if (!event.servicio_id) return;
    const service = dashboard.servicios.find((item) => item.id === event.servicio_id);
    if (service) {
      addServiceToCart(service);
      return;
    }

    const servicePayload = (event.payload?.servicio || {}) as any;
    addServiceToCart({
      id: event.servicio_id,
      nombre: event.item_nombre || servicePayload.nombre || 'Servicio',
      codigo: event.codigo ?? servicePayload.codigo ?? null,
      precio: Number(servicePayload.precio ?? 0),
      categoria: servicePayload.categoria ?? null,
      activo: true,
    });
  }

  function addPackToCart(pack: NonNullable<ComercialPosDashboard['packs']>[number]) {
    if (!pack?.id) return;
    if (pack.activo === false || pack.disponible_pos === false) {
      toast.error(c('El pack no está disponible para POS'));
      return;
    }
    const key = `pack:${pack.id}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) return current.map((item) => item.key === key ? { ...item, cantidad: item.cantidad + 1 } : item);
      return [
        ...current,
        {
          key,
          item_tipo: 'pack',
          producto_id: null,
          servicio_id: null,
          pack_id: pack.id,
          nombre: pack.nombre,
          codigo: pack.codigo,
          precio_unitario: Number(pack.precio ?? 0),
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

    if (match) {
      addToCart({
        ...match,
        stock_ubicacion: ubicacionId ? getStockForLocation(match.producto_id, ubicacionId, dashboard) : match.stock_total,
      });
      setBarcodeTerm('');
      return;
    }

    const serviceMatch = dashboard.servicios.find((service) => String(service.codigo ?? '').toLowerCase() === query && service.activo !== false);
    if (serviceMatch) {
      addServiceToCart(serviceMatch);
      setBarcodeTerm('');
      return;
    }

    const packMatch = dashboard.packs.find((pack) => String(pack.codigo ?? '').toLowerCase() === query && pack.disponible_pos !== false && pack.activo !== false);
    if (packMatch) {
      addPackToCart(packMatch);
      setBarcodeTerm('');
      return;
    }

    toast.error(c('No se encontró producto, servicio o pack por código/SKU'));
  }

  async function handleSubmitSale() {
    if (!ubicacionId) {
      toast.error(c('Seleccioná una ubicación de stock'));
      return;
    }
    if (!cart.length) {
      toast.error(c('Agregá al menos un producto, servicio o pack al carrito'));
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
        observaciones: c('Venta rápida POS/Kiosco'),
        cupon_codigo: cuponCodigo.trim() || null,
        items: cart.map((item) => ({
          item_tipo: item.item_tipo,
          producto_id: item.producto_id ?? null,
          servicio_id: item.servicio_id ?? null,
          pack_id: item.pack_id ?? null,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento: item.descuento,
        })),
      });
      setLastSale(sale);
      setCart([]);
      setClienteNombre('');
      setClienteDocumento('');
      setCuponCodigo('');
      toast.success(c('Venta POS/Kiosco registrada'));
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
      toast.error(c('El navegador bloqueó la ventana de impresión'));
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
      scannerPollFailuresRef.current = 0;
      scannerPollWarningShownRef.current = false;
      toast.success(c('Scanner móvil creado. Escaneá el QR con el celular.'));
    } catch (error: any) {
      toast.error(error?.message || c('No se pudo crear scanner móvil'));
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
      scannerPollFailuresRef.current = 0;
      scannerPollWarningShownRef.current = false;
      toast.success(c('Scanner móvil cerrado'));
    } catch (error: any) {
      toast.error(error?.message || c('No se pudo cerrar scanner móvil'));
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
        addScannedServiceToCart(event);
        toast.success(`Servicio agregado al carrito: ${event.item_nombre || event.codigo}`);
      } else if (event.item_tipo === 'pack' && event.pack_id) {
        const pack = dashboard.packs.find((item) => item.id === event.pack_id);
        if (!pack) {
          toast.error(`Pack escaneado no disponible en el POS: ${event.item_nombre || event.codigo}`);
        } else {
          addPackToCart(pack);
          toast.success(`Pack agregado al carrito: ${pack.nombre}`);
        }
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
      scannerPollFailuresRef.current = 0;
      scannerPollWarningShownRef.current = false;
      if (state.session) setScannerSession(state.session);
      setScannerEvents(state.recentEvents ?? []);
      for (const event of state.pendingEvents ?? []) {
        await processScannerEvent(event);
      }
    } catch (error: any) {
      scannerPollFailuresRef.current += 1;
      console.warn('Scanner móvil POS: fallo transitorio de polling', error);
      if (scannerPollFailuresRef.current >= 3 && !scannerPollWarningShownRef.current) {
        scannerPollWarningShownRef.current = true;
        toast.warning(c('Scanner móvil con conexión intermitente; seguimos reintentando en segundo plano.'));
      }
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

  const paymentLabel = useMemo(
    () => c(metodoPagoOptions.find((option) => option.value === metodoPago)?.label ?? metodoPago),
    [metodoPago]
  );

  const posReadiness = useMemo(() => {
    if (!ubicacionId) return { label: c('Configurar ubicación'), tone: 'warning' as const, detail: c('Seleccioná una ubicación para validar stock.') };
    if (dashboard.metricas.productosDisponibles === 0 && dashboard.metricas.serviciosDisponibles === 0 && dashboard.metricas.packsDisponibles === 0) {
      return { label: c('Sin catálogo POS'), tone: 'critical' as const, detail: c('No hay productos, servicios o packs disponibles.') };
    }
    if (dashboard.metricas.productosCriticos > 0) {
      return { label: c('Atención stock'), tone: 'warning' as const, detail: `${dashboard.metricas.productosCriticos} ${c('productos críticos.')}` };
    }
    return { label: c('Listo para vender'), tone: 'ok' as const, detail: c('Stock, servicios y packs disponibles.') };
  }, [dashboard.metricas.packsDisponibles, dashboard.metricas.productosCriticos, dashboard.metricas.productosDisponibles, dashboard.metricas.serviciosDisponibles, ubicacionId]);

  const posReadinessClass =
    posReadiness.tone === 'critical'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-100'
      : posReadiness.tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100';

  const visibleCatalogCount = filteredProducts.length + filteredServices.length + filteredPacks.length;

  if (!isInitialized) return <div>{c('Cargando...')}</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950'>
        <AppSidebar />
        <SidebarInset className='!grid !min-h-0 !grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
          <AppHeader title={c('POS / Kiosco')} />
          <main className='min-h-0 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 lg:px-6'>
            <section className='overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4 text-white shadow-xl dark:border-cyan-500/30 sm:p-6'>
              <div className='flex flex-col justify-between gap-5 xl:flex-row xl:items-center'>
                <div className='max-w-5xl space-y-3'>
                  <p className='text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-cyan-300'>
                    {c('POS móvil final · Comercial y Stock')}
                  </p>
                  <h1 className='text-2xl font-black leading-tight sm:text-3xl'>Punto de Venta / Kiosco</h1>
                  <p className='max-w-4xl text-sm leading-relaxed text-slate-200'>
                    {c('Venta rápida con carrito, búsqueda por producto/servicio/pack, scanner móvil, cupones, validación de stock por ubicación,')}
                    descuento por stock ledger, ticket imprimible y trazabilidad BI de packs/promos.
                  </p>
                  <div className='grid grid-cols-2 gap-2 text-xs sm:grid-cols-4'>
                    <div className='rounded-2xl border border-white/10 bg-white/10 p-3'>
                      <span className='text-slate-300'>{c('Carrito')}</span>
                      <p className='mt-1 text-lg font-black'>{cartTotals.items}</p>
                    </div>
                    <div className='rounded-2xl border border-white/10 bg-white/10 p-3'>
                      <span className='text-slate-300'>Total actual</span>
                      <p className='mt-1 text-lg font-black'>{formatCurrencyARS(cartTotals.total)}</p>
                    </div>
                    <div className='rounded-2xl border border-white/10 bg-white/10 p-3'>
                      <span className='text-slate-300'>Pago</span>
                      <p className='mt-1 text-lg font-black'>{paymentLabel}</p>
                    </div>
                    <div className={`rounded-2xl border p-3 ${posReadinessClass}`}>
                      <span className='opacity-80'>Estado POS</span>
                      <p className='mt-1 text-base font-black'>{posReadiness.label}</p><p className='mt-1 text-[0.68rem] font-medium opacity-80'>{posReadiness.detail}</p>
                    </div>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end'>
                  <Button variant='secondary' onClick={loadDashboard} disabled={loading} className='w-full sm:w-auto'>
                    {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}
                    Actualizar
                  </Button>
                  <Button variant='secondary' onClick={handleCreateScannerSession} disabled={scannerLoading} className='w-full sm:w-auto'>
                    {scannerLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Smartphone className='mr-2 h-4 w-4' />}
                    Scanner
                  </Button>
                  <Button asChild variant='secondary' className='w-full sm:w-auto'>
                    <Link href='/dashboard/comercial/stock-ledger'>Stock</Link>
                  </Button>
                  <Button asChild className='w-full bg-[#02a8e1] hover:bg-[#0288b1] sm:w-auto'>
                    <Link href='/dashboard/ventas'>Ventas</Link>
                  </Button>
                </div>
              </div>
            </section>

            <section className='grid grid-cols-2 gap-3 lg:hidden'>
              <div className='rounded-2xl border bg-white p-3 shadow-sm dark:bg-slate-900'>
                <p className='text-xs text-muted-foreground'>{c('Catálogo visible')}</p>
                <p className='text-xl font-black'>{visibleCatalogCount}</p>
              </div>
              <div className='rounded-2xl border bg-white p-3 shadow-sm dark:bg-slate-900'>
                <p className='text-xs text-muted-foreground'>Scanner</p>
                <p className='text-xl font-black'>{scannerSession?.estado ?? 'No conectado'}</p>
              </div>
            </section>

            {scannerSession && (
              <section className='rounded-3xl border bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-5'>
                <div className='grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]'>
                  <div className='flex flex-col items-center rounded-2xl border border-dashed bg-slate-50 p-4 dark:bg-slate-950'>
                    {scannerUrl ? <img src={buildQrImage(scannerUrl, 220)} alt={c('QR scanner móvil POS')} className='h-52 w-52 rounded-xl' /> : <div className='h-52 w-52 rounded-xl bg-slate-100' />}
                    <p className='mt-3 text-center text-xs text-muted-foreground'>{c('Escaneá este QR con el celular para usarlo como lector del POS.')}</p>
                  </div>
                  <div className='space-y-4'>
                    <div className='flex flex-col justify-between gap-3 md:flex-row md:items-start'>
                      <div>
                        <p className='text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600'>{c('Scanner móvil')}</p>
                        <h2 className='text-xl font-bold'>Celular conectado al POS</h2>
                        <p className='mt-1 text-sm text-muted-foreground'>{c('El celular envía códigos al carrito en tiempo casi real. Funciona con productos por SKU/barcode, QR internos de producto/servicio y códigos de packs.')}</p>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <Button variant='outline' onClick={pollScannerEvents}>Verificar ahora</Button>
                        <Button variant='outline' onClick={handleCloseScannerSession} disabled={scannerLoading || scannerSession.estado !== 'activa'}>{c('Cerrar sesión')}</Button>
                      </div>
                    </div>
                    <div className='max-w-full overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs text-muted-foreground dark:bg-slate-950'>
                      {scannerUrl}
                    </div>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
                      <div className='rounded-xl border p-3 text-sm'><span className='text-muted-foreground'>Estado</span><p className='font-semibold'>{scannerSession.estado}</p></div>
                      <div className='rounded-xl border p-3 text-sm'><span className='text-muted-foreground'>Eventos</span><p className='font-semibold'>{scannerEvents.length}</p></div>
                      <div className='rounded-xl border p-3 text-sm'><span className='text-muted-foreground'>Expira</span><p className='font-semibold'>{new Date(scannerSession.expira_en).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p></div>
                    </div>
                    {scannerEvents.length > 0 && (
                      <div className='space-y-2'>
                        <p className='text-sm font-semibold'>{c('Últimos escaneos')}</p>
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

            <section className='grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8'>
              <Card className='bg-white/95 dark:bg-slate-900'><CardContent className='flex items-center justify-between p-4'><div><p className='text-sm text-muted-foreground'>Ventas hoy</p><p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.ventasHoy}</p></div><Store className='h-6 w-6 text-sky-600' /></CardContent></Card>
              <Card className='bg-white/95 dark:bg-slate-900'><CardContent className='flex items-center justify-between p-4'><div><p className='text-sm text-muted-foreground'>Total hoy</p><p className='text-xl font-bold'>{loading ? '...' : formatCurrencyARS(dashboard.metricas.totalHoy)}</p></div><CreditCard className='h-6 w-6 text-emerald-600' /></CardContent></Card>
              <Card className='bg-white/95 dark:bg-slate-900'><CardContent className='flex items-center justify-between p-4'><div><p className='text-sm text-muted-foreground'>{c('Ítems hoy')}</p><p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.itemsHoy}</p></div><ShoppingCart className='h-6 w-6 text-indigo-600' /></CardContent></Card>
              <Card className='bg-white/95 dark:bg-slate-900'><CardContent className='flex items-center justify-between p-4'><div><p className='text-sm text-muted-foreground'>Productos</p><p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.productosDisponibles}</p></div><PackagePlus className='h-6 w-6 text-violet-600' /></CardContent></Card>
              <Card className='bg-white/95 dark:bg-slate-900'><CardContent className='flex items-center justify-between p-4'><div><p className='text-sm text-muted-foreground'>{c('Servicios')}</p><p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.serviciosDisponibles}</p></div><Store className='h-6 w-6 text-cyan-600' /></CardContent></Card>
              <Card className='bg-white/95 dark:bg-slate-900'><CardContent className='flex items-center justify-between p-4'><div><p className='text-sm text-muted-foreground'>Packs POS</p><p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.packsDisponibles}</p></div><PackagePlus className='h-6 w-6 text-fuchsia-600' /></CardContent></Card>
              <Card className='bg-white/95 dark:bg-slate-900'><CardContent className='flex items-center justify-between p-4'><div><p className='text-sm text-muted-foreground'>{c('Promos')}</p><p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.promocionesActivas}</p></div><Percent className='h-6 w-6 text-rose-600' /></CardContent></Card>
              <Card className='bg-white/95 dark:bg-slate-900'><CardContent className='flex items-center justify-between p-4'><div><p className='text-sm text-muted-foreground'>{c('Críticos')}</p><p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.productosCriticos}</p></div><Warehouse className='h-6 w-6 text-orange-600' /></CardContent></Card>
            </section>

            <section className='grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_440px]'>
              <div className='min-w-0 space-y-5'>
                <Card className='overflow-hidden bg-white/95 dark:bg-slate-900'>
                  <CardHeader>
                    <div className='grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end'>
                      <div className='space-y-2'>
                        <Label>Buscar producto, servicio o pack</Label>
                        <div className='relative'>
                          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                          <Input className='pl-9' value={searchTerm} placeholder={c('Nombre, SKU, código de barras, servicio o pack...')} onChange={(event) => setSearchTerm(event.target.value)} />
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <Label>{c('Ubicación de venta')}</Label>
                        <select className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm' value={ubicacionId} onChange={(event) => setUbicacionId(event.target.value)}>
                          {dashboard.ubicaciones.map((ubicacion) => <option key={ubicacion.id} value={ubicacion.id}>{ubicacion.nombre}</option>)}
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form className='mb-4 flex flex-col gap-2 sm:flex-row' onSubmit={handleBarcodeSubmit}>
                      <div className='relative flex-1'>
                        <Barcode className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                        <Input className='pl-9' value={barcodeTerm} placeholder={c('Escanear o pegar código/SKU/servicio/pack y presionar Enter')} onChange={(event) => setBarcodeTerm(event.target.value)} />
                      </div>
                      <Button type='submit' variant='outline' className='sm:w-auto'>Agregar</Button>
                    </form>

                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3'>
                      {filteredProducts.map((product) => (
                        <button key={product.producto_id} type='button' className='rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-950' onClick={() => addToCart(product)}>
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

                    {filteredServices.length > 0 && (
                      <div className='mt-6 space-y-3'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700'>Servicios vendibles</h3>
                          <span className='text-xs text-muted-foreground'>No descuentan stock y quedan registrados en venta_detalle</span>
                        </div>
                        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3'>
                          {filteredServices.map((service) => (
                            <button key={service.id} type='button' className='rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-left shadow-sm transition hover:border-cyan-300 hover:shadow-md dark:border-cyan-500/30 dark:bg-cyan-950/30' onClick={() => addServiceToCart(service)}>
                              <div className='flex items-start justify-between gap-2'>
                                <div>
                                  <p className='font-semibold'>{service.nombre}</p>
                                  <p className='text-xs text-muted-foreground'>{service.codigo || c('Sin código')} {service.categoria ? `· ${service.categoria}` : ''}</p>
                                </div>
                                <span className='rounded-full bg-cyan-100 px-2 py-1 text-xs text-cyan-700'>Servicio</span>
                              </div>
                              <div className='mt-3 flex items-center justify-between'>
                                <span className='text-lg font-bold'>{formatCurrencyARS(service.precio)}</span>
                                <span className='text-xs text-muted-foreground'>{service.duracion_minutos ? `${service.duracion_minutos} min` : 'POS'}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredPacks.length > 0 && (
                      <div className='mt-6 space-y-3'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-sm font-semibold uppercase tracking-[0.18em] text-fuchsia-700'>Packs / promociones vendibles</h3>
                          <span className='text-xs text-muted-foreground'>Se expanden en productos/servicios al vender</span>
                        </div>
                        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3'>
                          {filteredPacks.map((pack) => (
                            <button key={pack.id} type='button' className='rounded-2xl border border-fuchsia-100 bg-fuchsia-50/70 p-4 text-left shadow-sm transition hover:border-fuchsia-300 hover:shadow-md dark:border-fuchsia-500/30 dark:bg-fuchsia-950/30' onClick={() => addPackToCart(pack)}>
                              <div className='flex items-start justify-between gap-2'>
                                <div>
                                  <p className='font-semibold'>{pack.nombre}</p>
                                  <p className='text-xs text-muted-foreground'>{pack.codigo} · {(pack.items ?? []).length} {c('ítems')}</p>
                                </div>
                                <span className='rounded-full bg-fuchsia-100 px-2 py-1 text-xs text-fuchsia-700'>Pack</span>
                              </div>
                              <div className='mt-3 flex items-center justify-between'>
                                <span className='text-lg font-bold'>{formatCurrencyARS(pack.precio)}</span>
                                <span className='text-xs text-muted-foreground'>POS</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className='bg-white/95 dark:bg-slate-900'>
                  <CardHeader><CardTitle className='text-lg'>Ventas recientes</CardTitle></CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {dashboard.ventasRecientes.slice(0, 8).map((sale) => (
                        <div key={sale.id} className='flex flex-col justify-between gap-3 rounded-xl border p-3 text-sm sm:flex-row sm:items-center'>
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
                      {!loading && dashboard.ventasRecientes.length === 0 && <p className='text-sm text-muted-foreground'>{c('Aún no hay ventas recientes.')}</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className='h-fit overflow-hidden bg-white/95 dark:bg-slate-900 2xl:sticky 2xl:top-4'>
                <CardHeader className='border-b bg-slate-50/80 dark:bg-slate-950/60'><CardTitle className='flex items-center justify-between gap-2 text-lg'><span className='flex items-center gap-2'><ShoppingCart className='h-5 w-5 text-sky-600' />{c('Carrito')}</span><span className='rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-100'>{cartTotals.items} {c('ítems')}</span></CardTitle></CardHeader>
                <CardContent className='space-y-4 p-4 sm:p-6'>
                  <div className='grid grid-cols-1 gap-3'>
                    <div className='space-y-2'>
                      <Label>{c('Tipo cliente')}</Label>
                      <select className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm' value={clienteTipo} onChange={(event) => setClienteTipo(event.target.value as any)}>
                        <option value='consumidor_final'>{c('Consumidor final')}</option>
                        <option value='visitante'>{c('Visitante')}</option>
                      </select>
                    </div>
                    <div className='space-y-2'><Label>{c('Nombre opcional')}</Label><Input value={clienteNombre} onChange={(event) => setClienteNombre(event.target.value)} placeholder={c('Consumidor Final')} /></div>
                    <div className='space-y-2'><Label>{c('Documento opcional')}</Label><Input value={clienteDocumento} onChange={(event) => setClienteDocumento(event.target.value)} placeholder='DNI / CUIT' /></div>
                    <div className='space-y-2'>
                      <Label>{c('Método de pago')}</Label>
                      <select className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm' value={metodoPago} onChange={(event) => setMetodoPago(event.target.value)}>
                        {metodoPagoOptions.map((option) => <option key={option.value} value={option.value}>{c(option.label)}</option>)}
                      </select>
                    </div>
                    <div className='space-y-2'>
                      <Label>{c('Cupón / promo opcional')}</Label>
                      <Input value={cuponCodigo} onChange={(event) => setCuponCodigo(event.target.value.toUpperCase())} placeholder='PROMO10' />
                    </div>
                  </div>

                  <div className='space-y-3'>
                    {cart.map((item) => (
                      <div key={item.key} className='rounded-2xl border bg-slate-50/70 p-3 dark:bg-slate-950/40'>
                        <div className='flex items-start justify-between gap-2'>
                          <div><p className='font-medium'>{item.nombre}</p><p className='text-xs text-muted-foreground'>{getCartTypeLabel(item.item_tipo)}{item.item_tipo === 'producto' ? ` · Disponible: ${item.stockDisponible}` : ' POS'}</p></div>
                          <Button size='icon' variant='ghost' onClick={() => removeFromCart(item.key)}><Trash2 className='h-4 w-4' /></Button>
                        </div>
                        <div className='mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3'>
                          <Input type='number' min={1} max={item.stockDisponible} value={item.cantidad} onChange={(event) => updateCartQuantity(item.key, Number(event.target.value))} />
                          <Input type='number' min={0} value={item.precio_unitario} onChange={(event) => setCart((current) => current.map((cartItem) => cartItem.key === item.key ? { ...cartItem, precio_unitario: Number(event.target.value) } : cartItem))} />
                          <Input type='number' min={0} value={item.descuento} onChange={(event) => setCart((current) => current.map((cartItem) => cartItem.key === item.key ? { ...cartItem, descuento: Number(event.target.value) } : cartItem))} />
                        </div>
                        <p className='mt-2 text-right text-sm font-semibold'>{formatCurrencyARS(item.cantidad * item.precio_unitario - item.descuento)}</p>
                      </div>
                    ))}
                    {cart.length === 0 && <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>{c('Agregá productos, servicios o packs para iniciar la venta.')}</p>}
                  </div>

                  <div className='rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950'>
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
                      <Printer className='mr-2 h-4 w-4' /> {c('Imprimir último ticket')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </section>

            {cart.length > 0 && (
              <div className='sticky bottom-3 z-20 rounded-2xl border border-sky-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-sky-500/30 dark:bg-slate-900/95 2xl:hidden'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <p className='text-xs text-muted-foreground'>{c('Carrito')} · {cartTotals.items} {c('ítems')}</p>
                    <p className='text-lg font-black'>{formatCurrencyARS(cartTotals.total)}</p>
                  </div>
                  <Button className='bg-[#02a8e1] hover:bg-[#0288b1]' disabled={saving || cart.length === 0} onClick={handleSubmitSale}>
                    {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <CreditCard className='mr-2 h-4 w-4' />}
                    {c('Cobrar')}
                  </Button>
                </div>
              </div>
            )}
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
