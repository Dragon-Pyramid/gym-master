import { NextResponse } from 'next/server';
import { createInfraestructuraSector } from '@/services/server/infraestructuraMantenimientoService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sector = await createInfraestructuraSector(body);
    return NextResponse.json({ message: 'Sector edilicio creado con éxito', data: sector }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error al crear sector edilicio.' },
      { status: error?.message?.includes('obligatorio') ? 400 : 500 },
    );
  }
}
