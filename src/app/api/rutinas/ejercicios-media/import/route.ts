import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { importExerciseMediaFromRemoteUrl } from '@/services/ejercicioMediaCatalogService';

export const dynamic = 'force-dynamic';

function getStatusFromError(error: any) {
  const message = error?.message ?? '';

  if (message.includes('Token no proporcionado') || message.includes('Token inválido')) {
    return 401;
  }

  if (message.includes('No autorizado')) {
    return 403;
  }

  if (
    message.includes('URL') ||
    message.includes('imagen') ||
    message.includes('Cloudinary') ||
    message.includes('máximo permitido') ||
    message.includes('protocolo') ||
    message.includes('privadas') ||
    message.includes('id_ejercicio')
  ) {
    return 400;
  }

  return 500;
}

export async function POST(request: Request) {
  try {
    const { user } = await authMiddleware(request);
    const payload = await request.json();

    if (!payload?.id_ejercicio || !Number.isInteger(Number(payload.id_ejercicio))) {
      return NextResponse.json(
        { error: 'Debe indicar un id_ejercicio válido.' },
        { status: 400 }
      );
    }

    const imported = await importExerciseMediaFromRemoteUrl(user, {
      ...payload,
      id_ejercicio: Number(payload.id_ejercicio),
    });

    return NextResponse.json(
      {
        message: 'Media importada correctamente a Cloudinary.',
        ...imported,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const status = getStatusFromError(error);

    if (status === 500) {
      console.error('Error al importar media remota de ejercicio:', error);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Error al importar media remota de ejercicio.' },
      { status }
    );
  }
}
