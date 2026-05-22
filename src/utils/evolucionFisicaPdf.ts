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


interface PdfImageAsset {
  dataUrl: string;
  width: number;
  height: number;
}

const loadTransparentImageAsset = async (
  url: string,
  maxWidth = 900,
  maxHeight = 900
): Promise<PdfImageAsset | null> => {
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

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: canvas.width,
          height: canvas.height,
        });
      } catch (error) {
        console.warn("No se pudo convertir la silueta biométrica para PDF:", error);
        resolve(null);
      }
    };

    image.onerror = () => {
      console.warn("No se pudo cargar la silueta biométrica para PDF:", url);
      resolve(null);
    };

    image.src = url;
  });
};

const addImageContained = (
  doc: jsPDF,
  image: PdfImageAsset,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const ratio = Math.min(width / image.width, height / image.height);
  const imageWidth = image.width * ratio;
  const imageHeight = image.height * ratio;

  doc.addImage(
    image.dataUrl,
    "PNG",
    x + (width - imageWidth) / 2,
    y + (height - imageHeight) / 2,
    imageWidth,
    imageHeight
  );
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


const addPdfIcon = (
  doc: jsPDF,
  icon: "user" | "calendar" | "scale" | "ruler" | "percent" | "muscle" | "activity" | "info",
  x: number,
  y: number,
  size = 7,
  color: [number, number, number] = [2, 168, 225]
) => {
  const [r, g, b] = color;

  doc.setDrawColor(r, g, b);
  doc.setFillColor(230, 247, 253);
  doc.circle(x + size / 2, y + size / 2, size / 2, "FD");

  doc.setDrawColor(r, g, b);
  doc.setTextColor(r, g, b);
  doc.setLineWidth(0.35);

  const cx = x + size / 2;
  const cy = y + size / 2;

  if (icon === "user") {
    doc.circle(cx, cy - 1.3, 1.1, "S");
    doc.roundedRect(cx - 2.7, cy + 0.9, 5.4, 2.7, 1.2, 1.2, "S");
    return;
  }

  if (icon === "calendar") {
    doc.roundedRect(cx - 2.5, cy - 2.2, 5, 4.8, 0.6, 0.6, "S");
    doc.line(cx - 2.5, cy - 0.8, cx + 2.5, cy - 0.8);
    doc.line(cx - 1.4, cy - 2.8, cx - 1.4, cy - 1.7);
    doc.line(cx + 1.4, cy - 2.8, cx + 1.4, cy - 1.7);
    return;
  }

  if (icon === "scale") {
    doc.roundedRect(cx - 2.4, cy - 1.9, 4.8, 4.4, 0.7, 0.7, "S");
    doc.line(cx - 1.4, cy - 0.6, cx + 1.4, cy - 0.6);
    doc.line(cx, cy - 0.6, cx + 0.8, cy - 1.2);
    return;
  }

  if (icon === "ruler") {
    doc.line(cx - 2.7, cy + 1.8, cx + 2.7, cy - 1.8);
    doc.line(cx - 1.7, cy + 1.1, cx - 1.1, cy + 1.7);
    doc.line(cx - 0.3, cy + 0.2, cx + 0.3, cy + 0.8);
    doc.line(cx + 1.1, cy - 0.8, cx + 1.7, cy - 0.2);
    return;
  }

  if (icon === "percent") {
    doc.text("%", cx - 1.8, cy + 1.8);
    return;
  }

  if (icon === "muscle") {
    doc.circle(cx - 0.9, cy + 0.5, 1.45, "S");
    doc.circle(cx + 1.4, cy - 0.2, 1.15, "S");
    doc.line(cx - 2.7, cy + 1.2, cx - 3.1, cy + 2.4);
    doc.line(cx - 3.1, cy + 2.4, cx - 1.3, cy + 2.4);
    doc.line(cx + 2.2, cy - 1.1, cx + 3.0, cy - 2.0);
    return;
  }

  if (icon === "activity") {
    doc.line(cx - 3, cy + 0.4, cx - 1.4, cy + 0.4);
    doc.line(cx - 1.4, cy + 0.4, cx - 0.5, cy - 2.3);
    doc.line(cx - 0.5, cy - 2.3, cx + 0.9, cy + 2.3);
    doc.line(cx + 0.9, cy + 2.3, cx + 1.7, cy + 0.4);
    doc.line(cx + 1.7, cy + 0.4, cx + 3, cy + 0.4);
    return;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("i", cx - 0.7, cy + 2);
};

const resolveInfoIcon = (title: string) => {
  const normalized = title.toLowerCase();

  if (normalized.includes("registro") || normalized.includes("último")) return "calendar";
  if (normalized.includes("peso")) return "scale";
  if (normalized.includes("grasa")) return "percent";

  return "activity";
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
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, 26, 3, 3, "FD");

  addPdfIcon(doc, resolveInfoIcon(title) as "calendar" | "scale" | "percent" | "activity", x + 4, y + 5, 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(92, 103, 121);
  doc.text(title.toUpperCase(), x + 16, y + 7.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(value, x + 16, y + 14.6, { maxWidth: width - 20 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  doc.setTextColor(100, 116, 139);
  doc.text(helper, x + 16, y + 21, { maxWidth: width - 20 });
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


type BiometricSex = "masculino" | "femenino";

interface BiometricMetrics {
  peso: number | null;
  cintura: number | null;
  grasa: number | null;
  masaMuscular: number | null;
  brazoPromedio: number | null;
  musloPromedio: number | null;
  pantorrillaPromedio: number | null;
  cadera: number | null;
  sexoReferencia: string | null;
}

interface BiometricVisualModel {
  sex: BiometricSex;
  dominantSrc: string;
  widthScale: number;
  heightScale: number;
  glowOpacity: number;
  abdomenOpacity: number;
  muscleOpacity: number;
}

const BIOMETRIC_SILHOUETTES = {
  masculino: {
    soft: "/images/evolucion-fisica/siluetas/male-soft.png",
    athletic: "/images/evolucion-fisica/siluetas/male-athletic.png",
  },
  femenino: {
    soft: "/images/evolucion-fisica/siluetas/female-soft.png",
    athletic: "/images/evolucion-fisica/siluetas/female-athletic.png",
  },
} as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const averageValues = (left: unknown, right: unknown): number | null => {
  const values = [toNumber(left), toNumber(right)].filter(
    (value): value is number => value !== null
  );

  if (!values.length) return null;

  return Number((values.reduce((acc, value) => acc + value, 0) / values.length).toFixed(2));
};

const getBiometricMetrics = (row: EvolucionSocio): BiometricMetrics => ({
  peso: toNumber(row.peso),
  cintura: toNumber(row.cintura),
  grasa: toNumber(row.porcentaje_grasa),
  masaMuscular: toNumber(row.masa_muscular),
  brazoPromedio: averageValues(row.biceps_izquierdo, row.biceps_derecho),
  musloPromedio: averageValues(row.muslo_izquierdo, row.muslo_derecho),
  pantorrillaPromedio: averageValues(row.pantorrilla_izquierda, row.pantorrilla_derecha),
  cadera: toNumber(row.cadera),
  sexoReferencia: row.sexo_referencia ?? null,
});

const inferBiometricSex = (metrics: BiometricMetrics): BiometricSex => {
  if (metrics.sexoReferencia === "femenino") return "femenino";
  if (metrics.sexoReferencia === "masculino") return "masculino";

  const cadera = metrics.cadera ?? 98;
  const cintura = metrics.cintura ?? 84;

  return cadera > 100 && cintura < cadera * 0.9 ? "femenino" : "masculino";
};

const normalizeBiometric = (value: number, base: number, divisor: number) =>
  clamp((value - base) / divisor, -1.4, 1.4);

const buildBiometricVisualModel = (row: EvolucionSocio): BiometricVisualModel => {
  const metrics = getBiometricMetrics(row);
  const sex = inferBiometricSex(metrics);
  const female = sex === "femenino";

  const base = female
    ? { peso: 64, cintura: 74, cadera: 102, grasa: 25, masa: 44, brazo: 28, muslo: 56, pantorrilla: 36 }
    : { peso: 78, cintura: 86, cadera: 98, grasa: 20, masa: 56, brazo: 34, muslo: 60, pantorrilla: 38 };

  const peso = metrics.peso ?? base.peso;
  const cintura = metrics.cintura ?? base.cintura;
  const cadera = metrics.cadera ?? base.cadera;
  const grasa = metrics.grasa ?? base.grasa;
  const masa = metrics.masaMuscular ?? base.masa;
  const brazo = metrics.brazoPromedio ?? base.brazo;
  const muslo = metrics.musloPromedio ?? base.muslo;
  const pantorrilla = metrics.pantorrillaPromedio ?? base.pantorrilla;

  const pesoN = normalizeBiometric(peso, base.peso, female ? 18 : 22);
  const cinturaN = normalizeBiometric(cintura, base.cintura, female ? 11 : 13);
  const caderaN = normalizeBiometric(cadera, base.cadera, female ? 12 : 14);
  const grasaN = normalizeBiometric(grasa, base.grasa, 9);
  const masaN = normalizeBiometric(masa, base.masa, female ? 7 : 9);
  const brazoN = normalizeBiometric(brazo, base.brazo, female ? 4.5 : 5.5);
  const musloN = normalizeBiometric(muslo, base.muslo, female ? 6 : 7);
  const pantorrillaN = normalizeBiometric(pantorrilla, base.pantorrilla, 5);

  const leanness = -grasaN * 0.28 - cinturaN * 0.24;
  const muscle = masaN * 0.28 + brazoN * 0.17 + musloN * 0.14 + pantorrillaN * 0.04;
  const bodyContext = -pesoN * 0.08 + caderaN * (female ? 0.03 : -0.02);
  const fitnessScore = clamp(0.5 + leanness + muscle + bodyContext, 0.08, 0.92);

  const volume =
    pesoN * 0.04 +
    cinturaN * 0.055 +
    caderaN * (female ? 0.035 : 0.02) +
    grasaN * 0.03 +
    masaN * 0.018;

  const muscleExpansion = masaN * 0.018 + brazoN * 0.016 + musloN * 0.012;

  return {
    sex,
    dominantSrc:
      fitnessScore >= 0.52 ? BIOMETRIC_SILHOUETTES[sex].athletic : BIOMETRIC_SILHOUETTES[sex].soft,
    widthScale: clamp(1 + volume + muscleExpansion, 0.92, 1.1),
    heightScale: clamp(1 + pesoN * 0.006 - grasaN * 0.004, 0.985, 1.018),
    glowOpacity: clamp(0.24 + masaN * 0.055 - grasaN * 0.018, 0.18, 0.42),
    abdomenOpacity: clamp(0.12 + grasaN * 0.14 + cinturaN * 0.08, 0.08, 0.32),
    muscleOpacity: clamp(0.16 + masaN * 0.12 + brazoN * 0.04, 0.12, 0.34),
  };
};

const getBiometricMetricRows = (row: EvolucionSocio) => {
  const metrics = getBiometricMetrics(row);

  return [
    { icon: "scale" as const, label: "Peso", value: formatNumber(metrics.peso, " kg") },
    { icon: "ruler" as const, label: "Cintura", value: formatNumber(metrics.cintura, " cm") },
    { icon: "percent" as const, label: "% grasa", value: formatNumber(metrics.grasa, "%") },
    { icon: "muscle" as const, label: "Masa", value: formatNumber(metrics.masaMuscular, " kg") },
    { icon: "ruler" as const, label: "Brazo prom.", value: formatNumber(metrics.brazoPromedio, " cm") },
    { icon: "ruler" as const, label: "Muslo prom.", value: formatNumber(metrics.musloPromedio, " cm") },
  ];
};

const getBiometricDeltaRows = (initial: EvolucionSocio, current: EvolucionSocio) => {
  const initialMetrics = getBiometricMetrics(initial);
  const currentMetrics = getBiometricMetrics(current);

  return [
    { icon: "scale" as const, label: "Peso", value: formatDelta(currentMetrics.peso, initialMetrics.peso, " kg"), positiveDirection: "lower" as const },
    { icon: "ruler" as const, label: "Cintura", value: formatDelta(currentMetrics.cintura, initialMetrics.cintura, " cm"), positiveDirection: "lower" as const },
    { icon: "percent" as const, label: "% grasa", value: formatDelta(currentMetrics.grasa, initialMetrics.grasa, "%"), positiveDirection: "lower" as const },
    { icon: "muscle" as const, label: "Masa muscular", value: formatDelta(currentMetrics.masaMuscular, initialMetrics.masaMuscular, " kg"), positiveDirection: "higher" as const },
    { icon: "muscle" as const, label: "Brazo promedio", value: formatDelta(currentMetrics.brazoPromedio, initialMetrics.brazoPromedio, " cm"), positiveDirection: "higher" as const },
    { icon: "ruler" as const, label: "Muslo promedio", value: formatDelta(currentMetrics.musloPromedio, initialMetrics.musloPromedio, " cm"), positiveDirection: "higher" as const },
  ];
};

const isPositiveDelta = (
  value: string,
  direction: "lower" | "higher"
): boolean => {
  if (value === "-") return false;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const match = normalized.match(/[+-]?\d+(\.\d+)?/);
  if (!match) return false;

  const parsed = Number(match[0]);

  if (!Number.isFinite(parsed) || parsed === 0) return false;

  return direction === "lower" ? parsed < 0 : parsed > 0;
};

const addBiometricMetricBox = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  icon: "scale" | "ruler" | "percent" | "muscle",
  label: string,
  value: string
) => {
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, width, height, 2, 2, "FD");

  addPdfIcon(doc, icon, x + 2.2, y + 2.2, 5.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.6);
  doc.setTextColor(100, 116, 139);
  doc.text(label.toUpperCase(), x + 8.5, y + 5.8, { maxWidth: width - 9 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(15, 23, 42);
  doc.text(value, x + 3, y + height - 4.2, { maxWidth: width - 5 });
};

const addBiometricSilhouettePanel = (
  doc: jsPDF,
  image: PdfImageAsset | null,
  model: BiometricVisualModel,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  doc.setDrawColor(8, 15, 35);
  doc.setFillColor(3, 17, 38);
  doc.roundedRect(x, y, width, height, 3, 3, "FD");

  doc.setFillColor(7, 26, 50);
  doc.roundedRect(x + 3, y + 4, width - 6, height - 8, 3, 3, "F");

  doc.setFillColor(2, 132, 199);
  doc.circle(x + width / 2, y + height * 0.47, Math.min(width, height) * 0.25, "F");

  doc.setFillColor(34, 211, 238);
  doc.ellipse(x + width / 2, y + height - 6, width * 0.27, 1.5, "F");

  if (image) {
    const innerX = x + 3.8;
    const innerY = y + 7;
    const innerWidth = width - 7.6;
    const innerHeight = height - 13;

    /**
     * Ajuste fino para PDF biométrico:
     * - las siluetas soft son más anchas y visualmente más pesadas;
     * - si se centran de forma totalmente neutra pueden verse más bajas,
     *   un poco corridas o comprimidas frente a las athletic;
     * - por eso se aplica una calibración suave por variante, manteniendo
     *   proporción natural, apoyo visual en la plataforma y mejor encuadre.
     */
    const isSoftVariant = model.dominantSrc.includes("soft");
    const variantHeightBoost = isSoftVariant ? 1.23 : 1.015;
    const variantWidthLimit = isSoftVariant ? 1.03 : 0.93;
    const variantOffsetX = isSoftVariant ? 1.9 : 0.35;
    const variantBottomInset = isSoftVariant ? 0.8 : 1.15;

    let targetHeight = innerHeight * model.heightScale * variantHeightBoost;
    let targetWidth = image.width * (targetHeight / image.height);

    const maxAllowedWidth = innerWidth * variantWidthLimit;
    if (targetWidth > maxAllowedWidth) {
      const downscale = maxAllowedWidth / targetWidth;
      targetWidth *= downscale;
      targetHeight *= downscale;
    }

    const targetX = innerX + (innerWidth - targetWidth) / 2 + variantOffsetX;
    const targetY = innerY + innerHeight - targetHeight - variantBottomInset;

    doc.addImage(
      image.dataUrl,
      "PNG",
      targetX,
      targetY,
      targetWidth,
      targetHeight
    );
  }
};

const addBiometricCard = (
  doc: jsPDF,
  row: EvolucionSocio,
  image: PdfImageAsset | null,
  model: BiometricVisualModel,
  label: string,
  title: string,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(100, 116, 139);
  doc.text(label.toUpperCase(), x + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.2);
  doc.setTextColor(15, 23, 42);
  doc.text(title, x + 4, y + 12);

  addPdfIcon(doc, "activity", x + width - 12, y + 3.5, 7);

  const sexLabel = model.sex === "femenino" ? "femenina" : "masculina";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(2, 132, 199);
  doc.text(`Silueta ${sexLabel} biométrica según medición.`, x + 4, y + 17, {
    maxWidth: width - 8,
  });

  const panelX = x + 4;
  const panelY = y + 22;
  // Panel más ancho para que la silueta soft/robusta no se comprima horizontalmente.
  const panelWidth = 38;
  const panelHeight = height - 27;

  addBiometricSilhouettePanel(doc, image, model, panelX, panelY, panelWidth, panelHeight);

  const metrics = getBiometricMetricRows(row);
  const metricGap = 2;
  const metricX = panelX + panelWidth + 3;
  const metricWidth = (width - (metricX - x) - 4 - metricGap) / 2;
  const metricHeight = 21.2;

  metrics.forEach((metric, index) => {
    const column = index % 2;
    const rowIndex = Math.floor(index / 2);
    const boxX = metricX + column * (metricWidth + metricGap);
    const boxY = panelY + rowIndex * (metricHeight + metricGap);

    addBiometricMetricBox(
      doc,
      boxX,
      boxY,
      metricWidth,
      metricHeight,
      metric.icon,
      metric.label,
      metric.value
    );
  });
};

const addBiometricReadingCard = (
  doc: jsPDF,
  initial: EvolucionSocio,
  current: EvolucionSocio,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(2, 132, 199);
  doc.text("LECTURA AUTOMÁTICA", x + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Cambios corporales detectados", x + 4, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Resumen final de variaciones entre el registro inicial y la última medición.",
    x + 4,
    y + 19,
    { maxWidth: width - 8 }
  );

  const rows = getBiometricDeltaRows(initial, current);
  const columns = 3;
  const gap = 2.5;
  const rowWidth = (width - 8 - gap * (columns - 1)) / columns;
  const rowHeight = 9.8;
  const startX = x + 4;
  const startY = y + 25;

  rows.forEach((row, index) => {
    const column = index % columns;
    const rowIndex = Math.floor(index / columns);
    const rowX = startX + column * (rowWidth + gap);
    const rowY = startY + rowIndex * (rowHeight + 2.6);
    const positive = isPositiveDelta(row.value, row.positiveDirection);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(241, 245, 249);
    doc.roundedRect(rowX, rowY, rowWidth, rowHeight, 2, 2, "FD");

    addPdfIcon(doc, row.icon, rowX + 2, rowY + 2.1, 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text(row.label, rowX + 9, rowY + 6.1, { maxWidth: rowWidth - 22 });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.6);
    doc.setTextColor(positive ? 5 : 2, positive ? 150 : 132, positive ? 105 : 199);
    doc.text(row.value, rowX + rowWidth - 2.5, rowY + 6.1, { align: "right" });
  });

  doc.setFillColor(230, 247, 253);
  doc.setDrawColor(191, 232, 247);
  doc.roundedRect(x + width - 60, y + height - 17, 56, 12, 2, 2, "FD");
  addPdfIcon(doc, "info", x + width - 57.5, y + height - 14.7, 5.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.4);
  doc.setTextColor(2, 132, 199);
  doc.text(
    doc.splitTextToSize("Cierre visual del informe de evolución física.", 44),
    x + width - 49,
    y + height - 12.5
  );
};

const addBiometricVisualizationSection = async (
  doc: jsPDF,
  initial: EvolucionSocio,
  current: EvolucionSocio,
  startY: number
): Promise<number> => {
  let y = ensureSpace(doc, startY, 168);

  const initialModel = buildBiometricVisualModel(initial);
  const currentModel = buildBiometricVisualModel(current);

  const [initialImage, currentImage] = await Promise.all([
    loadTransparentImageAsset(initialModel.dominantSrc),
    loadTransparentImageAsset(currentModel.dominantSrc),
  ]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.2);
  doc.setTextColor(15, 23, 42);
  doc.text("Visualización biométrica", PAGE_MARGIN, y);

  const titleIconX = PAGE_MARGIN + doc.getTextWidth("Visualización biométrica") + 5;
  addPdfIcon(doc, "activity", titleIconX, y - 5.2, 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Comparativa visual y métricas de composición corporal basada en registros reales del socio.",
    PAGE_MARGIN,
    y + 6,
    { maxWidth: CONTENT_WIDTH }
  );

  y += 13;

  const gap = 4;
  const cardWidth = (CONTENT_WIDTH - gap) / 2;
  const cardHeight = 106;
  const readingHeight = 52;

  addBiometricCard(
    doc,
    initial,
    initialImage,
    initialModel,
    "Antes",
    "Registro inicial",
    PAGE_MARGIN,
    y,
    cardWidth,
    cardHeight
  );

  addBiometricCard(
    doc,
    current,
    currentImage,
    currentModel,
    "Ahora",
    "Última medición",
    PAGE_MARGIN + cardWidth + gap,
    y,
    cardWidth,
    cardHeight
  );

  y += cardHeight + 6;

  addBiometricReadingCard(
    doc,
    initial,
    current,
    PAGE_MARGIN,
    y,
    CONTENT_WIDTH,
    readingHeight
  );

  return y + readingHeight + 10;
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

  y = await addBiometricVisualizationSection(doc, initial, current, y + 8);

  addFooter(doc);

  const datePart = new Date().toISOString().split("T")[0];
  const fileName = `evolucion-fisica-${safeFileName(socioNombre || "socio")}-${datePart}.pdf`;

  doc.save(fileName);
};