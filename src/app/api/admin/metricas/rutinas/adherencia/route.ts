import { NextResponse } from "next/server";
import { dataAdherenciaMensualRutinas } from "@/services/rutinaService";
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
    const adherencia = await dataAdherenciaMensualRutinas(user);
    if (!adherencia) {
      return NextResponse.json({ error: "No se encontraron datos de adherencia de rutinas" }, { status: 404 });
    }
    return NextResponse.json(adherencia, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error al obtener adherencia de rutinas:", error);
    return NextResponse.json(
      { error: "Error al obtener adherencia de rutinas" },
      { status: 500 }
    );
  }
}
