'use client';

import { ElementType, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Banknote,
  BadgePercent,
  Boxes,
  ClipboardList,
  CreditCard,
  DollarSign,
  Gift,
  Package,
  PackageCheck,
  ReceiptText,
  RefreshCcw,
  ScanBarcode,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
  Warehouse,
} from 'lucide-react';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';
import { Producto } from '@/interfaces/producto.interface';
import { Proveedor } from '@/interfaces/proveedor.interface';
import { Servicio } from '@/interfaces/servicio.interface';
import { ResponseVenta } from '@/interfaces/venta.interface';
import {
  calcularValorInventario,
  formatCurrencyARS,
  getProductoStockEstadoLabel,
  isProductoStockCritico,
} from '@/lib/comercial/productos';
import {
  getComercialProductos,
  getComercialProveedores,
  getComercialServicios,
  getComercialVentas,
} from '@/services/comercialKioscoService';

type LoadState = {
  productos: Producto[];
  proveedores: Proveedor[];
  servicios: Servicio[];
  ventas: ResponseVenta[];
};

const initialState: LoadState = {
  productos: [],
  proveedores: [],
  servicios: [],
  ventas: [],
};

type CommercialHealthStatus = 'stable' | 'attention' | 'critical';

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

function getHealthCopy(status: CommercialHealthStatus) {
  if (status === 'critical') {
    return {
      label: 'Crítico',
      badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200',
      text: 'Hay productos sin stock o con reposición urgente. Conviene priorizar compras antes de impulsar promociones.',
    };
  }

  if (status === 'attention') {
    return {
      label: 'Atención',
      badge:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
      text: 'El tablero detecta oportunidades de reposición o venta. Revisá stock crítico y ticket promedio.',
    };
  }

  return {
    label: 'Operativo',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
    text: 'La operación comercial se ve estable. Podés enfocarte en ventas, packs y servicios adicionales.',
  };
}

function DashboardMetric({
  title,
  value,
  description,
  icon: Icon,
  tone = 'sky',
}: {
  title: string;
  value: string;
  description: string;
  icon: ElementType;
  tone?: 'sky' | 'amber' | 'emerald' | 'violet' | 'red' | 'slate';
}) {
  const toneClasses = {
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-200',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-200',
    emerald:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200',
    violet:
      'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-200',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-200',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200',
  }[tone];

  return (
    <Card className='overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/80'>
      <CardContent className='flex h-full items-center justify-between gap-4 p-5'>
        <div className='min-w-0 space-y-1'>
          <p className='text-sm text-muted-foreground'>{title}</p>
          <p className='truncate text-2xl font-bold'>{value}</p>
          <p className='text-xs leading-relaxed text-muted-foreground'>{description}</p>
        </div>
        <div className={`shrink-0 rounded-full p-3 ${toneClasses}`}>
          <Icon className='h-5 w-5' />
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon: Icon,
  disabled,
  label = 'Abrir',
  disabledLabel = 'Próxima etapa',
}: {
  title: string;
  description: string;
  href?: string;
  icon: ElementType;
  disabled?: boolean;
  label?: string;
  disabledLabel?: string;
}) {
  const content = (
    <Card
      className={`h-full overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 ${
        disabled ? 'opacity-70' : 'transition hover:-translate-y-0.5 hover:shadow-md'
      }`}
    >
      <CardContent className='flex h-full flex-col justify-between gap-4 p-5'>
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <div className='rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
              <Icon className='h-5 w-5' />
            </div>
            <h3 className='font-semibold'>{title}</h3>
          </div>
          <p className='text-sm leading-relaxed text-muted-foreground'>
            {description}
          </p>
        </div>
        <Button
          className='w-full justify-between'
          variant={disabled ? 'secondary' : 'outline'}
          disabled={disabled}
        >
          {disabled ? disabledLabel : label}
          {!disabled && <ArrowUpRight className='h-4 w-4' />}
        </Button>
      </CardContent>
    </Card>
  );

  if (disabled || !href) return content;

  return <Link href={href}>{content}</Link>;
}

function InsightCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ElementType;
}) {
  return (
    <div className='rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70'>
      <div className='mb-3 flex items-center gap-2'>
        <div className='rounded-full bg-cyan-500/10 p-2 text-cyan-600 dark:text-cyan-200'>
          <Icon className='h-4 w-4' />
        </div>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
          {title}
        </p>
      </div>
      <p className='text-xl font-bold'>{value}</p>
      <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>
        {description}
      </p>
    </div>
  );
}

