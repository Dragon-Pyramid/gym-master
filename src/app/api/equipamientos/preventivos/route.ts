import { NextResponse } from 'next/server';
import { getEquipamientosPreventivosDashboard } from '@/services/server/equipamientoPreventivoService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dashboard = await getEquipamientosPreventivosDashboard();
    return NextResponse.json(dashboard, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error al consultar preventivos de equipamientos.' },
      { status: 500 },
    );
  }
}
