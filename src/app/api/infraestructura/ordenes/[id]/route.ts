import { NextResponse } from 'next/server';
import { updateMantenimientoEdilicioOrden } from '@/services/server/infraestructuraMantenimientoService';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID de orden requerido.' }, { status: 400 });
    }

    const body = await req.json();
    const orden = await updateMantenimientoEdilicioOrden(id, body);
    return NextResponse.json({ message: 'Orden de mantenimiento edilicio actualizada con éxito', data: orden }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error al actualizar orden de mantenimiento edilicio.' },
      { status: 500 },
    );
  }
}
