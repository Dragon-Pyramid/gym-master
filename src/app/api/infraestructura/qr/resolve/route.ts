import { NextResponse } from 'next/server';
import { resolveInfraestructuraQrCode } from '@/services/server/infraestructuraMantenimientoService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const codigo = searchParams.get('codigo') || '';
    const result = await resolveInfraestructuraQrCode(codigo);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error al resolver código QR/barra.' },
      { status: error?.message?.includes('Ingresá') ? 400 : 500 },
    );
  }
}
