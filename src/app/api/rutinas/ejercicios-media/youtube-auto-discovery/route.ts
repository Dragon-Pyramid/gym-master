import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { autoDiscoverExerciseYoutubeVideos } from '@/services/ejercicioMediaCatalogService';

export const dynamic = 'force-dynamic';

function getAuthStatus(error: any) {
  const message = error?.message ?? '';

  if (message.includes('Token no proporcionado') || message.includes('Token inválido')) {
    return 401;
  }

  if (message.includes('No autorizado')) {
    return 403;
  }

  if (message.includes('YOUTUBE_DATA_API_KEY')) {
    return 400;
  }

  return 500;
}

export async function POST(request: Request) {
  try {
    const { user } = await authMiddleware(request);
    const payload = await request.json().catch(() => ({}));

    const result = await autoDiscoverExerciseYoutubeVideos(user, {
      apply: payload.apply === true,
      limit: payload.limit,
      idiomas: payload.idiomas,
      onlyMissing: payload.onlyMissing,
      regionEs: payload.regionEs,
      regionEn: payload.regionEn,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const status = getAuthStatus(error);

    if (status === 500) {
      console.error('Error en descubrimiento automático YouTube por ejercicio:', error);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Error en descubrimiento automático de videos de YouTube.' },
      { status }
    );
  }
}
