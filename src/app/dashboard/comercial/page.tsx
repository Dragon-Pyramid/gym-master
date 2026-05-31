'use client';

import { ElementType, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  Package,
  ReceiptText,
  RefreshCcw,
  ShoppingCart,
  Store,
  Truck,
} from 'lucide-react';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
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

function DashboardMetric({
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

function ActionCard({
  title,
  description,
  href,
  icon: Icon,
  disabled,
}: {
  title: string;
  description: string;
  href?: string;
  icon: ElementType;
  disabled?: boolean;
}) {
  const content = (
    <Card className={disabled ? 'opacity-70' : 'transition hover:shadow-md'}>
      <CardContent className='flex h-full flex-col justify-between gap-4 p-5'>
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <div className='rounded-full bg-slate-100 p-2 text-slate-700'>
              <Icon className='h-5 w-5' />
            </div>
            <h3 className='font-semibold'>{title}</h3>
          </div>
          <p className='text-sm leading-relaxed text-muted-foreground'>
            {description}
          </p>
        </div>
        <Button variant={disabled ? 'secondary' : 'outline'} disabled={disabled}>
          {disabled ? 'Próxima etapa' : 'Abrir'}
        </Button>
      </CardContent>
    </Card>
  );

  if (disabled || !href) return content;

  return <Link href={href}>{content}</Link>;
}

export default function ComercialKioscoPage() {
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

    return {
      productosActivos: productosActivos.length,
      productosCriticos,
      valorInventario: calcularValorInventario(productosActivos),
      proveedores: data.proveedores.length,
      servicios: data.servicios.filter((servicio) => servicio.activo !== false)
        .length,
      ventasTotal,
    };
  }, [data]);

  if (!isInitialized) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Comercial / Kiosco' />
          <main className='flex-1 space-y-6 p-6'>
            <section className='rounded-2xl border bg-white p-6 shadow-sm'>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-sky-600'>
                    Gestión comercial
                  </p>
                  <h1 className='text-2xl font-bold'>Kiosco y ventas del gimnasio</h1>
                  <p className='max-w-3xl text-sm leading-relaxed text-muted-foreground'>
                    Controlá productos, stock, ventas, proveedores y servicios adicionales. Esta primera base usa los datos actuales del sistema y deja preparado el camino para devoluciones, ajustes por recuento, compras y BI financiero.
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button asChild className='bg-[#02a8e1] hover:bg-[#0288b1]'>
                    <Link href='/dashboard/ventas'>Registrar venta</Link>
                  </Button>
                  <Button asChild variant='outline'>
                    <Link href='/dashboard/compras'>Registrar compra</Link>
                  </Button>
                  <Button asChild variant='outline'>
                    <Link href='/dashboard/productos'>Ver productos</Link>
                  </Button>
                </div>
              </div>
            </section>

            <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <DashboardMetric
                title='Productos activos'
                value={loading ? '...' : String(metrics.productosActivos)}
                description='Productos disponibles para venta o control de stock.'
                icon={Package}
              />
              <DashboardMetric
                title='Stock crítico'
                value={loading ? '...' : String(metrics.productosCriticos.length)}
                description='Productos en mínimo operativo o sin stock.'
                icon={AlertTriangle}
              />
              <DashboardMetric
                title='Inventario estimado'
                value={loading ? '...' : formatCurrencyARS(metrics.valorInventario)}
                description='Valor de venta estimado según precio y stock actual.'
                icon={Boxes}
              />
              <DashboardMetric
                title='Ventas registradas'
                value={loading ? '...' : formatCurrencyARS(metrics.ventasTotal)}
                description='Total vendido sin ventas anuladas.'
                icon={BarChart3}
              />
            </section>

            <section className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
              <ActionCard
                title='Productos y stock'
                description='Alta, edición, activación/desactivación y control de stock con alertas de reposición operativa.'
                href='/dashboard/productos'
                icon={Package}
              />
              <ActionCard
                title='Ventas y tickets'
                description='Ventas a socios o consumidores finales. La emisión de ticket formal queda preparada para la siguiente etapa.'
                href='/dashboard/ventas'
                icon={ReceiptText}
              />
              <ActionCard
                title='Proveedores'
                description='Base de proveedores para compras, reposición de stock y trazabilidad comercial.'
                href='/dashboard/proveedores'
                icon={Truck}
              />
              <ActionCard
                title='Compras y reposición'
                description='Registrá compras a proveedores, actualizá stock y mantené trazabilidad de costos.'
                href='/dashboard/compras'
                icon={ShoppingCart}
              />
              <ActionCard
                title='Servicios adicionales'
                description='Servicios parametrizables como masajes, cama solar o sesiones especiales para socios y no socios.'
                href='/dashboard/servicios'
                icon={Store}
              />
              <ActionCard
                title='Ajustes y recuento físico'
                description='Próxima etapa: comparar stock real contra stock del sistema, registrar diferencias y auditar motivos.'
                icon={ClipboardList}
                disabled
              />
              <ActionCard
                title='Devoluciones y mermas'
                description='Próxima etapa: devolución de productos vendidos, reintegro a stock o registro como merma/no apto.'
                icon={RefreshCcw}
                disabled
              />
            </section>

            {metrics.productosCriticos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <AlertTriangle className='h-5 w-5 text-amber-600' />
                    Productos que requieren reposición
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
                    {metrics.productosCriticos.slice(0, 9).map((producto) => (
                      <div
                        key={producto.id}
                        className='rounded-xl border bg-amber-50/60 p-4 text-sm'
                      >
                        <p className='font-semibold'>{producto.nombre}</p>
                        <p className='text-muted-foreground'>
                          Stock actual: {producto.stock} · {getProductoStockEstadoLabel(producto)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <ShoppingCart className='h-5 w-5 text-sky-600' />
                  Próximas integraciones financieras
                </CardTitle>
              </CardHeader>
              <CardContent className='grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-2'>
                <p>
                  Las ventas del kiosco, los servicios adicionales y las cuotas deberán alimentar los ingresos del gimnasio.
                </p>
                <p>
                  Las compras, proveedores, gastos generales, sueldos, mantenimiento y equipamiento alimentarán egresos y BI mensual.
                </p>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
