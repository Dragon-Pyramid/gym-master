import jsPDF from "jspdf";
import { Dieta } from "@/interfaces/dieta.interface";

type PlanBlock = {
  title: string;
  items: string[];
};

const MEAL_ORDER = [
  "desayuno",
  "colacion media manana",
  "almuerzo",
  "colacion siesta",
  "merienda",
  "colacion tarde",
  "cena",
];

const MEAL_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  "colacion media manana": "Colación media mañana",
  almuerzo: "Almuerzo",
  "colacion siesta": "Colación siesta",
  merienda: "Merienda",
  "colacion tarde": "Colación tarde",
  cena: "Cena",
};

const normalizeMealTitle = (value: string): string => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (normalized.includes("desayuno")) return "desayuno";
  if (normalized.includes("media manana") || normalized.includes("colacion manana")) {
    return "colacion media manana";
  }
  if (normalized.includes("almuerzo")) return "almuerzo";
  if (normalized.includes("siesta")) return "colacion siesta";
  if (normalized.includes("merienda")) return "merienda";
  if (normalized.includes("tarde")) return "colacion tarde";
  if (normalized.includes("cena")) return "cena";

  return normalized;
};

const orderPlanBlocks = (blocks: PlanBlock[]): PlanBlock[] => {
  return blocks
    .map((block, index) => {
      const key = normalizeMealTitle(block.title);
      const order = MEAL_ORDER.indexOf(key);

      return {
        ...block,
        title: MEAL_LABELS[key] || block.title,
        __order: order === -1 ? 999 + index : order,
      };
    })
    .sort((a, b) => a.__order - b.__order)
    .map(({ __order, ...block }) => block);
};

interface DescargarDietaPdfParams {
  dieta: Dieta;
  socioNombre?: string;
  logoUrl?: string;
}

const PAGE_MARGIN = 14;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const LINE_HEIGHT = 6;

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

const formatDate = (date?: string): string => {
  if (!date) return "No disponible";

  try {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return date;
  }
};

const calculateDays = (start?: string, end?: string): number => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diff) || diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
};

const parsePlan = (observaciones?: string): { blocks: PlanBlock[]; raw?: string } => {
  if (!observaciones?.trim()) return { blocks: [] };

  try {
    const parsed = JSON.parse(observaciones);

    if (Array.isArray(parsed)) {
      return {
        blocks: orderPlanBlocks(
          parsed.map((item, index) => ({
            title: item?.title || item?.comida || `Comida ${index + 1}`,
            items: Array.isArray(item?.items)
              ? item.items.map(String)
              : [item?.descripcion || item?.detalle || JSON.stringify(item)],
          }))
        ),
      };
    }

    if (typeof parsed === "object" && parsed !== null) {
      return {
        blocks: orderPlanBlocks(Object.entries(parsed).map(([key, value]) => {
          if (Array.isArray(value)) {
            return {
              title: key,
              items: value.map(String),
            };
          }

          if (typeof value === "object" && value !== null) {
            const record = value as Record<string, unknown>;
            return {
              title: key,
              items: [
                String(
                  record.descripcion ||
                    record.detalle ||
                    record.items ||
                    JSON.stringify(record)
                ),
              ],
            };
          }

          return {
            title: key,
            items: [String(value)],
          };
        })),
      };
    }
  } catch {
    return { blocks: [], raw: observaciones };
  }

  return { blocks: [], raw: observaciones };
};

const normalizarUrlImagen = (url: string): string => {
  const value = url.trim();

  if (!value) return value;
  if (value.startsWith("data:")) return value;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return `/api/image-proxy?url=${encodeURIComponent(value)}`;
  }

  return value;
};

const loadImageAsDataUrl = async (
  url: string,
  maxWidth = 600,
  maxHeight = 600
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

    image.onerror = () => resolve(null);
    image.src = normalizarUrlImagen(url);
  });
};

const addWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = LINE_HEIGHT
): number => {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((line, index) => {
    doc.text(line, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
};

const ensureSpace = (doc: jsPDF, y: number, requiredHeight: number): number => {
  if (y + requiredHeight <= PAGE_HEIGHT - PAGE_MARGIN) {
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
    doc.text(`Gym Master · Plan alimentario · Página ${page} de ${totalPages}`, PAGE_MARGIN, 288);
  }
};

const addInfoBox = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
): void => {
  doc.setDrawColor(225, 229, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(x, y, width, 18, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(label.toUpperCase(), x + 3, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(doc.splitTextToSize(value, width - 6) as string[], x + 3, y + 12);
};

export const descargarDietaPdf = async ({
  dieta,
  socioNombre,
  logoUrl = "/gm_logo.svg",
}: DescargarDietaPdfParams): Promise<void> => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const plan = parsePlan(dieta.observaciones);
  const titulo = dieta.nombre_plan || "Plan alimentario";
  const nombreSocio =
    socioNombre || dieta.socio?.nombre_completo || normalizarTexto(dieta.socio_id, "Socio no disponible");
  const logoData = await loadImageAsDataUrl(logoUrl, 500, 500);

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
  doc.text("Plan alimentario", logoData ? 44 : PAGE_MARGIN, 24);
  doc.text(`Socio: ${nombreSocio}`, logoData ? 44 : PAGE_MARGIN, 31);

  y = 52;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  y = addWrappedText(doc, titulo, PAGE_MARGIN, y, CONTENT_WIDTH, 7) + 4;

  const boxWidth = (CONTENT_WIDTH - 8) / 3;
  addInfoBox(doc, "Objetivo", normalizarTexto(dieta.objetivo, "No definido"), PAGE_MARGIN, y, boxWidth);
  addInfoBox(doc, "Inicio", formatDate(dieta.fecha_inicio), PAGE_MARGIN + boxWidth + 4, y, boxWidth);
  addInfoBox(doc, "Fin", formatDate(dieta.fecha_fin), PAGE_MARGIN + (boxWidth + 4) * 2, y, boxWidth);
  y += 24;

  addInfoBox(
    doc,
    "Duración",
    calculateDays(dieta.fecha_inicio, dieta.fecha_fin) > 0
      ? `${calculateDays(dieta.fecha_inicio, dieta.fecha_fin)} días`
      : "No calculable",
    PAGE_MARGIN,
    y,
    boxWidth
  );
  addInfoBox(doc, "DNI / Email", normalizarTexto(dieta.socio?.dni || dieta.socio?.email), PAGE_MARGIN + boxWidth + 4, y, boxWidth);
  y += 30;

  doc.setFillColor(240, 244, 248);
  doc.roundedRect(PAGE_MARGIN, y - 6, CONTENT_WIDTH, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text("Plan alimentario", PAGE_MARGIN + 4, y);
  y += 12;

  if (plan.blocks.length > 0) {
    for (const block of plan.blocks) {
      y = ensureSpace(doc, y, 24);
      doc.setDrawColor(225, 229, 235);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(PAGE_MARGIN, y - 4, CONTENT_WIDTH, 8, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text(block.title, PAGE_MARGIN + 4, y + 1);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.2);
      doc.setTextColor(60, 60, 60);

      for (const item of block.items) {
        y = ensureSpace(doc, y, 14);
        doc.text("•", PAGE_MARGIN + 3, y);
        y = addWrappedText(doc, item, PAGE_MARGIN + 8, y, CONTENT_WIDTH - 12, 5.2) + 2;
      }

      y += 3;
    }
  } else if (plan.raw) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    y = addWrappedText(doc, plan.raw, PAGE_MARGIN, y, CONTENT_WIDTH, 5.5) + 4;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(110, 110, 110);
    doc.text("Esta dieta no tiene detalle alimentario registrado.", PAGE_MARGIN, y);
  }

  y = ensureSpace(doc, y, 24);
  doc.setDrawColor(225, 229, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 20, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  addWrappedText(
    doc,
    "Este plan alimentario es una guía de apoyo generada por Gym Master. Ante condiciones médicas, alergias, embarazo, postparto o necesidades nutricionales específicas, consultar con un profesional de salud o nutrición.",
    PAGE_MARGIN + 4,
    y + 7,
    CONTENT_WIDTH - 8,
    4.5
  );

  addFooter(doc);
  doc.save(`${safeFileName(`${titulo}-${nombreSocio}`)}.pdf`);
};
