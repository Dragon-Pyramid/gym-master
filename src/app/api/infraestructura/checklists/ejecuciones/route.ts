import { NextResponse } from 'next/server';
import { createInfraestructuraChecklistEjecucion } from '@/services/server/infraestructuraMantenimientoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/infraestructura/mantenimiento-edilicio', ['admin', 'usuario']);
    const body = await req.json();
    const ejecucion = await createInfraestructuraChecklistEjecucion(body);
    return NextResponse.json({ message: 'Checklist edilicio ejecutado con éxito', data: ejecucion }, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error?.message || 'Error al ejecutar checklist edilicio.';
    const status = message.includes('Seleccioná') || message.includes('asociada') || message.includes('No se encontró') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
