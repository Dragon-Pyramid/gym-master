import { NextResponse } from 'next/server';
import { getAllDietas } from '@/services/dietaService';
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(
      req,
      '/dashboard/gestor-dietas',
      ['admin', 'usuario'],
    );
    const dietas = await getAllDietas(user);
    return NextResponse.json(dietas ?? [], { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al obtener las dietas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
