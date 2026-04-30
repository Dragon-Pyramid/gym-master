import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  getEntrenadorById,
  updateEntrenador,
} from '@/services/entrenadorService';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'ID del entrenador es requerido' },
        { status: 400 }
      );
    }

    const entrenador = await getEntrenadorById(id, user);

    if (!entrenador) {
      return NextResponse.json(
        { error: 'Entrenador no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(entrenador, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener el entrenador:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'ID del entrenador es requerido' },
        { status: 400 }
      );
    }

    const { updateData } = await req.json();

    const entrenador = await updateEntrenador(id, updateData, user);

    return NextResponse.json(
      { message: 'Entrenador actualizado correctamente', data: entrenador },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al actualizar el entrenador:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
