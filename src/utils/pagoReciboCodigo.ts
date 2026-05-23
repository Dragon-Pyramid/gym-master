export function buildPagoVerificationCode(pagoId: string) {
  const normalized = (pagoId || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  if (!normalized) {
    return "GM-PAGO-SIN-ID";
  }

  const prefix = normalized.slice(0, 8).padEnd(8, "0");
  const suffix = normalized.slice(-6).padStart(6, "0");

  return `GM-PAGO-${prefix}-${suffix}`;
}

export function normalizePagoVerificationCode(value: string | null | undefined) {
  return (value || "").trim().toUpperCase();
}

export function isPagoVerificationCodeValid(pagoId: string, codigo: string | null | undefined) {
  return normalizePagoVerificationCode(codigo) === buildPagoVerificationCode(pagoId);
}
