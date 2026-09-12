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
    console.error("Error al obtener evolución promedio por objetivo:", error);
    return NextResponse.json(
      { error: "Error al obtener evolución promedio por objetivo" },
      { status: 500 }
    );
  }
}
