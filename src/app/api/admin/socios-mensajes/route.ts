import { NextResponse } from 'next/server';
import { getMensajesAdmin } from '@/services/socioMensajeService';
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(
      req,
      '/dashboard/mensajes-admin',
      ['admin', 'usuario'],
    );
    const url = new URL(req.url);
    const mensajes = await getMensajesAdmin(user, {
      estado: url.searchParams.get('estado'),
      q: url.searchParams.get('q'),
    });
    return NextResponse.json({ data: mensajes });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
