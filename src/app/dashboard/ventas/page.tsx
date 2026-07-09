'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileSpreadsheet, FileText, Plus, Search, Store } from 'lucide-react';
import { deleteVenta, getAllVentas } from '@/services/ventaService';
import VentaModal from '@/components/modal/VentaModal';
import VentaViewModal from '@/components/modal/VentaViewModal';
import VentaTable from '@/components/tables/VentaTable';
import { ResponseVenta, Venta } from '@/interfaces/venta.interface';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { downloadCommercialReportPdf } from '@/utils/commercialReportPdf';
import { formatFrontendDate } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

const VENTAS_PAGE_SIZE = 10;

type VentaFilter = 'todas' | 'socio' | 'consumidor_final' | 'visitante' | 'anuladas';

function getVentaClienteLabel(venta: Venta) {
  if (venta.socio?.nombre_completo) return venta.socio.nombre_completo;
  if (venta.cliente_nombre) return venta.cliente_nombre;
  if (venta.cliente_tipo === 'visitante') return 'Visitante';
  return 'Consumidor Final';
}

function getVentaItemsLabel(venta: Venta) {
  const detalles = venta.venta_detalle ?? venta.detalles ?? [];
  if (!detalles.length) return 'Sin detalle';

  return detalles
    .map((detalle) => {
      const nombre =
        detalle.item_tipo === 'servicio'
          ? detalle.servicio?.nombre ?? 'Servicio'
          : detalle.producto?.nombre ?? 'Producto';
      return `${detalle.cantidad} x ${nombre}`;
    })
    .join(' | ');
}

function isDateWithinRange(value: string | null | undefined, from: string, to: string) {
  const normalized = String(value ?? '').slice(0, 10);
  if (!normalized) return false;
  if (from && normalized < from) return false;
  if (to && normalized > to) return false;
  return true;
}

function getDateRangeLabel(
  from: string,
  to: string,
  c: (text: string) => string,
) {
  if (from && to) return `${c('Período')}: ${formatFrontendDate(from)} ${c('a')} ${formatFrontendDate(to)}`;
  if (from) return `${c('Desde')}: ${formatFrontendDate(from)}`;
  if (to) return `${c('Hasta')}: ${formatFrontendDate(to)}`;
  return c('Período: todos');
}

const VENTA_FILTER_LABELS: Record<VentaFilter, string> = {
  todas: 'Todas',
  socio: 'Socios',
  consumidor_final: 'Consumidor final',
  visitante: 'Visitantes',
  anuladas: 'Anuladas',
};

