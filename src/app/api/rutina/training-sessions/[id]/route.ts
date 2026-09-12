import { NextResponse } from 'next/server';
import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import {
  cancelTrainingSession,
  finishTrainingSession,
  updateTrainingSessionExercise,
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

  if (message.includes('activa')) {
    return 409;
  }

  return 500;
};

type TrainingSessionActionRequestBody =
  Parameters<
    typeof updateTrainingSessionExercise
  >[2] & {
    action?: unknown;
  };

function trainingSessionItemErrorResponse(
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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/rutinas/asistente', '/dashboard/gestor-rutinas'],
      ['admin'],
      ['socio'],
    );

    const body =
      await readJsonBody<
        TrainingSessionActionRequestBody
      >(
        req,
        64 * 1024,
      );

    const action = String(
      body?.action ?? 'update_exercise',
    );

    if (action === 'finish') {
      const data = await finishTrainingSession(user, params.id);
      return NextResponse.json({ data }, { status: 200 });
    }

    if (action === 'cancel') {
      const data = await cancelTrainingSession(user, params.id);
      return NextResponse.json({ data }, { status: 200 });
    }

    if (action === 'update_exercise') {
      const data = await updateTrainingSessionExercise(user, params.id, body);
      return NextResponse.json({ data }, { status: 200 });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    return trainingSessionItemErrorResponse(
      error,
      'Error al actualizar la sesión de entrenamiento',
    );
  }
}
