import { NextResponse } from 'next/server';
import { getAllDietasSocio } from '@/services/dietaService';
import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/dietas', '/dashboard/gestor-dietas'],
      ['admin', 'usuario'],
      ['socio'],
    );
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'ID del socio es requerido' }, { status: 400 });
    const dietas = await getAllDietasSocio(id, user);
    return NextResponse.json(dietas ?? [], { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al obtener las dietas del socio';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
