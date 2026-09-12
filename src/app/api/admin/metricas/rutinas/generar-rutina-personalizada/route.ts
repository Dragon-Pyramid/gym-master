import { NextResponse } from "next/server";
import { dataGeneracionRutinaPersonalizada } from "@/services/rutinaService";
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from "@/lib/auth/serverAuthorization";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await authorizeDashboardRequest(
      req,
      '/dashboard/gestor-rutinas',
      ['admin', 'usuario'],
    );
    const body = await req.json();
    const generacionRutina = await dataGeneracionRutinaPersonalizada(user, body);
    if (!generacionRutina) {
      return NextResponse.json({ error: "No se encontraron datos de generación de rutina" }, { status: 404 });
    }
    return NextResponse.json({ message: "Rutina personalizada generada correctamente", data: generacionRutina }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error al generar rutina personalizada:", error);
    return NextResponse.json(
      { error: "Error al generar rutina personalizada" },
      { status: 500 }
    );
  }
}
