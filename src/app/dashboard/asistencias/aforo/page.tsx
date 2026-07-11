"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Clock,
  LogIn,
  LogOut,
  RefreshCcw,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/i18n/I18nProvider";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AforoAsistenciaResumen,
  AsistenciaMovimientoResumen,
} from "@/interfaces/asistenciaAforo.interface";
import {
  fetchAforoAsistencia,
  registrarSalidaAdministrativa,
} from "@/services/asistenciaAforoService";
import { toast } from "sonner";

const AFORO_AUTO_REFRESH_MS = 5000;

function getEstadoClass(estado?: string) {
  if (estado === "critico") return "border-red-300 bg-red-50 text-red-800";
  if (estado === "alto")
    return "border-orange-300 bg-orange-50 text-orange-800";
  if (estado === "medio") return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-emerald-300 bg-emerald-50 text-emerald-800";
}

function translateAforoEstado(value: string | undefined, isEnglish: boolean) {
  if (!value) return "--";

  if (!isEnglish) {
    return value;
  }

  const normalized = value.toLowerCase();

  if (normalized === "normal") return "Normal";
  if (normalized === "moderado" || normalized === "medio") return "Moderate";
  if (normalized === "alto") return "High";
  if (normalized === "critico" || normalized === "crítico") return "Critical";

  return value;
}

function translateAforoMessage(message: string | undefined, isEnglish: boolean) {
  if (!message) {
    return isEnglish ? "No capacity data." : "Sin datos de aforo.";
  }

  if (!isEnglish) {
    return message;
  }

  const translations: Record<string, string> = {
    "Ocupación normal. Hay disponibilidad operativa.":
      "Normal occupancy. Operational capacity is available.",
    "Ocupación moderada. El gimnasio opera con margen disponible.":
      "Moderate occupancy. The gym is operating with available margin.",
    "Ocupación alta. Recomendado monitorear accesos y horarios pico.":
      "High occupancy. Monitor access points and peak hours.",
    "Ocupación crítica. Activar control de aforo y limitar nuevos ingresos.":
      "Critical occupancy. Activate capacity control and limit new entries.",
  };

  return translations[message] ?? message;
}

function MovimientoRow({
  movimiento,
  isEnglish,
}: {
  movimiento: AsistenciaMovimientoResumen;
  isEnglish: boolean;
}) {
  const esSalida = movimiento.tipo_movimiento === "salida";

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold">
          {movimiento.socio?.nombre_completo || movimiento.socio_id}
        </p>
        <p className="text-xs text-muted-foreground">
          {isEnglish ? "Member ID" : "ID socio"}: {movimiento.socio_id}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-muted px-3 py-1 font-mono">
          {movimiento.fecha}
        </span>
        <span className="rounded-full bg-muted px-3 py-1 font-mono">
          {isEnglish ? "Check-in" : "Ingreso"} {movimiento.hora_ingreso?.slice(0, 5) || "--:--"}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${
            esSalida
              ? "bg-slate-100 text-slate-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {esSalida ? (
            <LogOut className="h-4 w-4" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {esSalida
            ? `${isEnglish ? "Exit" : "Salida"} ${movimiento.hora_egreso?.slice(0, 5) || "--:--"}`
            : isEnglish
              ? "Inside"
              : "Dentro"}
        </span>
      </div>
    </div>
  );
}

