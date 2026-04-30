import { authMiddleware } from '@/middlewares/auth.middleware';
import { FindOneFichaMedicaSocio } from '@/services/fichaMedicaService';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; id_ficha: string }> }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autorizado' },
        { status: 401 }
      );
    }
    const { id, id_ficha } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de socio no proporcionado' },
        { status: 400 }
      );
    }

    if (!id_ficha) {
      return NextResponse.json(
        { error: 'ID de ficha médica no proporcionado' },
        { status: 400 }
      );
    }

    const ficha = await FindOneFichaMedicaSocio(user, id, id_ficha);

    return NextResponse.json({ data: ficha }, { status: 200 });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
