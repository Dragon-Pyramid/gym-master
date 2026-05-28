"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, ShieldCheck } from "lucide-react";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppHeader } from "@/components/header/AppHeader";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import EvolucionFisicaDashboard from "@/components/dashboard/evolucion-fisica/EvolucionFisicaDashboard";
import EvolucionFisicaViewModal from "@/components/modal/EvolucionFisicaViewModal";
import EvolucionSocioTable from "@/components/tables/EvolucionSocioTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  EvolucionFisicaAdminResumen,
  EvolucionSocio,
} from "@/interfaces/evolucionSocio.interface";
import { getEvolucionFisicaAdminResumen } from "@/services/evolucionSocioClient";
import { useAuthStore } from "@/stores/authStore";

const isAdminRole = (rol?: string | null) => {
  const normalized = rol?.trim().toLowerCase();
  return normalized === "admin" || normalized === "administrador";
};

export default function GestorEvolucionFisicaDetallePage() {
  const router = useRouter();
  const params = useParams<{ socioId: string }>();
  const socioId = params.socioId;
  const { isAuthenticated, initializeAuth, isInitialized, user } = useAuthStore();
  const [dashboardRows, setDashboardRows] = useState<EvolucionSocio[]>([]);
  const [tableRows, setTableRows] = useState<EvolucionSocio[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvolucion, setSelectedEvolucion] = useState<EvolucionSocio | null>(null);
  const [sociosResumen, setSociosResumen] = useState<EvolucionFisicaAdminResumen[]>([]);

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

  useEffect(() => {
    let mounted = true;

    if (!isInitialized || !isAuthenticated || !isAdminRole(user?.rol)) {
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const res = await getEvolucionFisicaAdminResumen();
        if (mounted) setSociosResumen(res.data);
      } catch {
        if (mounted) setSociosResumen([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isInitialized, user?.rol]);

  const socioNombre = useMemo(() => {
    const socio = sociosResumen.find((item) => item.id_socio === socioId);
    return socio?.nombre_completo || "Socio";
  }, [socioId, sociosResumen]);

  if (!isInitialized) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  if (!isAuthenticated || !isAdminRole(user?.rol)) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Detalle de Evolución Física" />
          <main className="flex-1 space-y-6 p-6">
            <Card className="w-full">
              <CardHeader className="border-b p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      Evolución física de {socioNombre}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#02a8e1]" />
                      Vista administrativa solo lectura. Los valores no se editan desde este gestor.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/gestor-evolucion-fisica")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al gestor
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Registros cargados: {dashboardRows.length}. Resultados filtrados: {tableRows.length}.
              </CardContent>
            </Card>

            <EvolucionFisicaDashboard rows={dashboardRows} socioNombre={socioNombre} />

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap">
                <div>
                  <CardTitle className="text-xl font-bold">Historial de medidas</CardTitle>
                  <CardDescription>
                    Consulta cronológica de registros físicos del socio.
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-[320px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar en registros..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <EvolucionSocioTable
                  socioId={socioId}
                  searchTerm={searchTerm}
                  onDataChange={setTableRows}
                  onLoadedDataChange={setDashboardRows}
                  onView={setSelectedEvolucion}
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
      <EvolucionFisicaViewModal
        open={Boolean(selectedEvolucion)}
        onClose={() => setSelectedEvolucion(null)}
        evolucion={selectedEvolucion}
        socioNombre={socioNombre}
      />
    </SidebarProvider>
  );
}
