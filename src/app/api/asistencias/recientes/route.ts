import { authMiddleware } from '@/middlewares/auth.middleware';
import { NextResponse } from 'next/server';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const supabase = conexionBD(user.dbName);
    const { data, error } = await supabase
      .from('asistencia')
      .select('id, socio_id, fecha, creado_en')
      .order('creado_en', { ascending: false })
      .limit(5);
    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
