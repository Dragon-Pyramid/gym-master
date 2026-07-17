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
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

const PROVEEDORES_PAGE_SIZE = 10;

type EstadoFiltro = "todos" | ProveedorEstado;

const estadoLabel: Record<ProveedorEstado, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  discontinuado: "Discontinuado",
};

function proveedorExportTx(locale: string, es: string, en: string) {
  return locale === "en" ? en : es;
}

function normalizeProveedorExportText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\s/-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const PROVEEDOR_EXPORT_TEXTS: Record<string, string> = {
  todos: "All",
  todas: "All",
  all: "All",
  activo: "Active",
  activos: "Active",
  active: "Active",
  inactivo: "Inactive",
  inactivos: "Inactive",
  inactive: "Inactive",
  discontinuado: "Discontinued",
  discontinuados: "Discontinued",
  discontinued: "Discontinued",
  sin_razon_social: "No legal name",
  no_legal_name: "No legal name",
  sin_condicion_fiscal: "No tax status",
  no_tax_status: "No tax status",
  responsable_inscripto: "Registered taxpayer",
  registered_taxpayer: "Registered taxpayer",
  monotributo: "Monotax",
  monotax: "Monotax",
  consumidor_final: "Final consumer",
  final_consumer: "Final consumer",
  exento: "Tax exempt",
  tax_exempt: "Tax exempt",
  bebidas: "Beverages",
  bedidas: "Beverages",
  suplementos: "Supplements",
  equipamiento: "Equipment",
  limpieza: "Cleaning",
  insumos: "Supplies",
  servicios: "Services",
  productos: "Products",
  indumentaria: "Apparel",
  accesorios: "Accessories",
};

function translateProveedorExportText(locale: string, value?: string | null, fallback = "") {
  const original = String(value ?? fallback ?? "").trim();
  if (!original) return "";
  if (locale !== "en") return original;

  const normalized = normalizeProveedorExportText(original);
  return PROVEEDOR_EXPORT_TEXTS[normalized] ?? original;
}

function proveedorStatusExportLabel(locale: string, estado?: string | null) {
  return translateProveedorExportText(locale, estadoLabel[(estado ?? "activo") as ProveedorEstado] ?? estado ?? "activo");
}

function proveedorEstadoFilterExportLabel(locale: string, filter: EstadoFiltro) {
  return filter === "todos"
    ? proveedorExportTx(locale, "Todos", "All")
    : proveedorStatusExportLabel(locale, filter);
}

function proveedorFiscalStatusExportLabel(locale: string, value?: string | null) {
  return translateProveedorExportText(
    locale,
    value,
    proveedorExportTx(locale, "Sin condición fiscal", "No tax status"),
  );
}

function proveedorCategoryExportLabel(locale: string, value?: string | null) {
  return translateProveedorExportText(locale, value);
}


