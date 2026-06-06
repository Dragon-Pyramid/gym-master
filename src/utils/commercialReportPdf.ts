"use client";

import jsPDF from "jspdf";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import {
  assertGimnasioBrandingReadyForCommercialDocs,
  getResolvedGimnasioBranding,
} from "@/utils/gimnasioBrandingClient";

export interface CommercialReportMetric {
  label: string;
  value: string | number;
}

export interface CommercialReportColumn<T> {
  header: string;
  width: number;
  getValue: (row: T, index: number) => string | number | null | undefined;
  align?: "left" | "right" | "center";
}

export interface CommercialReportChartSeries {
  key: string;
  label: string;
  color: [number, number, number];
}

export interface CommercialReportChart {
  title: string;
  kind: "bars" | "line";
  data: Array<Record<string, string | number | null | undefined>>;
  labelKey: string;
  series: CommercialReportChartSeries[];
}

export interface DownloadCommercialReportPdfParams<T> {
  title: string;
  subtitle?: string;
  fileName: string;
  rows: T[];
  columns: CommercialReportColumn<T>[];
  metrics?: CommercialReportMetric[];
  filtersLabel?: string;
  charts?: CommercialReportChart[];
  logoUrl?: string;
  pageOrientation?: "landscape" | "portrait";
  pageFormat?: "a4" | "a5";
  brandName?: string;
  brandSubtitle?: string;
  footerText?: string;
}

const PAGE_MARGIN = 12;
const HEADER_HEIGHT = 25;
const FOOTER_HEIGHT = 10;
const ROW_MIN_HEIGHT = 8;
const PRIMARY = [2, 168, 225] as const;
const DARK = [15, 23, 42] as const;
const MUTED = [100, 116, 139] as const;
const BORDER = [226, 232, 240] as const;

const normalizeText = (value: unknown, fallback = "-"): string => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const safeFileName = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
};

const loadImageAsPngDataUrl = async (
  src: string,
  maxWidth = 320,
  maxHeight = 320
): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!src || typeof window === "undefined") {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = src;
  });
};

const formatDateTime = (): string => {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
};

const addHeader = (
  doc: jsPDF,
  pageWidth: number,
  logoDataUrl: string | null,
  title: string,
  subtitle: string | undefined,
  brandName: string,
  brandSubtitle: string
) => {
  const isCompact = pageWidth < 170;
  const logoSize = isCompact ? 15 : 18;
  const logoY = isCompact ? 6 : 6;
  const brandX = PAGE_MARGIN + logoSize + 5;
  const titleX = pageWidth - PAGE_MARGIN;
  const headerAvailableWidth = pageWidth - PAGE_MARGIN * 2;
  const safeGap = isCompact ? 7 : 12;
  const leftMaxWidth = isCompact
    ? Math.max(42, (headerAvailableWidth - logoSize - safeGap) * 0.48)
    : Math.max(72, headerAvailableWidth * 0.44);
  const rightMaxWidth = isCompact
    ? Math.max(42, headerAvailableWidth - logoSize - safeGap - leftMaxWidth)
    : Math.max(72, headerAvailableWidth * 0.42);

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT + 7, "F");

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", PAGE_MARGIN, logoY, logoSize, logoSize);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(isCompact ? 11.5 : 13);
  doc.setTextColor(...DARK);
  doc.text(brandName, brandX, isCompact ? 11.5 : 12, { maxWidth: leftMaxWidth });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(isCompact ? 7.2 : 8.5);
  doc.setTextColor(...MUTED);
  const brandSubtitleLines = doc.splitTextToSize(brandSubtitle, leftMaxWidth).slice(0, 2);
  doc.text(brandSubtitleLines, brandX, isCompact ? 16 : 17);
  const generatedY = isCompact ? 16 + brandSubtitleLines.length * 3.7 + 1 : 22;
  doc.text(`Generado: ${formatDateTime()}`, brandX, Math.min(generatedY, HEADER_HEIGHT + 1), {
    maxWidth: leftMaxWidth,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(isCompact ? 12.2 : 15);
  doc.setTextColor(...DARK);
  doc.text(title, titleX, isCompact ? 11.5 : 12, {
    align: "right",
    maxWidth: rightMaxWidth,
  });

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(isCompact ? 7.2 : 8.5);
    doc.setTextColor(...MUTED);
    const subtitleLines = doc.splitTextToSize(subtitle, rightMaxWidth).slice(0, 2);
    doc.text(subtitleLines, titleX, isCompact ? 16.5 : 18, {
      align: "right",
    });
  }

  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(PAGE_MARGIN, HEADER_HEIGHT + 3, pageWidth - PAGE_MARGIN, HEADER_HEIGHT + 3);
};

