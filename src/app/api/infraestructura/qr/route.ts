import { NextResponse } from 'next/server';
import { createInfraestructuraQrCode } from '@/services/server/infraestructuraMantenimientoService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const qr = await createInfraestructuraQrCode(body);
    return NextResponse.json({ message: 'Código QR/barra generado con éxito', data: qr }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || 'Error al generar código QR/barra.';
    const status = message.includes('obligatorio') || message.includes('No se encontró') || message.includes('no soportado') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