export default function ComercialKioscoPage() {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<LoadState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    async function loadDashboard() {
      setLoading(true);
      try {
        const [productos, proveedores, servicios, ventas] = await Promise.all([
          getComercialProductos(),
          getComercialProveedores(),
          getComercialServicios(),
          getComercialVentas(),
        ]);

        setData({ productos, proveedores, servicios, ventas });
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [isAuthenticated, isInitialized]);

  const metrics = useMemo(() => {
    const productosActivos = data.productos.filter((p) => p.activo !== false);
    const productosCriticos = productosActivos.filter(isProductoStockCritico);
    const ventasActivas = data.ventas.filter(
      (venta) => venta.activo !== false && venta.estado !== 'anulada'
    );
    const ventasTotal = ventasActivas.reduce(
      (total, venta) => total + Number(venta.total ?? 0),
      0
    );

    const productosSinStock = productosActivos.filter(
      (producto) => Number(producto.stock ?? 0) <= 0
    );
    const ticketPromedio =
      ventasActivas.length > 0 ? ventasTotal / ventasActivas.length : 0;
    const porcentajeStockCritico =
      productosActivos.length > 0
        ? (productosCriticos.length / productosActivos.length) * 100
        : 0;
    const serviciosActivos = data.servicios.filter(
      (servicio) => servicio.activo !== false
    );
    const healthStatus: CommercialHealthStatus =
      productosSinStock.length > 0
        ? 'critical'
        : productosCriticos.length > 0 || ventasActivas.length === 0
          ? 'attention'
          : 'stable';

    return {
      productosActivos: productosActivos.length,
      productosCriticos,
      productosSinStock,
      porcentajeStockCritico,
      valorInventario: calcularValorInventario(productosActivos),
      proveedores: data.proveedores.length,
      servicios: serviciosActivos.length,
      ventasActivas: ventasActivas.length,
      ventasTotal,
      ticketPromedio,
      healthStatus,
      conversionCatalogo:
        productosActivos.length + serviciosActivos.length > 0
          ? (serviciosActivos.length /
              (productosActivos.length + serviciosActivos.length)) *
            100
          : 0,
    };
  }, [data]);

  const healthCopy = getHealthCopy(metrics.healthStatus);

  if (!isInitialized) {
    return <div>{c('Cargando...')}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950'>
        <AppSidebar />
        <SidebarInset className='!grid h-[100dvh] max-h-[100dvh] min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
          <AppHeader title={c('Comercial / Kiosco')} />
          <section className='min-h-0 space-y-6 overflow-y-auto overflow-x-hidden p-4 pb-8 sm:p-6 lg:p-8'>
            <section className='overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-xl shadow-cyan-950/20'>
              <div className='flex flex-col justify-between gap-5 lg:flex-row lg:items-center'>
                <div className='space-y-3'>
                  <p className='text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200'>
                    {c('Panel comercial final')}
                  </p>
                  <h1 className='text-2xl font-black tracking-tight sm:text-3xl'>
                    {c('Operación comercial Gym Master')}
                  </h1>
                  <p className='max-w-3xl text-sm leading-relaxed text-cyan-50/85'>
                    {c('Control ejecutivo de ventas, inventario, servicios, packs, caja y reposición. Este panel resume la salud comercial del gimnasio y conecta con los módulos operativos clave.')}
                  </p>
                </div>
                <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end'>
                  <Button asChild className='bg-cyan-500 text-slate-950 hover:bg-cyan-400'>
                    <Link href='/dashboard/comercial/kiosco'>{c('Abrir POS / Kiosco')}</Link>
                  </Button>
                  <Button asChild variant='secondary'>
                    <Link href='/dashboard/comercial/caja'>{c('Caja')}</Link>
                  </Button>
                  <Button asChild variant='secondary'>
                    <Link href='/dashboard/productos'>{c('Stock')}</Link>
                  </Button>
                  <Button asChild variant='secondary'>
                    <Link href='/dashboard/finanzas'>{c('Finanzas / BI')}</Link>
                  </Button>
                </div>
              </div>
            </section>

            <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <DashboardMetric
                title={c('Total vendido')}
                value={loading ? '...' : formatCurrencyARS(metrics.ventasTotal)}
                description={c('Ventas activas sin operaciones anuladas.')}
                icon={TrendingUp}
                tone='emerald'
              />
              <DashboardMetric
                title={c('Ticket promedio')}
                value={loading ? '...' : formatCurrencyARS(metrics.ticketPromedio)}
                description={`${metrics.ventasActivas} ${c('ventas activas registradas.')}`}
                icon={ReceiptText}
                tone='sky'
              />
              <DashboardMetric
                title={c('Inventario estimado')}
                value={loading ? '...' : formatCurrencyARS(metrics.valorInventario)}
                description={`${metrics.productosActivos} ${c('productos activos en catálogo.')}`}
                icon={Boxes}
                tone='violet'
              />
              <DashboardMetric
                title={c('Stock crítico')}
                value={loading ? '...' : String(metrics.productosCriticos.length)}
                description={
                  loading
                    ? c('Calculando...')
                    : `${formatPercent(metrics.porcentajeStockCritico)} ${c('del catálogo activo.')}`
                }
                icon={AlertTriangle}
                tone={metrics.productosCriticos.length > 0 ? 'amber' : 'emerald'}
              />
            </section>

            <section className='grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
              <Card className='overflow-hidden border-cyan-500/20 bg-white/95 shadow-sm dark:border-cyan-500/20 dark:bg-slate-950/90'>
                <CardHeader className='border-b border-slate-200/70 dark:border-slate-800'>
                  <div className='flex flex-col justify-between gap-3 md:flex-row md:items-center'>
                    <div>
                      <CardTitle className='flex items-center gap-2 text-lg'>
                        <Store className='h-5 w-5 text-cyan-500' />
                        {c('Radar comercial operativo')}
                      </CardTitle>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {c('Señales rápidas para decidir ventas, compras, promociones y seguimiento de caja.')}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${healthCopy.badge}`}
                    >
                      {c(healthCopy.label)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4 p-5'>
                  <p className='rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-muted-foreground dark:border-slate-800 dark:bg-slate-900/70'>
                    {c(healthCopy.text)}
                  </p>
                  <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
                    <InsightCard
                      title={c('Catálogo')}
                      value={`${metrics.productosActivos} ${c('productos')}`}
                      description={`${metrics.servicios} ${c('servicios activos')} y ${metrics.proveedores} ${c('proveedores registrados')}.`}
                      icon={PackageCheck}
                    />
                    <InsightCard
                      title={c('Sin stock')}
                      value={String(metrics.productosSinStock.length)}
                      description={c('Productos que requieren revisión inmediata antes de nuevas ventas.')}
                      icon={AlertTriangle}
                    />
                    <InsightCard
                      title={c('Mix servicios')}
                      value={formatPercent(metrics.conversionCatalogo)}
                      description={c('Peso de servicios activos sobre catálogo comercial total.')}
                      icon={BadgePercent}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className='border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/90'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <ScanBarcode className='h-5 w-5 text-cyan-500' />
                    {c('Acciones rápidas')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1'>
                  <Button asChild className='justify-between bg-cyan-600 hover:bg-cyan-700'>
                    <Link href='/dashboard/comercial/kiosco'>{c('Vender en POS')} <ArrowUpRight className='h-4 w-4' /></Link>
                  </Button>
                  <Button asChild variant='outline' className='justify-between'>
                    <Link href='/dashboard/comercial/caja'>{c('Abrir caja')} <ArrowUpRight className='h-4 w-4' /></Link>
                  </Button>
                  <Button asChild variant='outline' className='justify-between'>
                    <Link href='/dashboard/comercial/servicios-promociones'>{c('Packs y promos')} <ArrowUpRight className='h-4 w-4' /></Link>
                  </Button>
                  <Button asChild variant='outline' className='justify-between'>
                    <Link href='/dashboard/comercial/compras-reposicion'>{c('Reposición')} <ArrowUpRight className='h-4 w-4' /></Link>
                  </Button>
                </CardContent>
              </Card>
            </section>

            <section className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
              <ActionCard
                title={c('Productos y stock')}
                description={c('Alta, edición, activación/desactivación y control de stock con alertas de reposición operativa.')}
                href='/dashboard/productos'
                icon={Package}
                label={c('Gestionar stock')}
              />
              <ActionCard
                title={c('POS / Kiosco')}
                description={c('Venta rápida con carrito, códigos de barra, validación de stock, servicios, packs y ticket imprimible.')}
                href='/dashboard/comercial/kiosco'
                icon={Store}
                label={c('Vender ahora')}
              />
              <ActionCard
                title={c('Caja / Cashup')}
                description={c('Apertura, ingresos, retiros, cierre esperado vs contado y reporte X/Z del turno comercial.')}
                href='/dashboard/comercial/caja'
                icon={Banknote}
                label={c('Controlar caja')}
              />
              <ActionCard
                title={c('Stock ledger')}
                description={c('Movimientos auditables, conteo físico, mermas, transferencias y reposición base por ubicación.')}
                href='/dashboard/comercial/stock-ledger'
                icon={Warehouse}
                label={c('Abrir')}
              />
              <ActionCard
                title={c('Ventas y tickets')}
                description={c('Ventas a socios o consumidores finales con consulta rápida de tickets y operaciones registradas.')}
                href='/dashboard/ventas'
                icon={ReceiptText}
                label={c('Abrir')}
              />
              <ActionCard
                title={c('Compras y reposición')}
                description={c('Reposición sugerida, órdenes de compra y recepción integrada al Stock Ledger.')}
                href='/dashboard/comercial/compras-reposicion'
                icon={ShoppingCart}
                label={c('Abrir')}
              />
              <ActionCard
                title={c('Servicios, packs y promos')}
                description={c('Servicios vendibles, packs de clases, promociones, cupones, canales y grupos de cliente.')}
                href='/dashboard/comercial/servicios-promociones'
                icon={Gift}
                label={c('Abrir')}
              />
              <ActionCard
                title={c('BI Packs / Promos')}
                description={c('Trazabilidad de packs vendidos, cupones usados, ingreso generado y ranking comercial por promoción.')}
                href='/dashboard/comercial/pack-analytics'
                icon={BadgePercent}
                label={c('Abrir')}
              />
              <ActionCard
                title={c('Finanzas / BI')}
                description={c('Consolidá ingresos, egresos, resultado neto, compromisos pendientes y evolución mensual.')}
                href='/dashboard/finanzas'
                icon={DollarSign}
                label={c('Abrir')}
              />
              <ActionCard
                title={c('Proveedores')}
                description={c('Base de proveedores para compras, reposición de stock y trazabilidad comercial.')}
                href='/dashboard/proveedores'
                icon={Truck}
                label={c('Abrir')}
              />
              <ActionCard
                title={c('Gastos / Egresos')}
                description={c('Registrá egresos operativos, vencimientos, medios de pago y comprobantes para alimentar el BI financiero.')}
                href='/dashboard/otros-gastos'
                icon={ClipboardList}
                label={c('Abrir')}
              />
              <ActionCard
                title={c('Devoluciones y mermas')}
                description={c('Próxima etapa: devolución de productos vendidos, reintegro a stock o registro como merma/no apto.')}
                icon={RefreshCcw}
                disabledLabel={c('Próxima etapa')}
                disabled
              />
            </section>

            <section className='grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]'>
              <Card className='border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/90'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <AlertTriangle className='h-5 w-5 text-amber-600' />
                    {c('Productos que requieren reposición')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.productosCriticos.length > 0 ? (
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                      {metrics.productosCriticos.slice(0, 8).map((producto) => (
                        <div
                          key={producto.id}
                          className='rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-500/10'
                        >
                          <p className='font-semibold'>{producto.nombre}</p>
                          <p className='text-muted-foreground'>
                            {c('Stock actual')}: {producto.stock} ·{' '}
                            {c(getProductoStockEstadoLabel(producto))}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100'>
                      {c('No se detectan productos críticos en el catálogo activo.')}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className='border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/90'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <ShoppingCart className='h-5 w-5 text-cyan-500' />
                    {c('Lectura ejecutiva comercial')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='grid grid-cols-1 gap-4 text-sm md:grid-cols-3'>
                  <div className='rounded-xl border bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70'>
                    <p className='font-semibold'>{c('Ingresos comerciales')}</p>
                    <p className='mt-1 text-muted-foreground'>
                      {loading
                        ? c('Calculando...')
                        : `${metrics.ventasActivas} ventas activas por ${formatCurrencyARS(metrics.ventasTotal)}.`}
                    </p>
                  </div>
                  <div className='rounded-xl border bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70'>
                    <p className='font-semibold'>{c('Stock y reposición')}</p>
                    <p className='mt-1 text-muted-foreground'>
                      {loading
                        ? c('Calculando...')
                        : `${metrics.productosCriticos.length} ${c('críticos y')} ${metrics.productosSinStock.length} ${c('sin stock.')}`}
                    </p>
                  </div>
                  <div className='rounded-xl border bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70'>
                    <p className='font-semibold'>{c('Decisión sugerida')}</p>
                    <p className='mt-1 text-muted-foreground'>
                      {metrics.productosCriticos.length > 0
                        ? c('Priorizar reposición de productos críticos antes de nuevas promociones.')
                        : metrics.ventasActivas === 0
                          ? c('Cargar ventas reales para alimentar el BI comercial y validar el flujo completo.')
                          : c('Catálogo estable para impulsar ventas y servicios adicionales.')}
                    </p>
                  </div>
                  <div className='rounded-xl border bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70 md:col-span-3'>
                    <p className='font-semibold'>{c('Próximo paso operativo')}</p>
                    <p className='mt-1 text-muted-foreground'>
                      {c('Revisar caja, stock crítico y packs/promociones al inicio del turno. Si el stock está estable, impulsar servicios adicionales y promociones de alto margen.')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
