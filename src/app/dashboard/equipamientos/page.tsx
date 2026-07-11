"use client";

import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCatalogosParametrizables } from "@/hooks/useCatalogosParametrizables";
import { Equipamento } from "@/interfaces/equipamiento.interface";
import { buildEquipamientoRiskRadar, equipamientoRiskTone } from "@/utils/equipamientoRisk";
import { AlertasMantenimientoEquipamientoResponse } from "@/interfaces/equipamientoAlertas.interface";
import { EquipamientoMantenimientoBiResponse } from "@/interfaces/equipamientoMantenimientoBi.interface";
import {
  getAllEquipamientos,
  deleteEquipamiento,
  getAlertasMantenimientoEquipamientos,
  getEquipamientoMantenimientoBi,
} from "@/services/equipamientoService";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import EquipamientoModal from "@/components/modal/EquipamientoModal";
import EquipamientoViewModal from "@/components/modal/EquipamientoViewModal";
import EquipamientoTable from "@/components/tables/EquipamientoTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  Search,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { useI18n } from "@/i18n/I18nProvider";
import ExcelJS from "exceljs";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const ESTADO_EQUIPAMIENTO_OPTIONS = ["operativo", "en mantenimiento", "fuera de servicio"];
const CHART_COLORS = ["#02a8e1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];
const PDF_CHART_COLORS: Array<[number, number, number]> = [
  [2, 168, 225],
  [34, 197, 94],
  [245, 158, 11],
  [239, 68, 68],
  [139, 92, 246],
  [20, 184, 166],
];

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function formatCurrency(value?: number | null) {
  return currencyFormatter.format(Number(value ?? 0));
}

function normalizeSearch(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))).sort();
}

function sanitizePdfText(value: unknown, fallback = "-") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function MetricCard({
  title,
  value,
  helper,
  tone = "slate",
}: {
  title: string;
  value: string | number;
  helper?: string;
  tone?: "red" | "amber" | "blue" | "emerald" | "slate" | "violet";
}) {
  const tones = {
    red: "border-red-100 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100",
    amber: "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
    blue: "border-blue-100 bg-blue-50 text-blue-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
    slate: "border-slate-100 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
    violet: "border-violet-100 bg-violet-50 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100",
  } as const;

  return (
    <Card className={tones[tone]}>
      <CardContent className="p-4">
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {helper && <p className="mt-1 text-xs opacity-70">{helper}</p>}
      </CardContent>
    </Card>
  );
}

