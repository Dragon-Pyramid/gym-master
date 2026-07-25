import { getServicioById } from '@/services/servicioService';
import { NextRequest, NextResponse } from 'next/server';


import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(
      req,
      [
        '/dashboard/servicios',
        '/dashboard/comercial',
        '/dashboard/comercial/kiosco',
        '/dashboard/comercial/servicios-promociones',
      ],
      ['admin', 'usuario'],
    );
    const { id } = await params;
    const servicio = await getServicioById(id);
    return NextResponse.json({ data: servicio }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error.message });
  }
}
