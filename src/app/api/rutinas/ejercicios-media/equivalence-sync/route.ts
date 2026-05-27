import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { syncExerciseMediaEquivalences } from '@/services/ejercicioMediaCatalogService';

export const dynamic = 'force-dynamic';

function getStatusFromError(error: any) {
  const message = error?.message ?? '';

  if (message.includes('Token no proporcionado') || message.includes('Token inválido')) {
    return 401;
  }

  if (message.includes('No autorizado')) {
    return 403;
  }

  return 500;
}

export async function POST(request: Request) {
  try {
    const { user } = await authMiddleware(request);
    const payload = await request.json().catch(() => ({}));

    const result = await syncExerciseMediaEquivalences(user, {
      apply: payload?.apply === true,
      limit: Number(payload?.limit ?? 500),
    });

    return NextResponse.json(
      {
        message: result.dryRun
          ? 'Previsualización de equivalencias generada correctamente.'
          : 'Sincronización de media equivalente aplicada correctamente.',
        ...result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const status = getStatusFromError(error);

    if (status === 500) {
      console.error('Error al sincronizar media de ejercicios equivalentes:', error);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Error al sincronizar media de ejercicios equivalentes.' },
      { status }
    );
  }
}
