import { NextResponse } from 'next/server';
import { createEquipamientoPlanPreventivo } from '@/services/server/equipamientoPreventivoService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan = await createEquipamientoPlanPreventivo(body);
    return NextResponse.json({ message: 'Plan preventivo creado con éxito', data: plan }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || 'Error al crear plan preventivo.';
    return NextResponse.json({ error: message }, { status: message.includes('obligatorio') ? 400 : 500 });
  }
}
