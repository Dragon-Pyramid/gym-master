import type { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import { registrarAsistenciaDesdeQR } from '@/services/asistenciaService';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const REGISTRO_QR_PATHS = [
  '/dashboard/asistencias',
  '/dashboard/control-asistencia',
];

function getInvalidRegistroStatus(registro: any) {
  if (registro?.access_status === 'desactivado') return 403;
  if (registro?.access_status === 'qr_expirado') return 400;
  return 400;
}

async function authorizeRegistroQR(req: NextRequest) {
  return authorizePersonalOrDashboardRequest(
    req,
    REGISTRO_QR_PATHS,
    ['admin', 'usuario'],
    ['socio'],
  );
}

async function handleRegistroQR(
  user: JwtUser,
  tokenAsistencia: string | null,
) {
  if (!tokenAsistencia) {
    return NextResponse.json(
      { valido: false, error: 'Falta el tokenAsistencia' },
      { status: 400 },
    );
  }

  const registro = await registrarAsistenciaDesdeQR(tokenAsistencia, user);

  if (!registro.valido) {
    return NextResponse.json(registro, {
      status: getInvalidRegistroStatus(registro),
    });
  }

  return NextResponse.json(registro, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const user = await authorizeRegistroQR(req);
    const { searchParams } = new URL(req.url);
    return handleRegistroQR(user, searchParams.get('tokenAsistencia'));
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error ? error.message : 'Error al registrar asistencia';
    console.error(error);
    return NextResponse.json(
      { valido: false, error: message },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeRegistroQR(req);
    const body = await req.json();
    return handleRegistroQR(user, body.qr ?? null);
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error ? error.message : 'Error al registrar asistencia';
    console.error(error);
    return NextResponse.json(
      { valido: false, error: message },
      { status: 400 },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
