"use client";

import { useState } from "react";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import EvolucionSocioForm from "@/components/forms/EvolucionSocioForm";
import EvolucionSocioTable from "@/components/tables/EvolucionSocioTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";

export default function EvolucionFisicaPage() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportRows, setExportRows] = useState<EvolucionSocio[]>([]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    if (!exportRows.length) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Evoluciones");
    worksheet.columns = [
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Peso", key: "peso", width: 10 },
      { header: "Cintura", key: "cintura", width: 12 },
      { header: "Bíceps", key: "bicep", width: 10 },
      { header: "Tríceps", key: "tricep", width: 10 },
      { header: "Pierna", key: "pierna", width: 10 },
      { header: "Glúteos", key: "gluteos", width: 10 },
      { header: "Pantorrilla", key: "pantorrilla", width: 14 },
      { header: "Altura", key: "altura", width: 10 },
      { header: "IMC", key: "imc", width: 10 },
      { header: "Observaciones", key: "observaciones", width: 40 },
    ];
    exportRows.forEach((e) => {
      worksheet.addRow({
        fecha: e.fecha ? new Date(e.fecha).toLocaleDateString() : "",
        peso: e.peso,
        cintura: e.cintura,
        bicep: e.bicep,
        tricep: e.tricep,
        pierna: e.pierna,
        gluteos: e.gluteos,
        pantorrilla: e.pantorrilla,
        altura: e.altura,
        imc: e.imc,
        observaciones: e.observaciones,
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Evolucion_Fisica.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Evolución física" />
          <main className="flex-1 p-6 space-y-8">
            {showForm && (
              <Card className="w-full">
                <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                  <h2 className="text-xl font-bold">Registrar medidas</h2>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cerrar
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  <EvolucionSocioForm
                    onCreated={() => setShowForm(false)}
                    onCancel={() => setShowForm(false)}
                  />
                </CardContent>
              </Card>
            )}
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Historial de medidas</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por peso, cintura, altura, observación..."
                      className="pl-8 sm:w-[300px] md:w-[240px] lg:w-[300px] w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                  <Button
                    onClick={handleExportExcel}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">Nueva Evolución</span>
                    <span className="sm:hidden">Nuevo</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <EvolucionSocioTable
                  searchTerm={searchTerm}
                  onDataChange={(rows) => setExportRows(rows)}
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
