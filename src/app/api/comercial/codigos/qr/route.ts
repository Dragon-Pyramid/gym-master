import { NextRequest, NextResponse } from 'next/server';
import { generateComercialQrCode } from '@/services/server/comercialCodigosServerService';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/codigos-etiquetas', ['admin', 'usuario']);
    const body = await req.json();
    const qr = await generateComercialQrCode(body);
    return NextResponse.json({ data: qr, message: 'Código QR comercial generado' }, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error?.message || 'Error al generar QR comercial.';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
