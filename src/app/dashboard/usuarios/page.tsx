"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, FileSpreadsheet } from "lucide-react";
import {
  deactivateUsuarioApi,
  fetchUsuariosApi,
  updateUsuarioApi,
} from "@/services/browser/usuarioApiClient";
import UserModal from "@/components/modal/UserModal";
import UserViewModal from "@/components/modal/UserViewModal";
import UsersTable from "@/components/tables/UserTable";
import { Usuario } from "@/interfaces/usuario.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";

const USUARIOS_PAGE_SIZE = 10;

function usersTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

function translateUserStatusFilter(locale: GymMasterLocale, value: string) {
  if (value === "todos") return usersTx(locale, "Todos", "All");
  if (value === "activos") return usersTx(locale, "Activos", "Active");
  return usersTx(locale, "Inactivos", "Inactive");
}

function translateRoleForExport(locale: GymMasterLocale, role?: string | null) {
  if (locale !== "en") return role || "-";
  const normalized = String(role || "").toLowerCase();
  if (normalized === "socio") return "Member";
  if (normalized === "usuario") return "Internal user";
  if (normalized === "admin") return "Admin";
  return role || "-";
}


export default function UsuariosPage() {
  const { isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const { locale } = useI18n();
  const c = useCallback((es: string, en: string) => usersTx(locale, es, en), [locale]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [usuarioVer, setUsuarioVer] = useState<Usuario | null>(null);
  const [filtroActivo, setFiltroActivo] = useState("todos");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadUsuarios = useCallback(async () => {
    setLoading(true);
    const data = await fetchUsuariosApi();
    setUsuarios(data as Usuario[] ?? []);
    setFilteredUsuarios(data as Usuario[] ?? []);
    setLoading(false);
  }, []);

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: c("Listado de Usuarios", "Users list"),
        subtitle: c("Reporte de usuarios internos, socios y administradores.", "Report of internal users, members, and administrators."),
        fileName: "listado-usuarios-gym-master",
        rows: filteredUsuarios,
        metrics: [
          { label: c("Usuarios filtrados", "Filtered users"), value: filteredUsuarios.length },
          { label: c("Activos", "Active"), value: filteredUsuarios.filter((u) => u.activo).length },
          { label: c("Inactivos", "Inactive"), value: filteredUsuarios.filter((u) => !u.activo).length },
        ],
        filtersLabel: `${c("Estado", "Status")}: ${filtroLabel}${searchTerm.trim() ? ` · ${c("Búsqueda", "Search")}: ${searchTerm.trim()}` : ""}`,
        columns: [
          { header: c("Nombre", "Name"), width: 46, getValue: (u) => u.nombre },
          { header: "Email", width: 58, getValue: (u) => u.email },
          { header: c("Rol", "Role"), width: 28, getValue: (u) => translateRoleForExport(locale, u.rol) },
          { header: c("Estado", "Status"), width: 24, getValue: (u) => (u.activo ? c("Activo", "Active") : c("Inactivo", "Inactive")) },
        ],
      });
    } catch {
      toast.error(c("No se pudo generar el PDF de usuarios", "Could not generate the users PDF"));
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Usuarios");

    worksheet.columns = [
      { header: "ID", key: "id", width: 30 },
      { header: c("Nombre", "Name"), key: "nombre", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: c("Rol", "Role"), key: "rol", width: 20 },
      { header: c("Activo", "Active"), key: "activo", width: 10 },
    ];

    filteredUsuarios.forEach((u) => {
      worksheet.addRow({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        rol: translateRoleForExport(locale, u.rol),
        activo: u.activo ? c("Sí", "Yes") : c("No", "No"),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName("listado-usuarios", "xlsx");
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleUsuarioActivo = async (usuario: Usuario) => {
    const confirmar = window.confirm(
      usuario.activo
        ? c("¿Está seguro de desactivar al usuario?", "Are you sure you want to deactivate this user?")
        : c("¿Está seguro de activar al usuario?", "Are you sure you want to activate this user?")
    );
    if (!confirmar) return;

    try {
      if (usuario.activo) {
        await deactivateUsuarioApi(usuario.id);
        toast.success(c("Usuario desactivado correctamente", "User deactivated successfully"));
      } else {
        await updateUsuarioApi(usuario.id, { activo: true });
        toast.success(c("Usuario activado correctamente", "User activated successfully"));
      }
      await loadUsuarios();
    } catch (error: unknown) {
      toast.error(c("Error al actualizar estado del usuario", "Error updating user status"));
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadUsuarios();
    }
  }, [isInitialized, isAuthenticated, loadUsuarios]);

  useEffect(() => {
    let usuariosFiltrados = usuarios;
    if (filtroActivo === "activos") {
      usuariosFiltrados = usuariosFiltrados.filter((u) => u.activo);
    } else if (filtroActivo === "inactivos") {
      usuariosFiltrados = usuariosFiltrados.filter((u) => !u.activo);
    }
    if (searchTerm.trim() !== "") {
      const lowercaseSearch = searchTerm.toLowerCase();
      usuariosFiltrados = usuariosFiltrados.filter(
        (u) =>
          u.nombre.toLowerCase().includes(lowercaseSearch) ||
          u.email.toLowerCase().includes(lowercaseSearch) ||
          u.rol?.toLowerCase().includes(lowercaseSearch)
      );
    }
    setFilteredUsuarios(usuariosFiltrados);
  }, [searchTerm, usuarios, filtroActivo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroActivo]);

  const totalUsuarios = filteredUsuarios.length;
  const totalPages = Math.max(1, Math.ceil(totalUsuarios / USUARIOS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsuarios = filteredUsuarios.slice(
    (safeCurrentPage - 1) * USUARIOS_PAGE_SIZE,
    safeCurrentPage * USUARIOS_PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const filtroLabel = translateUserStatusFilter(locale, filtroActivo);

  if (!isInitialized) {
    return <div>{c("Cargando...", "Loading...")}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c("Usuarios", "Users")} />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full dark:border-slate-800 dark:bg-slate-950/70">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap dark:border-slate-800">
                <h2 className="text-xl font-bold">{c("Listado de Usuarios", "Users list")}</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="flex items-center flex-grow gap-2 md:flex-grow-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="min-w-[120px]">
                          {filtroLabel}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo("todos")}
                          className={
                            filtroActivo === "todos" ? "font-bold" : ""
                          }
                        >
                          {c("Todos", "All")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo("activos")}
                          className={
                            filtroActivo === "activos" ? "font-bold" : ""
                          }
                        >
                          {c("Activos", "Active")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo("inactivos")}
                          className={
                            filtroActivo === "inactivos" ? "font-bold" : ""
                          }
                        >
                          {c("Inactivos", "Inactive")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder={c("Buscar por nombre, email...", "Search by name, email...")}
                        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">{c("Descargar PDF", "Download PDF")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">{c("Exportar", "Export")}</span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">{c("Añadir Usuario", "Add user")}</span>
                    <span className="sm:hidden">{c("Añadir", "Add")}</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <UsersTable
                    usuarios={paginatedUsuarios}
                    loading={loading}
                    onEdit={(usuario) => {
                      setSelectedUsuario(usuario);
                      setOpenModal(true);
                    }}
                    onView={(usuario) => {
                      setUsuarioVer(usuario);
                      setOpenModalVer(true);
                    }}
                    onDelete={toggleUsuarioActivo}
                  />
                </div>
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalUsuarios}
                  pageSize={USUARIOS_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel={c("usuarios", "users")}
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <UserModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedUsuario(null);
        }}
        onCreated={loadUsuarios}
        usuario={selectedUsuario}
      />

      <UserViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setUsuarioVer(null);
        }}
        usuario={usuarioVer}
      />
    </SidebarProvider>
  );
}
