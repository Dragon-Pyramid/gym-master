import { NextRequest, NextResponse } from 'next/server';
import { getSocioByIdServer } from '@/services/server/socioServerService';
import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await authorizePersonalOrDashboardRequest(
      req,
      '/dashboard/socios',
      ['admin', 'usuario'],
      ['socio'],
    );
    const socio = await getSocioByIdServer(user, id);
    return NextResponse.json({ data: socio }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al obtener el socio';
    const status = message.includes('No se encontró') ? 404 : message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
