import { NextResponse } from 'next/server';
import { getNotificacionPlantillas } from '@/services/notificacionService';
import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/notificaciones', ['admin', 'usuario']);
    return NextResponse.json(await getNotificacionPlantillas(user));
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error al obtener plantillas de notificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener plantillas de notificaciones" },
      { status: 500 }
    );
  }
}
