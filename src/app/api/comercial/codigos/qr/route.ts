import { comercialErrorResponse, readComercialJson } from '@/lib/comercial/comercialErrorBoundary';
import { NextRequest, NextResponse } from 'next/server';
import { generateComercialQrCode } from '@/services/server/comercialCodigosServerService';

import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/codigos-etiquetas', ['admin', 'usuario']);
    const body = await readComercialJson(req);
    const qr = await generateComercialQrCode(body);
    return NextResponse.json({ data: qr, message: 'Código QR comercial generado' }, { status: 201 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al generar QR comercial.");
  }
}
