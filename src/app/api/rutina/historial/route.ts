import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from "@/lib/auth/serverAuthorization";
import { historialRutinaSocioLogueado } from "@/services/rutinaService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/rutinas/asistente', '/dashboard/gestor-rutinas'],
      ['admin', 'usuario'],
      ['socio'],
    );


    const historialRutina = await historialRutinaSocioLogueado(user);

    return NextResponse.json(historialRutina, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error?.message ?? "Error al obtener historial de rutinas";

    if (
      message.includes("Token no proporcionado") ||
      message.includes("Token inválido") ||
      message.includes("JWT_SECRET")
    ) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    console.error("Error al obtener historial de rutinas:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
