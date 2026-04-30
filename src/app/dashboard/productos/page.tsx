"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, FileSpreadsheet } from "lucide-react";
import { getAllProductos, deleteProducto } from "@/services/productoService";
import ProductoModal from "@/components/modal/ProductoModal";
import ProductoViewModal from "@/components/modal/ProductoViewModal";
import ProductoTable from "@/components/tables/ProductoTable";
import { Producto } from "@/interfaces/producto.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";

export default function ProductoPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(
    null
  );
  const [openModalVer, setOpenModalVer] = useState(false);
  const [productoVer, setProductoVer] = useState<Producto | null>(null);

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
    const data = await getAllProductos();
    setProductos(data ?? []);
    setFilteredProductos(data ?? []);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Productos");

    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Descripción", key: "descripcion", width: 30 },
      { header: "Precio", key: "precio", width: 15 },
      { header: "Stock", key: "stock", width: 10 },
      { header: "Proveedor ID", key: "proveedor_id", width: 20 },
    ];

    filteredProductos.forEach((p) => {
      worksheet.addRow({
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        stock: p.stock,
        proveedor_id: p.proveedor_id,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Listado_Productos.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadProductos();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProductos(productos);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(lowercaseSearch) ||
        p.descripcion.toLowerCase().includes(lowercaseSearch) ||
        p.proveedor_id?.toLowerCase().includes(lowercaseSearch)
    );

    setFilteredProductos(filtered);
  }, [searchTerm, productos]);

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
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Productos</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por nombre, descripción, proveedor..."
                      className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Imprimir</span>
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
                    <span className="hidden sm:inline">Añadir Producto</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <ProductoTable
                    productos={filteredProductos}
                    loading={loading}
                    onEdit={(producto) => {
                      setSelectedProducto(producto as Producto);
                      setOpenModal(true);
                    }}
                    onView={(producto) => {
                      setProductoVer(producto as Producto);
                      setOpenModalVer(true);
                    }}
                    onDelete={async (producto) => {
                      const confirmar = window.confirm(
                        "¿Está seguro de eliminar el producto?"
                      );
                      if (!confirmar) return;

                      try {
                        await deleteProducto(producto.id);
                        toast.success("Producto eliminado correctamente");
                        await loadProductos();
                      } catch (err) {
                        toast.error("Error al eliminar producto");
                      }
                    }}
                  />
                </div>
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
      />
    </SidebarProvider>
  );
}
