"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, FileSpreadsheet } from "lucide-react";
import {
  getAllProveedores,
  deleteProveedor,
} from "@/services/proveedorService";
import ProveedorModal from "@/components/modal/ProveedorModal";
import ProveedorViewModal from "@/components/modal/ProveedorViewModal";
import ProveedoresTable from "@/components/tables/ProveedoresTable";
import { Proveedor } from "@/interfaces/proveedor.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";

export default function ProveedoresPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(
    null
  );
  const [openModalVer, setOpenModalVer] = useState(false);
  const [proveedorVer, setProveedorVer] = useState<Proveedor | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadProveedores = useCallback(async () => {
    setLoading(true);
    const data = await getAllProveedores();
    setProveedores(data ?? []);
    setFilteredProveedores(data ?? []);
    setLoading(false);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Proveedores");

    worksheet.columns = [
      { header: "ID", key: "id", width: 30 },
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Contacto", key: "contacto", width: 20 },
      { header: "Teléfono", key: "telefono", width: 20 },
      { header: "Dirección", key: "direccion", width: 40 },
    ];

    filteredProveedores.forEach((p) => {
      worksheet.addRow({
        id: p.id,
        nombre: p.nombre,
        contacto: p.contacto,
        telefono: p.telefono,
        direccion: p.direccion,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Listado_Proveedores.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteProveedor = async (proveedor: Proveedor) => {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar al proveedor ${proveedor.nombre}?`
    );
    if (!confirmar) return;

    try {
      await deleteProveedor(proveedor.id);
      toast.success("Proveedor eliminado correctamente");
      await loadProveedores();
    } catch (error: unknown) {
      toast.error("Error al eliminar proveedor");
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadProveedores();
    }
  }, [isInitialized, isAuthenticated, loadProveedores]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProveedores(proveedores);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = proveedores.filter(
      (p) =>
        p.nombre.toLowerCase().includes(lowercaseSearch) ||
        p.contacto.toLowerCase().includes(lowercaseSearch) ||
        p.telefono?.toLowerCase().includes(lowercaseSearch) ||
        p.direccion?.toLowerCase().includes(lowercaseSearch)
    );

    setFilteredProveedores(filtered);
  }, [searchTerm, proveedores]);

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
          <AppHeader title="Proveedores" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap gap-4 justify-between items-center p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Proveedores</h2>
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar proveedor..."
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
                    <span className="hidden sm:inline">Añadir Proveedor</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <ProveedoresTable
                    proveedores={filteredProveedores}
                    loading={loading}
                    onEdit={(proveedor) => {
                      setSelectedProveedor(proveedor);
                      setOpenModal(true);
                    }}
                    onView={(proveedor) => {
                      setProveedorVer(proveedor);
                      setOpenModalVer(true);
                    }}
                    onDelete={handleDeleteProveedor}
                  />
                </div>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <ProveedorModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedProveedor(null);
        }}
        onCreated={loadProveedores}
        proveedor={selectedProveedor}
      />

      <ProveedorViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setProveedorVer(null);
        }}
        proveedor={proveedorVer}
      />
    </SidebarProvider>
  );
}