const addFooter = (doc: jsPDF, pageWidth: number, pageHeight: number, footerText: string) => {
  const pageNumber = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(footerText, PAGE_MARGIN, pageHeight - 5);
  doc.text(`Página ${pageNumber}`, pageWidth - PAGE_MARGIN, pageHeight - 5, {
    align: "right",
  });
};

const drawMetrics = (
  doc: jsPDF,
  metrics: CommercialReportMetric[] | undefined,
  pageWidth: number,
  y: number
): number => {
  if (!metrics || metrics.length === 0) return y;

  const gap = 4;
  const availableWidth = pageWidth - PAGE_MARGIN * 2;
  const preferredWidth = (availableWidth - gap * (metrics.length - 1)) / metrics.length;
  const columnsPerRow = preferredWidth < 34 ? Math.min(2, metrics.length) : metrics.length;
  const cardWidth = (availableWidth - gap * (columnsPerRow - 1)) / columnsPerRow;
  const cardHeight = 17;

  metrics.forEach((metric, index) => {
    const row = Math.floor(index / columnsPerRow);
    const col = index % columnsPerRow;
    const x = PAGE_MARGIN + col * (cardWidth + gap);
    const cardY = y + row * (cardHeight + gap);

    doc.setDrawColor(...BORDER);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(metric.label, x + 3, cardY + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK);
    doc.text(normalizeText(metric.value, "0"), x + 3, cardY + 13);
  });

  const rowCount = Math.ceil(metrics.length / columnsPerRow);
  return y + rowCount * cardHeight + Math.max(0, rowCount - 1) * gap + 7;
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCompactMoney = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value)}`;
};

const setPdfColor = (doc: jsPDF, color: [number, number, number], mode: "draw" | "fill" | "text") => {
  if (mode === "draw") doc.setDrawColor(color[0], color[1], color[2]);
  if (mode === "fill") doc.setFillColor(color[0], color[1], color[2]);
  if (mode === "text") doc.setTextColor(color[0], color[1], color[2]);
};

const drawChartCard = (
  doc: jsPDF,
  chart: CommercialReportChart,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  doc.setDrawColor(...BORDER);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(chart.title, x + 4, y + 7);

  const plotX = x + 11;
  const plotY = y + 15;
  const plotWidth = width - 18;
  const plotHeight = height - 27;
  const bottomY = plotY + plotHeight;

  const values = chart.data.flatMap((item) => chart.series.map((serie) => toNumber(item[serie.key])));
  const rawMax = Math.max(0, ...values);
  const rawMin = chart.kind === "line" ? Math.min(0, ...values) : 0;
  const range = rawMax - rawMin || 1;
  const max = rawMax === rawMin ? rawMax + 1 : rawMax;
  const min = rawMax === rawMin ? 0 : rawMin;
  const adjustedRange = max - min || 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.1);

  for (let i = 0; i <= 3; i += 1) {
    const gridY = plotY + (plotHeight / 3) * i;
    const gridValue = max - (adjustedRange / 3) * i;
    doc.line(plotX, gridY, plotX + plotWidth, gridY);
    doc.text(formatCompactMoney(gridValue), x + 2, gridY + 1.5);
  }

  doc.setDrawColor(148, 163, 184);
  doc.line(plotX, bottomY, plotX + plotWidth, bottomY);
  doc.line(plotX, plotY, plotX, bottomY);

  const data = chart.data.slice(0, 12);
  if (data.length === 0) {
    doc.setTextColor(...MUTED);
    doc.text("Sin datos para graficar.", plotX + 4, plotY + 12);
    return;
  }

  const xForIndex = (index: number) => {
    if (data.length === 1) return plotX + plotWidth / 2;
    return plotX + (plotWidth / (data.length - 1)) * index;
  };
  const yForValue = (value: number) => bottomY - ((value - min) / adjustedRange) * plotHeight;

  if (chart.kind === "bars") {
    const groupWidth = plotWidth / Math.max(data.length, 1);
    const barGap = 1.2;
    const barWidth = Math.max(2, Math.min(9, (groupWidth - 5) / Math.max(chart.series.length, 1)));

    data.forEach((item, itemIndex) => {
      const groupX = plotX + itemIndex * groupWidth + groupWidth / 2 - (barWidth * chart.series.length + barGap * (chart.series.length - 1)) / 2;
      chart.series.forEach((serie, serieIndex) => {
        const value = toNumber(item[serie.key]);
        const barHeight = Math.max(1, ((value - 0) / Math.max(max, 1)) * plotHeight);
        const barX = groupX + serieIndex * (barWidth + barGap);
        const barY = bottomY - barHeight;
        setPdfColor(doc, serie.color, "fill");
        doc.rect(barX, barY, barWidth, barHeight, "F");
      });

      doc.setFontSize(6.2);
      doc.setTextColor(...MUTED);
      doc.text(normalizeText(item[chart.labelKey], ""), plotX + itemIndex * groupWidth + groupWidth / 2, bottomY + 4, { align: "center" });
    });
  } else {
    chart.series.forEach((serie) => {
      setPdfColor(doc, serie.color, "draw");
      setPdfColor(doc, serie.color, "fill");
      doc.setLineWidth(0.6);
      data.forEach((item, index) => {
        const currentX = xForIndex(index);
        const currentY = yForValue(toNumber(item[serie.key]));
        if (index > 0) {
          const prev = data[index - 1];
          doc.line(xForIndex(index - 1), yForValue(toNumber(prev[serie.key])), currentX, currentY);
        }
        doc.circle(currentX, currentY, 1.2, "F");
      });
    });

    data.forEach((item, index) => {
      doc.setFontSize(6.2);
      doc.setTextColor(...MUTED);
      doc.text(normalizeText(item[chart.labelKey], ""), xForIndex(index), bottomY + 4, { align: "center" });
    });
  }

  let legendX = x + 4;
  const legendY = y + height - 5;
  chart.series.forEach((serie) => {
    setPdfColor(doc, serie.color, "fill");
    doc.rect(legendX, legendY - 2.5, 3, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...MUTED);
    doc.text(serie.label, legendX + 5, legendY);
    legendX += 28;
  });
};

const drawCharts = (
  doc: jsPDF,
  charts: CommercialReportChart[] | undefined,
  pageWidth: number,
  pageHeight: number,
  y: number,
  addPageHeader: () => number
): number => {
  if (!charts || charts.length === 0) return y;

  const gap = 6;
  const availableWidth = pageWidth - PAGE_MARGIN * 2;
  const chartWidth = (availableWidth - gap) / 2;
  const chartHeight = 68;

  for (let index = 0; index < charts.length; index += 2) {
    if (y + chartHeight > pageHeight - FOOTER_HEIGHT - 8) {
      y = addPageHeader();
    }

    drawChartCard(doc, charts[index], PAGE_MARGIN, y, chartWidth, chartHeight);
    if (charts[index + 1]) {
      drawChartCard(doc, charts[index + 1], PAGE_MARGIN + chartWidth + gap, y, chartWidth, chartHeight);
    }
    y += chartHeight + 8;
  }

  return y;
};

const drawTableHeader = <T,>(
  doc: jsPDF,
  columns: CommercialReportColumn<T>[],
  x: number,
  y: number
) => {
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(15, 23, 42);
  doc.rect(x, y, tableWidth, 8, "F");

  let currentX = x;
  columns.forEach((col) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(col.header, currentX + 2, y + 5.5);
    currentX += col.width;
  });
};

export async function downloadCommercialReportPdf<T>({
  title,
  subtitle,
  fileName,
  rows,
  columns,
  metrics,
  filtersLabel,
  charts,
  logoUrl,
  pageOrientation = "landscape",
  pageFormat = "a4",
  brandName,
  brandSubtitle,
  footerText,
}: DownloadCommercialReportPdfParams<T>): Promise<void> {
  const resolvedBranding = await getResolvedGimnasioBranding();
  assertGimnasioBrandingReadyForCommercialDocs(resolvedBranding);

  const resolvedLogoUrl = logoUrl ?? resolvedBranding.logoUrl;
  const resolvedBrandName = brandName ?? resolvedBranding.nombre;
  const resolvedBrandSubtitle = brandSubtitle ?? resolvedBranding.subtitulo;
  const resolvedFooterText = footerText ?? resolvedBranding.piePagina;

  const doc = new jsPDF({ orientation: pageOrientation, unit: "mm", format: pageFormat });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const logoDataUrl = await loadImageAsPngDataUrl(resolvedLogoUrl, 256, 256);
  const tableX = PAGE_MARGIN;
  const tableWidth = pageWidth - PAGE_MARGIN * 2;
  const totalColumnWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const scale = tableWidth / totalColumnWidth;
  const normalizedColumns = columns.map((col) => ({ ...col, width: col.width * scale }));

  let y = HEADER_HEIGHT + 10;
  addHeader(doc, pageWidth, logoDataUrl, title, subtitle, resolvedBrandName, resolvedBrandSubtitle);

  y = drawMetrics(doc, metrics, pageWidth, y);

  if (filtersLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(filtersLabel, PAGE_MARGIN, y);
    y += 6;
  }

  y = drawCharts(doc, charts, pageWidth, pageHeight, y, () => {
    addFooter(doc, pageWidth, pageHeight, resolvedFooterText);
    doc.addPage();
    addHeader(doc, pageWidth, logoDataUrl, title, subtitle, resolvedBrandName, resolvedBrandSubtitle);
    return HEADER_HEIGHT + 10;
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(`Detalle (${rows.length} registros)`, PAGE_MARGIN, y);
  y += 4;

  drawTableHeader(doc, normalizedColumns, tableX, y);
  y += 8;

  if (rows.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("No hay registros para el filtro seleccionado.", PAGE_MARGIN, y + 8);
  }

  rows.forEach((row, rowIndex) => {
    const cellLines = normalizedColumns.map((col) => {
      const value = normalizeText(col.getValue(row, rowIndex));
      return doc.splitTextToSize(value, Math.max(12, col.width - 4));
    });

    const rowHeight = Math.max(
      ROW_MIN_HEIGHT,
      ...cellLines.map((lines) => 4 + lines.length * 3.8)
    );

    if (y + rowHeight > pageHeight - FOOTER_HEIGHT - 6) {
      addFooter(doc, pageWidth, pageHeight, resolvedFooterText);
      doc.addPage();
      addHeader(doc, pageWidth, logoDataUrl, title, subtitle, resolvedBrandName, resolvedBrandSubtitle);
      y = HEADER_HEIGHT + 10;
      drawTableHeader(doc, normalizedColumns, tableX, y);
      y += 8;
    }

    doc.setFillColor(rowIndex % 2 === 0 ? 255 : 248, rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 252);
    doc.setDrawColor(...BORDER);
    doc.rect(tableX, y, tableWidth, rowHeight, "FD");

    let currentX = tableX;
    normalizedColumns.forEach((col, colIndex) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(...DARK);

      const lines = cellLines[colIndex];
      const textX = col.align === "right" ? currentX + col.width - 2 : currentX + 2;
      if (col.align === "right") {
        doc.text(lines, textX, y + 5, { align: "right" });
      } else {
        doc.text(lines, textX, y + 5);
      }

      currentX += col.width;
    });

    y += rowHeight;
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    addFooter(doc, pageWidth, pageHeight, resolvedFooterText);
  }

  doc.save(fileName.toLowerCase().endsWith(".pdf") ? fileName : buildTimestampedDownloadFileName(fileName, "pdf"));
}
