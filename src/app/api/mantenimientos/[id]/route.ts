import { getMantenimientoByIdEquipamiento } from '@/services/mantenimientoService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id === '') {
      return NextResponse.json(
        { error: 'El ID del equipamento no puede estar vacío' },
        { status: 400 }
      );
    }
    const mantenimiento = await getMantenimientoByIdEquipamiento(id);

    return NextResponse.json(
      { message: 'Mantenimientos encontrados', data: mantenimiento },
      { status: 200 }
    );
  } catch (error: any) {
    console.log(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
