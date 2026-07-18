"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import { Download, FileSpreadsheet, Search } from "lucide-react";
import { toast } from "sonner";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppHeader } from "@/components/header/AppHeader";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import EvolucionSocioForm from "@/components/forms/EvolucionSocioForm";
import EvolucionSocioTable from "@/components/tables/EvolucionSocioTable";
import EvolucionFisicaDashboard from "@/components/dashboard/evolucion-fisica/EvolucionFisicaDashboard";
import EvolucionFisicaViewModal from "@/components/modal/EvolucionFisicaViewModal";
import EvolucionFisicaRagCoachPanel from "@/components/dashboard/evolucion-fisica/EvolucionFisicaRagCoachPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/authStore";
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";
import {
  getSociosBasicos,
  SocioBasico,
} from "@/services/evolucionSocioClient";
import { descargarEvolucionFisicaPdf } from "@/utils/evolucionFisicaPdf";
import { formatFrontendDate } from '@/utils/dateFormat';
import { useI18n } from "@/i18n/I18nProvider";

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
  return Number.isNaN(date.getTime()) ? "" : formatFrontendDate(value, 'es-AR', "");
};


interface DashboardChartLegendItem {
  label: string;
  color: string;
}

interface DashboardChartSnapshot {
  title: string;
  description?: string;
  dataUrl: string;
  width: number;
  height: number;
  legends?: DashboardChartLegendItem[];
}

const getChartLegends = (title: string): DashboardChartLegendItem[] => {
  const normalizedTitle = title.trim().toLowerCase();

  if (normalizedTitle.includes("peso")) {
    return [
      { label: "Peso", color: "#02a8e1" },
      { label: "IMC", color: "#6d28d9" },
    ];
  }

  if (normalizedTitle.includes("composición") || normalizedTitle.includes("composicion")) {
    return [
      { label: "% grasa", color: "#f97316" },
      { label: "Masa muscular", color: "#16a34a" },
    ];
  }

  if (normalizedTitle.includes("medidas")) {
    return [
      { label: "Cintura", color: "#0f172a" },
      { label: "Pecho", color: "#0284c7" },
      { label: "Cadera", color: "#db2777" },
    ];
  }

  return [];
};

const waitForChartPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const svgToPngDataUrl = async (
  svgElement: SVGSVGElement,
  scale = 2
): Promise<{ dataUrl: string; width: number; height: number } | null> => {
  const rect = svgElement.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  if (!width || !height) return null;

  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("width", String(width));
  clonedSvg.setAttribute("height", String(height));

  if (!clonedSvg.getAttribute("viewBox")) {
    clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  const background = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", String(width));
  background.setAttribute("height", String(height));
  background.setAttribute("fill", "#ffffff");
  clonedSvg.insertBefore(background, clonedSvg.firstChild);

  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `
    text { font-family: Arial, Helvetica, sans-serif; }
    .recharts-cartesian-axis-tick-value,
    .recharts-legend-item-text { fill: #4b5563; }
  `;
  clonedSvg.insertBefore(style, clonedSvg.firstChild);

  const svgText = new XMLSerializer().serializeToString(clonedSvg);
  const svgBlob = new Blob([svgText], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo capturar el gráfico"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {
      dataUrl: canvas.toDataURL("image/png"),
      width,
      height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
};

const captureDashboardChartSnapshots = async (): Promise<DashboardChartSnapshot[]> => {
  if (typeof document === "undefined") return [];

  await waitForChartPaint();

  const cards = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-evolucion-pdf-chart-card="true"]'
    )
  );

  const snapshots: DashboardChartSnapshot[] = [];

  for (const card of cards) {
    const svg = card.querySelector<SVGSVGElement>("svg.recharts-surface");
    if (!svg) continue;

    try {
      const png = await svgToPngDataUrl(svg);
      if (!png) continue;

      const title = card.dataset.chartTitle || "Gráfico de evolución";

      snapshots.push({
        title,
        description: card.dataset.chartDescription || undefined,
        dataUrl: png.dataUrl,
        width: png.width,
        height: png.height,
        legends: getChartLegends(title),
      });
    } catch (error) {
      console.warn("No se pudo capturar un gráfico para el PDF:", error);
    }
  }

  return snapshots;
};

