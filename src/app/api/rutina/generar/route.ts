import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from "@/lib/auth/serverAuthorization";
import { dataGeneracionRutina } from "@/services/rutinaService";
import { NextResponse } from "next/server";


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const user = await authorizePersonalOrDashboardRequest(
            req,
            ['/dashboard/rutinas/asistente', '/dashboard/gestor-rutinas'],
            ['admin', 'usuario'],
            ['socio'],
        );


        const body = await req.json();

        const generacionRutina = await dataGeneracionRutina(user, body);

        if (!generacionRutina) {
            return NextResponse.json({ error: "No se encontraron datos de generación de rutina" }, { status: 404 });
        }

        return NextResponse.json({ message: "Rutina generada correctamente", data: generacionRutina }, { status: 200 });
    } catch (error: any) {
        const authResponse = authorizationErrorResponse(error);
        if (authResponse) return authResponse;
        console.error("Error en la generación de rutina:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
