"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, FileSpreadsheet, FileText, Package, Search, Store } from "lucide-react";
import { getAllProductos, deleteProducto } from "@/services/productoService";
import { getAllProveedores } from "@/services/proveedorService";
import ProductoModal from "@/components/modal/ProductoModal";
import ProductoViewModal from "@/components/modal/ProductoViewModal";
import ProductoStockMovimientoModal from "@/components/modal/ProductoStockMovimientoModal";
import ProductoTable from "@/components/tables/ProductoTable";
import { Producto } from "@/interfaces/producto.interface";
import { Proveedor } from "@/interfaces/proveedor.interface";
import { CatalogoParametrizableItem } from "@/interfaces/parametrizacion.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import { useCatalogoParametrizable } from "@/hooks/useCatalogosParametrizables";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { PaginationControls } from "@/components/ui/PaginationControls";

import {
  calcularValorInventario,
  formatCurrencyARS,
  getProductoStockEstado,
  isProductoStockCritico,
} from "@/lib/comercial/productos";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

const PRODUCTOS_PAGE_SIZE = 10;

type StockFilter = "todos" | "activos" | "critico" | "sin_stock" | "inactivos";

function productoExportTx(locale: string, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function normalizeProductoExportText(value?: string | null) {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s/-]+/g, '_');
}

const PRODUCTO_EXPORT_TEXTS: Record<string, string> = {
  todos: 'All',
  todas: 'All',
  activos: 'Active',
  activo: 'Active',
  active: 'Active',
  inactivos: 'Inactive',
  inactivo: 'Inactive',
  inactive: 'Inactive',
  discontinuados: 'Discontinued',
  discontinuado: 'Discontinued',
  critico: 'Critical stock',
  stock_critico: 'Critical stock',
  critical_stock: 'Critical stock',
  sin_stock: 'Out of stock',
  out_of_stock: 'Out of stock',
  stock_ok: 'Stock OK',
  ok: 'OK',
  bajo_stock: 'Low stock',
  low_stock: 'Low stock',
  no: 'No',
  si: 'Yes',
  yes: 'Yes',
  no_category: 'No category',
  sin_categoria: 'No category',
  categoria_no_encontrada: 'Category not found',
  sin_proveedor_asignado: 'No supplier assigned',
  proveedor_no_encontrado: 'Supplier not found',
  bebidas: 'Drinks',
  bebida: 'Drink',
  suplementos: 'Supplements',
  suplemento: 'Supplement',
  accesorios: 'Accessories',
  accesorio: 'Accessory',
  higiene: 'Hygiene',
  indumentaria: 'Apparel',
  snacks: 'Snacks',
  servicios: 'Services',
  otros: 'Other',
  otro: 'Other',
  productos_no_clasificados: 'Unclassified products',
  descripcion_del_producto_1: 'Product 1 description',
  descripcion_del_producto_2: 'Product 2 description',
  descripcion_del_producto_3: 'Product 3 description',
  descripcion_del_producto_4: 'Product 4 description',
  descripcion_del_producto_5: 'Product 5 description',
  energizante: 'Energy drink',
  bebida_isotonica_post_entrenamiento: 'Post-workout isotonic drink',
  bebida_isotonica_post_entrenamiento_: 'Post-workout isotonic drink.',
  barra_proteica_sabor_chocolate: 'Chocolate-flavored protein bar',
  barra_proteica_sabor_chocolate_: 'Chocolate-flavored protein bar.',
  creatina_monohidrato_micronizada: 'Micronized creatine monohydrate',
  creatina_monohidrato_micronizada_: 'Micronized creatine monohydrate.',
  proteina_de_suero_sabor_vainilla: 'Vanilla-flavored whey protein',
  proteina_de_suero_sabor_vainilla_: 'Vanilla-flavored whey protein.',
  shaker_para_suplementos: 'Supplement shaker',
  shaker_para_suplementos_: 'Supplement shaker.',
  guantes_basicos_para_entrenamiento: 'Basic training gloves',
  guantes_basicos_para_entrenamiento_: 'Basic training gloves.',
  toalla_deportiva_mediana: 'Medium sports towel',
  toalla_deportiva_mediana_: 'Medium sports towel.',
  agua_mineral_para_venta_rapida_en_kiosco: 'Mineral water for quick kiosk sales',
  agua_mineral_para_venta_rapida_en_kiosco_: 'Mineral water for quick kiosk sales.',
  sabor_neutro_300_grms: 'Neutral flavor 300 g',
};

