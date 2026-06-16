import { NextResponse } from 'next/server';
import { getInfraestructuraMantenimientoDashboard } from '@/services/server/infraestructuraMantenimientoService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dashboard = await getInfraestructuraMantenimientoDashboard();
    return NextResponse.json(dashboard, { status: 200 });
  } catch (error: any) {
    console.error('Error al consultar mantenimiento edilicio:', error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || 'Error al consultar mantenimiento edilicio.' },
      { status: 500 },
    );
  }
}
