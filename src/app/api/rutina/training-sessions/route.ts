import { NextResponse } from 'next/server';
import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import {
  listTrainingSessions,
  startTrainingSession,
} from '@/services/server/rutinaTrainingSessionService';
import {
  HttpRuntimeError,
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';

export const dynamic = 'force-dynamic';

const resolveStatus = (message: string): number => {
  if (
    message.includes('obligatorio') ||
    message.includes('válido')
  ) {
    return 400;
  }

  if (message.includes('permisos')) {
    return 403;
  }

  if (message.includes('No se encontró')) {
    return 404;
  }

  return 500;
};

type StartTrainingSessionRequestBody =
  Parameters<typeof startTrainingSession>[1];

function trainingSessionErrorResponse(
  error: unknown,
  fallback: string,
) {
  if (error instanceof HttpRuntimeError) {
    return runtimeErrorResponse(
      error,
      fallback,
    );
  }

  const message =
    error instanceof Error
      ? error.message
      : '';

  const status = resolveStatus(message);

  if (status < 500) {
    return NextResponse.json(
      {
        error:
          message ||
          'Solicitud inválida',
      },
      { status },
    );
  }

  console.error(fallback, {
    name:
      error instanceof Error
        ? error.name
        : 'UnknownError',
  });

  return NextResponse.json(
    { error: fallback },
    { status: 500 },
  );
}

export async function GET(req: Request) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/rutinas/asistente', '/dashboard/gestor-rutinas'],
      ['admin'],
      ['socio'],
    );

    const { searchParams } = new URL(req.url);
    const rutinaId = searchParams.get('rutinaId');

    if (!rutinaId) {
      return NextResponse.json(
        { error: 'rutinaId es obligatorio' },
        { status: 400 },
      );
    }

    const data = await listTrainingSessions(user, rutinaId);

    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      },
    );
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    return trainingSessionErrorResponse(
      error,
      'Error al obtener sesiones de entrenamiento',
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/rutinas/asistente', '/dashboard/gestor-rutinas'],
      ['admin'],
      ['socio'],
    );

    const body =
      await readJsonBody<
        StartTrainingSessionRequestBody
      >(
        req,
        64 * 1024,
      );

    const data =
      await startTrainingSession(
        user,
        body,
      );

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    return trainingSessionErrorResponse(
      error,
      'Error al iniciar la sesión de entrenamiento',
    );
  }
}
