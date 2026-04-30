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

    // Últimas 4 asistencias con datos del socio
    const { data, error } = await supabase
      .from('asistencia')
      .select(`
        id,
        socio_id,
        fecha,
        hora_ingreso,
        socio:socio_id (
          id_socio,
          nombre_completo,
          foto
        )
      `)
      .order('fecha', { ascending: false })
      .order('hora_ingreso', { ascending: false })
      .order('id', { ascending: false }) // ← tiebreaker estable
      .limit(4);

    if (error) throw new Error(error.message);

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
