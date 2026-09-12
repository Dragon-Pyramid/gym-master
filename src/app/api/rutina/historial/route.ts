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
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error al obtener historial de rutinas:", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { error: "Error al obtener historial de rutinas" },
      { status: 500 },
    );
  }
}
