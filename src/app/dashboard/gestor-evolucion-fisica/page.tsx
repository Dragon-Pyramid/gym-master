"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, CalendarDays, Eye, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppHeader } from "@/components/header/AppHeader";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { EvolucionFisicaAdminResumen } from "@/interfaces/evolucionSocio.interface";
import { getEvolucionFisicaAdminResumen } from "@/services/evolucionSocioClient";
import { useAuthStore } from "@/stores/authStore";

const GESTOR_EVOLUCION_PAGE_SIZE = 12;

const isAdminRole = (rol?: string | null) => {
  const normalized = rol?.trim().toLowerCase();
  return normalized === "admin" || normalized === "administrador";
};

const formatDate = (value?: string | null) => {
  if (!value) return "Sin registros";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sin registros" : date.toLocaleDateString("es-AR");
};

const formatNumber = (value?: number | null, suffix = "") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
};

function StatCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Card className="rounded-2xl border bg-white shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function SocioEvolucionCard({
  socio,
  onView,
}: {
  socio: EvolucionFisicaAdminResumen;
  onView: (socioId: string) => void;
}) {
  return (
    <Card className="h-full transition-shadow duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <UserRound className="h-5 w-5 flex-shrink-0 text-[#02a8e1]" />
            <CardTitle className="truncate text-base font-semibold">
              {socio.nombre_completo}
            </CardTitle>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              socio.activo
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {socio.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
        <CardDescription>DNI: {socio.dni}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#02a8e1]" />
            <span className="text-sm font-semibold">Evolución física</span>
          </div>

          {socio.tiene_evolucion ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Registros:</span> {socio.total_registros}
              </p>
              <p className="flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Última medición: {formatDate(socio.ultima_fecha)}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>Peso: {formatNumber(socio.ultimo_peso, " kg")}</span>
                <span>IMC: {formatNumber(socio.ultimo_imc)}</span>
                <span>Cintura: {formatNumber(socio.ultima_cintura, " cm")}</span>
                <span>Grasa: {formatNumber(socio.ultimo_porcentaje_grasa, "%")}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Este socio todavía no tiene registros de evolución física.
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!socio.tiene_evolucion}
          onClick={() => onView(socio.id_socio)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver evolución
        </Button>
      </CardContent>
    </Card>
  );
}

export default function GestorEvolucionFisicaPage() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth, isInitialized, user } = useAuthStore();
  const [rows, setRows] = useState<EvolucionFisicaAdminResumen[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user && !isAdminRole(user.rol)) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isInitialized, router, user]);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getEvolucionFisicaAdminResumen();
      setRows(res.data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el gestor de evolución física"
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user && isAdminRole(user.rol)) {
      loadData();
    }
  }, [isAuthenticated, isInitialized, loadData, user]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const orderedRows = [...rows].sort((a, b) =>
      a.nombre_completo.localeCompare(b.nombre_completo, "es")
    );

    if (!q) return orderedRows;

    return orderedRows.filter((row) =>
      [row.nombre_completo, row.dni, row.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [rows, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalFilteredRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredRows / GESTOR_EVOLUCION_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = filteredRows.slice(
    (safeCurrentPage - 1) * GESTOR_EVOLUCION_PAGE_SIZE,
    safeCurrentPage * GESTOR_EVOLUCION_PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalSocios = rows.length;
  const sociosConEvolucion = rows.filter((row) => row.tiene_evolucion).length;
  const sociosSinEvolucion = totalSocios - sociosConEvolucion;
  const activosConEvolucion = rows.filter(
    (row) => row.activo && row.tiene_evolucion
  ).length;

  if (!isInitialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Cargando gestor de evolución física...
      </div>
    );
  }

  if (!isAuthenticated || !isAdminRole(user?.rol)) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Gestor de Evolución Física" />
          <main className="flex-1 space-y-6 p-6">
            <Card className="w-full">
              <CardHeader className="space-y-2 border-b p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      Evolución física de socios
                    </CardTitle>
                    <CardDescription>
                      Consulta administrativa solo lectura del progreso físico de los socios.
                    </CardDescription>
                  </div>
                  <div className="relative w-full md:w-[360px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por nombre, DNI o email..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Socios"
                    value={totalSocios}
                    helper="Total de socios registrados"
                  />
                  <StatCard
                    title="Con evolución"
                    value={sociosConEvolucion}
                    helper="Socios con al menos una medición"
                  />
                  <StatCard
                    title="Sin evolución"
                    value={sociosSinEvolucion}
                    helper="Pendientes de primera carga"
                  />
                  <StatCard
                    title="Activos con evolución"
                    value={activosConEvolucion}
                    helper="Socios activos con seguimiento físico"
                  />
                </div>

                {filteredRows.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                    No hay socios que coincidan con la búsqueda actual.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedRows.map((socio) => (
                      <SocioEvolucionCard
                        key={socio.id_socio}
                        socio={socio}
                        onView={(socioId) =>
                          router.push(`/dashboard/gestor-evolucion-fisica/socio/${socioId}`)
                        }
                      />
                    ))}
                  </div>
                )}
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalFilteredRows}
                  pageSize={GESTOR_EVOLUCION_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel="socios"
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
