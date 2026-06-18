import { NextResponse } from 'next/server';
import { createEquipamientoOrdenTecnica } from '@/services/server/equipamientoPreventivoService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orden = await createEquipamientoOrdenTecnica(body);
    return NextResponse.json({ message: 'Orden técnica creada con éxito', data: orden }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || 'Error al crear orden técnica.';
    const status = message.includes('obligatorio') || message.includes('Seleccioná') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
