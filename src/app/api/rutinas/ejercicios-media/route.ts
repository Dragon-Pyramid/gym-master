import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  getExerciseMediaCatalog,
  updateExerciseMediaCatalogItem,
} from '@/services/ejercicioMediaCatalogService';

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

export async function GET(request: Request) {
  try {
    const { user } = await authMiddleware(request);
    const url = new URL(request.url);
    const catalog = await getExerciseMediaCatalog(user, url.searchParams);

    return NextResponse.json(catalog, { status: 200 });
  } catch (error: any) {
    const status = getAuthStatus(error);

    if (status === 500) {
      console.error('Error al obtener catálogo de media de ejercicios:', error);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Error al obtener catálogo de media de ejercicios.' },
      { status }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await authMiddleware(request);
    const payload = await request.json();

    if (!payload?.id_ejercicio || !Number.isInteger(Number(payload.id_ejercicio))) {
      return NextResponse.json(
        { error: 'Debe indicar un id_ejercicio válido.' },
        { status: 400 }
      );
    }

    const updated = await updateExerciseMediaCatalogItem(user, {
      ...payload,
      id_ejercicio: Number(payload.id_ejercicio),
    });

    return NextResponse.json(
      {
        message: 'Media del ejercicio actualizada correctamente.',
        data: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const status = getAuthStatus(error);

    if (status === 500) {
      console.error('Error al actualizar media de ejercicio:', error);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Error al actualizar media de ejercicio.' },
      { status }
    );
  }
}
