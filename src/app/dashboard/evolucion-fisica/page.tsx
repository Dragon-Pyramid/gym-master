"use client";

import { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { Download, FileSpreadsheet, Search } from "lucide-react";
import { toast } from "sonner";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppHeader } from "@/components/header/AppHeader";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import EvolucionSocioForm from "@/components/forms/EvolucionSocioForm";
import EvolucionSocioTable from "@/components/tables/EvolucionSocioTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";
import {
  getSociosBasicos,
  SocioBasico,
} from "@/services/evolucionSocioClient";
import { descargarEvolucionFisicaPdf } from "@/utils/evolucionFisicaPdf";

const formatSocioName = (socio: SocioBasico) => {
  const nombreCompleto = socio.nombre_completo;

  if (nombreCompleto?.trim()) {
    return nombreCompleto.trim();
  }

  const nombre =
    socio.nombre ||
    socio.usuario?.nombre ||
    [socio.usuario?.nombre, socio.usuario?.apellido].filter(Boolean).join(" ");

  const apellido = socio.apellido || socio.usuario?.apellido;
  const email = socio.email || socio.usuario?.email;

  const fullName = [nombre, apellido]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return fullName || email || socio.id_socio || socio.id || "Socio";
};

const getSocioId = (socio: SocioBasico) => socio.id_socio || socio.id || "";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
};

