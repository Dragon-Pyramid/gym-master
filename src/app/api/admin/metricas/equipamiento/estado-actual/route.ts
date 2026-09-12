import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import { dataEstadoEquipamientoSemaforo } from "@/services/equipamientoService";
import { NextResponse } from "next/server";


import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const user = await authorizeDashboardRequest(req, '/dashboard/equipamientos', ['admin', 'usuario']);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rolAdmin = rolAdminMiddleware(user);
        if (!rolAdmin) {
            return NextResponse.json({ error: "Unauthorized: User no tiene rol de admin" }, { status: 403 });
        }

        const estadoActual = await dataEstadoEquipamientoSemaforo(user);

        if (!estadoActual) {
            return NextResponse.json({ error: "No se encontraron datos del estado actual del equipamiento" }, { status: 404 });
        }

        return NextResponse.json(estadoActual);
    } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
        console.error("Error en el estado actual del equipamiento:", error);
        return NextResponse.json({ error: "Error al obtener el estado actual del equipamiento" }, { status: 500 });
    }
}
