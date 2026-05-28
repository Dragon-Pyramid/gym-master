import { authMiddleware } from '@/middlewares/auth.middleware';
import { getDietaById } from '@/services/dietaService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
        { error: 'ID de dieta es requerido' },
        { status: 400 }
      );
    }

    const dieta = await getDietaById(id, user);
    if (!dieta) {
      return NextResponse.json(
        { error: 'No se encontró la dieta solicitada' },
        { status: 404 }
      );
    }

    return NextResponse.json(dieta, { status: 200 });
  } catch (error: any) {
    const message = error?.message ?? 'Error al obtener la dieta';
    const status = message.includes('Token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
