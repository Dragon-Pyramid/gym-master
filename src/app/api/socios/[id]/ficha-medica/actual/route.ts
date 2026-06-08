import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { FindFichaMedicaSocio, resolveFichaMedicaSocioId } from '@/services/fichaMedicaService';



function getFichaMedicaErrorStatus(message?: string) {
  if (message?.includes('No autorizado')) return 403;
  if (message?.includes('No se encontró')) return 404;
  if (message?.includes('no proporcionado')) return 400;
  return 500;
}

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'ID de socio no proporcionado' },
        { status: 400 }
      );
    }

    const resolvedSocioId = await resolveFichaMedicaSocioId(user, id);
    const ficha = await FindFichaMedicaSocio(user, resolvedSocioId);

    return NextResponse.json({ data: ficha }, { status: 200 });
  } catch (error: any) {
    console.log(error);
    const status = getFichaMedicaErrorStatus(error?.message);
    return NextResponse.json({ error: error.message }, { status });
  }
}
