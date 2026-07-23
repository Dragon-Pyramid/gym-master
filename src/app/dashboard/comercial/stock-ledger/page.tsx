'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FilterX,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingCart,
  Target,
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
  ComercialStockLedgerDashboard,
  ComercialStockMovimientoTipo,
  ComercialStockResumenItem,
  CreateComercialStockMovimientoDTO,
} from '@/interfaces/comercialStockLedger.interface';
import {
  createComercialStockMovimiento,
  getComercialStockLedgerDashboard,
} from '@/services/comercialStockLedgerService';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { toast } from 'sonner';

const initialDashboard: ComercialStockLedgerDashboard = {
  ubicaciones: [],
  stockPorUbicacion: [],
  movimientos: [],
  resumen: [],
  metricas: {
    productos: 0,
    productosSinStock: 0,
    productosCriticos: 0,
    stockTotal: 0,
    valorInventario: 0,
    movimientos: 0,
    ubicacionesActivas: 0,
  },
};

const tiposMovimiento: Array<{ value: ComercialStockMovimientoTipo; label: string; help: string }> = [
  { value: 'compra', label: 'Compra / ingreso', help: 'Suma stock en una ubicación.' },
  { value: 'ajuste_entrada', label: 'Ajuste entrada', help: 'Corrige stock sumando unidades.' },
  { value: 'ajuste_salida', label: 'Ajuste salida', help: 'Corrige stock restando unidades.' },
  { value: 'transferencia', label: 'Transferencia', help: 'Mueve stock entre ubicaciones.' },
  { value: 'devolucion', label: 'Devolución', help: 'Reingresa stock por devolución.' },
  { value: 'merma', label: 'Merma / pérdida', help: 'Registra pérdida no vendible.' },
  { value: 'vencimiento', label: 'Vencimiento', help: 'Retira producto vencido.' },
  { value: 'conteo_fisico', label: 'Conteo físico', help: 'Ajusta una ubicación al stock real.' },
  { value: 'uso_interno', label: 'Uso interno', help: 'Consumo interno del gimnasio.' },
];

type StockAlertFilter = 'todos' | 'sin_stock' | 'critico' | 'bajo_minimo' | 'ok';

const stockAlertFilters: Array<{ value: StockAlertFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'sin_stock', label: 'Sin stock' },
  { value: 'critico', label: 'Crítico' },
  { value: 'bajo_minimo', label: 'Bajo mínimo' },
  { value: 'ok', label: 'OK' },
];

function getStockPriority(item: ComercialStockResumenItem) {
  if (item.estado_stock === 'sin_stock') return 4;
  if (item.estado_stock === 'critico') return 3;
  if (item.estado_stock === 'bajo_minimo') return 2;
  return 1;
}

function getReorderQuantity(item: ComercialStockResumenItem) {
  const objective = Number(item.stock_objetivo ?? 0) > 0
    ? Number(item.stock_objetivo ?? 0)
    : Math.max(Number(item.stock_minimo ?? 0) * 2, Number(item.stock_minimo ?? 0) + 1);

  return Math.max(0, Math.ceil(objective - Number(item.stock_total ?? 0)));
}

function getAlertToneClass(item: ComercialStockResumenItem) {
  if (item.estado_stock === 'sin_stock') {
    return 'border-red-300 bg-red-50 text-red-900 dark:border-red-700/70 dark:bg-red-950/30 dark:text-red-100';
  }

  if (item.estado_stock === 'critico') {
    return 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-700/70 dark:bg-orange-950/30 dark:text-orange-100';
  }

  if (item.estado_stock === 'bajo_minimo') {
    return 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-100';
  }

  return 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700/70 dark:bg-emerald-950/30 dark:text-emerald-100';
}

function getEstadoLabel(item: ComercialStockResumenItem) {
  if (item.estado_stock === 'sin_stock') return 'Sin stock';
  if (item.estado_stock === 'critico') return 'Crítico';
  if (item.estado_stock === 'bajo_minimo') return 'Bajo mínimo';
  return 'OK';
}

function getEstadoClass(item: ComercialStockResumenItem) {
  if (item.estado_stock === 'sin_stock') return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200';
  if (item.estado_stock === 'critico') return 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200';
  if (item.estado_stock === 'bajo_minimo') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200';
}


function normalizeStockRuntimeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function translateStockRuntimeText(locale: string, value: string | null | undefined, fallback?: (text: string) => string) {
  if (!value) return '';

  const original = String(value).trim();
  if (!original) return original;

  const translatedByDictionary = fallback?.(original);
  if (translatedByDictionary && translatedByDictionary !== original) {
    return translatedByDictionary;
  }

  if (locale !== 'en') return original;

  const normalized = normalizeStockRuntimeText(original);

  const directMap: Record<string, string> = {
    compra: 'purchase',
    venta: 'sale',
    ajuste: 'adjustment',
    'ajuste entrada': 'inbound adjustment',
    'ajuste salida': 'outbound adjustment',
    transferencia: 'transfer',
    devolucion: 'return',
    merma: 'shrinkage',
    vencimiento: 'expiration',
    'conteo fisico': 'physical count',
    'uso interno': 'internal use',
    'compra ingreso': 'purchase / inbound',
    'compra / ingreso': 'purchase / inbound',
    deposito: 'Warehouse',
    kiosco: 'Kiosk',
    recepcion: 'Reception',
    heladera: 'Cooler',
    vitrina: 'Display',
    'sala profesores': 'Staff room',
    'sin origen': 'No origin',
    'sin destino': 'No destination',
    'sin ubicacion': 'No location',
    'stock principal de reposicion y mercaderia guardada': 'Main replenishment stock and stored merchandise.',
    'stock disponible para venta directa en mostrador': 'Stock available for direct counter sales.',
    'stock disponible en recepcion o caja': 'Stock available in reception or cash register.',
    'bebidas o productos refrigerados': 'Chilled drinks or refrigerated products.',
    'productos exhibidos para venta': 'Products displayed for sale.',
    'productos o insumos reservados para uso interno': 'Products or supplies reserved for internal use.',
  };

  const mapped = directMap[normalized];
  if (mapped) return mapped;

  const minimumReplenishment = normalized.match(/^reposicion sugerida por alerta bajo minimo\s*[·.-]?\s*(\d+)\s*unidades?$/);
  if (minimumReplenishment) {
    return `Suggested replenishment due to below-minimum alert · ${minimumReplenishment[1]} units`;
  }

  const purchaseOrderReceipt = normalized.match(/^recepcion orden de compra\s+(.+)$/);
  if (purchaseOrderReceipt) {
    const code = original.replace(/^Recepción orden de compra\s+/i, '').trim();
    return `Purchase order receipt ${code}`;
  }

  const posSale = normalized.match(/^venta pos\/?kiosco\s+(.+)$/);
  if (posSale) {
    const code = original.replace(/^Venta POS\/?Kiosco\s+/i, '').trim();
    return `POS/Kiosk sale ${code}`;
  }

  return original;
}

function MovementTypeHelp({ tipo, c }: { tipo: ComercialStockMovimientoTipo; c: (text: string) => string }) {
  const selected = tiposMovimiento.find((item) => item.value === tipo);
  return <p className='text-xs text-muted-foreground'>{selected?.help ? c(selected.help) : null}</p>;
}

