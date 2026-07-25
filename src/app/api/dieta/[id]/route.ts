import { NextResponse } from 'next/server';
import { getDietaById } from '@/services/dietaService';
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
    if (!id) return NextResponse.json({ error: 'ID de dieta es requerido' }, { status: 400 });
    const dieta = await getDietaById(id, user);
    if (!dieta) return NextResponse.json({ error: 'No se encontró la dieta solicitada' }, { status: 404 });
    return NextResponse.json(dieta, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al obtener la dieta';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
