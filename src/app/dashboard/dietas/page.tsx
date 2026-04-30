"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, FileSpreadsheet } from "lucide-react";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import DietaHistorial from "@/components/tables/DietaHistorial";
import DietaForm from "@/components/forms/DietaForm";

export default function DietasPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);

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
        .download("Historial_Dietas.pdf");
    });
  };

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Dietas" />
          <main className="flex-1 p-6 space-y-6">
            {openModal && (
              <Card className="w-full">
                <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                  <h2 className="text-xl font-bold">Nueva Dieta</h2>
                  <Button variant="outline" onClick={() => setOpenModal(false)}>
                    Cerrar
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  <DietaForm />
                </CardContent>
              </Card>
            )}
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Historial de Dietas</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="flex items-center flex-grow gap-2 md:flex-grow-0">
                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar dieta..."
                        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                    onClick={() => setOpenModal(true)}
                  >
                    Nueva Dieta
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {user?.id && <DietaHistorial userId={user.id} />}
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
