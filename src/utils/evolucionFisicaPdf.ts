import jsPDF from "jspdf";
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";

interface DashboardChartLegendItem {
  label: string;
  color: string;
}

interface DashboardChartSnapshot {
  title: string;
  description?: string;
  dataUrl: string;
  width?: number;
  height?: number;
  legends?: DashboardChartLegendItem[];
}

interface DescargarEvolucionFisicaPdfParams {
  rows: EvolucionSocio[];
  socioNombre?: string;
  logoUrl?: string;
  dashboardCharts?: DashboardChartSnapshot[];
}

const PAGE_MARGIN = 14;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("es-AR");
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value: unknown, suffix = "") => {
  const parsed = toNumber(value);

  if (parsed === null) return "-";

  return `${parsed.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
};

const formatDelta = (current: unknown, initial: unknown, suffix = "") => {
  const currentValue = toNumber(current);
  const initialValue = toNumber(initial);

  if (currentValue === null || initialValue === null) return "-";

  const diff = Number((currentValue - initialValue).toFixed(2));
  const prefix = diff > 0 ? "+" : "";

  return `${prefix}${formatNumber(diff, suffix)}`;
};

const normalizarTexto = (value: unknown, fallback = "-"): string => {
  if (value === undefined || value === null || value === "") return fallback;
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

const sortAscByDate = (rows: EvolucionSocio[]) => {
  return [...rows].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
};

const loadImageAsDataUrl = async (
  url: string,
  maxWidth = 500,
  maxHeight = 500
): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!url) {
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

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        console.warn("No se pudo convertir el logo para PDF:", error);
        resolve(null);
      }
    };

    image.onerror = () => {
      console.warn("No se pudo cargar el logo para PDF:", url);
      resolve(null);
    };

    image.src = url;
  });
};

const ensureSpace = (doc: jsPDF, y: number, requiredHeight: number): number => {
  if (y + requiredHeight <= PAGE_HEIGHT - PAGE_MARGIN - 8) {
    return y;
  }

  doc.addPage();
  return PAGE_MARGIN;
};

const addFooter = (doc: jsPDF): void => {
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`Gym Master · Evolución física · Página ${page} de ${totalPages}`, PAGE_MARGIN, 288);
  }
};

const addWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 5
): number => {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];

  lines.forEach((line, index) => {
    doc.text(line, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
};

const addInfoBox = (
  doc: jsPDF,
  title: string,
  value: string,
  helper: string,
  x: number,
  y: number,
  width: number
) => {
  doc.setDrawColor(225, 225, 225);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, 24, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  doc.text(title.toUpperCase(), x + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(value, x + 4, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 110);
  doc.text(helper, x + 4, y + 19);
};

const addTableHeader = (doc: jsPDF, y: number) => {
  const columns = [
    { label: "Fecha", width: 23 },
    { label: "Peso", width: 18 },
    { label: "IMC", width: 14 },
    { label: "Cintura", width: 20 },
    { label: "Pecho", width: 18 },
    { label: "Cadera", width: 18 },
    { label: "% Grasa", width: 18 },
    { label: "Masa", width: 22 },
    { label: "Observaciones", width: 31 },
  ];

  doc.setFillColor(240, 244, 248);
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(17, 24, 39);

  let x = PAGE_MARGIN + 2;

  columns.forEach((column) => {
    doc.text(column.label, x, y + 5.5);
    x += column.width;
  });

  return { columns, nextY: y + 8 };
};


const formatCompactNumber = (value: unknown): string => {
  const parsed = toNumber(value);

  if (parsed === null) return "-";

  return parsed.toLocaleString("es-AR", {
    maximumFractionDigits: 1,
  });
};

const formatPair = (
  left: unknown,
  right: unknown,
  fallback?: unknown
): string => {
  const leftValue = toNumber(left);
  const rightValue = toNumber(right);
  const fallbackValue = toNumber(fallback);

  if (leftValue === null && rightValue === null) {
    return fallbackValue === null ? "-" : formatCompactNumber(fallbackValue);
  }

  return `${leftValue === null ? "-" : formatCompactNumber(leftValue)}/${
    rightValue === null ? "-" : formatCompactNumber(rightValue)
  }`;
};

const formatTriple = (...values: unknown[]): string => {
  return values.map((value) => formatCompactNumber(value)).join(" / ");
};

const addSegmentedTableHeader = (doc: jsPDF, y: number) => {
  const columns = [
    { label: "Fecha", width: 22 },
    { label: "Bíceps I/D", width: 25 },
    { label: "Tríceps I/D", width: 25 },
    { label: "Anteb. I/D", width: 25 },
    { label: "Muslo I/D", width: 25 },
    { label: "Pant. I/D", width: 25 },
    { label: "Abd/Cue/Hom", width: 35 },
  ];

  doc.setFillColor(240, 244, 248);
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(17, 24, 39);

  let x = PAGE_MARGIN + 2;

  columns.forEach((column) => {
    doc.text(column.label, x, y + 5.5);
    x += column.width;
  });

  return { columns, nextY: y + 8 };
};

const addSegmentedMeasurementsTable = (
  doc: jsPDF,
  rows: EvolucionSocio[],
  startY: number
): number => {
  if (!rows.length) return startY;

  let y = ensureSpace(doc, startY, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text("Mediciones segmentarias", PAGE_MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.3);
  doc.setTextColor(90, 90, 90);
  doc.text(
    "Detalle en centímetros de brazos, piernas y segmentos corporales. I/D indica izquierda/derecha.",
    PAGE_MARGIN,
    y + 6
  );

  y += 13;

  let tableInfo = addSegmentedTableHeader(doc, y);
  let columns = tableInfo.columns;

  y = tableInfo.nextY;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.1);

  rows.forEach((row, index) => {
    const rowHeight = 10;

    y = ensureSpace(doc, y, rowHeight + 8);

    if (y === PAGE_MARGIN) {
      tableInfo = addSegmentedTableHeader(doc, y);
      columns = tableInfo.columns;
      y = tableInfo.nextY;
    }

    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight, "F");
    }

    doc.setDrawColor(235, 235, 235);
    doc.line(PAGE_MARGIN, y + rowHeight, PAGE_WIDTH - PAGE_MARGIN, y + rowHeight);
    doc.setTextColor(35, 35, 35);

    const values = [
      formatDate(row.fecha),
      formatPair(row.biceps_izquierdo, row.biceps_derecho, row.bicep),
      formatPair(row.triceps_izquierdo, row.triceps_derecho, row.tricep),
      formatPair(row.antebrazo_izquierdo, row.antebrazo_derecho),
      formatPair(row.muslo_izquierdo, row.muslo_derecho, row.pierna),
      formatPair(row.pantorrilla_izquierda, row.pantorrilla_derecha, row.pantorrilla),
      formatTriple(row.abdomen, row.cuello, row.hombros),
    ];

    let x = PAGE_MARGIN + 2;

    values.forEach((value, columnIndex) => {
      const maxWidth = columns[columnIndex].width - 2;
      const lines = doc.splitTextToSize(value, maxWidth) as string[];
      doc.text(lines.slice(0, 2), x, y + 5);
      x += columns[columnIndex].width;
    });

    y += rowHeight;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(110, 110, 110);
  y = addWrappedText(
    doc,
    "Referencias: Bíceps, tríceps, antebrazo, muslo y pantorrilla muestran izquierda/derecha. Abd/Cue/Hom corresponde a abdomen, cuello y hombros.",
    PAGE_MARGIN,
    y + 6,
    CONTENT_WIDTH,
    4
  );

  return y + 6;
};


const addMeasureBlock = (
  doc: jsPDF,
  title: string,
  rows: Array<[string, string]>,
  x: number,
  y: number,
  width: number
) => {
  doc.setDrawColor(225, 225, 225);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, 48, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(title, x + 4, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);

  rows.forEach(([label, value], index) => {
    const rowY = y + 15 + index * 6;
    doc.text(`${label}:`, x + 4, rowY);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + 33, rowY);
    doc.setFont("helvetica", "normal");
  });
};

const addChartLegend = (
  doc: jsPDF,
  legends: DashboardChartLegendItem[] | undefined,
  x: number,
  y: number
): number => {
  if (!legends?.length) return y;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);

  let currentX = x;
  const lineY = y + 3;

  legends.forEach((legend) => {
    const label = normalizarTexto(legend.label);
    const labelWidth = doc.getTextWidth(label);

    doc.setFillColor(legend.color);
    doc.circle(currentX + 1.5, lineY - 1.5, 1.4, "F");

    doc.setTextColor(75, 85, 99);
    doc.text(label, currentX + 5, lineY);

    currentX += labelWidth + 16;
  });

  return y + 7;
};


const addDashboardCharts = (
  doc: jsPDF,
  charts: DashboardChartSnapshot[],
  startY: number
): number => {
  if (!charts.length) return startY;

  let y = ensureSpace(doc, startY, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text("Gráficos de evolución", PAGE_MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(
    "Capturas generadas desde los mismos gráficos visibles en el dashboard.",
    PAGE_MARGIN,
    y + 6
  );

  y += 15;

  charts.forEach((chart) => {
    const sourceWidth = chart.width && chart.width > 0 ? chart.width : 640;
    const sourceHeight = chart.height && chart.height > 0 ? chart.height : 320;
    const imageWidth = CONTENT_WIDTH;
    const imageHeight = Math.min(82, imageWidth * (sourceHeight / sourceWidth));
    const legendHeight = chart.legends?.length ? 8 : 0;
    const blockHeight = imageHeight + 22 + legendHeight;

    y = ensureSpace(doc, y, blockHeight + 6);

    doc.setDrawColor(225, 225, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, blockHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(chart.title, PAGE_MARGIN + 4, y + 7);

    if (chart.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);
      doc.text(chart.description, PAGE_MARGIN + 4, y + 12);
    }

    doc.addImage(
      chart.dataUrl,
      "PNG",
      PAGE_MARGIN + 4,
      y + 16,
      CONTENT_WIDTH - 8,
      imageHeight
    );

    addChartLegend(doc, chart.legends, PAGE_MARGIN + 6, y + 18 + imageHeight);

    y += blockHeight + 8;
  });

  return y;
};

export const descargarEvolucionFisicaPdf = async ({
  rows,
  socioNombre = "Socio",
  logoUrl = "/gm_logo.svg",
  dashboardCharts = [],
}: DescargarEvolucionFisicaPdfParams): Promise<void> => {
  if (!rows.length) {
    throw new Error("No hay registros de evolución física para exportar");
  }

  const orderedRows = sortAscByDate(rows);
  const initial = orderedRows.find((row) => row.es_registro_inicial) || orderedRows[0];
  const current = orderedRows[orderedRows.length - 1];
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logoData = await loadImageAsDataUrl(logoUrl);

  let y = PAGE_MARGIN;

  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, PAGE_WIDTH, 42, "F");

  if (logoData) {
    doc.addImage(logoData, "PNG", PAGE_MARGIN, 7, 24, 24);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("GYM MASTER", logoData ? 44 : PAGE_MARGIN, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Informe de evolución física", logoData ? 44 : PAGE_MARGIN, 24);
  doc.text(`Socio: ${normalizarTexto(socioNombre, "Socio")}`, logoData ? 44 : PAGE_MARGIN, 31);

  y = 52;

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Resumen comparativo", PAGE_MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`Generado: ${new Date().toLocaleString("es-AR")}`, PAGE_MARGIN, y + 7);
  doc.text(`Registros incluidos: ${orderedRows.length}`, PAGE_MARGIN + 70, y + 7);

  y += 15;

  const boxWidth = (CONTENT_WIDTH - 6) / 4;

  addInfoBox(
    doc,
    "Registro inicial",
    formatDate(initial.fecha),
    `${formatNumber(initial.peso, " kg")} · IMC ${formatNumber(initial.imc)}`,
    PAGE_MARGIN,
    y,
    boxWidth
  );

  addInfoBox(
    doc,
    "Último registro",
    formatDate(current.fecha),
    `${formatNumber(current.peso, " kg")} · IMC ${formatNumber(current.imc)}`,
    PAGE_MARGIN + boxWidth + 2,
    y,
    boxWidth
  );

  addInfoBox(
    doc,
    "Peso / cintura",
    `${formatDelta(current.peso, initial.peso, " kg")} / ${formatDelta(current.cintura, initial.cintura, " cm")}`,    "Último vs. inicial",
    PAGE_MARGIN + boxWidth * 2 + 4,
    y,
    boxWidth
  );

  addInfoBox(
    doc,
    "Grasa / masa",
    `${formatDelta(current.porcentaje_grasa, initial.porcentaje_grasa, "%")} / ${formatDelta(current.masa_muscular, initial.masa_muscular, " kg")}`,
    "Último vs. inicial",
    PAGE_MARGIN + boxWidth * 3 + 6,
    y,
    boxWidth
  );

  y += 34;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text("Última medición", PAGE_MARGIN, y);

  y += 6;

  const blockWidth = (CONTENT_WIDTH - 6) / 2;

  addMeasureBlock(
    doc,
    "Datos principales",
    [
      ["Fecha", formatDate(current.fecha)],
      ["Peso", formatNumber(current.peso, " kg")],
      ["Altura", formatNumber(current.altura, " cm")],
      ["IMC", formatNumber(current.imc)],
      ["Tipo", normalizarTexto(current.tipo_corporal)],
      ["Sexo ref.", normalizarTexto(current.sexo_referencia)],
    ],
    PAGE_MARGIN,
    y,
    blockWidth
  );

  addMeasureBlock(
    doc,
    "Medidas corporales",
    [
      ["Pecho", formatNumber(current.pecho, " cm")],
      ["Cintura", formatNumber(current.cintura, " cm")],
      ["Cadera", formatNumber(current.cadera, " cm")],
      ["Abdomen", formatNumber(current.abdomen, " cm")],
      ["% grasa", formatNumber(current.porcentaje_grasa, "%")],
      ["Masa", formatNumber(current.masa_muscular, " kg")],
    ],
    PAGE_MARGIN + blockWidth + 6,
    y,
    blockWidth
  );

  y += 60;

  if (current.observaciones) {
    y = ensureSpace(doc, y, 24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("Observaciones de la última medición", PAGE_MARGIN, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    y = addWrappedText(doc, current.observaciones, PAGE_MARGIN, y + 6, CONTENT_WIDTH, 5) + 5;
  }

  y = ensureSpace(doc, y, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text("Historial cronológico", PAGE_MARGIN, y);

  y += 6;

  let tableInfo = addTableHeader(doc, y);
  let columns = tableInfo.columns;

  y = tableInfo.nextY;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);

  orderedRows.forEach((row, index) => {
    const observaciones = normalizarTexto(row.observaciones, "");
    const observationLines = doc.splitTextToSize(observaciones, columns[8].width - 2) as string[];
    const limitedObservationLines = observationLines.slice(0, 3);
    const rowHeight = Math.max(8, limitedObservationLines.length * 4 + 4);

    y = ensureSpace(doc, y, rowHeight + 8);

    if (y === PAGE_MARGIN) {
      tableInfo = addTableHeader(doc, y);
      columns = tableInfo.columns;
      y = tableInfo.nextY;
    }

    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight, "F");
    }

    doc.setDrawColor(235, 235, 235);
    doc.line(PAGE_MARGIN, y + rowHeight, PAGE_WIDTH - PAGE_MARGIN, y + rowHeight);

    doc.setTextColor(35, 35, 35);

    const values = [
      formatDate(row.fecha),
      formatNumber(row.peso, " kg"),
      formatNumber(row.imc),
      formatNumber(row.cintura, " cm"),
      formatNumber(row.pecho, " cm"),
      formatNumber(row.cadera, " cm"),
      formatNumber(row.porcentaje_grasa, "%"),
      formatNumber(row.masa_muscular, " kg"),
    ];

    let x = PAGE_MARGIN + 2;

    values.forEach((value, columnIndex) => {
      doc.text(value, x, y + 5);
      x += columns[columnIndex].width;
    });

    limitedObservationLines.forEach((line, lineIndex) => {
      doc.text(line, x, y + 5 + lineIndex * 4);
    });

    y += rowHeight;
  });

  y = addSegmentedMeasurementsTable(doc, orderedRows, y + 12);

  y = addDashboardCharts(doc, dashboardCharts, y + 8);

  addFooter(doc);

  const datePart = new Date().toISOString().split("T")[0];
  const fileName = `evolucion-fisica-${safeFileName(socioNombre || "socio")}-${datePart}.pdf`;

  doc.save(fileName);
};