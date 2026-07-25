import { getCuotaById } from '@/services/cuotaService';
import { NextRequest, NextResponse } from 'next/server';


import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/cuotas', ['admin', 'usuario']);
    const { id } = await params;
    const cuota = await getCuotaById(id);
    return NextResponse.json({ data: cuota }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error.message });
  }
}