export default function EvolucionFisicaPage() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportRows, setExportRows] = useState<EvolucionSocio[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [socios, setSocios] = useState<SocioBasico[]>([]);
  const [selectedSocioId, setSelectedSocioId] = useState("me");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await getSociosBasicos();

      if (mounted && res.ok && res.data.length > 0) {
        setSocios(res.data);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const effectiveSocioId = useMemo(
    () => selectedSocioId || "me",
    [selectedSocioId]
  );

  const selectedSocioName = useMemo(() => {
    if (effectiveSocioId === "me") {
      return "Socio autenticado";
    }

    const selectedSocio = socios.find((socio) => getSocioId(socio) === effectiveSocioId);

    return selectedSocio ? formatSocioName(selectedSocio) : "Socio";
  }, [effectiveSocioId, socios]);

  const handleDownloadPdf = async () => {
    if (!exportRows.length) {
      toast.warning("No hay registros para descargar");
      return;
    }

    setGeneratingPdf(true);

    try {
      await descargarEvolucionFisicaPdf({
        rows: exportRows,
        socioNombre: selectedSocioName,
        logoUrl: "/gm_logo.svg",
      });

      toast.success("PDF de evolución física generado");
    } catch (error) {
      console.error("Error al generar PDF de evolución física:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo generar el PDF de evolución física"
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (!exportRows.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Evolucion Fisica");

    worksheet.columns = [
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Peso", key: "peso", width: 12 },
      { header: "Altura", key: "altura", width: 12 },
      { header: "IMC", key: "imc", width: 10 },
      { header: "Pecho", key: "pecho", width: 12 },
      { header: "Cintura", key: "cintura", width: 12 },
      { header: "Cadera", key: "cadera", width: 12 },
      { header: "Abdomen", key: "abdomen", width: 12 },
      { header: "Cuello", key: "cuello", width: 12 },
      { header: "Hombros", key: "hombros", width: 12 },
      { header: "Bíceps Izq.", key: "biceps_izquierdo", width: 14 },
      { header: "Bíceps Der.", key: "biceps_derecho", width: 14 },
      { header: "Tríceps Izq.", key: "triceps_izquierdo", width: 14 },
      { header: "Tríceps Der.", key: "triceps_derecho", width: 14 },
      { header: "Muslo Izq.", key: "muslo_izquierdo", width: 14 },
      { header: "Muslo Der.", key: "muslo_derecho", width: 14 },
      { header: "Pantorrilla Izq.", key: "pantorrilla_izquierda", width: 18 },
      { header: "Pantorrilla Der.", key: "pantorrilla_derecha", width: 18 },
      { header: "% Grasa", key: "porcentaje_grasa", width: 12 },
      { header: "Masa muscular", key: "masa_muscular", width: 16 },
      { header: "Tipo corporal", key: "tipo_corporal", width: 16 },
      { header: "Sexo referencia", key: "sexo_referencia", width: 18 },
      { header: "Registro inicial", key: "es_registro_inicial", width: 18 },
      { header: "Observaciones", key: "observaciones", width: 50 },
    ];

    exportRows.forEach((e) => {
      worksheet.addRow({
        fecha: formatDate(e.fecha),
        peso: e.peso ?? "",
        altura: e.altura ?? "",
        imc: e.imc ?? "",
        pecho: e.pecho ?? "",
        cintura: e.cintura ?? "",
        cadera: e.cadera ?? "",
        abdomen: e.abdomen ?? "",
        cuello: e.cuello ?? "",
        hombros: e.hombros ?? "",
        biceps_izquierdo: e.biceps_izquierdo ?? "",
        biceps_derecho: e.biceps_derecho ?? "",
        triceps_izquierdo: e.triceps_izquierdo ?? "",
        triceps_derecho: e.triceps_derecho ?? "",
        muslo_izquierdo: e.muslo_izquierdo ?? "",
        muslo_derecho: e.muslo_derecho ?? "",
        pantorrilla_izquierda: e.pantorrilla_izquierda ?? "",
        pantorrilla_derecha: e.pantorrilla_derecha ?? "",
        porcentaje_grasa: e.porcentaje_grasa ?? "",
        masa_muscular: e.masa_muscular ?? "",
        tipo_corporal: e.tipo_corporal ?? "",
        sexo_referencia: e.sexo_referencia ?? "",
        es_registro_inicial: e.es_registro_inicial ? "Sí" : "No",
        observaciones: e.observaciones ?? "",
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

  const handleCreated = () => {
    setShowForm(false);
    setRefreshKey((value) => value + 1);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Evolución física" />
          <main className="flex-1 space-y-8 p-6">
            <Card className="w-full">
              <CardHeader className="space-y-2 border-b p-4">
                <h1 className="text-2xl font-bold">Evolución física</h1>
                <p className="text-sm text-muted-foreground">
                  Registro profesional de medidas corporales, composición física e historial comparativo del socio.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <label htmlFor="socioId" className="text-sm font-medium">
                    Socio
                  </label>
                  <select
                    id="socioId"
                    value={selectedSocioId}
                    onChange={(e) => {
                      setSelectedSocioId(e.target.value || "me");
                      setShowForm(false);
                    }}
                    className="h-10 w-full max-w-xl rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="me">Mi evolución / socio autenticado</option>
                    {socios.map((socio) => {
                      const id = getSocioId(socio);
                      if (!id) return null;

                      return (
                        <option key={id} value={id}>
                          {formatSocioName(socio)}
                        </option>
                      );
                    })}
                  </select>
                  {socios.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Si ingresaste como socio, se usará tu perfil autenticado. Si ingresaste como administrador, aquí aparecerán los socios disponibles.
                    </p>
                  )}
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-[#02a8e1] hover:bg-[#0288b1] md:w-auto"
                  >
                    Nueva evolución
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showForm && (
              <Card className="w-full">
                <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap">
                  <h2 className="text-xl font-bold">Registrar medidas</h2>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cerrar
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  <EvolucionSocioForm
                    socioId={effectiveSocioId}
                    onCreated={handleCreated}
                    onCancel={() => setShowForm(false)}
                  />
                </CardContent>
              </Card>
            )}

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap">
                <h2 className="text-xl font-bold">Historial de medidas</h2>
                <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por fecha, peso, cintura, observación..."
                      className="w-full pl-8 sm:w-[300px] md:w-[240px] lg:w-[300px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    disabled={!exportRows.length || generatingPdf}
                    className="flex items-center gap-2 border-[#02a8e1] bg-white text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {generatingPdf ? "Generando PDF..." : "Descargar PDF"}
                    </span>
                    <span className="sm:hidden">
                      {generatingPdf ? "Generando..." : "PDF"}
                    </span>
                  </Button>
                  <Button
                    onClick={handleExportExcel}
                    variant="outline"
                    disabled={!exportRows.length}
                    className="flex items-center gap-2 border-[#02a8e1] bg-white text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <EvolucionSocioTable
                  socioId={effectiveSocioId}
                  refreshKey={refreshKey}
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
