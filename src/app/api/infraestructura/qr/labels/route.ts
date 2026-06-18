import { NextResponse } from 'next/server';
import { getInfraestructuraQrLabelsDashboard } from '@/services/server/infraestructuraMantenimientoService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dashboard = await getInfraestructuraQrLabelsDashboard();
    return NextResponse.json(dashboard, { status: 200 });
  } catch (error: any) {
    console.error('Error al consultar etiquetas QR:', error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || 'Error al consultar etiquetas QR.' },
      { status: 500 },
    );
  }
}
