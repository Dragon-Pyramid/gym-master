import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getComercialPackAnalyticsDashboard } from '@/services/server/comercialPackAnalyticsServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authMiddleware(req);
    const { searchParams } = new URL(req.url);
    const data = await getComercialPackAnalyticsDashboard({
      desde: searchParams.get('desde'),
      hasta: searchParams.get('hasta'),
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    const message = error?.message || 'Error al obtener analítica de packs comerciales';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
