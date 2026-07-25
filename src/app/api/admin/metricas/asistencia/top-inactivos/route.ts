import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import { NextResponse } from "next/server";


import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const user = await authorizeDashboardRequest(req, '/dashboard/asistencias', ['admin', 'usuario']);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rolAdmin = rolAdminMiddleware(user);
        if (!rolAdmin) {
            return NextResponse.json({ error: "Unauthorized: User no tiene rol de admin" }, { status: 403 });
        }

        //TODO IMPLEMENTAR LÓGICA USANDO sp_resumen_asistencias_por_periodo O FUNCIÓN SIMILAR

        return NextResponse.json({ error: "Endpoint no implementado" }, { status: 501 });
    } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
        console.error("Error en el resumen de asistencias por periodo:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}