"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Activity, CalendarDays, Clock3, Eye, Search, UserCheck, UserRound, Users } from "lucide-react";
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
import { formatFrontendDate } from '@/utils/dateFormat';
import { useI18n } from "@/i18n/I18nProvider";

const GESTOR_EVOLUCION_PAGE_SIZE = 12;

const isAdminRole = (rol?: string | null) => {
  const normalized = rol?.trim().toLowerCase();
  return normalized === "admin" || normalized === "administrador";
};

const formatDate = (value?: string | null, locale: string = "es", emptyLabel = "Sin registros") => {
  if (!value) return emptyLabel;

  const date = new Date(value);
  const dateLocale = locale === "en" ? "en-US" : "es-AR";
  return Number.isNaN(date.getTime())
    ? emptyLabel
    : formatFrontendDate(value, dateLocale, emptyLabel);
};

const formatNumber = (value?: number | null, suffix = "", locale: string = "es") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toLocaleString(locale === "en" ? "en-US" : "es-AR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
};

type TranslateFn = (es: string, en: string) => string;

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "neutral",
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "neutral" | "positive" | "warning" | "info";
}) {
  const toneMap = {
    neutral: {
      badge: "border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-800 dark:bg-white/[0.04] dark:text-neutral-200",
      bar: "bg-neutral-300 dark:bg-neutral-700",
    },
    positive: {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
      bar: "bg-emerald-400 dark:bg-emerald-500",
    },
    warning: {
      badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
      bar: "bg-amber-400 dark:bg-amber-500",
    },
    info: {
      badge: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/70 dark:bg-cyan-950/40 dark:text-cyan-300",
      bar: "bg-cyan-400 dark:bg-cyan-500",
    },
  } as const;

  const selectedTone = toneMap[tone];

  return (
    <Card className="rounded-2xl border border-border/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/80 dark:shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-neutral-400">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground dark:text-neutral-500">{helper}</p>
          </div>
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${selectedTone.badge}`}>
            <Icon className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="text-4xl font-bold leading-none text-foreground dark:text-white">{value}</p>
          <span className={`h-1.5 w-14 rounded-full ${selectedTone.bar}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function SocioEvolucionCard({
  socio,
  onView,
  tx,
  locale,
}: {
  socio: EvolucionFisicaAdminResumen;
  onView: (socioId: string) => void;
  tx: TranslateFn;
  locale: string;
}) {
  return (
    <Card className="h-full border bg-card transition-shadow duration-200 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900/70 dark:hover:border-neutral-700 dark:hover:shadow-none">
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
                ? "bg-green-100 text-green-800 dark:bg-emerald-950/70 dark:text-emerald-200"
                : "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            {socio.activo ? tx("Activo", "Active") : tx("Inactivo", "Inactive")}
          </span>
        </div>
        <CardDescription>{tx("DNI", "ID")}: {socio.dni}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-xl border bg-muted/20 p-3 dark:border-neutral-800 dark:bg-black/25">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#02a8e1]" />
            <span className="text-sm font-semibold">{tx("Evolución física", "Physical evolution")}</span>
          </div>

          {socio.tiene_evolucion ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">{tx("Registros", "Records")}:</span> {socio.total_registros}
              </p>
              <p className="flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {tx("Última medición", "Last measurement")}: {formatDate(socio.ultima_fecha, locale, tx("Sin registros", "No records"))}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{tx("Peso", "Weight")}: {formatNumber(socio.ultimo_peso, " kg", locale)}</span>
                <span>{tx("IMC", "BMI")}: {formatNumber(socio.ultimo_imc, "", locale)}</span>
                <span>{tx("Cintura", "Waist")}: {formatNumber(socio.ultima_cintura, " cm", locale)}</span>
                <span>{tx("Grasa", "Fat")}: {formatNumber(socio.ultimo_porcentaje_grasa, "%", locale)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {tx("Este socio todavía no tiene registros de evolución física.", "This member does not have physical evolution records yet.")}
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
          {tx("Ver evolución", "View evolution")}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function GestorEvolucionFisicaPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = useCallback((es: string, en: string) => (isEnglish ? en : es), [isEnglish]);
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
          : tx("No se pudo cargar el gestor de evolución física", "The physical evolution manager could not be loaded")
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tx]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user && isAdminRole(user.rol)) {
      loadData();
    }
  }, [isAuthenticated, isInitialized, loadData, user]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const orderedRows = [...rows].sort((a, b) =>
      a.nombre_completo.localeCompare(b.nombre_completo, isEnglish ? "en" : "es")
    );

    if (!q) return orderedRows;

    return orderedRows.filter((row) =>
      [row.nombre_completo, row.dni, row.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [isEnglish, rows, searchTerm]);

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
        {tx("Cargando gestor de evolución física...", "Loading physical evolution manager...")}
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
          <AppHeader title={tx("Gestor de Evolución Física", "Physical evolution manager")} />
          <main className="flex-1 space-y-6 bg-background p-6 dark:bg-black">
            <Card className="w-full dark:border-neutral-800 dark:bg-neutral-950/45">
              <CardHeader className="space-y-2 border-b p-4 dark:border-neutral-800">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {tx("Evolución física de socios", "Members' physical evolution")}
                    </CardTitle>
                    <CardDescription>
                      {tx(
                        "Consulta administrativa solo lectura del progreso físico de los socios.",
                        "Read-only administrative view of members' physical progress."
                      )}
                    </CardDescription>
                  </div>
                  <div className="relative w-full md:w-[360px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={tx("Buscar por nombre, DNI o email...", "Search by name, ID, or email...")}
                      className="pl-9 dark:border-neutral-800 dark:bg-black/40 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title={tx("Socios", "Members")}
                    value={totalSocios}
                    helper={tx("Total de socios registrados", "Total registered members")}
                    icon={Users}
                    tone="neutral"
                  />
                  <StatCard
                    title={tx("Con evolución", "With evolution")}
                    value={sociosConEvolucion}
                    helper={tx("Socios con al menos una medición", "Members with at least one measurement")}
                    icon={Activity}
                    tone="positive"
                  />
                  <StatCard
                    title={tx("Sin evolución", "Without evolution")}
                    value={sociosSinEvolucion}
                    helper={tx("Pendientes de primera carga", "Pending first entry")}
                    icon={Clock3}
                    tone="warning"
                  />
                  <StatCard
                    title={tx("Activos con evolución", "Active with evolution")}
                    value={activosConEvolucion}
                    helper={tx("Socios activos con seguimiento físico", "Active members with physical tracking")}
                    icon={UserCheck}
                    tone="info"
                  />
                </div>

                {filteredRows.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                    {tx("No hay socios que coincidan con la búsqueda actual.", "No members match the current search.")}
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
                        tx={tx}
                        locale={locale}
                      />
                    ))}
                  </div>
                )}
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalFilteredRows}
                  pageSize={GESTOR_EVOLUCION_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel={tx("socios", "members")}
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