export default function ComercialStockLedgerPage() {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ComercialStockLedgerDashboard>(initialDashboard);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockAlertFilter, setStockAlertFilter] = useState<StockAlertFilter>('todos');
  const [form, setForm] = useState<CreateComercialStockMovimientoDTO>({
    producto_id: '',
    tipo: 'compra',
    cantidad: 1,
    stock_real: null,
    ubicacion_origen_id: '',
    ubicacion_destino_id: '',
    motivo: '',
  });

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
      const data = await getComercialStockLedgerDashboard();
      setDashboard(data ?? initialDashboard);
    } catch (error: any) {
      toast.error(error?.message || c('No se pudo cargar stock ledger'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadDashboard();
    }
  }, [isInitialized, isAuthenticated]);

  const stockAlerts = useMemo(() => {
    return dashboard.resumen
      .filter((item) => item.estado_stock !== 'ok')
      .sort((a, b) => {
        const priorityDiff = getStockPriority(b) - getStockPriority(a);
        if (priorityDiff !== 0) return priorityDiff;
        return Number(a.stock_total ?? 0) - Number(b.stock_total ?? 0);
      });
  }, [dashboard.resumen]);

  const highPriorityAlerts = useMemo(
    () => stockAlerts.filter((item) => item.estado_stock === 'sin_stock' || item.estado_stock === 'critico'),
    [stockAlerts]
  );

  const suggestedReorderUnits = useMemo(
    () => stockAlerts.reduce((total, item) => total + getReorderQuantity(item), 0),
    [stockAlerts]
  );

  const stockHealthPercent = useMemo(() => {
    if (dashboard.metricas.productos === 0) return 100;
    const healthy = dashboard.resumen.filter((item) => item.estado_stock === 'ok').length;
    return Math.round((healthy / dashboard.metricas.productos) * 100);
  }, [dashboard.metricas.productos, dashboard.resumen]);

  const filteredResumen = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return dashboard.resumen.filter((item) => {
      const matchesSearch = !query || [item.producto_nombre, item.sku, item.codigo_barras]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      const matchesAlertFilter = stockAlertFilter === 'todos' || item.estado_stock === stockAlertFilter;
      return matchesSearch && matchesAlertFilter;
    });
  }, [dashboard.resumen, searchTerm, stockAlertFilter]);

  const stockByProduct = useMemo(() => {
    const map = new Map<string, typeof dashboard.stockPorUbicacion>();
    dashboard.stockPorUbicacion.forEach((item) => {
      const list = map.get(item.producto_id) ?? [];
      list.push(item);
      map.set(item.producto_id, list);
    });
    return map;
  }, [dashboard.stockPorUbicacion]);

  const selectedTipo = form.tipo;
  const needsOrigin = ['venta', 'ajuste_salida', 'transferencia', 'merma', 'vencimiento', 'uso_interno'].includes(selectedTipo);
  const needsDestination = ['compra', 'ajuste_entrada', 'transferencia', 'devolucion', 'conteo_fisico'].includes(selectedTipo);
  const isConteo = selectedTipo === 'conteo_fisico';

  function prepareIncomingMovement(item: ComercialStockResumenItem) {
    const cantidad = Math.max(1, getReorderQuantity(item));
    setForm((prev) => ({
      ...prev,
      producto_id: item.producto_id,
      tipo: 'compra',
      cantidad,
      stock_real: null,
      ubicacion_origen_id: '',
      ubicacion_destino_id: dashboard.ubicaciones[0]?.id ?? prev.ubicacion_destino_id ?? '',
      motivo: `Reposición sugerida por alerta ${getEstadoLabel(item).toLowerCase()} · ${cantidad} unidades`,
    }));
    toast.info(c('Producto cargado en el formulario de movimiento'));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await createComercialStockMovimiento({
        ...form,
        cantidad: isConteo ? null : Number(form.cantidad ?? 0),
        stock_real: isConteo ? Number(form.stock_real ?? 0) : null,
        ubicacion_origen_id: form.ubicacion_origen_id || null,
        ubicacion_destino_id: form.ubicacion_destino_id || null,
      });
      toast.success(c('Movimiento de stock registrado'));
      setForm((prev) => ({
        ...prev,
        cantidad: 1,
        stock_real: null,
        motivo: '',
      }));
      await loadDashboard();
    } catch (error: any) {
      toast.error(error?.message || c('No se pudo registrar movimiento'));
    } finally {
      setSaving(false);
    }
  }

  if (!isInitialized) return <div>{c('Cargando...')}</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100'>
        <AppSidebar />
        <SidebarInset className='grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
          <AppHeader title={c('Alertas de stock comercial')} />
          <main className='min-h-0 space-y-6 overflow-y-auto overflow-x-hidden p-4 sm:p-6'>
            <section className='rounded-3xl border border-sky-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-sm dark:border-cyan-800/70'>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300'>
                    {c('Centro final de alertas · Stock comercial')}
                  </p>
                  <h1 className='text-2xl font-bold'>{c('Alertas de stock, reposición y movimientos')}</h1>
                  <p className='max-w-4xl text-sm leading-relaxed text-cyan-50/85'>
                    {c('Detectá productos sin stock, críticos o bajo mínimo antes de que impacten el POS. Priorizá reposición, compras y ajustes desde un único tablero operativo.')}
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button variant='outline' className='border-white/30 bg-white/10 text-white hover:bg-white/20' onClick={loadDashboard} disabled={loading}>
                    {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}
                    {c('Actualizar')}
                  </Button>
                  <Button asChild variant='outline' className='border-white/30 bg-white/10 text-white hover:bg-white/20'>
                    <Link href='/dashboard/productos'>{c('Productos')}</Link>
                  </Button>
                  <Button asChild className='bg-cyan-400 text-slate-950 hover:bg-cyan-300'>
                    <Link href='/dashboard/comercial'>Comercial</Link>
                  </Button>
                </div>
              </div>
            </section>

            <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6'>
              <Card>
                <CardContent className='flex items-center justify-between p-5'>
                  <div>
                    <p className='text-sm text-muted-foreground'>{c('Productos')}</p>
                    <p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.productos}</p>
                  </div>
                  <Package className='h-6 w-6 text-sky-600' />
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center justify-between p-5'>
                  <div>
                    <p className='text-sm text-muted-foreground'>{c('Stock total')}</p>
                    <p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.stockTotal}</p>
                  </div>
                  <Boxes className='h-6 w-6 text-emerald-600' />
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center justify-between p-5'>
                  <div>
                    <p className='text-sm text-muted-foreground'>{c('Valor inventario')}</p>
                    <p className='text-xl font-bold'>{loading ? '...' : formatCurrencyARS(dashboard.metricas.valorInventario, locale)}</p>
                  </div>
                  <BarChart3 className='h-6 w-6 text-indigo-600' />
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center justify-between p-5'>
                  <div>
                    <p className='text-sm text-muted-foreground'>{c('Bajo/Crítico')}</p>
                    <p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.productosCriticos}</p>
                  </div>
                  <AlertTriangle className='h-6 w-6 text-orange-600' />
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center justify-between p-5'>
                  <div>
                    <p className='text-sm text-muted-foreground'>{c('Ubicaciones')}</p>
                    <p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.ubicacionesActivas}</p>
                  </div>
                  <Warehouse className='h-6 w-6 text-slate-600' />
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center justify-between p-5'>
                  <div>
                    <p className='text-sm text-muted-foreground'>{c('Movimientos')}</p>
                    <p className='text-2xl font-bold'>{loading ? '...' : dashboard.metricas.movimientos}</p>
                  </div>
                  <ClipboardList className='h-6 w-6 text-violet-600' />
                </CardContent>
              </Card>
            </section>

            <section className='grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr]'>
              <Card className='border-orange-200 bg-orange-50/80 dark:border-orange-900/60 dark:bg-orange-950/20'>
                <CardHeader>
                  <div className='flex flex-col justify-between gap-3 md:flex-row md:items-start'>
                    <div className='space-y-1'>
                      <CardTitle className='flex items-center gap-2 text-lg'>
                        <ShieldAlert className='h-5 w-5 text-orange-600' />
                        {c('Alertas prioritarias de stock')}
                      </CardTitle>
                      <p className='text-sm text-muted-foreground'>
                        {c('Productos que pueden frenar ventas en POS o requieren reposición inmediata.')}
                      </p>
                    </div>
                    <div className='rounded-full border border-orange-300 bg-white px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-800 dark:bg-slate-950 dark:text-orange-200'>
                      {highPriorityAlerts.length} {c('críticas')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {stockAlerts.length === 0 ? (
                    <div className='rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100'>
                      <CheckCircle2 className='mb-2 h-5 w-5' />
                      {c('No hay alertas de stock. El catálogo comercial está dentro de parámetros operativos.')}
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                      {stockAlerts.slice(0, 6).map((item) => {
                        const reorderQty = getReorderQuantity(item);
                        return (
                          <div key={item.producto_id} className={`rounded-2xl border p-4 ${getAlertToneClass(item)}`}>
                            <div className='flex items-start justify-between gap-3'>
                              <div className='min-w-0'>
                                <p className='truncate font-semibold'>{item.producto_nombre}</p>
                                <p className='text-xs opacity-80'>
                                  {item.sku ? `SKU ${item.sku}` : c('Sin SKU')} · {c('Stock')} {item.stock_total} / {c('mín.')} {item.stock_minimo}
                                </p>
                              </div>
                              <span className='shrink-0 rounded-full bg-white/70 px-2 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-950/70 dark:text-slate-100'>
                                {c(getEstadoLabel(item))}
                              </span>
                            </div>
                            <div className='mt-3 grid grid-cols-2 gap-2 text-xs'>
                              <div className='rounded-xl bg-white/55 p-2 dark:bg-slate-950/40'>
                                <p className='opacity-70'>{c('Reponer sugerido')}</p>
                                <p className='text-base font-bold'>{reorderQty}</p>
                              </div>
                              <div className='rounded-xl bg-white/55 p-2 dark:bg-slate-950/40'>
                                <p className='opacity-70'>{c('Valor actual')}</p>
                                <p className='text-base font-bold'>{formatCurrencyARS(item.valor_inventario, locale)}</p>
                              </div>
                            </div>
                            <Button
                              type='button'
                              variant='outline'
                              className='mt-3 w-full bg-white/80 text-slate-900 hover:bg-white dark:border-white/20 dark:bg-slate-950/50 dark:text-slate-100'
                              onClick={() => prepareIncomingMovement(item)}
                            >
                              <ShoppingCart className='mr-2 h-4 w-4' />
                              {c('Preparar ingreso')}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className='border-sky-200 bg-sky-50/80 dark:border-sky-900/60 dark:bg-sky-950/20'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <Target className='h-5 w-5 text-sky-600' />
                    {c('Salud de inventario')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='rounded-2xl border bg-white p-4 dark:bg-slate-950/50'>
                      <p className='text-xs uppercase tracking-wide text-muted-foreground'>{c('Salud stock')}</p>
                      <p className='text-2xl font-bold'>{stockHealthPercent}%</p>
                    </div>
                    <div className='rounded-2xl border bg-white p-4 dark:bg-slate-950/50'>
                      <p className='text-xs uppercase tracking-wide text-muted-foreground'>{c('Unidades sugeridas')}</p>
                      <p className='text-2xl font-bold'>{suggestedReorderUnits}</p>
                    </div>
                    <div className='rounded-2xl border bg-white p-4 dark:bg-slate-950/50'>
                      <p className='text-xs uppercase tracking-wide text-muted-foreground'>{c('Sin stock')}</p>
                      <p className='text-2xl font-bold text-red-600'>{dashboard.metricas.productosSinStock}</p>
                    </div>
                    <div className='rounded-2xl border bg-white p-4 dark:bg-slate-950/50'>
                      <p className='text-xs uppercase tracking-wide text-muted-foreground'>{c('Bajo/crítico')}</p>
                      <p className='text-2xl font-bold text-orange-600'>{dashboard.metricas.productosCriticos}</p>
                    </div>
                  </div>
                  <div className='rounded-2xl border border-sky-200 bg-white p-4 text-sm leading-relaxed text-muted-foreground dark:border-sky-900/70 dark:bg-slate-950/50'>
                    {stockAlerts.length > 0
                      ? c('Priorizá productos sin stock o críticos antes de impulsar promociones o packs de alto movimiento.')
                      : c('El inventario no presenta alertas críticas. Revisá movimientos recientes para mantener trazabilidad.')}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className='grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <Plus className='h-5 w-5 text-sky-600' />
                    {c('Registrar movimiento')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className='space-y-4' onSubmit={handleSubmit}>
                    <div className='space-y-2'>
                      <Label>{c('Producto')}</Label>
                      <select
                        className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                        value={form.producto_id}
                        onChange={(event) => setForm((prev) => ({ ...prev, producto_id: event.target.value }))}
                        required
                      >
                        <option value=''>{c('Seleccionar producto')}</option>
                        {dashboard.resumen.map((item) => (
                          <option key={item.producto_id} value={item.producto_id}>
                            {item.producto_nombre} · {c('Stock')} {item.stock_total}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className='space-y-2'>
                      <Label>{c('Tipo de movimiento')}</Label>
                      <select
                        className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                        value={form.tipo}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, tipo: event.target.value as ComercialStockMovimientoTipo }))
                        }
                      >
                        {tiposMovimiento.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {c(tipo.label)}
                          </option>
                        ))}
                      </select>
                      <MovementTypeHelp tipo={form.tipo} c={c} />
                    </div>

                    {needsOrigin && (
                      <div className='space-y-2'>
                        <Label>{c('Ubicación origen')}</Label>
                        <select
                          className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                          value={form.ubicacion_origen_id || ''}
                          onChange={(event) => setForm((prev) => ({ ...prev, ubicacion_origen_id: event.target.value }))}
                          required={needsOrigin}
                        >
                          <option value=''>{c('Seleccionar origen')}</option>
                          {dashboard.ubicaciones.map((ubicacion) => (
                            <option key={ubicacion.id} value={ubicacion.id}>
                              {translateStockRuntimeText(locale, ubicacion.nombre, c)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {needsDestination && (
                      <div className='space-y-2'>
                        <Label>{c('Ubicación destino')}</Label>
                        <select
                          className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                          value={form.ubicacion_destino_id || ''}
                          onChange={(event) => setForm((prev) => ({ ...prev, ubicacion_destino_id: event.target.value }))}
                          required={needsDestination}
                        >
                          <option value=''>{c('Seleccionar destino')}</option>
                          {dashboard.ubicaciones.map((ubicacion) => (
                            <option key={ubicacion.id} value={ubicacion.id}>
                              {translateStockRuntimeText(locale, ubicacion.nombre, c)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                      {!isConteo && (
                        <div className='space-y-2'>
                          <Label>{c('Cantidad')}</Label>
                          <Input
                            type='number'
                            min={1}
                            value={form.cantidad ?? 1}
                            onChange={(event) => setForm((prev) => ({ ...prev, cantidad: Number(event.target.value) }))}
                            required
                          />
                        </div>
                      )}
                      {isConteo && (
                        <div className='space-y-2'>
                          <Label>{c('Stock real')}</Label>
                          <Input
                            type='number'
                            min={0}
                            value={form.stock_real ?? ''}
                            onChange={(event) => setForm((prev) => ({ ...prev, stock_real: Number(event.target.value) }))}
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label>{c('Motivo')}</Label>
                      <Input
                        value={form.motivo}
                        placeholder={c('Ej: Compra a proveedor, ajuste por conteo, merma por vencimiento...')}
                        onChange={(event) => setForm((prev) => ({ ...prev, motivo: event.target.value }))}
                        required
                      />
                    </div>

                    <Button type='submit' className='w-full bg-[#02a8e1] hover:bg-[#0288b1]' disabled={saving}>
                      {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <ArrowRightLeft className='mr-2 h-4 w-4' />}
                      {c('Registrar movimiento')}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className='flex flex-col justify-between gap-3 md:flex-row md:items-center'>
                    <CardTitle className='text-lg'>{c('Resumen por producto')}</CardTitle>
                    <div className='flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center'>
                      <select
                        className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:w-44'
                        value={stockAlertFilter}
                        onChange={(event) => setStockAlertFilter(event.target.value as StockAlertFilter)}
                      >
                        {stockAlertFilters.map((filter) => (
                          <option key={filter.value} value={filter.value}>{c(filter.label)}</option>
                        ))}
                      </select>
                      <div className='relative w-full md:w-80'>
                        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                        <Input
                          className='pl-9'
                          value={searchTerm}
                          placeholder={c('Buscar producto, SKU o barcode...')}
                          onChange={(event) => setSearchTerm(event.target.value)}
                        />
                      </div>
                      {(searchTerm || stockAlertFilter !== 'todos') && (
                        <Button
                          type='button'
                          variant='outline'
                          className='w-full md:w-auto'
                          onClick={() => {
                            setSearchTerm('');
                            setStockAlertFilter('todos');
                          }}
                        >
                          <FilterX className='mr-2 h-4 w-4' />
                          {c('Limpiar')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='overflow-x-auto rounded-lg border'>
                    <table className='w-full min-w-[880px] text-sm'>
                      <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-muted-foreground dark:bg-slate-900/70'>
                        <tr>
                          <th className='px-4 py-3'>{c('Producto')}</th>
                          <th className='px-4 py-3 text-right'>{c('Stock')}</th>
                          <th className='px-4 py-3 text-right'>{c('Mínimo')}</th>
                          <th className='px-4 py-3 text-right'>{c('Objetivo')}</th>
                          <th className='px-4 py-3 text-right'>{c('Valor')}</th>
                          <th className='px-4 py-3 text-right'>{c('Margen unit.')}</th>
                          <th className='px-4 py-3'>{c('Estado')}</th>
                          <th className='px-4 py-3'>{c('Ubicaciones')}</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {loading ? (
                          <tr>
                            <td colSpan={8} className='px-4 py-8 text-center text-muted-foreground'>
                              {c('Cargando stock...')}
                            </td>
                          </tr>
                        ) : filteredResumen.length === 0 ? (
                          <tr>
                            <td colSpan={8} className='px-4 py-8 text-center text-muted-foreground'>
                              {c('No hay productos para mostrar con los filtros actuales.')}
                            </td>
                          </tr>
                        ) : (
                          filteredResumen.map((item) => {
                            const locations = stockByProduct.get(item.producto_id) ?? [];
                            return (
                              <tr key={item.producto_id} className='align-top'>
                                <td className='px-4 py-3'>
                                  <p className='font-medium'>{item.producto_nombre}</p>
                                  <p className='text-xs text-muted-foreground'>
                                    {item.sku ? `SKU ${item.sku}` : c('Sin SKU')} {item.codigo_barras ? `· ${item.codigo_barras}` : ''}
                                  </p>
                                </td>
                                <td className='px-4 py-3 text-right font-semibold'>{item.stock_total}</td>
                                <td className='px-4 py-3 text-right'>{item.stock_minimo}</td>
                                <td className='px-4 py-3 text-right'>{item.stock_objetivo || '-'}</td>
                                <td className='px-4 py-3 text-right'>{formatCurrencyARS(item.valor_inventario, locale)}</td>
                                <td className='px-4 py-3 text-right'>{formatCurrencyARS(item.margen_unitario, locale)}</td>
                                <td className='px-4 py-3'>
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${getEstadoClass(item)}`}>
                                    {c(getEstadoLabel(item))}
                                  </span>
                                </td>
                                <td className='px-4 py-3 text-xs text-muted-foreground'>
                                  {locations.length === 0 ? c('Sin ubicación') : locations.map((location) => (
                                    <div key={location.id}>
                                      {translateStockRuntimeText(locale, location.ubicacion?.nombre || 'Ubicación', c)}: {location.cantidad}
                                    </div>
                                  ))}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>{c('Movimientos recientes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {dashboard.movimientos.slice(0, 12).map((movimiento) => (
                      <div key={movimiento.id} className='rounded-lg border p-3 text-sm'>
                        <div className='flex items-center justify-between gap-2'>
                          <p className='font-medium'>{movimiento.producto?.nombre || c('Producto')}</p>
                          <span className='rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800'>{translateStockRuntimeText(locale, tiposMovimiento.find((item) => item.value === movimiento.tipo)?.label ?? movimiento.tipo.replace(/_/g, ' '), c)}</span>
                        </div>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {c('Cantidad')} {movimiento.cantidad} · {c('Stock')} {movimiento.stock_anterior_total} → {movimiento.stock_nuevo_total}
                        </p>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {translateStockRuntimeText(locale, movimiento.ubicacion_origen?.nombre || 'Sin origen', c)} → {translateStockRuntimeText(locale, movimiento.ubicacion_destino?.nombre || 'Sin destino', c)}
                        </p>
                        {movimiento.motivo && <p className='mt-1 text-xs'>{translateStockRuntimeText(locale, movimiento.motivo, c)}</p>}
                      </div>
                    ))}
                    {!loading && dashboard.movimientos.length === 0 && (
                      <p className='text-sm text-muted-foreground'>{c('Aún no hay movimientos comerciales registrados.')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>{c('Ubicaciones de stock')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                    {dashboard.ubicaciones.map((ubicacion) => (
                      <div key={ubicacion.id} className='rounded-lg border p-4'>
                        <div className='flex items-center gap-2'>
                          <Warehouse className='h-4 w-4 text-sky-600' />
                          <p className='font-medium'>{translateStockRuntimeText(locale, ubicacion.nombre, c)}</p>
                        </div>
                        <p className='mt-1 text-xs uppercase tracking-wide text-muted-foreground'>{ubicacion.codigo}</p>
                        {ubicacion.descripcion && (
                          <p className='mt-2 text-sm text-muted-foreground'>{translateStockRuntimeText(locale, ubicacion.descripcion, c)}</p>
                        )}
                      </div>
                    ))}
                  </div>
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
