import type { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import {
  noStoreJson,
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';
import { registrarAsistenciaDesdeQR } from '@/services/asistenciaService';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const REGISTRO_QR_PATHS = [
  '/dashboard/asistencias',
  '/dashboard/control-asistencia',
];
const REGISTRO_QR_BODY_MAX_BYTES = 8 * 1024;

type RegistroQrBody = {
  qr?: unknown;
};

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
  if (!tokenAsistencia || tokenAsistencia.length > 512) {
    return noStoreJson(
      { valido: false, error: 'Falta el tokenAsistencia' },
      400,
    );
  }

  const registro = await registrarAsistenciaDesdeQR(tokenAsistencia, user);

  if (!registro.valido) {
    return noStoreJson(registro, getInvalidRegistroStatus(registro));
  }

  return noStoreJson(registro, 200);
}

export async function GET(req: NextRequest) {
  try {
    const user = await authorizeRegistroQR(req);
    const { searchParams } = new URL(req.url);
    return handleRegistroQR(user, searchParams.get('tokenAsistencia'));
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error al registrar asistencia QR:', {
      method: 'GET',
      name: error instanceof Error ? error.name : 'UnknownError',
    });
    return noStoreJson(
      { valido: false, error: 'No se pudo registrar la asistencia' },
      400,
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeRegistroQR(req);
    const body = await readJsonBody<RegistroQrBody>(
      req,
      REGISTRO_QR_BODY_MAX_BYTES,
    );
    const qr = typeof body.qr === 'string' ? body.qr.trim() : '';
    return handleRegistroQR(user, qr || null);
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const runtimeResponse = runtimeErrorResponse(
      error,
      'No se pudo registrar la asistencia',
      400,
    );

    if (runtimeResponse.status >= 500) {
      console.error('Error al registrar asistencia QR:', {
        method: 'POST',
        name: error instanceof Error ? error.name : 'UnknownError',
      });
    }

    return runtimeResponse;
  }
}