function translateProductoExportText(locale: string, value?: string | null, fallback = '') {
  const original = String(value ?? fallback ?? '').trim();
  if (!original) return '';
  if (locale !== 'en') return original;

  const normalized = normalizeProductoExportText(original);
  const genericProductMatch = normalized.match(/^producto_(\d+)$/);
  if (genericProductMatch) return 'Product ' + genericProductMatch[1];

  const genericDescriptionMatch = normalized.match(/^descripcion_del_producto_(\d+)$/);
  if (genericDescriptionMatch) return 'Product ' + genericDescriptionMatch[1] + ' description';

  return PRODUCTO_EXPORT_TEXTS[normalized] ?? original;
}

function stockFilterExportLabel(locale: string, filter: StockFilter) {
  if (filter === 'todos') return productoExportTx(locale, 'Todos', 'All');
  if (filter === 'activos') return productoExportTx(locale, 'Activos', 'Active');
  if (filter === 'critico') return productoExportTx(locale, 'Stock crítico', 'Critical stock');
  if (filter === 'sin_stock') return productoExportTx(locale, 'Sin stock', 'Out of stock');
  if (filter === 'inactivos') return productoExportTx(locale, 'Inactivos / discontinuados', 'Inactive / discontinued');
  return translateProductoExportText(locale, filter);
}

function getProductoExportFiltersLabel(locale: string, stockFilter: StockFilter, searchTerm: string) {
  const search = searchTerm.trim();
  return `${productoExportTx(locale, 'Filtro', 'Filter')}: ${stockFilterExportLabel(locale, stockFilter)}${search ? ` · ${productoExportTx(locale, 'Búsqueda', 'Search')}: ${search}` : ''}`;
}

const fallbackCategoriasProducto: CatalogoParametrizableItem[] = [
  {
    id: "fallback-otros",
    codigo: "otros",
    nombre: "Otros",
    descripcion: "Productos no clasificados.",
    activo: true,
    orden: 90,
  },
];

