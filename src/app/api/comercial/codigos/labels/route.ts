import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getComercialCodigosLabelsDashboard } from '@/services/server/comercialCodigosServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authMiddleware(req);
    const dashboard = await getComercialCodigosLabelsDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: any) {
    const message = error?.message || 'Error al consultar códigos comerciales.';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