export default function EvolucionFisicaPage() {
  const { user } = useAuthStore();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = useCallback((es: string, en: string) => (isEnglish ? en : es), [isEnglish]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportRows, setExportRows] = useState<EvolucionSocio[]>([]);
  const [dashboardRows, setDashboardRows] = useState<EvolucionSocio[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [socios, setSocios] = useState<SocioBasico[]>([]);
  const [selectedSocioId, setSelectedSocioId] = useState("me");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [selectedEvolucion, setSelectedEvolucion] = useState<EvolucionSocio | null>(null);

  const userRole = user?.rol?.trim().toLowerCase() ?? "";
  const isAdmin = userRole === "admin" || userRole === "administrador";

  useEffect(() => {
    let mounted = true;

    if (!isAdmin) {
      setSocios([]);
      setSelectedSocioId("me");
      return () => {
        mounted = false;
      };
    }

    (async () => {
      const res = await getSociosBasicos();

      if (!mounted) return;

      if (res.ok && res.data.length > 0) {
        setSocios(res.data);

        setSelectedSocioId((current) => {
          const currentStillExists = res.data.some(
            (socio) => getSocioId(socio) === current
          );

          if (current && current !== "me" && currentStillExists) {
            return current;
          }

          return getSocioId(res.data[0]) || "me";
        });
      } else {
        setSocios([]);
        setSelectedSocioId("me");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const effectiveSocioId = useMemo(
    () => (isAdmin ? selectedSocioId || "me" : "me"),
    [isAdmin, selectedSocioId]
  );

  const selectedSocioName = useMemo(() => {
    if (!isAdmin || effectiveSocioId === "me") {
      const authenticatedName = user?.nombre?.trim();
      const authenticatedEmail = user?.email?.trim();

      return authenticatedName || authenticatedEmail || tx("Socio autenticado", "Authenticated member");
    }

    const selectedSocio = socios.find((socio) => getSocioId(socio) === effectiveSocioId);

    return selectedSocio ? formatSocioName(selectedSocio) : tx("Socio", "Member");
  }, [effectiveSocioId, isAdmin, socios, tx, user?.email, user?.nombre]);

  const canRenderEvolutionData = !isAdmin || effectiveSocioId !== "me";

  const handleDownloadPdf = async () => {
    if (!exportRows.length) {
      toast.warning(tx("No hay registros para descargar", "There are no records to download"));
      return;
    }

    setGeneratingPdf(true);

    try {
      const dashboardCharts = await captureDashboardChartSnapshots();

      await descargarEvolucionFisicaPdf({
        rows: exportRows,
        socioNombre: selectedSocioName,
        logoUrl: "/gm_logo.svg",
        dashboardCharts,
        locale,
      });

      toast.success(tx("PDF de evolución física generado", "Physical evolution PDF generated"));
    } catch (error) {
      console.error("Error al generar PDF de evolución física:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : tx("No se pudo generar el PDF de evolución física", "Could not generate the physical evolution PDF")
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
    a.download = buildTimestampedDownloadFileName("listado-evolucion-fisica", "xlsx");
    a.click();

    window.URL.revokeObjectURL(url);
  };

  const handleCreated = () => {
    setShowForm(false);
    setRefreshKey((value) => value + 1);
  };

  const handleLoadedDataChange = useCallback((rows: EvolucionSocio[]) => {
    setDashboardRows(rows);
  }, []);

  return (
    <SidebarProvider>
      <div className="gm-dashboard-page-evolucion-fisica gm-dashboard-shell flex min-h-[100dvh] w-full bg-background">
        <AppSidebar />
        <SidebarInset className="gm-evolucion-fisica-inset min-h-[100dvh]">
          <AppHeader title={tx("Evolución física", "Physical evolution")} />
          <section data-gm-dashboard-content="true" className="gm-evolucion-fisica-content flex-1 space-y-4 p-3 pb-4 sm:p-4 sm:pb-5 md:space-y-8 md:p-6 md:pb-6">
            <Card className="w-full overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
              <CardHeader className="space-y-2 border-b bg-gradient-to-r from-sky-50 to-background p-4 dark:from-slate-900 dark:to-background">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#02a8e1]">
                  {tx("Progreso del socio", "Member progress")}
                </p>
                <h1 className="text-xl font-bold md:text-2xl">{tx("Evolución física", "Physical evolution")}</h1>
                <p className="text-sm text-muted-foreground">
                  {tx("Registro profesional de medidas corporales, composición física e historial comparativo del socio.", "Professional record of body measurements, body composition, and member comparison history.")}
                </p>
              </CardHeader>
              <CardContent
                className={`flex flex-col gap-4 p-4 md:flex-row md:items-end ${
                  isAdmin ? "md:justify-between" : "md:justify-end"
                }`}
              >
                {isAdmin && (
                  <div className="space-y-2">
                    <label htmlFor="socioId" className="text-sm font-medium">
                      {tx("Socio a consultar", "Member to review")}
                    </label>
                    <select
                      id="socioId"
                      value={selectedSocioId}
                      onChange={(e) => {
                        setSelectedSocioId(e.target.value || "me");
                        setShowForm(false);
                        setSelectedEvolucion(null);
                      }}
                      className="h-10 w-full max-w-xl rounded-md border bg-background px-3 text-sm md:min-w-[380px]"
                    >
                      <option value="me" disabled>
                        {tx("Seleccionar socio", "Select member")}
                      </option>
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
                        {tx("No hay socios disponibles para consultar en este momento.", "There are no members available to review right now.")}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-end md:ml-auto">
                  <Button
                    onClick={() => setShowForm(true)}
                    disabled={!canRenderEvolutionData}
                    className="w-full bg-[#02a8e1] hover:bg-[#0288b1] md:w-auto"
                  >
                    {tx("Nueva evolución", "New evolution")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showForm && (
              <Card className="w-full">
                <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap">
                  <h2 className="text-xl font-bold">{tx("Registrar medidas", "Register measurements")}</h2>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    {tx("Cerrar", "Close")}
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

            {canRenderEvolutionData && (
              <EvolucionFisicaRagCoachPanel
                socioId={effectiveSocioId}
                socioNombre={selectedSocioName}
              />
            )}

            {canRenderEvolutionData ? (
              <EvolucionFisicaDashboard
                rows={dashboardRows}
                socioNombre={selectedSocioName}
              />
            ) : (
              <Card className="w-full rounded-2xl border bg-card text-card-foreground shadow-sm">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  {tx("Seleccioná un socio para consultar su evolución física.", "Select a member to review their physical evolution.")}
                </CardContent>
              </Card>
            )}

            {canRenderEvolutionData && (
              <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap">
                <div>
                  <h2 className="text-lg font-bold sm:text-xl">{tx("Historial de medidas", "Measurement history")}</h2>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    {tx("Revisá las mediciones cargadas y abrí cada registro para ver el detalle completo.", "Review the loaded measurements and open each record to see the full detail.")}
                  </p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={tx("Buscar por fecha, peso, cintura, observación...", "Search by date, weight, waist, note...")}
                      className="w-full pl-8 sm:w-[300px] md:w-[240px] lg:w-[300px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    disabled={!exportRows.length || generatingPdf}
                    className="flex items-center gap-2 border-[#02a8e1] bg-background text-[#02a8e1] hover:bg-[#e6f7fd] dark:bg-slate-950 dark:hover:bg-sky-950/60"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {generatingPdf ? tx("Generando PDF...", "Generating PDF...") : tx("Descargar PDF", "Download PDF")}
                    </span>
                    <span className="sm:hidden">
                      {generatingPdf ? tx("Generando...", "Generating...") : "PDF"}
                    </span>
                  </Button>
                  {isAdmin && (
                    <Button
                      onClick={handleExportExcel}
                      variant="outline"
                      disabled={!exportRows.length}
                      className="hidden items-center gap-2 border-[#02a8e1] bg-background text-[#02a8e1] hover:bg-[#e6f7fd] dark:bg-slate-950 dark:hover:bg-sky-950/60 sm:flex"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>{tx("Exportar", "Export")}</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <EvolucionSocioTable
                  socioId={effectiveSocioId}
                  refreshKey={refreshKey}
                  searchTerm={searchTerm}
                  onDataChange={(rows) => setExportRows(rows)}
                  onLoadedDataChange={handleLoadedDataChange}
                  onView={(evolucion) => setSelectedEvolucion(evolucion)}
                />
              </CardContent>
            </Card>
            )}
          </section>
          <AppFooter className="gm-evolucion-fisica-footer mt-0" />
        </SidebarInset>
        <EvolucionFisicaViewModal
          open={Boolean(selectedEvolucion)}
          onClose={() => setSelectedEvolucion(null)}
          evolucion={selectedEvolucion}
          socioNombre={selectedSocioName}
        />
      </div>
    </SidebarProvider>
  );
}