export default function ProveedoresPage() {
  const { locale } = useI18n();
  const c = useCallback(
    (text: string) => translateCommercialUi(locale, text),
    [locale],
  );

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
    // `c` is memoized to avoid re-triggering this effect on every render.
    setLoading(true);
    try {
      const data = await getAllProveedores();
      setProveedores(data ?? []);
      setFilteredProveedores(data ?? []);
    } catch {
      toast.error(c("Error al cargar proveedores"));
      setProveedores([]);
      setFilteredProveedores([]);
    } finally {
      setLoading(false);
    }
  }, [c]);

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
        title: proveedorExportTx(locale, "Listado de Proveedores", "Supplier list"),
        subtitle: proveedorExportTx(
          locale,
          "Perfil comercial, fiscal, contacto, ubicación y datos bancarios opcionales.",
          "Commercial, tax, contact, location and optional banking data profile.",
        ),
        fileName: proveedorExportTx(locale, "listado-proveedores-gym-master", "gym-master-supplier-list"),
        locale,
        footerText: proveedorExportTx(
          locale,
          "Documento generado por Gym Master.",
          "Document generated by Gym Master.",
        ),
        labels: {
          generated: proveedorExportTx(locale, "Generado", "Generated"),
          page: proveedorExportTx(locale, "Página", "Page"),
          of: proveedorExportTx(locale, "de", "of"),
          detail: proveedorExportTx(locale, "Detalle", "Details"),
          records: proveedorExportTx(locale, "registros", "records"),
          empty: proveedorExportTx(
            locale,
            "No hay registros para el filtro seleccionado.",
            "No records found for the selected filter.",
          ),
        },
        rows: filteredProveedores,
        metrics: [
          { label: proveedorExportTx(locale, "Total", "Total"), value: metrics.total },
          { label: proveedorExportTx(locale, "Activos", "Active"), value: metrics.activos },
          { label: proveedorExportTx(locale, "Inactivos", "Inactive"), value: metrics.inactivos },
          { label: proveedorExportTx(locale, "Discontinuados", "Discontinued"), value: metrics.discontinuados },
        ],
        filtersLabel: proveedorExportTx(locale, "Filtro de estado", "Status filter") + ": " + proveedorEstadoFilterExportLabel(locale, estadoFiltro) + (searchTerm.trim() ? " · " + proveedorExportTx(locale, "Búsqueda", "Search") + ": " + searchTerm.trim() : ""),
        columns: [
          { header: proveedorExportTx(locale, "Proveedor", "Supplier"), width: 30, getValue: (p) => p.nombre },
          { header: proveedorExportTx(locale, "Razón social", "Legal name"), width: 32, getValue: (p) => p.razon_social || proveedorExportTx(locale, "Sin razón social", "No legal name") },
          { header: proveedorExportTx(locale, "CUIT/RUC", "Tax ID"), width: 20, getValue: (p) => p.identificacion_fiscal || "-" },
          { header: proveedorExportTx(locale, "Cond. fiscal", "Tax status"), width: 24, getValue: (p) => p.condicion_fiscal ? proveedorFiscalStatusExportLabel(locale, p.condicion_fiscal) : "-" },
          { header: proveedorExportTx(locale, "Contacto", "Contact"), width: 28, getValue: (p) => p.contacto || p.telefono || "-" },
          { header: "WhatsApp", width: 24, getValue: (p) => p.whatsapp || "-" },
          { header: "Email", width: 34, getValue: (p) => p.email || "-" },
          { header: proveedorExportTx(locale, "Ubicación", "Location"), width: 42, getValue: (p) => [p.direccion, p.ciudad, p.provincia, p.pais].filter(Boolean).join(", ") || "-" },
          { header: proveedorExportTx(locale, "Rubro", "Category"), width: 24, getValue: (p) => proveedorCategoryExportLabel(locale, p.rubro) || "-" },
          { header: proveedorExportTx(locale, "Estado", "Status"), width: 18, getValue: (p) => proveedorStatusExportLabel(locale, p.estado ?? "activo") },
        ],
      });
    } catch {
      toast.error(proveedorExportTx(locale, "No se pudo generar el PDF de proveedores", "Could not generate the suppliers PDF"));
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(proveedorExportTx(locale, "Proveedores", "Suppliers"));

    worksheet.columns = [
      { header: proveedorExportTx(locale, "Nombre comercial", "Commercial name"), key: "nombre", width: 30 },
      { header: proveedorExportTx(locale, "Razón social", "Legal name"), key: "razon_social", width: 35 },
      { header: proveedorExportTx(locale, "CUIT/RUC", "Tax ID"), key: "identificacion_fiscal", width: 20 },
      { header: proveedorExportTx(locale, "Condición fiscal", "Tax status"), key: "condicion_fiscal", width: 25 },
      { header: proveedorExportTx(locale, "Contacto", "Contact"), key: "contacto", width: 24 },
      { header: proveedorExportTx(locale, "Teléfono", "Phone"), key: "telefono", width: 20 },
      { header: "WhatsApp", key: "whatsapp", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: proveedorExportTx(locale, "Dirección", "Address"), key: "direccion", width: 40 },
      { header: proveedorExportTx(locale, "Ciudad", "City"), key: "ciudad", width: 20 },
      { header: proveedorExportTx(locale, "Provincia", "Province"), key: "provincia", width: 20 },
      { header: proveedorExportTx(locale, "País", "Country"), key: "pais", width: 18 },
      { header: proveedorExportTx(locale, "Rubro", "Category"), key: "rubro", width: 24 },
      { header: proveedorExportTx(locale, "Estado", "Status"), key: "estado", width: 18 },
      { header: proveedorExportTx(locale, "Banco", "Bank"), key: "banco", width: 24 },
      { header: "Alias CBU/CVU", key: "alias_cbu", width: 24 },
      { header: "CBU/CVU", key: "cbu_cvu", width: 28 },
      { header: proveedorExportTx(locale, "Titular cuenta", "Account holder"), key: "titular_cuenta", width: 30 },
      { header: proveedorExportTx(locale, "Observaciones", "Notes"), key: "observaciones", width: 45 },
    ];

    filteredProveedores.forEach((p) => {
      const estado = p.estado ?? "activo";
      worksheet.addRow({
        nombre: p.nombre,
        razon_social: p.razon_social ?? "",
        identificacion_fiscal: p.identificacion_fiscal ?? "",
        condicion_fiscal: proveedorFiscalStatusExportLabel(locale, p.condicion_fiscal),
        contacto: p.contacto ?? "",
        telefono: p.telefono ?? "",
        whatsapp: p.whatsapp ?? "",
        email: p.email ?? "",
        direccion: p.direccion ?? "",
        ciudad: p.ciudad ?? "",
        provincia: p.provincia ?? "",
        pais: p.pais ?? "",
        rubro: proveedorCategoryExportLabel(locale, p.rubro),
        estado: proveedorStatusExportLabel(locale, estado),
        banco: p.banco ?? "",
        alias_cbu: p.alias_cbu ?? "",
        cbu_cvu: p.cbu_cvu ?? "",
        titular_cuenta: p.titular_cuenta ?? "",
        observaciones: p.observaciones ?? "",
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName(
      proveedorExportTx(locale, "listado-proveedores", "supplier-list"),
      "xlsx",
    );
    a.click();
    window.URL.revokeObjectURL(url);
  };


  const handleDeleteProveedor = async (proveedor: Proveedor) => {
    const confirmar = window.confirm(
      `${c("¿Está seguro de desactivar al proveedor")} ${proveedor.nombre}? ${c("No se borrará el histórico ni las relaciones comerciales.")}`
    );
    if (!confirmar) return;

    try {
      await deleteProveedor(proveedor.id);
      toast.success(c("Proveedor desactivado correctamente"));
      await loadProveedores();
    } catch (error: unknown) {
      toast.error(c("Error al desactivar proveedor"));
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
    return <div>{c("Cargando...")}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c("Proveedores")} />
          <main className="flex-1 p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{c("Total")}</p>
                  <p className="text-2xl font-bold">{metrics.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{c("Activos")}</p>
                  <p className="text-2xl font-bold text-emerald-600">{metrics.activos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{c("Inactivos")}</p>
                  <p className="text-2xl font-bold text-gray-600">{metrics.inactivos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{c("Discontinuados")}</p>
                  <p className="text-2xl font-bold text-amber-600">{metrics.discontinuados}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="w-full">
              <CardHeader className="flex flex-wrap gap-4 justify-between items-center p-4 border-b md:flex-nowrap">
                <div>
                  <h2 className="text-xl font-bold">{c("Listado de Proveedores")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {c("Gestión comercial, fiscal, contacto, ubicación y datos bancarios opcionales.")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={c("Buscar proveedor...")}
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
                    <option value="todos">{c("Todos los estados")}</option>
                    <option value="activo">{c("Activos")}</option>
                    <option value="inactivo">{c("Inactivos")}</option>
                    <option value="discontinuado">{c("Discontinuados")}</option>
                  </select>
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
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
                    <span className="hidden sm:inline">{c("Añadir Proveedor")}</span>
                    <span className="sm:hidden">{c("Añadir")}</span>
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
