import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  cancelTrainingSession,
  finishTrainingSession,
  updateTrainingSessionExercise,
} from '@/services/server/rutinaTrainingSessionService';

export const dynamic = 'force-dynamic';

const resolveStatus = (message: string): number => {
  if (message.includes('obligatorio') || message.includes('válido')) return 400;
  if (message.includes('permisos')) return 403;
  if (message.includes('No se encontró')) return 404;
  if (message.includes('activa')) return 409;
  return 500;
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body?.action ?? 'update_exercise');

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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: resolveStatus(message) });
  }
}
