"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Search, ShieldCheck } from "lucide-react";
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
import { descargarEvolucionFisicaPdf } from "@/utils/evolucionFisicaPdf";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";

const isAdminRole = (rol?: string | null) => {
  const normalized = rol?.trim().toLowerCase();
  return normalized === "admin" || normalized === "administrador";
};

export default function GestorEvolucionFisicaDetallePage() {
  const router = useRouter();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const params = useParams<{ socioId: string }>();
  const socioId = params.socioId;
  const { isAuthenticated, initializeAuth, isInitialized, user } = useAuthStore();
  const [dashboardRows, setDashboardRows] = useState<EvolucionSocio[]>([]);
  const [tableRows, setTableRows] = useState<EvolucionSocio[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvolucion, setSelectedEvolucion] = useState<EvolucionSocio | null>(null);
  const [sociosResumen, setSociosResumen] = useState<EvolucionFisicaAdminResumen[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);

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
    return socio?.nombre_completo || tx("Socio", "Member");
  }, [socioId, sociosResumen]);

  const handleDownloadPdf = async () => {
    if (!dashboardRows.length) {
      toast.warning(tx("No hay registros para descargar", "There are no records to download"));
      return;
    }

    setGeneratingPdf(true);

    try {
      await descargarEvolucionFisicaPdf({
        rows: dashboardRows,
        socioNombre,
        logoUrl: "/gm_logo.svg",
        locale,
      });

      toast.success(tx("PDF de evolución física generado", "Physical evolution PDF generated"));
    } catch (error) {
      console.error("Error al generar PDF de evolución física:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : tx("No se pudo generar el PDF de evolución física", "The physical evolution PDF could not be generated")
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!isInitialized) {
    return <div className="flex h-screen items-center justify-center">{tx("Cargando...", "Loading...")}</div>;
  }

  if (!isAuthenticated || !isAdminRole(user?.rol)) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={tx("Detalle de Evolución Física", "Physical evolution detail")} />
          <main className="flex-1 space-y-6 p-6">
            <Card className="w-full">
              <CardHeader className="border-b p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {tx("Evolución física de", "Physical evolution of")} {socioNombre}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#02a8e1]" />
                      {tx("Vista administrativa solo lectura. Los valores no se editan desde este gestor.", "Read-only administrative view. Values are not edited from this manager.")}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDownloadPdf}
                      disabled={!dashboardRows.length || generatingPdf}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {generatingPdf ? tx("Generando PDF...", "Generating PDF...") : tx("Descargar PDF", "Download PDF")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/gestor-evolucion-fisica")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {tx("Volver al gestor", "Back to manager")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 text-sm text-muted-foreground">
                {tx("Registros cargados", "Loaded records")}: {dashboardRows.length}. {tx("Resultados filtrados", "Filtered results")}: {tableRows.length}.
              </CardContent>
            </Card>

            <EvolucionFisicaDashboard rows={dashboardRows} socioNombre={socioNombre} />

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap">
                <div>
                  <CardTitle className="text-xl font-bold">{tx("Historial de medidas", "Measurement history")}</CardTitle>
                  <CardDescription>
                    {tx("Consulta cronológica de registros físicos del socio.", "Chronological view of the member physical records.")}
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-[320px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={tx("Buscar en registros...", "Search records...")}
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
