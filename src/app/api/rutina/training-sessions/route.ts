import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  listTrainingSessions,
  startTrainingSession,
} from '@/services/server/rutinaTrainingSessionService';

export const dynamic = 'force-dynamic';

const resolveStatus = (message: string): number => {
  if (message.includes('obligatorio') || message.includes('válido')) return 400;
  if (message.includes('permisos')) return 403;
  if (message.includes('No se encontró')) return 404;
  return 500;
};

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: resolveStatus(message) });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = await startTrainingSession(user, body);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: resolveStatus(message) });
  }
}
