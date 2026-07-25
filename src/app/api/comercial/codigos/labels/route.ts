import { NextRequest, NextResponse } from 'next/server';
import { getComercialCodigosLabelsDashboard } from '@/services/server/comercialCodigosServerService';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/codigos-etiquetas', ['admin', 'usuario']);
    const dashboard = await getComercialCodigosLabelsDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error?.message || 'Error al consultar códigos comerciales.';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
