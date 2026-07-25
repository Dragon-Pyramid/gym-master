import { getAllNiveles } from "@/services/nivelesService";
import { NextResponse } from "next/server";


import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const user = await authorizeDashboardRequest(req, ['/dashboard/gestor-rutinas', '/dashboard/rutinas/asistente', '/dashboard/rutinas/media', '/dashboard/gestor-dietas', '/dashboard/dietas'], ['admin', 'usuario', 'socio']);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const niveles = await getAllNiveles(user);
        return NextResponse.json(niveles, { status: 200 });

    } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
        console.error("Error al traer los niveles", error);
        return NextResponse.json({ error: "Error al traer los niveles" }, { status: 500 });
    }
}