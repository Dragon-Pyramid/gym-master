import type { PagoBonificacionMensualSocio, PagoDescuentoPreview } from "@/interfaces/pago.interface";

function roundMoney(value: number) {
  return Number(Math.max(value, 0).toFixed(2));
}

function safePercent(value?: number | null) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}

export function resolveBonificacionMensualForPeriod(params: {
  socioId?: string | null;
  fechaReferencia?: string | null;
  bonificaciones?: PagoBonificacionMensualSocio[] | null;
}): PagoBonificacionMensualSocio | null {
  if (!params.socioId || !params.fechaReferencia || !params.bonificaciones?.length) return null;

  const [year, month] = String(params.fechaReferencia).slice(0, 10).split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;

  return (
    params.bonificaciones.find(
      (bonificacion) =>
        bonificacion.socio_id === params.socioId &&
        bonificacion.anio === year &&
        bonificacion.mes === month &&
        bonificacion.bonificado === true &&
        safePercent(bonificacion.descuento_porcentaje) > 0,
    ) ?? null
  );
}

export function combinarDescuentosPago(params: {
  previewPagoAdelantado: PagoDescuentoPreview;
  bonificacionMensual?: PagoBonificacionMensualSocio | null;
}): PagoDescuentoPreview {
  const preview = params.previewPagoAdelantado;
  const subtotal = roundMoney(Number(preview.subtotal ?? 0));
  const porcentajePagoAdelantado = safePercent(preview.descuento_porcentaje);
  const porcentajeBonificacion = params.bonificacionMensual?.bonificado
    ? safePercent(params.bonificacionMensual.descuento_porcentaje)
    : 0;
  const cuotaMonto = roundMoney(Number(preview.cuota_monto ?? 0));
  const pagoAdelantadoMonto = roundMoney((subtotal * porcentajePagoAdelantado) / 100);
  // La bonificación mensual corresponde al mes de la cuota, no a todo el paquete
  // de meses cubiertos. Si paga varios meses juntos, se bonifica solo una cuota mensual.
  const bonificacionMonto = roundMoney((cuotaMonto * porcentajeBonificacion) / 100);
  const descuentoMonto = roundMoney(Math.min(subtotal, pagoAdelantadoMonto + bonificacionMonto));
  const porcentajeTotal = subtotal > 0 ? Number(((descuentoMonto / subtotal) * 100).toFixed(2)) : 0;
  const total = roundMoney(subtotal - descuentoMonto);

  const motivos = [
    preview.mensaje && porcentajePagoAdelantado > 0 ? preview.mensaje : null,
    porcentajeBonificacion > 0
      ? `Bonificación mensual del socio: ${porcentajeBonificacion}% sobre 1 cuota del mes${
          params.bonificacionMensual?.motivo ? ` (${params.bonificacionMensual.motivo})` : ""
        }.`
      : null,
  ].filter(Boolean);

  return {
    ...preview,
    descuento_aplicado: descuentoMonto > 0,
    descuento_porcentaje: porcentajeTotal,
    descuento_monto: descuentoMonto,
    total,
    mensaje: motivos.length ? motivos.join(" ") : preview.mensaje ?? null,
    bonificacion_mensual_aplicada: porcentajeBonificacion > 0,
    bonificacion_mensual_porcentaje: porcentajeBonificacion,
    bonificacion_mensual_monto: bonificacionMonto,
    bonificacion_mensual_motivo: params.bonificacionMensual?.motivo ?? null,
    descuento_pago_adelantado_porcentaje: porcentajePagoAdelantado,
    descuento_pago_adelantado_monto: pagoAdelantadoMonto,
  };
}
