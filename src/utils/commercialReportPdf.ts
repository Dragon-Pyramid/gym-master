"use client";

import jsPDF from "jspdf";

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

export interface DownloadCommercialReportPdfParams<T> {
  title: string;
  subtitle?: string;
  fileName: string;
  rows: T[];
  columns: CommercialReportColumn<T>[];
  metrics?: CommercialReportMetric[];
  filtersLabel?: string;
  logoUrl?: string;
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
  subtitle?: string
) => {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT + 7, "F");

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", PAGE_MARGIN, 6, 18, 18);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  doc.text("Gym Master", PAGE_MARGIN + 23, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("Dragon Pyramid · Gestión integral de gimnasios", PAGE_MARGIN + 23, 17);
  doc.text(`Generado: ${formatDateTime()}`, PAGE_MARGIN + 23, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...DARK);
  doc.text(title, pageWidth - PAGE_MARGIN, 12, { align: "right" });

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(subtitle, pageWidth - PAGE_MARGIN, 18, { align: "right" });
  }

  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(PAGE_MARGIN, HEADER_HEIGHT + 3, pageWidth - PAGE_MARGIN, HEADER_HEIGHT + 3);
};

const addFooter = (doc: jsPDF, pageWidth: number, pageHeight: number) => {
  const pageNumber = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Gym Master · Reporte generado por el sistema", PAGE_MARGIN, pageHeight - 5);
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
  const cardWidth = Math.max(38, (availableWidth - gap * (metrics.length - 1)) / metrics.length);
  const cardHeight = 17;

  metrics.forEach((metric, index) => {
    const x = PAGE_MARGIN + index * (cardWidth + gap);
    doc.setDrawColor(...BORDER);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(metric.label, x + 3, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(normalizeText(metric.value, "0"), x + 3, y + 13);
  });

  return y + cardHeight + 7;
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
  logoUrl = "/gm_logo.svg",
}: DownloadCommercialReportPdfParams<T>): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const logoDataUrl = await loadImageAsPngDataUrl(logoUrl, 256, 256);
  const tableX = PAGE_MARGIN;
  const tableWidth = pageWidth - PAGE_MARGIN * 2;
  const totalColumnWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const scale = tableWidth / totalColumnWidth;
  const normalizedColumns = columns.map((col) => ({ ...col, width: col.width * scale }));

  let y = HEADER_HEIGHT + 10;
  addHeader(doc, pageWidth, logoDataUrl, title, subtitle);

  y = drawMetrics(doc, metrics, pageWidth, y);

  if (filtersLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(filtersLabel, PAGE_MARGIN, y);
    y += 6;
  }

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
      addFooter(doc, pageWidth, pageHeight);
      doc.addPage();
      addHeader(doc, pageWidth, logoDataUrl, title, subtitle);
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
    addFooter(doc, pageWidth, pageHeight);
  }

  doc.save(`${safeFileName(fileName)}.pdf`);
}
