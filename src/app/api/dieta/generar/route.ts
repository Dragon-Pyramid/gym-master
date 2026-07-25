import { NextResponse } from 'next/server';
import { createDietaSocio } from '@/services/dietaService';
import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/dietas', '/dashboard/gestor-dietas'],
      ['admin', 'usuario'],
      ['socio'],
    );
    const body = await req.json();
    if (!body.socio_id || !body.objetivo || !body.fecha_inicio || !body.fecha_fin) {
      return NextResponse.json({ error: 'Debe enviar todos los campos requeridos' }, { status: 400 });
    }
    const dieta = await createDietaSocio(body, user);
    return NextResponse.json(dieta, { status: 201 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al generar la dieta';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
