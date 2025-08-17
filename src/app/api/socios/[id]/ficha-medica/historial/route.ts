import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { FindAllFichaMedicaSocio } from '@/services/fichaMedicaService';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autorizado' },
        { status: 401 }
      );
    }
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'ID de socio no proporcionado' },
        { status: 400 }
      );
    }
    const url = new URL(req.url);
    const pageParam = url.searchParams.get('page') || '1';
    let page = parseInt(pageParam, 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    const perPage = 5;
    const ficha = await FindAllFichaMedicaSocio(user, id);
    const list = Array.isArray(ficha) ? ficha : [];
    const total = list.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const paginated = list.slice(start, start + perPage);
    return NextResponse.json(
      { data: paginated, meta: { page, perPage, total, totalPages } },
      { status: 200 }
    );
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { error: error?.message || 'Error interno' },
      { status: 500 }
    );
  }
}
