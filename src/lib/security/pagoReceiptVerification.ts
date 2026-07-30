import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

const RECEIPT_CODE_PREFIX = 'GM-PAGO-V2';
const RECEIPT_SIGNING_CONTEXT = 'gym-master:pago-receipt:v2';
const MIN_SECRET_BYTES = 32;
const MAX_PAGO_ID_LENGTH = 128;

function getReceiptVerificationSecret() {
  const secret = process.env.PAGO_RECEIPT_VERIFICATION_SECRET?.trim() ?? '';

  if (!secret) {
    throw new Error(
      'PAGO_RECEIPT_VERIFICATION_SECRET no está definido',
    );
  }

  if (Buffer.byteLength(secret, 'utf8') < MIN_SECRET_BYTES) {
    throw new Error(
      `PAGO_RECEIPT_VERIFICATION_SECRET debe tener al menos ${MIN_SECRET_BYTES} bytes`,
    );
  }

  return secret;
}

function normalizePagoId(pagoId: string) {
  const normalized = String(pagoId ?? '').trim();

  if (!normalized || normalized.length > MAX_PAGO_ID_LENGTH) {
    throw new Error('ID de pago inválido para verificación de recibo');
  }

  return normalized;
}

function buildSignature(pagoId: string) {
  const normalizedId = normalizePagoId(pagoId);
  const secret = getReceiptVerificationSecret();

  return createHmac('sha256', secret)
    .update(`${RECEIPT_SIGNING_CONTEXT}:${normalizedId}`, 'utf8')
    .digest('base64url');
}

export function buildPagoReceiptVerificationCode(pagoId: string) {
  return `${RECEIPT_CODE_PREFIX}-${buildSignature(pagoId)}`;
}

export function normalizePagoReceiptVerificationCode(
  value: string | null | undefined,
) {
  return String(value ?? '').trim();
}

export function isPagoReceiptVerificationCodeValid(
  pagoId: string,
  value: string | null | undefined,
) {
  try {
    const provided = normalizePagoReceiptVerificationCode(value);

    if (!provided.startsWith(`${RECEIPT_CODE_PREFIX}-`)) {
      return false;
    }

    const expected = buildPagoReceiptVerificationCode(pagoId);
    const providedBuffer = Buffer.from(provided, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    return (
      providedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(providedBuffer, expectedBuffer)
    );
  } catch {
    return false;
  }
}
