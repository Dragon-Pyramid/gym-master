import { getActividadById } from '@/services/actividadService';
import { NextResponse } from 'next/server';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/actividades', ['admin', 'usuario', 'socio']);
    const params = await context.params;
    const id = params.id;
    const actividad = await getActividadById(id);
    return NextResponse.json({ data: actividad }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
