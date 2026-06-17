import { NextResponse } from 'next/server';
import { createInfraestructuraChecklistEjecucion } from '@/services/server/infraestructuraMantenimientoService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ejecucion = await createInfraestructuraChecklistEjecucion(body);
    return NextResponse.json({ message: 'Checklist edilicio ejecutado con éxito', data: ejecucion }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || 'Error al ejecutar checklist edilicio.';
    const status = message.includes('Seleccioná') || message.includes('asociada') || message.includes('No se encontró') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
