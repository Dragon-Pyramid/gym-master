import { NextResponse } from 'next/server';
import { getMensajesAdminResumen } from '@/services/socioMensajeService';
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/mensajes-admin', ['admin', 'usuario']);
    const resumen = await getMensajesAdminResumen(user);
    return NextResponse.json({ data: resumen });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : '';
    if (message === "No autorizado para administrar mensajes de socios") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Error al obtener resumen de mensajes de socios:", error);
    return NextResponse.json(
      { error: "Error al obtener resumen de mensajes de socios" },
      { status: 500 }
    );
  }
}
