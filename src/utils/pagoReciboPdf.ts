"use client";

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { ResponsePago } from "@/interfaces/pago.interface";
import { buildPagoVerificationCode } from "@/utils/pagoReciboCodigo";

function formatDate(value?: string | null) {
  if (!value) return "-";

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatMoney(value?: number | null) {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

function humanize(value?: string | null) {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPeriodLabel(pago: ResponsePago) {
  const desde = pago.periodo_desde ?? pago.fecha_pago;
  const hasta = pago.periodo_hasta ?? pago.fecha_vencimiento;

  return `${formatDate(desde)} al ${formatDate(hasta)}`;
}

function getSocioEmail(pago: ResponsePago) {
  return pago.socio?.email?.trim() || "-";
}

function getVerificationUrl(pago: ResponsePago) {
  const codigo = buildPagoVerificationCode(pago.id);

  if (typeof window === "undefined") {
    return `/api/pagos/${pago.id}/verificar?codigo=${encodeURIComponent(codigo)}`;
  }

  return new URL(
    `/api/pagos/${pago.id}/verificar?codigo=${encodeURIComponent(codigo)}`,
    window.location.origin
  ).toString();
}

async function loadImageAsPngDataUrl(
  src: string,
  maxWidth = 320,
  maxHeight = 320,
  options?: { tintColor?: string }
) {
  return new Promise<string | null>((resolve) => {
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

        if (options?.tintColor) {
          ctx.globalCompositeOperation = "source-in";
          ctx.fillStyle = options.tintColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = "source-over";
        }

        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function addSectionTitle(doc: jsPDF, title: string, x: number, y: number, lineWidth = 55) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(title, x, y);

  doc.setDrawColor(2, 168, 225);
  doc.setLineWidth(0.5);
  doc.line(x, y + 2.2, x + lineWidth, y + 2.2);
}

function addField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  const lines = doc.splitTextToSize(value || "-", width);
  doc.text(lines, x, y + 5.2);
}

function addStackedField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(doc.splitTextToSize(value || "-", width), x, y + 4.5);
}

function addStatusPill(doc: jsPDF, value: string, x: number, y: number) {
  const normalized = value.toLowerCase();
  const isPaid = normalized === "pagado";
  const isCancelled = normalized === "cancelado";

  if (isPaid) {
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(134, 239, 172);
    doc.setTextColor(22, 101, 52);
  } else if (isCancelled) {
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(252, 165, 165);
    doc.setTextColor(153, 27, 27);
  } else {
    doc.setFillColor(254, 249, 195);
    doc.setDrawColor(253, 224, 71);
    doc.setTextColor(133, 77, 14);
  }

  doc.roundedRect(x, y, 34, 8, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(humanize(value), x + 17, y + 5.3, { align: "center" });
}

export async function descargarPagoReciboPdf(pago: ResponsePago) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const codigo = buildPagoVerificationCode(pago.id);
  const verificationUrl = getVerificationUrl(pago);

  const [logoDataUrl, qrDataUrl] = await Promise.all([
    loadImageAsPngDataUrl("/gm_logo.svg", 256, 256, { tintColor: "#ffffff" }).catch(
      () => null
    ),
    QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    }),
  ]);

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 38, "F");

  doc.setFillColor(2, 168, 225);
  doc.rect(0, 38, pageWidth, 2, "F");

  if (logoDataUrl) {
    // Mantener proporción cuadrada para evitar logo ovalado/deformado.
    doc.addImage(logoDataUrl, "PNG", margin, 4, 30, 30);
  } else {
    doc.setFillColor(2, 168, 225);
    doc.circle(margin + 15, 19, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("GM", margin + 15, 22, { align: "center" });
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("GYM MASTER", margin + 37, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text("Recibo oficial de pago de cuota", margin + 37, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("RECIBO DE PAGO", pageWidth - margin, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Código: ${codigo}`, pageWidth - margin, 24, { align: "right" });

  let y = 52;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 52, 3, 3, "FD");

  addSectionTitle(doc, "Datos del socio", margin + 5, y + 9, 55);
  addStackedField(
    doc,
    "Nombre del socio",
    pago.socio?.nombre_completo ?? "-",
    margin + 5,
    y + 20,
    pageWidth - margin * 2 - 10
  );
  addStackedField(
    doc,
    "ID socio",
    pago.socio?.id_socio ?? "-",
    margin + 5,
    y + 32,
    pageWidth - margin * 2 - 10
  );
  addStackedField(doc, "Email", getSocioEmail(pago), margin + 5, y + 44, pageWidth - margin * 2 - 10);

  y += 64;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 82, 3, 3, "FD");

  addSectionTitle(doc, "Detalle del pago", margin + 5, y + 9, 55);

  const col1 = margin + 5;
  const col2 = margin + 70;
  const col3 = margin + 133;

  addField(doc, "Cuota abonada", pago.cuota?.descripcion ?? "Cuota", col1, y + 22, 55);
  addField(doc, "Período cubierto", getPeriodLabel(pago), col2, y + 22, 54);
  addField(doc, "Meses cubiertos", `${pago.meses_cubiertos ?? 1}`, col3, y + 22, 38);

  addField(doc, "Fecha de pago", formatDate(pago.fecha_pago), col1, y + 43, 55);
  addField(doc, "Fecha de vencimiento", formatDate(pago.fecha_vencimiento), col2, y + 43, 54);
  addField(doc, "Medio de pago", humanize(pago.metodo_pago), col3, y + 43, 38);

  addField(doc, "Registrado por", pago.registrado_por?.nombre ?? "-", col1, y + 64, 55);
  addField(doc, "Observaciones", pago.observaciones ?? "-", col2, y + 64, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text("ESTADO", col3, y + 64);
  addStatusPill(doc, pago.estado ?? "pagado", col3, y + 68);

  y += 94;

  const amountBoxX = margin;
  const amountBoxW = 78;
  const verificationBoxX = margin + amountBoxW + 8;
  const verificationBoxW = pageWidth - margin - verificationBoxX;
  const summaryBoxH = 54;

  doc.setFillColor(230, 247, 253);
  doc.setDrawColor(184, 232, 247);
  doc.roundedRect(amountBoxX, y, amountBoxW, summaryBoxH, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(2, 132, 199);
  doc.text("TOTAL ABONADO", amountBoxX + 6, y + 11);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(formatMoney(pago.monto_pagado), amountBoxX + 6, y + 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    doc.splitTextToSize(
      `Comprobante emitido por Gym Master. Código: ${codigo}`,
      amountBoxW - 12
    ),
    amountBoxX + 6,
    y + 36
  );

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(verificationBoxX, y, verificationBoxW, summaryBoxH, 3, 3, "FD");

  doc.addImage(qrDataUrl, "PNG", verificationBoxX + 6, y + 10, 30, 30);

  const verificationTextX = verificationBoxX + 42;
  const verificationTextW = verificationBoxW - 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  doc.setTextColor(15, 23, 42);
  doc.text("Verificación del comprobante", verificationTextX, y + 12, {
    maxWidth: verificationTextW,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    doc.splitTextToSize(
      "Escanee el QR desde administración o consulte el código impreso para validar el pago.",
      verificationTextW
    ),
    verificationTextX,
    y + 21
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(2, 132, 199);
  doc.text(doc.splitTextToSize(codigo, verificationTextW), verificationTextX, y + 42);

  y += 68;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Este recibo acredita el registro administrativo del pago en Gym Master. La validez operativa puede verificarse mediante el QR o código informado.",
    margin,
    y + 9,
    { maxWidth: pageWidth - margin * 2 }
  );

  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Emitido: ${new Date().toLocaleString("es-AR")}`, margin, pageHeight - 12);
  doc.text(`Pago ID: ${pago.id}`, pageWidth - margin, pageHeight - 12, {
    align: "right",
  });

  doc.save(`recibo-gym-master-${codigo}.pdf`);
}
