import { NextRequest, NextResponse } from 'next/server';

import {
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';
import {
  createPublicComercialScannerEvent,
  getPublicComercialScannerSession,
} from '@/services/server/comercialMobileScannerServerService';

export const dynamic = 'force-dynamic';

// AUTH POLICY: PUBLIC_TOKEN
// The scanner session is intentionally reachable without a user JWT. Access is
// limited by a 144-bit random token, strict token format, expiry and session
// state checks in the server service.
const PUBLIC_SCANNER_TOKEN_RE = /^gm-pos-[a-f0-9]{36}$/;
const PUBLIC_SCANNER_BODY_MAX_BYTES = 8 * 1024;

type Params = {
  params: {
    token: string;
  };
};

type ScannerBody = {
  codigo?: unknown;
};

function getValidatedToken(token: string) {
  const cleanToken = String(token ?? '').trim().toLowerCase();
  if (!PUBLIC_SCANNER_TOKEN_RE.test(cleanToken)) {
    throw new Error('Token de scanner inválido');
  }
  return cleanToken;
}

function publicScannerResponse<T>(payload: T, status: number) {
  return NextResponse.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function getPublicScannerError(error: unknown, operation: 'read' | 'write') {
  const message = error instanceof Error ? error.message : '';

  if (/Token de scanner inválido/i.test(message)) {
    return { message: 'Token de scanner inválido', status: 400 };
  }

  if (/Sesión de scanner no encontrada/i.test(message)) {
    return { message: 'Sesión de scanner no encontrada', status: 404 };
  }

  if (/no está activa|expiró/i.test(message)) {
    return { message, status: 409 };
  }

  if (/código válido/i.test(message)) {
    return { message: 'El código escaneado es inválido', status: 400 };
  }

  console.error('Error en scanner público:', {
    operation,
    name: error instanceof Error ? error.name : 'UnknownError',
  });

  return {
    message: operation === 'read'
      ? 'No se pudo obtener la sesión pública de scanner'
      : 'No se pudo procesar el código escaneado',
    status: 500,
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getPublicComercialScannerSession(
      getValidatedToken(params.token),
    );
    return publicScannerResponse({ data: session }, 200);
  } catch (error) {
    const publicError = getPublicScannerError(error, 'read');
    return publicScannerResponse(
      { error: publicError.message },
      publicError.status,
    );
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const token = getValidatedToken(params.token);
    const body = await readJsonBody<ScannerBody>(
      req,
      PUBLIC_SCANNER_BODY_MAX_BYTES,
    );
    const codigo = String(body.codigo ?? '').trim();

    if (!codigo || codigo.length > 160) {
      return publicScannerResponse(
        { error: 'El código escaneado es inválido' },
        400,
      );
    }

    const result = await createPublicComercialScannerEvent(token, codigo);
    return publicScannerResponse(
      { data: result, message: result.message },
      201,
    );
  } catch (error) {
    const runtimeResponse = runtimeErrorResponse(
      error,
      'No se pudo procesar el código escaneado',
    );

    if (runtimeResponse.status !== 500) return runtimeResponse;

    const publicError = getPublicScannerError(error, 'write');
    return publicScannerResponse(
      { error: publicError.message },
      publicError.status,
    );
  }
}
