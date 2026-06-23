import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { generateComercialQrCode } from '@/services/server/comercialCodigosServerService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await authMiddleware(req);
    const body = await req.json();
    const qr = await generateComercialQrCode(body);
    return NextResponse.json({ data: qr, message: 'Código QR comercial generado' }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || 'Error al generar QR comercial.';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
