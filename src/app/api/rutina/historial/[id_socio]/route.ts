import { authMiddleware } from '@/middlewares/auth.middleware';
import { historialRutinaSocio } from '@/services/rutinaService';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id_socio: string }> }
) {
  const { user } = await authMiddleware(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id_socio } = await params;

  const historialRutina = await historialRutinaSocio(user, id_socio);
  return NextResponse.json(historialRutina, { status: 200 });
}