export default function VentasPage() {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  const { user, isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [ventas, setVentas] = useState<ResponseVenta[]>([]);
  const [filteredVentas, setFilteredVentas] = useState<ResponseVenta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ventaFilter, setVentaFilter] = useState<VentaFilter>('todas');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<ResponseVenta | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [ventaVer, setVentaVer] = useState<ResponseVenta | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadVentas = async () => {
    setLoading(true);
    try {
      if (!user) {
        setVentas([]);
        setFilteredVentas([]);
        return;
      }

      const data = await getAllVentas(user as any);
      setVentas(data ?? []);
      setFilteredVentas(data ?? []);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar ventas');
      setVentas([]);
      setFilteredVentas([]);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const activas = filteredVentas.filter((venta) => venta.activo !== false && venta.estado !== 'anulada');
    const anuladas = filteredVentas.filter((venta) => venta.activo === false || venta.estado === 'anulada');
    const totalVendido = activas.reduce((acc, venta) => acc + Number(venta.total ?? 0), 0);
    const itemsVendidos = activas.reduce(
      (acc, venta) =>
        acc +
        (venta.venta_detalle ?? venta.detalles ?? []).reduce(
          (sub, detalle) => sub + Number(detalle.cantidad ?? 0),
          0
        ),
      0
    );

    return {
      activas: activas.length,
      anuladas: anuladas.length,
      totalVendido,
      itemsVendidos,
    };
  }, [filteredVentas]);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ventas');

    worksheet.columns = [
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Tipo cliente', key: 'cliente_tipo', width: 18 },
      { header: 'Documento', key: 'cliente_documento', width: 18 },
      { header: 'Items', key: 'items', width: 60 },
      { header: 'Método de pago', key: 'metodo_pago', width: 18 },
      { header: 'Estado', key: 'estado', width: 14 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Fecha', key: 'fecha', width: 16 },
      { header: 'Comprobante', key: 'comprobante', width: 24 },
    ];

    filteredVentas.forEach((venta) => {
      worksheet.addRow({
        cliente: getVentaClienteLabel(venta),
        cliente_tipo: venta.cliente_tipo ?? 'consumidor_final',
        cliente_documento: venta.cliente_documento ?? '',
        items: getVentaItemsLabel(venta),
        metodo_pago: venta.metodo_pago ?? 'efectivo',
        estado: venta.estado ?? (venta.activo === false ? 'anulada' : 'pagada'),
        total: venta.total,
        fecha: venta.fecha,
        comprobante: venta.comprobante_codigo ?? '',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildTimestampedDownloadFileName('listado-ventas-kiosco', 'xlsx');
    a.click();
    window.URL.revokeObjectURL(url);
  };


  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: 'Listado de Ventas',
        subtitle: 'Ventas de kiosco a socios, visitantes y consumidores finales.',
        fileName: 'listado-ventas-kiosco',
        rows: filteredVentas,
        metrics: [
          { label: 'Ventas activas', value: metrics.activas },
          { label: 'Total vendido', value: formatCurrencyARS(metrics.totalVendido) },
          { label: 'Ítems vendidos', value: metrics.itemsVendidos },
          { label: 'Anuladas', value: metrics.anuladas },
        ],
        filtersLabel: `${c('Filtro')}: ${c(VENTA_FILTER_LABELS[ventaFilter])} · ${getDateRangeLabel(dateFrom, dateTo, c)}${searchTerm.trim() ? ` · ${c('Búsqueda')}: ${searchTerm.trim()}` : ''}`,
        columns: [
          { header: 'Cliente', width: 34, getValue: (venta) => getVentaClienteLabel(venta) },
          { header: 'Tipo', width: 20, getValue: (venta) => venta.cliente_tipo ?? 'consumidor_final' },
          { header: 'Detalle', width: 72, getValue: (venta) => getVentaItemsLabel(venta) },
          { header: 'Método', width: 20, getValue: (venta) => venta.metodo_pago ?? 'efectivo' },
          { header: 'Total', width: 22, getValue: (venta) => formatCurrencyARS(venta.total), align: 'right' },
          { header: 'Fecha', width: 18, getValue: (venta) => formatFrontendDate(venta.fecha) },
          { header: 'Estado', width: 18, getValue: (venta) => venta.estado ?? (venta.activo === false ? 'anulada' : 'pagada') },
        ],
      });
    } catch {
      toast.error('No se pudo generar el PDF de ventas');
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadVentas();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    const lowercaseSearch = searchTerm.toLowerCase().trim();

    const filtered = ventas.filter((venta) => {
      const estado = venta.estado ?? (venta.activo === false ? 'anulada' : 'pagada');

      if (ventaFilter === 'anuladas' && estado !== 'anulada') return false;
      if (ventaFilter !== 'todas' && ventaFilter !== 'anuladas') {
        if ((venta.cliente_tipo ?? 'consumidor_final') !== ventaFilter) return false;
        if (estado === 'anulada') return false;
      }
      if (ventaFilter === 'todas' && estado === 'anulada') return false;
      if (!isDateWithinRange(venta.fecha, dateFrom, dateTo)) return false;

      if (!lowercaseSearch) return true;

      return (
        getVentaClienteLabel(venta).toLowerCase().includes(lowercaseSearch) ||
        (venta.cliente_documento ?? '').toLowerCase().includes(lowercaseSearch) ||
        (venta.metodo_pago ?? '').toLowerCase().includes(lowercaseSearch) ||
        venta.fecha.toLowerCase().includes(lowercaseSearch) ||
        getVentaItemsLabel(venta).toLowerCase().includes(lowercaseSearch)
      );
    });

    setFilteredVentas(filtered);
  }, [searchTerm, ventaFilter, dateFrom, dateTo, ventas]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, ventaFilter, dateFrom, dateTo]);

  const totalVentas = filteredVentas.length;
  const totalPages = Math.max(1, Math.ceil(totalVentas / VENTAS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedVentas = filteredVentas.slice(
    (safeCurrentPage - 1) * VENTAS_PAGE_SIZE,
    safeCurrentPage * VENTAS_PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
          <AppHeader title={c('Ventas')} />
          <main className='flex-1 space-y-6 p-6'>
            <section className='grid grid-cols-1 gap-4 md:grid-cols-4'>
              <Card>
                <CardContent className='p-5'>
                  <p className='text-sm text-muted-foreground'>{c('Ventas activas')}</p>
                  <p className='text-2xl font-bold'>{metrics.activas}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-5'>
                  <p className='text-sm text-muted-foreground'>{c('Total vendido')}</p>
                  <p className='text-2xl font-bold'>{formatCurrencyARS(metrics.totalVendido)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-5'>
                  <p className='text-sm text-muted-foreground'>{c('Ítems vendidos')}</p>
                  <p className='text-2xl font-bold'>{metrics.itemsVendidos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-5'>
                  <p className='text-sm text-muted-foreground'>{c('Anuladas')}</p>
                  <p className='text-2xl font-bold text-red-700'>{metrics.anuladas}</p>
                </CardContent>
              </Card>
            </section>

            <Card className='w-full'>
              <CardHeader className='flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap'>
                <div className='space-y-1'>
                  <h2 className='text-xl font-bold'>{c('Ventas de kiosco')}</h2>
                  <p className='text-sm text-muted-foreground'>
                    {c('Registro de ventas a socios, visitantes y consumidores finales con detalle real de ítems.')}
                  </p>
                </div>
                <div className='flex w-full flex-wrap items-center gap-2 md:w-auto'>
                  <Button asChild variant='outline' className='flex items-center gap-2'>
                    <Link href='/dashboard/comercial'>
                      <Store className='h-4 w-4' />
                      <span className='hidden sm:inline'>{c('Comercial')}</span>
                    </Link>
                  </Button>
                  <div className='relative flex-grow md:flex-grow-0'>
                    <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      type='search'
                      placeholder={c('Buscar cliente, producto, servicio, fecha...')}
                      className='w-full pl-8 sm:w-[300px] md:w-[240px] lg:w-[340px]'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant='outline'
                    onClick={handleDownloadPdf}
                    className='flex items-center gap-2 border-[#02a8e1] bg-white text-[#02a8e1] hover:bg-[#e6f7fd]'
                  >
                    <FileText className='h-4 w-4' />
                    <span className='hidden sm:inline'>PDF</span>
                  </Button>
                  <Button
                    variant='outline'
                    onClick={handleExportExcel}
                    className='flex items-center gap-2 border-[#02a8e1] bg-white text-[#02a8e1] hover:bg-[#e6f7fd]'
                  >
                    <FileSpreadsheet className='h-4 w-4' />
                    <span className='hidden sm:inline'>{c('Exportar')}</span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className='bg-[#02a8e1] hover:bg-[#0288b1]'
                  >
                    <Plus className='h-4 w-4' />
                    <span className='hidden sm:inline'>{c('Nueva Venta')}</span>
                    <span className='sm:hidden'>{c('Nueva')}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-4 p-4'>
                <div className='flex flex-wrap gap-2'>
                  {[
                    ['todas', c('Todas')],
                    ['socio', c('Socios')],
                    ['consumidor_final', c('Consumidor final')],
                    ['visitante', c('Visitantes')],
                    ['anuladas', c('Anuladas')],
                  ].map(([value, label]) => (
                    <Button
                      key={value}
                      type='button'
                      size='sm'
                      variant={ventaFilter === value ? 'default' : 'outline'}
                      onClick={() => setVentaFilter(value as VentaFilter)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <div className='grid gap-3 rounded-xl border bg-slate-50/60 p-3 md:grid-cols-[1fr_1fr_auto] md:items-end'>
                  <label className='space-y-1 text-sm font-medium'>
                    <span>{c('Desde')}</span>
                    <Input type='date' value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                  </label>
                  <label className='space-y-1 text-sm font-medium'>
                    <span>{c('Hasta')}</span>
                    <Input type='date' value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                  </label>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    disabled={!dateFrom && !dateTo}
                  >
                    {c('Limpiar fechas')}
                  </Button>
                </div>
                <div className='overflow-x-auto'>
                  <VentaTable
                    ventas={paginatedVentas}
                    loading={loading}
                    onEdit={(venta) => {
                      setSelectedVenta(venta as ResponseVenta);
                      setOpenModal(true);
                    }}
                    onView={(venta) => {
                      setVentaVer(venta as ResponseVenta);
                      setOpenModalVer(true);
                    }}
                    onDelete={async (venta) => {
                      const confirmar = window.confirm(
                        c('¿Querés anular esta venta? No se eliminará el histórico.')
                      );
                      if (!confirmar) return;

                      try {
                        await deleteVenta(user as any, venta.id);
                        toast.success(c('Venta anulada correctamente'));
                        await loadVentas();
                      } catch (err: any) {
                        toast.error(err.message || c('Error al anular venta'));
                      }
                    }}
                  />
                </div>
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalVentas}
                  pageSize={VENTAS_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel={c("ventas")}
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <VentaModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedVenta(null);
        }}
        onCreated={loadVentas}
        venta={selectedVenta}
      />

      <VentaViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setVentaVer(null);
        }}
        venta={ventaVer}
      />
    </SidebarProvider>
  );
}
