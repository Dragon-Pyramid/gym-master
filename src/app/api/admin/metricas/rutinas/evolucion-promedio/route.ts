import { NextResponse } from "next/server";
import { dataEvolucionPromedioPorObjetivo } from "@/services/rutinaService";
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from "@/lib/auth/serverAuthorization";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(
      req,
      '/dashboard/gestor-rutinas',
      ['admin', 'usuario'],
    );
    const evolucionPromedio = await dataEvolucionPromedioPorObjetivo(user);
    if (!evolucionPromedio) {
      return NextResponse.json({ error: "No se encontraron datos de evolución promedio por objetivo" }, { status: 404 });
    }
    return NextResponse.json(evolucionPromedio, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