export default function EquipamientosPage() {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const tStatus = (value?: string | null) => {
    switch (String(value ?? "").toLowerCase()) {
      case "operativo": return tx("operativo", "operational");
      case "en mantenimiento": return tx("en mantenimiento", "under maintenance");
      case "fuera de servicio": return tx("fuera de servicio", "out of service");
      default: return String(value ?? "");
    }
  };
  const tRiskLevel = (value?: string | null) => {
    switch (String(value ?? "").toLowerCase()) {
      case "bajo": return tx("bajo", "low");
      case "medio": return tx("medio", "medium");
      case "alto": return tx("alto", "high");
      case "critico":
      case "crítico": return tx("crítico", "critical");
      default: return String(value ?? "");
    }
  };
  const tRiskFactor = (value?: string | null) => {
    switch (String(value ?? "").toLowerCase()) {
      case "fuera de servicio": return tx("fuera de servicio", "out of service");
      case "en mantenimiento": return tx("en mantenimiento", "under maintenance");
      case "sin próxima revisión": return tx("sin próxima revisión", "no next review");
      case "revisión vencida": return tx("revisión vencida", "overdue review");
      case "revisión urgente": return tx("revisión urgente", "urgent review");
      case "revisión próxima": return tx("revisión próxima", "upcoming review");
      case "score de reemplazo": return tx("score de reemplazo", "replacement score");
      case "fallas repetidas": return tx("fallas repetidas", "repeated failures");
      case "costo reciente": return tx("costo reciente", "recent cost");
      default: return String(value ?? "");
    }
  };
  const tRiskMessage = (value?: string | null) => {
    switch (String(value ?? "")) {
      case "Intervención prioritaria: el equipo puede afectar operación, seguridad o costos.":
        return tx("Intervención prioritaria: el equipo puede afectar operación, seguridad o costos.", "Priority intervention: this equipment may affect operations, safety, or costs.");
      case "Planificar revisión técnica: hay señales de mantenimiento o reemplazo.":
        return tx("Planificar revisión técnica: hay señales de mantenimiento o reemplazo.", "Plan a technical review: there are signs of maintenance needs or replacement.");
      case "Mantener seguimiento preventivo y revisar en la próxima ronda técnica.":
        return tx("Mantener seguimiento preventivo y revisar en la próxima ronda técnica.", "Maintain preventive follow-up and review in the next technical round.");
      case "Equipo sin señales críticas con los datos disponibles.":
        return tx("Equipo sin señales críticas con los datos disponibles.", "This equipment shows no critical signals with the available data.");
      default:
        return String(value ?? "");
    }
  };
  const tAlertState = (value?: string | null) => {
    switch (String(value ?? "").toLowerCase()) {
      case "vencido": return tx("vencido", "overdue");
      case "proximo":
      case "próximo": return tx("próximo", "upcoming");
      case "sin_fecha":
      case "sin fecha": return tx("sin fecha", "no date");
      case "en_mantenimiento":
      case "en mantenimiento": return tx("en mantenimiento", "under maintenance");
      default: return String(value ?? "").replaceAll("_", " ");
    }
  };
  const tAlertMessage = (value?: string | null) => {
    const text = String(value ?? "").trim();
    let match = text.match(/^La revisión está vencida hace (\d+) días?\.$/i);
    if (match) return tx(text, `The review is overdue by ${match[1]} day${match[1] === "1" ? "" : "s"}.`);
    match = text.match(/^Próxima revisión en (\d+) días?\.$/i);
    if (match) return tx(text, `Next review in ${match[1]} day${match[1] === "1" ? "" : "s"}.`);
    return text;
  };
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [equipos, setEquipos] = useState<Equipamento[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipamento | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [equipoVer, setEquipoVer] = useState<Equipamento | null>(null);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [selectedUbicaciones, setSelectedUbicaciones] = useState<string[]>([]);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [alertasMantenimiento, setAlertasMantenimiento] =
    useState<AlertasMantenimientoEquipamientoResponse | null>(null);
  const [biMantenimiento, setBiMantenimiento] =
    useState<EquipamientoMantenimientoBiResponse | null>(null);
  const [loadingAlertas, setLoadingAlertas] = useState(false);
  const { catalogos } = useCatalogosParametrizables();

  const tipoEquipamientoCatalogo = useMemo(
    () => catalogos.find((catalogo) => catalogo.key === "tipo_equipamiento") ?? null,
    [catalogos],
  );
  const ubicacionEquipamientoCatalogo = useMemo(
    () => catalogos.find((catalogo) => catalogo.key === "ubicacion_equipamiento") ?? null,
    [catalogos],
  );

  const tipos = useMemo(() => {
    const catalogo = tipoEquipamientoCatalogo?.items
      ?.filter((item) => item.activo)
      .map((item) => item.nombre);
    const usados = equipos.map((equipo) => String(equipo.tipo ?? ""));
    return uniqueSorted([...(catalogo ?? []), ...usados]);
  }, [equipos, tipoEquipamientoCatalogo]);

  const estados = useMemo(() => ESTADO_EQUIPAMIENTO_OPTIONS, []);

  const ubicaciones = useMemo(() => {
    const catalogo = ubicacionEquipamientoCatalogo?.items
      ?.filter((item) => item.activo)
      .map((item) => item.nombre);
    const usadas = equipos.map((equipo) => String(equipo.ubicacion ?? ""));
    return uniqueSorted([...(catalogo ?? []), ...usadas]);
  }, [equipos, ubicacionEquipamientoCatalogo]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadEquipos = async () => {
    setLoading(true);
    try {
      const data = await getAllEquipamientos();
      setEquipos(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const loadMantenimientoAnalytics = async () => {
    try {
      setLoadingAlertas(true);
      const [alertas, bi] = await Promise.all([
        getAlertasMantenimientoEquipamientos(5),
        getEquipamientoMantenimientoBi(),
      ]);
      setAlertasMantenimiento(alertas);
      setBiMantenimiento(bi);
    } catch (error) {
      console.error("Error al cargar métricas de mantenimiento:", error);
      setAlertasMantenimiento(null);
      setBiMantenimiento(null);
    } finally {
      setLoadingAlertas(false);
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadEquipos();
      loadMantenimientoAnalytics();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTipos, selectedEstados, selectedUbicaciones, pageSize]);

  const filteredEquipos = useMemo(() => {
    let equiposFiltrados = [...equipos];

    if (selectedTipos.length > 0) {
      equiposFiltrados = equiposFiltrados.filter((e) => selectedTipos.includes(String(e.tipo ?? "")));
    }

    if (selectedEstados.length > 0) {
      equiposFiltrados = equiposFiltrados.filter((e) => selectedEstados.includes(String(e.estado ?? "")));
    }

    if (selectedUbicaciones.length > 0) {
      equiposFiltrados = equiposFiltrados.filter((e) =>
        selectedUbicaciones.includes(String(e.ubicacion ?? "")),
      );
    }

    if (searchTerm.trim() !== "") {
      const lower = normalizeSearch(searchTerm);
      equiposFiltrados = equiposFiltrados.filter((e) =>
        [e.nombre, e.tipo, e.estado, e.ubicacion, e.marca, e.modelo, e.observaciones]
          .map(normalizeSearch)
          .some((value) => value.includes(lower)),
      );
    }

    return equiposFiltrados;
  }, [equipos, searchTerm, selectedEstados, selectedTipos, selectedUbicaciones]);

  const totalPages = Math.max(1, Math.ceil(filteredEquipos.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEquipos = filteredEquipos.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Equipamientos");
    worksheet.columns = [
      { header: "ID", key: "id", width: 36 },
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Tipo", key: "tipo", width: 22 },
      { header: "Marca", key: "marca", width: 22 },
      { header: "Modelo", key: "modelo", width: 22 },
      { header: "Estado", key: "estado", width: 20 },
      { header: "Ubicación", key: "ubicacion", width: 24 },
      { header: "Última revisión", key: "ultima_revision", width: 18 },
      { header: "Próxima revisión", key: "proxima_revision", width: 18 },
    ];

    filteredEquipos.forEach((e) => {
      worksheet.addRow({
        id: e.id,
        nombre: e.nombre,
        tipo: e.tipo,
        marca: e.marca,
        modelo: e.modelo,
        estado: e.estado,
        ubicacion: e.ubicacion,
        ultima_revision: e.ultima_revision,
        proxima_revision: e.proxima_revision,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName("listado-equipamientos", "xlsx");
    a.click();
    window.URL.revokeObjectURL(url);
  };


  const handleDownloadPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let y = margin;

    const addPageIfNeeded = (needed = 14) => {
      if (y + needed > pageHeight - margin - 10) {
        doc.addPage();
        y = margin;
      }
    };

    const addReportFooters = () => {
      const totalPages = doc.getNumberOfPages();

      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Gym Master · Equipamiento y mantenimiento", margin, pageHeight - 5);
        doc.text(`Página ${page} de ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
      }
    };

    const sectionTitle = (title: string) => {
      addPageIfNeeded(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(title, margin, y);
      y += 7;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    };

    const drawMetric = (label: string, value: string, x: number, boxY: number, width: number) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, boxY, width, 18, 2, 2, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(label, x + 3, boxY + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(2, 132, 199);
      doc.text(value, x + 3, boxY + 14);
    };

    const drawHorizontalBars = (
      title: string,
      data: Array<{ label: string; total: number; costo?: number }>,
      x: number,
      boxY: number,
      width: number,
      height: number,
    ) => {
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, boxY, width, height, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(title, x + 4, boxY + 7);

      const rows = data.slice(0, 6);
      const max = Math.max(...rows.map((row) => row.total), 1);
      let rowY = boxY + 15;

      rows.forEach((row, index) => {
        const color = PDF_CHART_COLORS[index % PDF_CHART_COLORS.length];
        const barWidth = Math.max(4, ((width - 45) * row.total) / max);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(sanitizePdfText(row.label), x + 4, rowY + 3);
        doc.setFillColor(...color);
        doc.rect(x + 38, rowY, barWidth, 4, "F");
        doc.setFont("helvetica", "bold");
        doc.text(String(row.total), x + 40 + barWidth, rowY + 3.4);
        rowY += 7;
      });
    };

    const drawMonthlyCost = (
      title: string,
      data: Array<{ periodo: string; costo: number; mantenimientos: number }>,
      x: number,
      boxY: number,
      width: number,
      height: number,
    ) => {
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, boxY, width, height, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(title, x + 4, boxY + 7);

      const rows = data.slice(-6);
      const max = Math.max(...rows.map((row) => row.costo), 1);
      const chartBottom = boxY + height - 12;
      const barAreaHeight = height - 25;
      const gap = 3;
      const barWidth = Math.max(6, (width - 18 - gap * Math.max(rows.length - 1, 0)) / Math.max(rows.length, 1));

      rows.forEach((row, index) => {
        const barHeight = Math.max(2, (barAreaHeight * row.costo) / max);
        const bx = x + 7 + index * (barWidth + gap);
        const by = chartBottom - barHeight;
        doc.setFillColor(2, 168, 225);
        doc.rect(bx, by, barWidth, barHeight, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(row.periodo.slice(5), bx, chartBottom + 4);
      });
    };

    const drawTable = (headers: string[], rows: string[][], widths: number[]) => {
      const rowHeight = 7;

      const drawTableHeader = () => {
        addPageIfNeeded(rowHeight * 2);
        let x = margin;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setFillColor(15, 23, 42);
        doc.setDrawColor(30, 41, 59);
        doc.setTextColor(255, 255, 255);

        headers.forEach((header, index) => {
          doc.setFillColor(15, 23, 42);
          doc.setDrawColor(30, 41, 59);
          doc.setTextColor(255, 255, 255);
          doc.rect(x, y, widths[index], rowHeight, "FD");
          doc.text(sanitizePdfText(header), x + 2, y + 4.8);
          x += widths[index];
        });

        y += rowHeight;
      };

      drawTableHeader();

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      rows.forEach((row, rowIndex) => {
        if (y + rowHeight + 2 > pageHeight - margin) {
          doc.addPage();
          y = margin;
          drawTableHeader();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
        }

        let x = margin;
        const isEven = rowIndex % 2 === 0;

        row.forEach((cell, index) => {
          doc.setDrawColor(226, 232, 240);
          doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
          doc.rect(x, y, widths[index], rowHeight, "FD");
          doc.setTextColor(15, 23, 42);
          const text = doc.splitTextToSize(sanitizePdfText(cell), widths[index] - 4)[0] ?? "";
          doc.text(text, x + 2, y + 4.8);
          x += widths[index];
        });

        y += rowHeight;
      });

      y += 5;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(2, 132, 199);
    doc.text("Gym Master · Reporte de equipamiento y mantenimiento", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Generado: ${new Date().toLocaleString("es-AR")}`, margin, y);
    y += 6;
    doc.text(
      `Filtros: tipo=${selectedTipos.join(", ") || "todos"}; estado=${selectedEstados.join(", ") || "todos"}; ubicación=${selectedUbicaciones.join(", ") || "todas"}; búsqueda=${searchTerm || "sin búsqueda"}`,
      margin,
      y,
    );
    y += 8;

    sectionTitle("Resumen ejecutivo");
    const metricWidth = (pageWidth - margin * 2 - 10) / 6;
    const metricsY = y;
    drawMetric("Total equipos", String(biMantenimiento?.resumen.total_equipos ?? equipos.length), margin, metricsY, metricWidth);
    drawMetric("Operativos", String(biMantenimiento?.resumen.operativos ?? 0), margin + (metricWidth + 2) * 1, metricsY, metricWidth);
    drawMetric("En mantenimiento", String(biMantenimiento?.resumen.en_mantenimiento ?? 0), margin + (metricWidth + 2) * 2, metricsY, metricWidth);
    drawMetric("Fuera servicio", String(biMantenimiento?.resumen.fuera_de_servicio ?? 0), margin + (metricWidth + 2) * 3, metricsY, metricWidth);
    drawMetric("Vencidos", String(biMantenimiento?.resumen.vencidos ?? 0), margin + (metricWidth + 2) * 4, metricsY, metricWidth);
    drawMetric("Costo 90 días", formatCurrency(biMantenimiento?.resumen.costo_ultimos_90_dias), margin + (metricWidth + 2) * 5, metricsY, metricWidth);
    y += 25;

    sectionTitle("Gráficos de métricas");
    drawHorizontalBars("Estado del parque", biMantenimiento?.por_estado ?? [], margin, y, 86, 56);
    drawMonthlyCost("Costo mensual", biMantenimiento?.costo_mensual ?? [], margin + 94, y, 86, 56);
    drawHorizontalBars("Equipos por tipo", biMantenimiento?.por_tipo ?? [], margin + 188, y, 86, 56);
    y += 64;

    sectionTitle("Listado de equipamientos");
    drawTable(
      ["Nombre", "Tipo", "Estado", "Ubicación", "Marca/Modelo", "Próx. rev."],
      filteredEquipos.map((equipo) => [
        sanitizePdfText(equipo.nombre),
        sanitizePdfText(equipo.tipo),
        sanitizePdfText(equipo.estado),
        sanitizePdfText(equipo.ubicacion),
        `${sanitizePdfText(equipo.marca)} ${sanitizePdfText(equipo.modelo)}`.trim(),
        sanitizePdfText(equipo.proxima_revision),
      ]),
      [46, 32, 34, 34, 56, 34],
    );

    sectionTitle("Historial reciente de mantenimiento");
    drawTable(
      ["Equipo", "Fecha", "Tipo mant.", "Estado", "Costo", "Técnico"],
      (biMantenimiento?.mantenimientos_recientes ?? []).map((mantenimiento) => [
        sanitizePdfText(mantenimiento.equipo_nombre),
        sanitizePdfText(mantenimiento.fecha_mantenimiento),
        sanitizePdfText(mantenimiento.tipo_mantenimiento),
        sanitizePdfText(mantenimiento.estado),
        formatCurrency(mantenimiento.costo),
        sanitizePdfText(mantenimiento.tecnico_responsable),
      ]),
      [48, 28, 38, 32, 30, 60],
    );

    sectionTitle("Recomendaciones de venta/reemplazo");
    drawTable(
      ["Equipo", "Ubicación", "Score", "Costo 180", "Recomendación"],
      (biMantenimiento?.recomendaciones_reemplazo ?? []).map((item) => [
        sanitizePdfText(item.nombre),
        sanitizePdfText(item.ubicacion),
        String(item.score_reemplazo),
        formatCurrency(item.costo_180_dias),
        sanitizePdfText(item.recomendacion),
      ]),
      [48, 35, 20, 30, 103],
    );

    addReportFooters();
    doc.save(buildTimestampedDownloadFileName("reporte-equipamiento-mantenimiento", "pdf"));
  };

  const riskRadar = useMemo(() => {
    return buildEquipamientoRiskRadar(
      equipos,
      biMantenimiento?.recomendaciones_reemplazo ?? [],
    );
  }, [equipos, biMantenimiento]);

  const topRiskRadar = riskRadar.slice(0, 5);
  const riesgoAltoCritico = riskRadar.filter((item) => item.nivel === "critico" || item.nivel === "alto");
  const stateChartData = useMemo(() => (biMantenimiento?.por_estado ?? []).map((item) => ({ ...item, label: tStatus(item.label) })), [biMantenimiento?.por_estado, isEnglish]);
  const preventivosUrgentes = riskRadar.filter((item) =>
    item.diasParaRevision !== null && item.diasParaRevision <= 5,
  );
  const sinRevisionProgramada = riskRadar.filter((item) => item.diasParaRevision === null);

  if (!isInitialized) {
    return <div>{tx("Cargando...", "Loading...")}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const resumenAlertas = alertasMantenimiento?.resumen;
  const alertasOperativas = alertasMantenimiento?.alertas_operativas ?? [];
  const proximasAlertas = alertasOperativas.slice(0, 5);
  const resumenBi = biMantenimiento?.resumen;

  const handleRefreshMantenimiento = async () => {
    await Promise.all([loadEquipos(), loadMantenimientoAnalytics()]);
  };

  const activeFiltersCount = selectedTipos.length + selectedEstados.length + selectedUbicaciones.length;

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="!grid !min-h-0 !flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
          <AppHeader title={tx("Equipamientos", "Equipment")} />
          <main className="min-h-0 space-y-6 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            <section className="overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-5 text-white shadow-xl shadow-cyan-950/20 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
                    {tx("Infraestructura y salud operativa", "Infrastructure and operational health")}
                  </p>
                  <h1 className="text-2xl font-black sm:text-3xl">{tx("Equipamiento y mantenimiento final", "Equipment and maintenance overview")}</h1>
                  <p className="text-sm leading-6 text-cyan-50/85">
                    {tx("Vista ejecutiva para controlar estado del parque, próximos preventivos, alertas técnicas, costos y decisiones de reemplazo sin saltar entre módulos.", "Executive view to track fleet status, upcoming preventive tasks, technical alerts, costs, and replacement decisions without jumping between modules.")}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[460px]">
                  <Button type="button" onClick={() => router.push('/dashboard/infraestructura/equipamientos/preventivos')} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                    <CalendarClock className="mr-2 h-4 w-4" /> {tx("Preventivos", "Preventive maintenance")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push('/dashboard/infraestructura/etiquetas-qr')} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    <FileText className="mr-2 h-4 w-4" /> {tx("Etiquetas QR", "QR labels")}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleRefreshMantenimiento} disabled={loadingAlertas} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loadingAlertas ? "animate-spin" : ""}`} /> {tx("Actualizar", "Refresh")}
                  </Button>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <MetricCard title={tx("Vencidos", "Overdue")} value={resumenAlertas?.vencidos ?? 0} tone="red" />
              <MetricCard title={tx("Próximos", "Upcoming")} value={resumenAlertas?.proximos ?? 0} tone="amber" helper={tx("Umbral 5 días", "5-day threshold")} />
              <MetricCard title={tx("En mantenimiento", "Under maintenance")} value={resumenAlertas?.en_mantenimiento ?? 0} tone="blue" />
              <MetricCard title={tx("Sin fecha", "No date")} value={resumenAlertas?.sin_fecha ?? 0} tone="slate" />
              <MetricCard title={tx("Costo 90 días", "90-day cost")} value={formatCurrency(resumenBi?.costo_ultimos_90_dias)} tone="violet" />
              <MetricCard title={tx("Revisar reemplazo", "Review replacement")} value={resumenBi?.equipos_revisar_reemplazo ?? 0} tone="red" helper={tx("Score técnico/comercial", "Technical/commercial score")} />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="border-emerald-500/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-500/10 dark:text-emerald-100 lg:col-span-2">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-75">{tx("Lectura ejecutiva", "Executive summary")}</p>
                      <h2 className="mt-1 text-xl font-black">
                        {riesgoAltoCritico.length > 0 ? tx('Atención técnica prioritaria', 'Priority technical attention') : preventivosUrgentes.length > 0 ? tx('Preventivos por ejecutar', 'Preventive tasks to schedule') : tx('Parque controlado', 'Fleet under control')}
                      </h2>
                      <p className="mt-2 text-sm leading-6 opacity-85">
                        {riesgoAltoCritico.length > 0 ? tx(`Hay ${riesgoAltoCritico.length} equipo${riesgoAltoCritico.length === 1 ? '' : 's'} con riesgo alto/crítico. Conviene revisar antes de nuevas promociones o rutinas intensivas.`, `There ${riesgoAltoCritico.length === 1 ? 'is' : 'are'} ${riesgoAltoCritico.length} equipment item${riesgoAltoCritico.length === 1 ? '' : 's'} with high/critical risk. It is advisable to review them before new promotions or intensive routines.`) : preventivosUrgentes.length > 0 ? tx(`Hay ${preventivosUrgentes.length} preventivo${preventivosUrgentes.length === 1 ? '' : 's'} próximo${preventivosUrgentes.length === 1 ? '' : 's'} o vencido${preventivosUrgentes.length === 1 ? '' : 's'}. Programar atención reduce downtime.`, `There ${preventivosUrgentes.length === 1 ? 'is' : 'are'} ${preventivosUrgentes.length} upcoming or overdue preventive task${preventivosUrgentes.length === 1 ? '' : 's'}. Scheduling attention reduces downtime.`) : tx('No se detectan señales críticas con los datos actuales. Mantener revisión periódica y completar fechas faltantes.', 'No critical signals were detected with the current data. Maintain periodic reviews and complete missing dates.')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-cyan-500/30 bg-cyan-50 text-cyan-950 dark:bg-cyan-500/10 dark:text-cyan-100">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-75">{tx("Próximo paso", "Next step")}</p>
                  <p className="mt-2 text-lg font-bold">
                    {sinRevisionProgramada.length > 0 ? tx('Completar fechas de revisión', 'Complete review dates') : tx('Actualizar preventivos', 'Refresh preventive maintenance')}
                  </p>
                  <p className="mt-2 text-sm opacity-80">
                    {sinRevisionProgramada.length > 0
                      ? tx(`${sinRevisionProgramada.length} equipo${sinRevisionProgramada.length === 1 ? '' : 's'} sin próxima revisión.`, `${sinRevisionProgramada.length} equipment item${sinRevisionProgramada.length === 1 ? '' : 's'} without a next review.`)
                      : tx('Usá el panel preventivo para programar órdenes técnicas.', 'Use the preventive panel to schedule technical work orders.')}
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
                <CardHeader className="border-b p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h2 className="text-xl font-bold">{tx("Radar técnico del parque", "Technical fleet radar")}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tx("Score heurístico inspirado en CMMS: estado, próxima revisión, costos, fallas y señales de reemplazo.", "Heuristic score inspired by CMMS: status, next review, costs, failures, and replacement signals.")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs text-muted-foreground">{tx("Alto / crítico", "High / critical")}</p>
                      <p className="mt-1 text-2xl font-bold text-red-700">{riesgoAltoCritico.length}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs text-muted-foreground">{tx("Preventivos urgentes", "Urgent preventive tasks")}</p>
                      <p className="mt-1 text-2xl font-bold text-amber-700">{preventivosUrgentes.length}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs text-muted-foreground">{tx("Sin revisión", "No review")}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-700 dark:text-slate-100">{sinRevisionProgramada.length}</p>
                    </div>
                  </div>

                  {topRiskRadar.length ? (
                    <div className="space-y-2">
                      {topRiskRadar.map((item) => (
                        <div key={item.id} className="rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-950 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-slate-100">{item.nombre}</p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {item.tipo || tx("Sin tipo", "No type")} · {item.ubicacion || tx("Sin ubicación", "No location")}
                              </p>
                            </div>
                            <span className={`rounded-full border px-2 py-1 text-xs font-semibold capitalize ${equipamientoRiskTone[item.nivel]}`}>
                              {tRiskLevel(item.nivel)} · {item.score}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{tRiskMessage(item.mensaje)}</p>
                          {item.factores.length > 0 && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {tx("Factores", "Factors")}: {item.factores.map((factor) => tRiskFactor(factor)).join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                      Sin equipamientos cargados para analizar riesgo técnico.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-xl font-bold">{tx("Acciones sugeridas", "Suggested actions")}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tx("Próximos pasos operativos para reducir downtime, costos y fallas repetidas.", "Next operational steps to reduce downtime, costs, and repeated failures.")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {riesgoAltoCritico.length > 0 && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                      {tx(`Priorizar diagnóstico de ${riesgoAltoCritico.length} equipo${riesgoAltoCritico.length === 1 ? "" : "s"} con riesgo alto/crítico.`, `Prioritize diagnosis of ${riesgoAltoCritico.length} equipment item${riesgoAltoCritico.length === 1 ? "" : "s"} with high/critical risk.`)}
                    </div>
                  )}
                  {preventivosUrgentes.length > 0 && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                      {tx("Programar preventivos urgentes o vencidos para evitar salida de servicio.", "Schedule urgent or overdue preventive tasks to avoid service interruption.")}
                    </div>
                  )}
                  {sinRevisionProgramada.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:text-slate-300">
                      {tx("Completar próxima revisión en equipos sin fecha para mejorar trazabilidad.", "Complete the next review for equipment without a date to improve traceability.")}
                    </div>
                  )}
                  {(biMantenimiento?.recomendaciones_reemplazo?.length ?? 0) > 0 && (
                    <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-800">
                      {tx("Evaluar reparación vs. reemplazo en equipos con costo o correctivos repetidos.", "Evaluate repair vs. replacement for equipment with high cost or repeated corrective maintenance.")}
                    </div>
                  )}
                  {riesgoAltoCritico.length === 0 &&
                    preventivosUrgentes.length === 0 &&
                    sinRevisionProgramada.length === 0 &&
                    (biMantenimiento?.recomendaciones_reemplazo?.length ?? 0) === 0 && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                        No hay acciones críticas detectadas con los datos actuales.
                      </div>
                    )}

                  <div className="rounded-xl border bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    {tx("Próxima evolución sugerida: planes preventivos por tipo de máquina, órdenes técnicas avanzadas, repuestos, QR y downtime.", "Suggested next evolution: preventive plans by machine type, advanced technical work orders, spare parts, QR, and downtime.")}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 border-b p-4">
                  <div>
                    <h2 className="text-xl font-bold">{tx("Métricas de mantenimiento", "Maintenance metrics")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {tx("Costos, frecuencia y señales para decidir si mantener, reparar o reemplazar.", "Costs, frequency, and signals to decide whether to maintain, repair, or replace.")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRefreshMantenimiento}
                    disabled={loadingAlertas}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] dark:bg-slate-950 dark:text-cyan-300 dark:hover:bg-slate-900"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingAlertas ? "animate-spin" : ""}`} />
                    {tx("Actualizar", "Refresh")}
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-4 p-4 lg:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="mb-3 flex items-center gap-2 font-semibold">
                      <BarChart3 className="h-4 w-4" /> {tx("Estado del parque", "Fleet status")}
                    </div>
                    {biMantenimiento?.por_estado?.length ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={stateChartData}
                            dataKey="total"
                            nameKey="label"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                          >
                            {stateChartData.map((entry, index) => (
                              <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart label={tx("Sin datos para estado del parque.", "No data available for fleet status.")} />
                    )}
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="mb-3 flex items-center gap-2 font-semibold">
                      <TrendingUp className="h-4 w-4" /> {tx("Costo mensual", "Monthly cost")}
                    </div>
                    {biMantenimiento?.costo_mensual?.length ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={biMantenimiento.costo_mensual}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="costo" name={tx("Costo", "Cost")} fill="#02a8e1" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart label={tx("Sin costos mensuales para graficar.", "No monthly costs available to chart.")} />
                    )}
                  </div>

                  <div className="rounded-xl border p-4 lg:col-span-2">
                    <div className="mb-3 flex items-center gap-2 font-semibold">
                      <Wrench className="h-4 w-4" /> {tx("Mantenimientos por tipo", "Maintenance by type")}
                    </div>
                    {biMantenimiento?.por_tipo?.length ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={biMantenimiento.por_tipo} layout="vertical" margin={{ left: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis type="category" dataKey="label" />
                          <Tooltip />
                          <Bar dataKey="total" name={tx("Equipos", "Equipment")} fill="#22c55e" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart label={tx("Sin datos por tipo de equipamiento.", "No data available by equipment type.")} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b p-4">
                  <h2 className="text-xl font-bold">{tx("Recomendaciones operativas", "Operational recommendations")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {tx("Equipos con mantenimiento repetido, alto costo o estado crítico.", "Equipment with repeated maintenance, high cost, or critical status.")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {biMantenimiento?.recomendaciones_reemplazo?.length ? (
                    biMantenimiento.recomendaciones_reemplazo.map((item) => (
                      <div key={item.id_equipamiento} className="rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-slate-100">{item.nombre}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {item.tipo || tx("Sin tipo", "No type")} · {item.ubicacion || tx("Sin ubicación", "No location")}
                            </p>
                          </div>
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                            {tx("Score", "Score")} {item.score_reemplazo}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{item.recomendacion}</p>
                        <div className="mt-2 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                          <span>{tx("Correctivos 180 días", "Corrective work 180 days")}: {item.correctivos_180_dias}</span>
                          <span>{tx("Costo 180 días", "180-day cost")}: {formatCurrency(item.costo_180_dias)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                      {tx("No hay equipos con recomendación de reemplazo en este momento.", "There is no equipment with a replacement recommendation at this time.")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <div>
                  <h2 className="text-xl font-bold">{tx("Alertas de mantenimiento", "Maintenance alerts")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {tx("Control operativo basado en próxima revisión, estado del equipo y umbral de 5 días.", "Operational control based on the next review, equipment status, and a 5-day threshold.")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefreshMantenimiento}
                  disabled={loadingAlertas}
                  className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] dark:bg-slate-950 dark:text-cyan-300 dark:hover:bg-slate-900"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingAlertas ? "animate-spin" : ""}`} />
                  Actualizar alertas
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                {proximasAlertas.length === 0 ? (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                    No hay alertas operativas de mantenimiento con el umbral actual.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {proximasAlertas.map((alerta) => (
                      <div key={alerta.id} className="rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-slate-100">{alerta.nombre}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {alerta.tipo || tx("Sin tipo", "No type")} · {alerta.ubicacion || tx("Sin ubicación", "No location")}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              alerta.severidad === "critica"
                                ? "bg-red-100 text-red-700"
                                : alerta.severidad === "alta"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {tAlertState(alerta.estado_alerta)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{tAlertMessage(alerta.mensaje)}</p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {tx("Próxima revisión", "Next review")}: {alerta.proxima_revision || tx("sin fecha", "no date")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <div>
                  <h2 className="text-xl font-bold">{tx("Listado de equipamientos", "Equipment registry")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {tx(`${filteredEquipos.length} resultado${filteredEquipos.length === 1 ? "" : "s"} filtrado${filteredEquipos.length === 1 ? "" : "s"} de ${equipos.length} equipos activos.`, `${filteredEquipos.length} filtered result${filteredEquipos.length === 1 ? "" : "s"} out of ${equipos.length} active equipment item${equipos.length === 1 ? "" : "s"}.`)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tx("Tipos y ubicaciones se toman de catálogos parametrizables. Los estados se mantienen normalizados para control operativo.", "Types and locations come from parameterized catalogs. Statuses remain normalized for operational control.")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="flex items-center flex-grow gap-2 md:flex-grow-0">
                    <Popover open={filtrosOpen} onOpenChange={setFiltrosOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="min-w-[120px]">
                          <Filter className="w-4 h-4 mr-2" />
                          {tx("Filtros", "Filters")}
                          {activeFiltersCount > 0 && (
                            <span className="px-1 ml-1 text-xs text-blue-600 bg-blue-100 rounded-full">
                              {activeFiltersCount}
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-72" align="start">
                        <div className="p-4 space-y-4">
                          <div>
                            <div className="pb-2 text-sm font-medium text-gray-700 dark:text-slate-200">{tx("Tipo", "Type")}</div>
                            <div className="space-y-2">
                              {tipos.map((tipo) => (
                                <div key={tipo} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`tipo-${tipo}`}
                                    checked={selectedTipos.includes(tipo)}
                                    onCheckedChange={() =>
                                      setSelectedTipos((prev) =>
                                        prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
                                      )
                                    }
                                  />
                                  <label htmlFor={`tipo-${tipo}`} className="text-sm cursor-pointer">
                                    {tipo}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            <div className="pb-2 text-sm font-medium text-gray-700 dark:text-slate-200">{tx("Estado", "Status")}</div>
                            <div className="space-y-2">
                              {estados.map((estado) => (
                                <div key={tStatus(estado)} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`estado-${tStatus(estado)}`}
                                    checked={selectedEstados.includes(estado)}
                                    onCheckedChange={() =>
                                      setSelectedEstados((prev) =>
                                        prev.includes(estado)
                                          ? prev.filter((e) => e !== estado)
                                          : [...prev, estado],
                                      )
                                    }
                                  />
                                  <label htmlFor={`estado-${tStatus(estado)}`} className="text-sm cursor-pointer">
                                    {tStatus(estado)}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            <div className="pb-2 text-sm font-medium text-gray-700 dark:text-slate-200">{tx("Ubicación", "Location")}</div>
                            <div className="space-y-2">
                              {ubicaciones.map((ubicacion) => (
                                <div key={ubicacion} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`ubicacion-${ubicacion}`}
                                    checked={selectedUbicaciones.includes(ubicacion)}
                                    onCheckedChange={() =>
                                      setSelectedUbicaciones((prev) =>
                                        prev.includes(ubicacion)
                                          ? prev.filter((u) => u !== ubicacion)
                                          : [...prev, ubicacion],
                                      )
                                    }
                                  />
                                  <label htmlFor={`ubicacion-${ubicacion}`} className="text-sm cursor-pointer">
                                    {ubicacion}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSelectedTipos([]);
                              setSelectedEstados([]);
                              setSelectedUbicaciones([]);
                            }}
                          >
                            Limpiar filtros
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder={tx("Buscar nombre, marca, modelo, tipo, ubicación...", "Search name, brand, model, type, location...")}
                        className="pl-8 sm:w-[320px] md:w-[260px] lg:w-[360px] w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/parametrizacion")}
                    className="flex items-center gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">{tx("Catálogos", "Catalogs")}</span>
                  </Button>

                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] dark:bg-slate-950 dark:text-cyan-300 dark:hover:bg-slate-900"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">{tx("Descargar PDF", "Download PDF")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] dark:bg-slate-950 dark:text-cyan-300 dark:hover:bg-slate-900"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">{tx("Exportar", "Export")}</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setOpenModal(true);
                      setSelectedEquipo(null);
                    }}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">{tx("Añadir Equipo", "Add equipment")}</span>
                    <span className="sm:hidden">{tx("Añadir", "Add")}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {loading ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    {tx("Cargando equipamientos...", "Loading equipment...")}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <EquipamientoTable
                        equipos={paginatedEquipos}
                        onEdit={(equipo) => {
                          setSelectedEquipo(equipo);
                          setOpenModal(true);
                        }}
                        onView={(equipo) => {
                          setEquipoVer(equipo);
                          setOpenModalVer(true);
                        }}
                        onDelete={async (equipo) => {
                          const confirmar = window.confirm(tx("¿Está seguro de eliminar el equipo?", "Are you sure you want to delete the equipment?"));
                          if (!confirmar) return;
                          await deleteEquipamiento(equipo.id);
                          await handleRefreshMantenimiento();
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                      <div className="text-sm text-muted-foreground">
                        {tx(`Página ${safeCurrentPage} de ${totalPages} · mostrando ${paginatedEquipos.length} de ${filteredEquipos.length}`, `Page ${safeCurrentPage} of ${totalPages} · showing ${paginatedEquipos.length} of ${filteredEquipos.length}`)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                        >
                          {PAGE_SIZE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option} {tx("por página", "per page")}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={safeCurrentPage <= 1}
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {tx("Anterior", "Previous")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={safeCurrentPage >= totalPages}
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        >
                          {tx("Siguiente", "Next")}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
      <EquipamientoModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedEquipo(null);
        }}
        onCreated={handleRefreshMantenimiento}
        equipoId={selectedEquipo ? selectedEquipo.id : null}
      />
      <EquipamientoViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setEquipoVer(null);
        }}
        equipoId={equipoVer ? equipoVer.id : null}
      />
    </SidebarProvider>
  );
}
