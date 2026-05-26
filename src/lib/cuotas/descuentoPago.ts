import type {
  PagoDescuentoConfig,
  PagoDescuentoPreview,
} from "@/interfaces/pago.interface";

export const DEFAULT_PAGO_ADELANTADO_CONFIG: PagoDescuentoConfig = {
  codigo: "pago_adelantado",
  activo: false,
  cuotas_minimas: 2,
  porcentaje: 0,
  descripcion:
    "Descuento configurable para socios que pagan cuotas por adelantado.",
};

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPositiveInteger(value: unknown, fallback = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

export function normalizePagoDescuentoConfig(
  row: Partial<PagoDescuentoConfig> | null | undefined
): PagoDescuentoConfig {
  if (!row) return DEFAULT_PAGO_ADELANTADO_CONFIG;

  return {
    id: row.id,
    codigo: row.codigo || DEFAULT_PAGO_ADELANTADO_CONFIG.codigo,
    activo: row.activo === true,
    cuotas_minimas: Math.max(
      1,
      toPositiveInteger(row.cuotas_minimas, DEFAULT_PAGO_ADELANTADO_CONFIG.cuotas_minimas)
    ),
    porcentaje: Math.min(100, Math.max(0, toNumber(row.porcentaje, 0))),
    descripcion: row.descripcion ?? DEFAULT_PAGO_ADELANTADO_CONFIG.descripcion,
    creado_en: row.creado_en ?? null,
    actualizado_en: row.actualizado_en ?? null,
  };
}

export function calcularDescuentoPago(params: {
  cuotaMonto: number;
  mesesCubiertos: number;
  config?: PagoDescuentoConfig | null;
}): PagoDescuentoPreview {
  const config = normalizePagoDescuentoConfig(params.config);
  const mesesCubiertos = Math.max(1, toPositiveInteger(params.mesesCubiertos, 1));
  const cuotaMonto = Math.max(0, toNumber(params.cuotaMonto, 0));
  const subtotal = Number((cuotaMonto * mesesCubiertos).toFixed(2));

  const descuentoDisponible =
    config.activo === true &&
    config.porcentaje > 0 &&
    mesesCubiertos >= config.cuotas_minimas;

  const descuentoMonto = descuentoDisponible
    ? Number(((subtotal * config.porcentaje) / 100).toFixed(2))
    : 0;

  const total = Number(Math.max(subtotal - descuentoMonto, 0).toFixed(2));

  const mensaje =
    config.activo && config.porcentaje > 0
      ? descuentoDisponible
        ? `Se aplicó ${config.porcentaje}% de descuento por pagar ${mesesCubiertos} cuotas por adelantado.`
        : `Pagando ${config.cuotas_minimas} o más cuotas por adelantado obtenés ${config.porcentaje}% de descuento.`
      : null;

  return {
    cuota_monto: cuotaMonto,
    meses_cubiertos: mesesCubiertos,
    subtotal,
    descuento_aplicado: descuentoDisponible,
    descuento_porcentaje: descuentoDisponible ? config.porcentaje : 0,
    descuento_monto: descuentoMonto,
    total,
    mensaje,
    config,
  };
}

export function formatDiscountPercent(value: number): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0%";
  return `${parsed.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  })}%`;
}
