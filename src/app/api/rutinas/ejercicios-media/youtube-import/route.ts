import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { importExerciseYoutubeVideos } from '@/services/ejercicioMediaCatalogService';

export const dynamic = 'force-dynamic';

function getAuthStatus(error: any) {
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
    const payload = await request.json();

    if (!Array.isArray(payload?.items)) {
      return NextResponse.json(
        { error: 'Debe enviar items como arreglo de ejercicios/videos a importar.' },
        { status: 400 }
      );
    }

    const result = await importExerciseYoutubeVideos(user, {
      apply: payload.apply === true,
      items: payload.items,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const status = getAuthStatus(error);

    if (status === 500) {
      console.error('Error en importación masiva de YouTube por ejercicio:', error);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Error en importación masiva de videos de YouTube.' },
      { status }
    );
  }
}
