import {
  createPublicComercialScannerEvent,
  getPublicComercialScannerSession,
} from '@/services/server/comercialMobileScannerServerService';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// AUTH POLICY: PUBLIC_TOKEN
// The scanner session is intentionally reachable without a user JWT. Access is
// limited by a 144-bit random token, strict token format, expiry and session
// state checks in the server service.
const PUBLIC_SCANNER_TOKEN_RE = /^gm-pos-[a-f0-9]{36}$/;

type Params = {
  params: {
    token: string;
  };
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

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getPublicComercialScannerSession(
      getValidatedToken(params.token),
    );
    return publicScannerResponse({ data: session }, 200);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error al obtener sesión pública de scanner';
    return publicScannerResponse({ error: message }, 404);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const token = getValidatedToken(params.token);
    const body = await req.json().catch(() => ({}));
    const codigo = String(body?.codigo ?? '').trim();

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
    const message =
      error instanceof Error
        ? error.message
        : 'Error al enviar código escaneado';
    return publicScannerResponse({ error: message }, 400);
  }
}
