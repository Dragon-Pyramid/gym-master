import { NextResponse } from 'next/server';
import {
  getMensajeAdminById,
  updateMensajeAdmin,
  SocioMensajeNoEncontradoError,
} from '@/services/socioMensajeService';
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
    if (error instanceof SocioMensajeNoEncontradoError) {
      return NextResponse.json(
        { error: 'Mensaje de socio no encontrado' },
        { status: 404 }
      );
    }
    const message = error instanceof Error ? error.message : '';
    if (message === "No autorizado para administrar mensajes de socios") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Error al obtener el mensaje de socio:", error);
    return NextResponse.json(
      { error: "Error al obtener el mensaje de socio" },
      { status: 500 }
    );
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
    if (error instanceof SocioMensajeNoEncontradoError) {
      return NextResponse.json(
        { error: 'Mensaje de socio no encontrado' },
        { status: 404 }
      );
    }
    const message = error instanceof Error ? error.message : '';
    if (message === "No autorizado para administrar mensajes de socios") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "No hay cambios para aplicar") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Error al actualizar el mensaje de socio:", error);
    return NextResponse.json(
      { error: "Error al actualizar el mensaje de socio" },
      { status: 500 }
    );
  }
}
