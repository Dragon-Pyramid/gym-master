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

function MovimientoRow({
  movimiento,
}: {
  movimiento: AsistenciaMovimientoResumen;
}) {
  const esSalida = movimiento.tipo_movimiento === "salida";

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold">
          {movimiento.socio?.nombre_completo || movimiento.socio_id}
        </p>
        <p className="text-xs text-muted-foreground">
          ID socio: {movimiento.socio_id}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-muted px-3 py-1 font-mono">
          {movimiento.fecha}
        </span>
        <span className="rounded-full bg-muted px-3 py-1 font-mono">
          Ingreso {movimiento.hora_ingreso?.slice(0, 5) || "--:--"}
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
            ? `Salida ${movimiento.hora_egreso?.slice(0, 5) || "--:--"}`
            : "Dentro"}
        </span>
      </div>
    </div>
  );
}

export default function AsistenciaAforoPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
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
      toast.error((error as Error).message || "No se pudo cargar el aforo");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
      `¿Registrar salida para ${movimiento.socio?.nombre_completo || movimiento.socio_id}?`,
    );
    if (!confirmar) return;

    try {
      const response = await registrarSalidaAdministrativa(movimiento.id);
      toast.success(response.message || "Salida registrada correctamente");
      await loadAforo(true);
    } catch (error: unknown) {
      toast.error((error as Error).message || "No se pudo registrar la salida");
    }
  };

  if (!isInitialized || loading) {
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
          <AppHeader title="Salida / Aforo" />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-black">
                  Control de salida y aforo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Monitoreo operativo en vivo de personas dentro del gimnasio.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/asistencias")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al listado
                </Button>
                <Button onClick={() => loadAforo(true)} disabled={refreshing}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {refreshing ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-emerald-100 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Dentro ahora
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
                    Capacidad máxima
                  </p>
                  <p className="text-4xl font-black">
                    {aforo?.capacidad_maxima ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Configurable por entorno
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-muted-foreground">
                    Ocupación
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
                    <p className="text-sm font-bold uppercase">Estado</p>
                  </div>
                  <p className="mt-2 text-2xl font-black capitalize">
                    {aforo?.estado ?? "normal"}
                  </p>
                  <p className="text-xs font-medium">{aforo?.mensaje_estado}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Entradas de hoy
                  </p>
                  <p className="text-2xl font-bold">
                    {aforo?.entradas_hoy ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Salidas de hoy
                  </p>
                  <p className="text-2xl font-bold">
                    {aforo?.salidas_hoy ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Abiertas antiguas
                  </p>
                  <p className="text-2xl font-bold">
                    {aforo?.asistencias_abiertas_antiguas ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Última lectura
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
                    Socios dentro ahora
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aforo?.socios_dentro?.length ? (
                    aforo.socios_dentro.map((movimiento) => (
                      <div
                        key={movimiento.id}
                        className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <MovimientoRow movimiento={movimiento} />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegisterExit(movimiento)}
                          className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Registrar salida
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No hay socios dentro en este momento.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Movimientos recientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aforo?.movimientos_recientes?.length ? (
                    aforo.movimientos_recientes.map((movimiento) => (
                      <MovimientoRow
                        key={movimiento.id}
                        movimiento={movimiento}
                      />
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Todavía no hay movimientos registrados hoy.
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
