import { NextResponse } from 'next/server';
import { getMensajeAdminById, updateMensajeAdmin } from '@/services/socioMensajeService';
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/mensajes-admin', ['admin', 'usuario']);
    const mensaje = await getMensajeAdminById(params.id, user);
    return NextResponse.json({ data: mensaje });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/mensajes-admin', ['admin', 'usuario']);
    const mensaje = await updateMensajeAdmin(params.id, await req.json(), user);
    return NextResponse.json({ data: mensaje });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
