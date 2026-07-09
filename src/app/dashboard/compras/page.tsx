'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import { toast } from 'sonner';
import { FileSpreadsheet, FileText, Plus, Search, ShoppingBag, Store } from 'lucide-react';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { useAuthStore } from '@/stores/authStore';
import { Compra } from '@/interfaces/compra.interface';
import { Producto } from '@/interfaces/producto.interface';
import { Proveedor } from '@/interfaces/proveedor.interface';
import { anularCompra, getAllCompras } from '@/services/compraService';
import { getAllProductos } from '@/services/productoService';
import { getAllProveedores } from '@/services/proveedorService';
import CompraModal from '@/components/modal/CompraModal';
import CompraViewModal from '@/components/modal/CompraViewModal';
import CompraTable from '@/components/tables/CompraTable';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { downloadCommercialReportPdf } from '@/utils/commercialReportPdf';
import { formatFrontendDate } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

const COMPRAS_PAGE_SIZE = 10;
type CompraFilter = 'todas' | 'pendiente' | 'pagada' | 'anulada';

function getItemsLabel(compra: Compra) {
  const detalles = compra.compra_detalle ?? compra.detalles ?? [];
  if (!detalles.length) return 'Sin detalle';
  return detalles.map((detalle) => `${detalle.cantidad} x ${detalle.producto?.nombre ?? 'Producto'}`).join(' | ');
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

const COMPRA_FILTER_LABELS: Record<CompraFilter, string> = {
  todas: 'Todas',
  pendiente: 'Pendientes',
  pagada: 'Pagadas',
  anulada: 'Anuladas',
};

export default function ComprasPage() {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<CompraFilter>('todas');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [compraVer, setCompraVer] = useState<Compra | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, isInitialized, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comprasData, productosData, proveedoresData] = await Promise.all([
        getAllCompras(),
        getAllProductos(),
        getAllProveedores(),
      ]);
      setCompras(comprasData ?? []);
      setProductos(productosData ?? []);
      setProveedores(proveedoresData ?? []);
    } catch (error: any) {
      toast.error(error.message || c('Error al cargar compras'));
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) loadData();
  }, [isAuthenticated, isInitialized]);

  const filteredCompras = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return compras.filter((compra) => {
      if (filter !== 'todas' && compra.estado !== filter) return false;
      if (!isDateWithinRange(compra.fecha, dateFrom, dateTo)) return false;
      if (!search) return true;
      return (
        (compra.proveedor?.nombre ?? '').toLowerCase().includes(search) ||
        (compra.proveedor?.razon_social ?? '').toLowerCase().includes(search) ||
        (compra.proveedor?.identificacion_fiscal ?? '').toLowerCase().includes(search) ||
        (compra.numero_comprobante ?? '').toLowerCase().includes(search) ||
        compra.fecha.toLowerCase().includes(search) ||
        getItemsLabel(compra).toLowerCase().includes(search)
      );
    });
  }, [compras, filter, dateFrom, dateTo, searchTerm]);

  useEffect(() => setCurrentPage(1), [searchTerm, filter, dateFrom, dateTo]);

  const metrics = useMemo(() => {
    const activas = filteredCompras.filter((compra) => compra.estado !== 'anulada' && compra.activo !== false);
    const anuladas = filteredCompras.filter((compra) => compra.estado === 'anulada' || compra.activo === false);
    return {
      activas: activas.length,
      pendientes: filteredCompras.filter((compra) => compra.estado === 'pendiente').length,
      anuladas: anuladas.length,
      totalComprado: activas.reduce((acc, compra) => acc + Number(compra.total ?? 0), 0),
    };
  }, [filteredCompras]);

  const totalPages = Math.max(1, Math.ceil(filteredCompras.length / COMPRAS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCompras = filteredCompras.slice(
    (safeCurrentPage - 1) * COMPRAS_PAGE_SIZE,
    safeCurrentPage * COMPRAS_PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(c('Compras'));
    worksheet.columns = [
      { header: c('Proveedor'), key: 'proveedor', width: 30 },
      { header: c('Fecha'), key: 'fecha', width: 16 },
      { header: c('Comprobante'), key: 'comprobante', width: 24 },
      { header: c('Estado'), key: 'estado', width: 14 },
      { header: c('Medio de pago'), key: 'medio_pago', width: 18 },
      { header: c('Productos'), key: 'productos', width: 60 },
      { header: c('Total'), key: 'total', width: 15 },
    ];
    filteredCompras.forEach((compra) => {
      worksheet.addRow({
        proveedor: compra.proveedor?.nombre ?? c('Proveedor no encontrado'),
        fecha: formatFrontendDate(compra.fecha),
        comprobante: compra.numero_comprobante ?? '',
        estado: c(compra.estado),
        medio_pago: c(compra.medio_pago),
        productos: getItemsLabel(compra),
        total: compra.total,
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildTimestampedDownloadFileName('listado-compras-proveedores', 'xlsx');
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: c('Listado de Compras'),
        subtitle: c('Compras a proveedores, reposición de stock y trazabilidad comercial.'),
        fileName: 'listado-compras-gym-master',
        rows: filteredCompras,
        metrics: [
          { label: c('Compras activas'), value: metrics.activas },
          { label: c('Pendientes'), value: metrics.pendientes },
          { label: c('Anuladas'), value: metrics.anuladas },
          { label: c('Total comprado'), value: formatCurrencyARS(metrics.totalComprado) },
        ],
        filtersLabel: `${c('Filtro')}: ${c(COMPRA_FILTER_LABELS[filter])} · ${getDateRangeLabel(dateFrom, dateTo, c)}${searchTerm.trim() ? ` · ${c('Búsqueda')}: ${searchTerm.trim()}` : ''}`,
        columns: [
          { header: c('Proveedor'), width: 34, getValue: (compra) => compra.proveedor?.nombre ?? '-' },
          { header: c('Fecha'), width: 18, getValue: (compra) => formatFrontendDate(compra.fecha) },
          { header: c('Comprobante'), width: 24, getValue: (compra) => compra.numero_comprobante ?? '-' },
          { header: c('Estado'), width: 18, getValue: (compra) => c(compra.estado) },
          { header: c('Productos'), width: 70, getValue: (compra) => getItemsLabel(compra) },
          { header: c('Total'), width: 22, getValue: (compra) => formatCurrencyARS(compra.total), align: 'right' },
        ],
      });
    } catch {
      toast.error(c('No se pudo generar el PDF de compras'));
    }
  };

  if (!isInitialized) return <div>{c('Cargando...')}</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c("Compras")} />
          <main className="flex-1 space-y-6 p-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{c("Compras activas")}</p><p className="text-2xl font-bold">{metrics.activas}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{c("Pendientes")}</p><p className="text-2xl font-bold text-amber-700">{metrics.pendientes}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{c("Anuladas")}</p><p className="text-2xl font-bold text-red-700">{metrics.anuladas}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{c("Total comprado")}</p><p className="text-2xl font-bold">{formatCurrencyARS(metrics.totalComprado)}</p></CardContent></Card>
            </section>

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">{c("Compras a proveedores")}</h2>
                  <p className="text-sm text-muted-foreground">{c("Registrá compras, actualizá stock y mantené trazabilidad por proveedor.")}</p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                  <Button asChild variant="outline" className="flex items-center gap-2">
                    <Link href="/dashboard/comercial"><Store className="h-4 w-4" /><span className="hidden sm:inline">{c("Comercial")}</span></Link>
                  </Button>
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={c("Buscar proveedor, comprobante, producto...")}
                      className="w-full pl-8 sm:w-[320px]"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={handleDownloadPdf} className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"><FileText className="h-4 w-4" />{c("Descargar PDF")}</Button>
                  <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"><FileSpreadsheet className="h-4 w-4" />{c("Exportar")}</Button>
                  <Button onClick={() => setOpenModal(true)} className="bg-[#02a8e1] hover:bg-[#0288b1]"><Plus className="mr-2 h-4 w-4" />{c("Nueva compra")}</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    ['todas', 'Todas'],
                    ['pagada', 'Pagadas'],
                    ['pendiente', 'Pendientes'],
                    ['anulada', 'Anuladas'],
                  ].map(([value, label]) => (
                    <Button key={value} type="button" size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value as CompraFilter)}>{c(label)}</Button>
                  ))}
                </div>
                <div className="grid gap-3 rounded-xl border bg-slate-50/60 p-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <label className="space-y-1 text-sm font-medium">
                    <span>{c("Desde")}</span>
                    <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    <span>{c("Hasta")}</span>
                    <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    disabled={!dateFrom && !dateTo}
                  >
                    {c("Limpiar fechas")}
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <CompraTable
                    compras={paginatedCompras}
                    loading={loading}
                    onView={(compra) => { setCompraVer(compra); setOpenViewModal(true); }}
                    onCancel={async (compra) => {
                      const ok = window.confirm(c("¿Querés anular esta compra? Se descontará del stock la cantidad ingresada por la compra."));
                      if (!ok) return;
                      try {
                        await anularCompra(compra.id);
                        toast.success(c('Compra anulada y stock revertido'));
                        await loadData();
                      } catch (error: any) {
                        toast.error(error.message || c('No se pudo anular la compra'));
                      }
                    }}
                  />
                </div>
                <PaginationControls currentPage={safeCurrentPage} totalItems={filteredCompras.length} pageSize={COMPRAS_PAGE_SIZE} onPageChange={setCurrentPage} itemLabel="compras" />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
      <CompraModal open={openModal} onClose={() => setOpenModal(false)} onCreated={loadData} proveedores={proveedores} productos={productos} />
      <CompraViewModal open={openViewModal} onClose={() => { setOpenViewModal(false); setCompraVer(null); }} compra={compraVer} />
    </SidebarProvider>
  );
}
