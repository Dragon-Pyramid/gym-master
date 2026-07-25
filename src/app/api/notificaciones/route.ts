import { NextResponse } from 'next/server';
import { createNotificacion, getNotificaciones } from '@/services/notificacionService';
import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/notificaciones', ['admin', 'usuario']);
    return NextResponse.json(await getNotificaciones(user));
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/notificaciones', ['admin', 'usuario']);
    const notificacion = await createNotificacion(await req.json(), user);
    return NextResponse.json(notificacion, { status: 201 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
