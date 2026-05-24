import { authMiddleware } from '@/middlewares/auth.middleware';
import { historialRutinaSocio } from '@/services/rutinaService';
import { deleteRutinaById } from '@/services/server/rutinaServerService';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ idSocio: string }> }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { idSocio } = await params;
    if (!idSocio) {
      return NextResponse.json(
        { error: 'ID del socio es requerido' },
        { status: 400 }
      );
    }

    const rutinas = await historialRutinaSocio(user, idSocio);

    if (!rutinas) {
      return NextResponse.json(
        { error: 'Rutinas no encontradas para el socio' },
        { status: 404 }
      );
    }

    return NextResponse.json(rutinas, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener las rutinas del socio:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ idSocio: string }> }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { idSocio: idRutina } = await params;
    const deletedRutina = await deleteRutinaById(user, idRutina);

    return NextResponse.json(
      {
        message: 'Rutina eliminada correctamente',
        data: deletedRutina,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al eliminar rutina:', error);

    const message = error?.message ?? 'Error al eliminar rutina';

    if (message.includes('no es válido')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes('No autorizado')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (message.includes('no encontrada') || message.includes('no encontrado')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
