import { mantenimientoCompletado } from '@/services/mantenimientoService';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID inválido para actualizar' },
        { status: 400 }
      );
    }
    const mantenimiento = await mantenimientoCompletado(id);
    return NextResponse.json(
      {
        message:
          'Mantenimiento completado, el equipamiento vuelve a estar operativo',
        data: mantenimiento,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.log(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
