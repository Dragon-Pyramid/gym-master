"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, FileSpreadsheet } from "lucide-react";
import {
  getAllProveedores,
  deleteProveedor,
} from "@/services/proveedorService";
import ProveedorModal from "@/components/modal/ProveedorModal";
import ProveedorViewModal from "@/components/modal/ProveedorViewModal";
import ProveedoresTable from "@/components/tables/ProveedoresTable";
import { Proveedor, ProveedorEstado } from "@/interfaces/proveedor.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { PaginationControls } from "@/components/ui/PaginationControls";

const PROVEEDORES_PAGE_SIZE = 10;

type EstadoFiltro = "todos" | ProveedorEstado;

const estadoLabel: Record<ProveedorEstado, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  discontinuado: "Discontinuado",
};

export default function ProveedoresPage() {
  const { isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");
  const [currentPage, setCurrentPage] = useState(1);
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
    try {
      const data = await getAllProveedores();
      setProveedores(data ?? []);
      setFilteredProveedores(data ?? []);
    } catch {
      toast.error("Error al cargar proveedores");
      setProveedores([]);
      setFilteredProveedores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const metrics = useMemo(() => {
    const activos = proveedores.filter((p) => (p.estado ?? "activo") === "activo").length;
    const inactivos = proveedores.filter((p) => p.estado === "inactivo").length;
    const discontinuados = proveedores.filter((p) => p.estado === "discontinuado").length;

    return {
      total: proveedores.length,
      activos,
      inactivos,
      discontinuados,
    };
  }, [proveedores]);

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: "Listado de Proveedores",
        subtitle: "Perfil comercial, fiscal, contacto, ubicación y datos bancarios opcionales.",
        fileName: "listado-proveedores-gym-master",
        rows: filteredProveedores,
        metrics: [
          { label: "Total", value: metrics.total },
          { label: "Activos", value: metrics.activos },
          { label: "Inactivos", value: metrics.inactivos },
          { label: "Discontinuados", value: metrics.discontinuados },
        ],
        filtersLabel: `Filtro de estado: ${estadoFiltro === "todos" ? "Todos" : estadoLabel[estadoFiltro]}${searchTerm.trim() ? ` · Búsqueda: ${searchTerm.trim()}` : ""}`,
        columns: [
          { header: "Proveedor", width: 30, getValue: (p) => p.nombre },
          { header: "Razón social", width: 32, getValue: (p) => p.razon_social || "Sin razón social" },
          { header: "CUIT/RUC", width: 20, getValue: (p) => p.identificacion_fiscal || "-" },
          { header: "Cond. fiscal", width: 24, getValue: (p) => p.condicion_fiscal || "-" },
          { header: "Contacto", width: 28, getValue: (p) => p.contacto || p.telefono || "-" },
          { header: "WhatsApp", width: 24, getValue: (p) => p.whatsapp || "-" },
          { header: "Email", width: 34, getValue: (p) => p.email || "-" },
          { header: "Ubicación", width: 42, getValue: (p) => [p.direccion, p.ciudad, p.provincia, p.pais].filter(Boolean).join(", ") || "-" },
          { header: "Rubro", width: 24, getValue: (p) => p.rubro || "-" },
          { header: "Estado", width: 18, getValue: (p) => estadoLabel[p.estado ?? "activo"] ?? "Activo" },
        ],
      });
    } catch {
      toast.error("No se pudo generar el PDF de proveedores");
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Proveedores");

    worksheet.columns = [
      { header: "Nombre comercial", key: "nombre", width: 30 },
      { header: "Razón social", key: "razon_social", width: 35 },
      { header: "CUIT/RUC", key: "identificacion_fiscal", width: 20 },
      { header: "Condición fiscal", key: "condicion_fiscal", width: 25 },
      { header: "Contacto", key: "contacto", width: 24 },
      { header: "Teléfono", key: "telefono", width: 20 },
      { header: "WhatsApp", key: "whatsapp", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Dirección", key: "direccion", width: 40 },
      { header: "Ciudad", key: "ciudad", width: 20 },
      { header: "Provincia", key: "provincia", width: 20 },
      { header: "País", key: "pais", width: 18 },
      { header: "Rubro", key: "rubro", width: 24 },
      { header: "Estado", key: "estado", width: 18 },
      { header: "Banco", key: "banco", width: 24 },
      { header: "Alias CBU/CVU", key: "alias_cbu", width: 24 },
      { header: "CBU/CVU", key: "cbu_cvu", width: 28 },
      { header: "Titular cuenta", key: "titular_cuenta", width: 30 },
      { header: "Observaciones", key: "observaciones", width: 45 },
    ];

    filteredProveedores.forEach((p) => {
      const estado = p.estado ?? "activo";
      worksheet.addRow({
        nombre: p.nombre,
        razon_social: p.razon_social ?? "",
        identificacion_fiscal: p.identificacion_fiscal ?? "",
        condicion_fiscal: p.condicion_fiscal ?? "",
        contacto: p.contacto ?? "",
        telefono: p.telefono ?? "",
        whatsapp: p.whatsapp ?? "",
        email: p.email ?? "",
        direccion: p.direccion ?? "",
        ciudad: p.ciudad ?? "",
        provincia: p.provincia ?? "",
        pais: p.pais ?? "",
        rubro: p.rubro ?? "",
        estado: estadoLabel[estado] ?? "Activo",
        banco: p.banco ?? "",
        alias_cbu: p.alias_cbu ?? "",
        cbu_cvu: p.cbu_cvu ?? "",
        titular_cuenta: p.titular_cuenta ?? "",
        observaciones: p.observaciones ?? "",
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
      `¿Está seguro de desactivar al proveedor ${proveedor.nombre}? No se borrará el histórico ni las relaciones comerciales.`
    );
    if (!confirmar) return;

    try {
      await deleteProveedor(proveedor.id);
      toast.success("Proveedor desactivado correctamente");
      await loadProveedores();
    } catch (error: unknown) {
      toast.error("Error al desactivar proveedor");
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadProveedores();
    }
  }, [isInitialized, isAuthenticated, loadProveedores]);

  useEffect(() => {
    const lowercaseSearch = searchTerm.toLowerCase().trim();
    const filtered = proveedores.filter((p) => {
      const estado = p.estado ?? "activo";
      const matchesEstado = estadoFiltro === "todos" || estado === estadoFiltro;
      if (!matchesEstado) return false;

      if (lowercaseSearch.length === 0) return true;

      return [
        p.nombre,
        p.razon_social,
        p.identificacion_fiscal,
        p.condicion_fiscal,
        p.contacto,
        p.telefono,
        p.whatsapp,
        p.email,
        p.direccion,
        p.ciudad,
        p.provincia,
        p.pais,
        p.rubro,
        p.observaciones,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(lowercaseSearch));
    });

    setFilteredProveedores(filtered);
  }, [searchTerm, estadoFiltro, proveedores]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFiltro]);

  const totalProveedores = filteredProveedores.length;
  const totalPages = Math.max(1, Math.ceil(totalProveedores / PROVEEDORES_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProveedores = filteredProveedores.slice(
    (safeCurrentPage - 1) * PROVEEDORES_PAGE_SIZE,
    safeCurrentPage * PROVEEDORES_PAGE_SIZE
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
          <AppHeader title="Proveedores" />
          <main className="flex-1 p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{metrics.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold text-emerald-600">{metrics.activos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Inactivos</p>
                  <p className="text-2xl font-bold text-gray-600">{metrics.inactivos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Discontinuados</p>
                  <p className="text-2xl font-bold text-amber-600">{metrics.discontinuados}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="w-full">
              <CardHeader className="flex flex-wrap gap-4 justify-between items-center p-4 border-b md:flex-nowrap">
                <div>
                  <h2 className="text-xl font-bold">Listado de Proveedores</h2>
                  <p className="text-sm text-muted-foreground">
                    Gestión comercial, fiscal, contacto, ubicación y datos bancarios opcionales.
                  </p>
                </div>
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
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value as EstadoFiltro)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activos</option>
                    <option value="inactivo">Inactivos</option>
                    <option value="discontinuado">Discontinuados</option>
                  </select>
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
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
                    <span className="hidden sm:inline">Añadir Proveedor</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <ProveedoresTable
                    proveedores={paginatedProveedores}
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
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalProveedores}
                  pageSize={PROVEEDORES_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel="proveedores"
                />
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
