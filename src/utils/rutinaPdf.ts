import jsPDF from "jspdf";
import { formatFrontendDate } from '@/utils/dateFormat';
import { Rutina } from "@/interfaces/rutina.interface";

type EjerciciosPorDia = Record<string, any[]>;

interface DescargarRutinaPdfParams {
  rutina: Rutina;
  ejerciciosPorDia: EjerciciosPorDia;
  socioNombre: string;
  logoUrl?: string;
}

const PAGE_MARGIN = 14;
const LINE_HEIGHT = 6;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

const normalizarTexto = (value: unknown, fallback = "-"): string => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
};

const capitalizar = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const obtenerNombreEjercicio = (ejercicio: any): string => {
  return normalizarTexto(
    ejercicio?.nombre || ejercicio?.ejercicio || ejercicio?.nombre_ejercicio,
    "Ejercicio"
  );
};

const obtenerGrupoEjercicio = (ejercicio: any): string => {
  return normalizarTexto(
    ejercicio?.grupo_muscular || ejercicio?.grupo_nombre || ejercicio?.nombre_gp || ejercicio?.grupo,
    "-"
  );
};

const obtenerSeries = (ejercicio: any): string => {
  return normalizarTexto(ejercicio?.series ?? ejercicio?.sets);
};

const obtenerRepeticiones = (ejercicio: any): string => {
  return normalizarTexto(ejercicio?.reps ?? ejercicio?.repeticiones);
};

const obtenerDescanso = (ejercicio: any): string => {
  if (ejercicio?.descanso_seg !== undefined && ejercicio?.descanso_seg !== null) {
    return `${ejercicio.descanso_seg}s`;
  }

  return normalizarTexto(ejercicio?.descanso);
};

const obtenerImagen = (ejercicio: any): string | null => {
  return (
    ejercicio?.imagen ||
    ejercicio?.imagen_url ||
    ejercicio?.imagenUrl ||
    ejercicio?.url_imagen ||
    ejercicio?.gif_url ||
    ejercicio?.gifUrl ||
    ejercicio?.gif ||
    ejercicio?.video_url ||
    ejercicio?.videoURL ||
    null
  );
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

const obtenerTituloRutina = (rutina: Rutina): string => {
  if (rutina.nombre) return rutina.nombre;
  if (rutina.semana) return `Rutina semana ${rutina.semana}`;
  return `Rutina #${rutina.id_rutina}`;
};

const safeFileName = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
};

const loadImageAsDataUrl = async (url: string, maxWidth = 800, maxHeight = 800): Promise<string | null> => {
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
        console.warn("No se pudo convertir la imagen para PDF:", error);
        resolve(null);
      }
    };

    image.onerror = () => {
      console.warn("No se pudo cargar la imagen para PDF:", url);
      resolve(null);
    };

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
    doc.text(`Gym Master · Página ${page} de ${totalPages}`, PAGE_MARGIN, 288);
  }
};

export const descargarRutinaPdf = async ({
  rutina,
  ejerciciosPorDia,
  socioNombre,
  logoUrl = "/gm_logo.svg",
}: DescargarRutinaPdfParams): Promise<void> => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const titulo = obtenerTituloRutina(rutina);
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
  doc.text("Rutina de entrenamiento", logoData ? 44 : PAGE_MARGIN, 24);
  doc.text(`Socio: ${socioNombre}`, logoData ? 44 : PAGE_MARGIN, 31);

  y = 52;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  y = addWrappedText(doc, titulo, PAGE_MARGIN, y, CONTENT_WIDTH, 7) + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const creado = rutina.creado_en ? formatFrontendDate(rutina.creado_en) : "-";
  const actualizado = rutina.actualizado_en ? formatFrontendDate(rutina.actualizado_en) : "-";
  doc.text(`Creado: ${creado}`, PAGE_MARGIN, y);
  doc.text(`Actualizado: ${actualizado}`, PAGE_MARGIN + 50, y);
  doc.text(`ID rutina: ${rutina.id_rutina}`, PAGE_MARGIN + 108, y);
  y += 10;

  const dias = Object.entries(ejerciciosPorDia).filter(([, ejercicios]) => Array.isArray(ejercicios));

  if (dias.length === 0) {
    doc.setTextColor(110, 110, 110);
    doc.text("Esta rutina no tiene ejercicios cargados o usa un formato no reconocido.", PAGE_MARGIN, y);
    addFooter(doc);
    doc.save(`${safeFileName(titulo)}.pdf`);
    return;
  }

  for (const [dia, ejercicios] of dias) {
    y = ensureSpace(doc, y, 28);
    doc.setFillColor(240, 244, 248);
    doc.roundedRect(PAGE_MARGIN, y - 6, CONTENT_WIDTH, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text(capitalizar(dia), PAGE_MARGIN + 4, y);
    y += 10;

    if (!ejercicios.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Día de descanso", PAGE_MARGIN + 4, y);
      y += 10;
      continue;
    }

    for (const ejercicio of ejercicios) {
      y = ensureSpace(doc, y, 44);
      const nombre = obtenerNombreEjercicio(ejercicio);
      const grupo = obtenerGrupoEjercicio(ejercicio);
      const series = obtenerSeries(ejercicio);
      const repeticiones = obtenerRepeticiones(ejercicio);
      const descanso = obtenerDescanso(ejercicio);
      const imagen = obtenerImagen(ejercicio);
      const imageData = imagen ? await loadImageAsDataUrl(imagen, 500, 500) : null;
      const cardStartY = y;
      const imageBoxX = PAGE_WIDTH - PAGE_MARGIN - 34;
      const textMaxWidth = imageData ? CONTENT_WIDTH - 42 : CONTENT_WIDTH - 8;

      doc.setDrawColor(225, 225, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(PAGE_MARGIN, cardStartY - 4, CONTENT_WIDTH, 32, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(25, 25, 25);
      const textEndY = addWrappedText(doc, nombre, PAGE_MARGIN + 4, y + 2, textMaxWidth, 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`Grupo: ${grupo}`, PAGE_MARGIN + 4, textEndY + 2);
      doc.text(`Series: ${series} · Repeticiones: ${repeticiones} · Descanso: ${descanso}`, PAGE_MARGIN + 4, textEndY + 8);

      if (imageData) {
        doc.addImage(imageData, "PNG", imageBoxX, cardStartY, 28, 24);
      } else {
        doc.setDrawColor(230, 230, 230);
        doc.setFillColor(248, 248, 248);
        doc.roundedRect(imageBoxX, cardStartY, 28, 24, 2, 2, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(140, 140, 140);
        doc.text("Imagen", imageBoxX + 8, cardStartY + 10);
        doc.text("no disponible", imageBoxX + 5, cardStartY + 15);
      }

      y = cardStartY + 36;
    }
  }

  addFooter(doc);
  doc.save(`${safeFileName(titulo)}-${safeFileName(socioNombre)}.pdf`);
};