export default function AsistenciaAforoPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const text = useCallback((es: string, en: string) => (isEnglish ? en : es), [isEnglish]);
  const router = useRouter();
  const [aforo, setAforo] = useState<AforoAsistenciaResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadAforo = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await fetchAforoAsistencia();
      setAforo(data);
    } catch (error: unknown) {
      toast.error((error as Error).message || text("No se pudo cargar el aforo", "Capacity data could not be loaded"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [text]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      void loadAforo();
    }
  }, [isInitialized, isAuthenticated, loadAforo]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadAforo(true);
      }
    }, AFORO_AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, isInitialized, loadAforo]);

  const handleRegisterExit = async (
    movimiento: AsistenciaMovimientoResumen,
  ) => {
    const confirmar = window.confirm(
      text(
        `¿Registrar salida para ${movimiento.socio?.nombre_completo || movimiento.socio_id}?`,
        `Register exit for ${movimiento.socio?.nombre_completo || movimiento.socio_id}?`,
      ),
    );
    if (!confirmar) return;

    try {
      const response = await registrarSalidaAdministrativa(movimiento.id);
      toast.success(response.message || text("Salida registrada correctamente", "Exit recorded successfully"));
      await loadAforo(true);
    } catch (error: unknown) {
      toast.error((error as Error).message || text("No se pudo registrar la salida", "The exit could not be recorded"));
    }
  };

  if (!isInitialized || loading) {
    return <div>{text("Cargando...", "Loading...")}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={text("Salida / Aforo", "Exit / Capacity")} />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-black">
                  {text("Control de salida y aforo", "Exit and capacity control")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {text("Monitoreo operativo en vivo de personas dentro del gimnasio.", "Live operational monitoring of people inside the gym.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/asistencias")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {text("Volver al listado", "Back to list")}
                </Button>
                <Button onClick={() => loadAforo(true)} disabled={refreshing}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {refreshing ? text("Actualizando...", "Refreshing...") : text("Actualizar", "Refresh")}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-emerald-100 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {text("Dentro ahora", "Inside now")}
                      </p>
                      <p className="text-4xl font-black">
                        {aforo?.aforo_actual ?? 0}
                      </p>
                    </div>
                    <Users className="h-10 w-10 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-muted-foreground">
                    {text("Capacidad máxima", "Maximum capacity")}
                  </p>
                  <p className="text-4xl font-black">
                    {aforo?.capacidad_maxima ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {text("Configurable por entorno", "Configurable by environment")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-muted-foreground">
                    {text("Ocupación", "Occupancy")}
                  </p>
                  <p className="text-4xl font-black">
                    {aforo?.porcentaje_ocupacion ?? 0}%
                  </p>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#02a8e1]"
                      style={{
                        width: `${Math.min(aforo?.porcentaje_ocupacion ?? 0, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className={getEstadoClass(aforo?.estado)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="text-sm font-bold uppercase">{text("Estado", "Status")}</p>
                  </div>
                  <p className="mt-2 text-2xl font-black capitalize">
                    {translateAforoEstado(aforo?.estado ?? "normal", isEnglish)}
                  </p>
                  <p className="text-xs font-medium">{translateAforoMessage(aforo?.mensaje_estado, isEnglish)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {text("Entradas de hoy", "Today's entries")}
                  </p>
                  <p className="text-2xl font-bold">
                    {aforo?.entradas_hoy ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {text("Salidas de hoy", "Today's exits")}
                  </p>
                  <p className="text-2xl font-bold">
                    {aforo?.salidas_hoy ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {text("Abiertas antiguas", "Old open records")}
                  </p>
                  <p className="text-2xl font-bold">
                    {aforo?.asistencias_abiertas_antiguas ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {text("Última lectura", "Last reading")}
                  </p>
                  <p className="flex items-center gap-2 text-2xl font-bold">
                    <Clock className="h-5 w-5" />
                    {aforo?.hora_actual?.slice(0, 5) ?? "--:--"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {text("Socios dentro ahora", "Members inside now")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aforo?.socios_dentro?.length ? (
                    aforo.socios_dentro.map((movimiento) => (
                      <div
                        key={movimiento.id}
                        className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <MovimientoRow movimiento={movimiento} isEnglish={isEnglish} />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegisterExit(movimiento)}
                          className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {text("Registrar salida", "Register exit")}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {text("No hay socios dentro en este momento.", "There are no members inside right now.")}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {text("Movimientos recientes", "Recent movements")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aforo?.movimientos_recientes?.length ? (
                    aforo.movimientos_recientes.map((movimiento) => (
                      <MovimientoRow
                        key={movimiento.id}
                        movimiento={movimiento}
                        isEnglish={isEnglish}
                      />
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {text("Todavía no hay movimientos registrados hoy.", "No movements have been recorded today yet.")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
