"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, FileSpreadsheet, PlusCircle, Utensils } from "lucide-react";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import DietaHistorial from "@/components/tables/DietaHistorial";
import DietaForm from "@/components/forms/DietaForm";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";

const isAdminRole = (rol?: string | null) => {
  const normalized = rol?.trim().toLowerCase();
  return normalized === "admin" || normalized === "administrador";
};

export default function DietasPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [dietasRefreshKey, setDietasRefreshKey] = useState(0);
  const usuarioEsAdmin = isAdminRole(user?.rol);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    import("pdfmake/build/pdfmake").then((pdfMake) => {
      pdfMake.default
        .createPdf({
          content: [
            {
              text: "Historial de Dietas",
              style: "header",
              margin: [0, 0, 0, 12],
            },
          ],
          styles: {
            header: {
              fontSize: 18,
              bold: true,
            },
          },
          defaultStyle: {
            fontSize: 10,
          },
          pageOrientation: "landscape",
        })
        .download(buildTimestampedDownloadFileName("historial-dietas", "pdf"));
    });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="!grid !h-[100dvh] !min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
          <AppHeader title="Dietas" />
          <section className="min-h-0 space-y-4 overflow-y-auto p-3 pb-24 md:space-y-6 md:p-6 md:pb-6">
            <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-slate-950 dark:to-sky-950/30 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-100 dark:ring-emerald-800">
                    <Utensils className="h-3.5 w-3.5" />
                    {usuarioEsAdmin ? "Gestión de dietas" : "Mi alimentación"}
                  </div>
                  <h1 className="text-2xl font-extrabold leading-tight text-slate-900 dark:text-slate-50 md:text-3xl">
                    {usuarioEsAdmin ? "Dietas de socios" : "Mis dietas"}
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {usuarioEsAdmin
                      ? "Consultá las dietas asignadas y generá nuevos planes alimentarios para los socios."
                      : "Tené tu plan alimentario a mano desde el celular, comida por comida, con fechas claras y descarga PDF."}
                  </p>
                </div>
                {usuarioEsAdmin ? (
                  <Button
                    className="w-full bg-[#02a8e1] hover:bg-[#0288b1] md:w-auto"
                    onClick={() => setOpenModal(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Dieta
                  </Button>
                ) : null}
              </div>
            </section>

            {openModal && usuarioEsAdmin && (
              <Card className="w-full rounded-3xl">
                <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap">
                  <h2 className="text-xl font-bold">Nueva Dieta</h2>
                  <Button variant="outline" onClick={() => setOpenModal(false)}>
                    Cerrar
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  <DietaForm
                    onSuccess={() => {
                      setDietasRefreshKey((current) => current + 1);
                      setOpenModal(false);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            <Card className="w-full rounded-3xl">
              <CardHeader className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {usuarioEsAdmin ? "Historial de Dietas" : "Historial de mis dietas"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {usuarioEsAdmin
                      ? "Buscá y revisá planes alimentarios cargados."
                      : "Abrí una dieta para ver el detalle completo desde el celular."}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                  <div className="relative w-full md:w-[280px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar dieta u objetivo..."
                      className="w-full pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {usuarioEsAdmin ? (
                    <div className="hidden gap-2 md:flex">
                      <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Exportar
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {user?.id_socio ? (
                  <DietaHistorial
                    socioId={user.id_socio}
                    refreshKey={dietasRefreshKey}
                    searchTerm={searchTerm}
                  />
                ) : usuarioEsAdmin ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Esta pantalla está optimizada para la vista del socio. Para gestionar dietas por socio, usá el Gestor de Dietas.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    No se pudo identificar el socio asociado a este usuario.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
