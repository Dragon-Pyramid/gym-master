import { NextResponse } from 'next/server';
import {
  createSocioServer,
  deactivateSocioServer,
  fetchSociosServer,
  updateSocioServer,
} from '@/services/server/socioServerService';
import { authMiddleware } from '@/middlewares/auth.middleware';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const socios = await fetchSociosServer(user);
    return NextResponse.json(socios, { status: 200 });
  } catch (error: any) {
    console.error('ERROR al obtener socios:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener socios' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const body = await req.json();
    const creado = await createSocioServer(user, body);

    return NextResponse.json(
      {
        message: 'Socio creado con éxito',
        data: creado,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('ERROR al crear socio:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Error al crear socio' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const { id, ...updateData } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID inválido para actualizar' },
        { status: 400 }
      );
    }

    const actualizado = await updateSocioServer(user, id, updateData);
    return NextResponse.json(
      {
        message: 'Socio actualizado con éxito',
        data: actualizado,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar socio' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const { id } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID requerido para eliminar' },
        { status: 400 }
      );
    }

    const desactivado = await deactivateSocioServer(user, id);
    return NextResponse.json(
      { message: 'Socio desactivado con éxito', data: desactivado },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al desactivar socio' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}