export default function ProductoPage() {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  const { isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(
    null
  );
  const [openModalVer, setOpenModalVer] = useState(false);
  const [productoVer, setProductoVer] = useState<Producto | null>(null);
  const [openStockModal, setOpenStockModal] = useState(false);
  const [productoStock, setProductoStock] = useState<Producto | null>(null);
  const { items: categoriasProducto } = useCatalogoParametrizable(
    "categoria_producto",
    fallbackCategoriasProducto
  );

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadProductos = async () => {
    setLoading(true);
    try {
      const [productosData, proveedoresData] = await Promise.all([
        getAllProductos(),
        getAllProveedores().catch(() => [] as Proveedor[]),
      ]);

      setProductos(productosData ?? []);
      setProveedores(proveedoresData ?? []);
    } finally {
      setLoading(false);
    }
  };

  const proveedorById = useMemo(() => {
    return new Map(proveedores.map((proveedor) => [proveedor.id, proveedor]));
  }, [proveedores]);

  const getProveedorNombre = (proveedorId?: string | null) => {
    if (!proveedorId) return c("Sin proveedor asignado");

    const proveedor = proveedorById.get(proveedorId);
    return proveedor?.nombre || c("Proveedor no encontrado");
  };

  const categoriaById = useMemo(() => {
    return new Map(categoriasProducto.map((categoria) => [categoria.id, categoria]));
  }, [categoriasProducto]);

  const getCategoriaNombre = (categoriaId?: string | null) => {
    if (!categoriaId) return c("Sin categoría");

    const categoria = categoriaById.get(categoriaId);
    return categoria?.nombre || c("Categoría no encontrada");
  };

  const metrics = useMemo(() => {
    const activos = productos.filter((p) => p.activo !== false);
    const criticos = activos.filter(isProductoStockCritico);
    const sinStock = activos.filter((p) => getProductoStockEstado(p) === "sin_stock");

    return {
      activos: activos.length,
      inactivos: productos.length - activos.length,
      criticos: criticos.length,
      sinStock: sinStock.length,
      valorInventario: calcularValorInventario(activos),
    };
  }, [productos]);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(productoExportTx(locale, 'Productos', 'Products'));

    worksheet.columns = [
      { header: productoExportTx(locale, 'Producto', 'Product'), key: 'nombre', width: 30 },
      { header: productoExportTx(locale, 'Descripción', 'Description'), key: 'descripcion', width: 38 },
      { header: productoExportTx(locale, 'Categoría', 'Category'), key: 'categoria', width: 24 },
      { header: productoExportTx(locale, 'Proveedor', 'Supplier'), key: 'proveedor', width: 30 },
      { header: productoExportTx(locale, 'Precio', 'Price'), key: 'precio', width: 15 },
      { header: productoExportTx(locale, 'Costo', 'Cost'), key: 'costo', width: 15 },
      { header: productoExportTx(locale, 'Margen', 'Margin'), key: 'margen', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: productoExportTx(locale, 'Stock mínimo', 'Minimum stock'), key: 'stock_minimo', width: 16 },
      { header: productoExportTx(locale, 'Estado', 'Status'), key: 'estado', width: 18 },
      { header: productoExportTx(locale, 'Activo', 'Active'), key: 'activo', width: 12 },
    ];

    filteredProductos.forEach((p) => {
      worksheet.addRow({
        nombre: translateProductoExportText(locale, p.nombre),
        descripcion: translateProductoExportText(locale, p.descripcion),
        categoria: translateProductoExportText(locale, getCategoriaNombre(p.id_categoria_producto)),
        proveedor: translateProductoExportText(locale, getProveedorNombre(p.proveedor_id)),
        precio: p.precio,
        costo: p.costo ?? 0,
        margen: Number(p.precio ?? 0) - Number(p.costo ?? 0),
        stock: p.stock,
        stock_minimo: p.stock_minimo ?? 5,
        estado: translateProductoExportText(locale, getProductoStockEstado(p).replace(/_/g, ' ')),
        activo: p.activo === false ? productoExportTx(locale, 'No', 'No') : productoExportTx(locale, 'Sí', 'Yes'),
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildTimestampedDownloadFileName(
      productoExportTx(locale, 'listado-productos', 'products-list'),
      'xlsx',
    );
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: productoExportTx(locale, 'Listado de Productos', 'Product list'),
        subtitle: productoExportTx(
          locale,
          'Control operativo de productos, stock, proveedores y estado comercial.',
          'Operational control of products, stock, suppliers and commercial status.',
        ),
        fileName: productoExportTx(locale, 'listado-productos-gym-master', 'gym-master-products-list'),
        locale,
        footerText: productoExportTx(
          locale,
          'Documento generado por Gym Master.',
          'Document generated by Gym Master.',
        ),
        labels: {
          generated: productoExportTx(locale, 'Generado', 'Generated'),
          page: productoExportTx(locale, 'Página', 'Page'),
          of: productoExportTx(locale, 'de', 'of'),
          detail: productoExportTx(locale, 'Detalle', 'Details'),
          records: productoExportTx(locale, 'registros', 'records'),
          empty: productoExportTx(
            locale,
            'No hay registros para el filtro seleccionado.',
            'No records found for the selected filter.',
          ),
        },
        rows: filteredProductos,
        metrics: [
          { label: productoExportTx(locale, 'Productos activos', 'Active products'), value: metrics.activos },
          { label: productoExportTx(locale, 'Stock crítico', 'Critical stock'), value: metrics.criticos },
          { label: productoExportTx(locale, 'Sin stock', 'Out of stock'), value: metrics.sinStock },
          { label: productoExportTx(locale, 'Inventario estimado', 'Estimated inventory'), value: formatCurrencyARS(metrics.valorInventario) },
        ],
        filtersLabel: getProductoExportFiltersLabel(locale, stockFilter, searchTerm),
        columns: [
          { header: productoExportTx(locale, 'Producto', 'Product'), width: 30, getValue: (p) => translateProductoExportText(locale, p.nombre) },
          { header: productoExportTx(locale, 'Descripción', 'Description'), width: 34, getValue: (p) => p.descripcion ? translateProductoExportText(locale, p.descripcion) : '-' },
          { header: productoExportTx(locale, 'Categoría', 'Category'), width: 25, getValue: (p) => translateProductoExportText(locale, getCategoriaNombre(p.id_categoria_producto)) },
          { header: productoExportTx(locale, 'Proveedor', 'Supplier'), width: 30, getValue: (p) => translateProductoExportText(locale, getProveedorNombre(p.proveedor_id)) },
          { header: productoExportTx(locale, 'Precio', 'Price'), width: 18, getValue: (p) => formatCurrencyARS(p.precio), align: 'right' },
          { header: productoExportTx(locale, 'Costo', 'Cost'), width: 18, getValue: (p) => formatCurrencyARS(p.costo ?? 0), align: 'right' },
          { header: productoExportTx(locale, 'Margen', 'Margin'), width: 18, getValue: (p) => formatCurrencyARS((p.precio ?? 0) - (p.costo ?? 0)), align: 'right' },
          { header: 'Stock', width: 14, getValue: (p) => p.stock, align: 'right' },
          { header: productoExportTx(locale, 'Stock mínimo', 'Minimum stock'), width: 20, getValue: (p) => p.stock_minimo ?? 5, align: 'right' },
          { header: productoExportTx(locale, 'Estado', 'Status'), width: 22, getValue: (p) => translateProductoExportText(locale, getProductoStockEstado(p).replace(/_/g, ' ')) },
          { header: productoExportTx(locale, 'Activo', 'Active'), width: 16, getValue: (p) => (p.activo === false ? productoExportTx(locale, 'No', 'No') : productoExportTx(locale, 'Sí', 'Yes')) },
        ],
      });
    } catch {
      toast.error(productoExportTx(locale, 'No se pudo generar el PDF de productos', 'Could not generate the products PDF'));
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadProductos();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    const lowercaseSearch = searchTerm.toLowerCase().trim();

    const filtered = productos.filter((p) => {
      const matchesSearch =
        lowercaseSearch.length === 0 ||
        p.nombre.toLowerCase().includes(lowercaseSearch) ||
        (p.descripcion ?? "").toLowerCase().includes(lowercaseSearch) ||
        getProveedorNombre(p.proveedor_id).toLowerCase().includes(lowercaseSearch);

      if (!matchesSearch) return false;

      if (stockFilter === "activos") return p.activo !== false;
      if (stockFilter === "inactivos") return p.activo === false;
      if (stockFilter === "critico") return p.activo !== false && isProductoStockCritico(p);
      if (stockFilter === "sin_stock") return p.activo !== false && getProductoStockEstado(p) === "sin_stock";

      return true;
    });

    setFilteredProductos(filtered);
  }, [searchTerm, stockFilter, productos, proveedorById]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stockFilter]);

  const totalProductos = filteredProductos.length;
  const totalPages = Math.max(1, Math.ceil(totalProductos / PRODUCTOS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProductos = filteredProductos.slice(
    (safeCurrentPage - 1) * PRODUCTOS_PAGE_SIZE,
    safeCurrentPage * PRODUCTOS_PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!isInitialized) {
    return <div>{c('Cargando...')}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c("Productos")} />
          <main className="flex-1 p-6 space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{c("Productos activos")}</p>
                  <p className="text-2xl font-bold">{metrics.activos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{c("Stock crítico")}</p>
                  <p className="text-2xl font-bold text-amber-700">{metrics.criticos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{c("Sin stock")}</p>
                  <p className="text-2xl font-bold text-red-700">{metrics.sinStock}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{c("Inventario estimado")}</p>
                  <p className="text-2xl font-bold">{formatCurrencyARS(metrics.valorInventario)}</p>
                </CardContent>
              </Card>
            </section>

            {metrics.criticos > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>
                  {c("Hay productos con stock crítico. Revisá reposición para evitar quiebres de stock en ventas del kiosco.")}
                </p>
              </div>
            )}

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">{c("Productos del kiosco")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {c("Control operativo de productos, stock y estado comercial.")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <Button asChild variant="outline" className="flex items-center gap-2">
                    <Link href="/dashboard/comercial">
                      <Store className="w-4 h-4" />
                      <span className="hidden sm:inline">{c("Comercial")}</span>
                    </Link>
                  </Button>
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={c("Buscar producto, descripción o proveedor...")}
                      className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">{c("Descargar PDF")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">{c("Exportar")}</span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <Package className="w-4 h-4" />
                    <span className="hidden sm:inline">{c("Añadir Producto")}</span>
                    <span className="sm:hidden">{c("Añadir")}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    ["todos", "Todos"],
                    ["activos", "Activos"],
                    ["critico", "Stock crítico"],
                    ["sin_stock", "Sin stock"],
                    ["inactivos", "Inactivos / discontinuados"],
                  ].map(([value, label]) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={stockFilter === value ? "default" : "outline"}
                      onClick={() => setStockFilter(value as StockFilter)}
                    >
                      {c(label)}
                    </Button>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <ProductoTable
                    productos={paginatedProductos}
                    loading={loading}
                    onEdit={(producto) => {
                      setSelectedProducto(producto as Producto);
                      setOpenModal(true);
                    }}
                    onView={(producto) => {
                      setProductoVer(producto as Producto);
                      setOpenModalVer(true);
                    }}
                    onStockMovement={(producto) => {
                      setProductoStock(producto as Producto);
                      setOpenStockModal(true);
                    }}
                    getProveedorNombre={getProveedorNombre}
                    onDelete={async (producto) => {
                      const confirmar = window.confirm(
                        c("¿Querés desactivar este producto? No se borra el histórico.")
                      );
                      if (!confirmar) return;

                      try {
                        await deleteProducto(producto.id);
                        toast.success(c("Producto desactivado correctamente"));
                        await loadProductos();
                      } catch (err) {
                        toast.error(c("Error al desactivar producto"));
                      }
                    }}
                  />
                </div>
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalProductos}
                  pageSize={PRODUCTOS_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel={c("productos")}
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <ProductoModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedProducto(null);
        }}
        onCreated={loadProductos}
        producto={selectedProducto}
      />

      <ProductoViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setProductoVer(null);
        }}
        producto={productoVer}
        getProveedorNombre={getProveedorNombre}
        getCategoriaNombre={getCategoriaNombre}
      />

      <ProductoStockMovimientoModal
        open={openStockModal}
        onClose={() => {
          setOpenStockModal(false);
          setProductoStock(null);
        }}
        producto={productoStock}
        onSaved={loadProductos}
      />
    </SidebarProvider>
  );
}
