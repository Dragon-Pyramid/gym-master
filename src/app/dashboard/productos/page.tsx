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

const PRODUCTOS_PAGE_SIZE = 10;

type StockFilter = "todos" | "activos" | "critico" | "sin_stock" | "inactivos";

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
    if (!proveedorId) return "Sin proveedor asignado";

    const proveedor = proveedorById.get(proveedorId);
    return proveedor?.nombre || "Proveedor no encontrado";
  };

  const categoriaById = useMemo(() => {
    return new Map(categoriasProducto.map((categoria) => [categoria.id, categoria]));
  }, [categoriasProducto]);

  const getCategoriaNombre = (categoriaId?: string | null) => {
    if (!categoriaId) return "Sin categoría";

    const categoria = categoriaById.get(categoriaId);
    return categoria?.nombre || "Categoría no encontrada";
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
    const worksheet = workbook.addWorksheet("Productos");

    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Descripción", key: "descripcion", width: 30 },
      { header: "Precio", key: "precio", width: 15 },
      { header: "Costo", key: "costo", width: 15 },
      { header: "Margen", key: "margen", width: 15 },
      { header: "Stock", key: "stock", width: 10 },
      { header: "Proveedor", key: "proveedor", width: 30 },
      { header: "Activo", key: "activo", width: 12 },
    ];

    filteredProductos.forEach((p) => {
      worksheet.addRow({
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        costo: p.costo ?? 0,
        margen: Number(p.precio ?? 0) - Number(p.costo ?? 0),
        stock: p.stock,
        proveedor: getProveedorNombre(p.proveedor_id),
        activo: p.activo === false ? "No" : "Sí",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName("listado-productos", "xlsx");
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: "Listado de Productos",
        subtitle: "Control operativo de productos, stock, proveedores y estado comercial.",
        fileName: "listado-productos-gym-master",
        rows: filteredProductos,
        metrics: [
          { label: "Productos activos", value: metrics.activos },
          { label: "Stock crítico", value: metrics.criticos },
          { label: "Sin stock", value: metrics.sinStock },
          { label: "Inventario estimado", value: formatCurrencyARS(metrics.valorInventario) },
        ],
        filtersLabel: `Filtro: ${stockFilter.replace(/_/g, " ")}${searchTerm.trim() ? ` · Búsqueda: ${searchTerm.trim()}` : ""}`,
        columns: [
          { header: "Producto", width: 34, getValue: (p) => p.nombre },
          { header: "Descripción", width: 38, getValue: (p) => p.descripcion || "-" },
          { header: "Categoría", width: 28, getValue: (p) => getCategoriaNombre(p.id_categoria_producto) },
          { header: "Proveedor", width: 34, getValue: (p) => getProveedorNombre(p.proveedor_id) },
          { header: "Precio", width: 20, getValue: (p) => formatCurrencyARS(p.precio), align: "right" },
          { header: "Costo", width: 20, getValue: (p) => formatCurrencyARS(p.costo ?? 0), align: "right" },
          { header: "Margen", width: 20, getValue: (p) => formatCurrencyARS((p.precio ?? 0) - (p.costo ?? 0)), align: "right" },
          { header: "Stock", width: 15, getValue: (p) => p.stock, align: "right" },
          { header: "Stock mínimo", width: 20, getValue: (p) => p.stock_minimo ?? 5, align: "right" },
          { header: "Estado", width: 24, getValue: (p) => getProductoStockEstado(p).replace(/_/g, " ") },
          { header: "Activo", width: 16, getValue: (p) => (p.activo === false ? "No" : "Sí") },
        ],
      });
    } catch {
      toast.error("No se pudo generar el PDF de productos");
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
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Productos" />
          <main className="flex-1 p-6 space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Productos activos</p>
                  <p className="text-2xl font-bold">{metrics.activos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Stock crítico</p>
                  <p className="text-2xl font-bold text-amber-700">{metrics.criticos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Sin stock</p>
                  <p className="text-2xl font-bold text-red-700">{metrics.sinStock}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Inventario estimado</p>
                  <p className="text-2xl font-bold">{formatCurrencyARS(metrics.valorInventario)}</p>
                </CardContent>
              </Card>
            </section>

            {metrics.criticos > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>
                  Hay productos con stock crítico. Revisá reposición para evitar quiebres de stock en ventas del kiosco.
                </p>
              </div>
            )}

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">Productos del kiosco</h2>
                  <p className="text-sm text-muted-foreground">
                    Control operativo de productos, stock y estado comercial.
                  </p>
                </div>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <Button asChild variant="outline" className="flex items-center gap-2">
                    <Link href="/dashboard/comercial">
                      <Store className="w-4 h-4" />
                      <span className="hidden sm:inline">Comercial</span>
                    </Link>
                  </Button>
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar producto, descripción o proveedor..."
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
                    <span className="hidden sm:inline">Descargar PDF</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <Package className="w-4 h-4" />
                    <span className="hidden sm:inline">Añadir Producto</span>
                    <span className="sm:hidden">Añadir</span>
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
                      {label}
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
                        "¿Querés desactivar este producto? No se borra el histórico."
                      );
                      if (!confirmar) return;

                      try {
                        await deleteProducto(producto.id);
                        toast.success("Producto desactivado correctamente");
                        await loadProductos();
                      } catch (err) {
                        toast.error("Error al desactivar producto");
                      }
                    }}
                  />
                </div>
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalProductos}
                  pageSize={PRODUCTOS_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel="productos"
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
