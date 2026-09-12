import { comercialErrorResponse } from '@/lib/comercial/comercialErrorBoundary';
import { NextRequest, NextResponse } from 'next/server';
import { getComercialPackAnalyticsDashboard } from '@/services/server/comercialPackAnalyticsServerService';

import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/pack-analytics', ['admin', 'usuario']);
    const { searchParams } = new URL(req.url);
    const data = await getComercialPackAnalyticsDashboard({
      desde: searchParams.get('desde'),
      hasta: searchParams.get('hasta'),
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al obtener analítica de packs comerciales");
  }
}
