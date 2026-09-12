import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from "@/lib/auth/serverAuthorization";
import { dataGeneracionRutina } from "@/services/rutinaService";
import {
  HttpRuntimeError,
  readJsonBody,
  runtimeErrorResponse,
} from "@/lib/security/httpRuntimeSecurity";
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


        const body =
            await readJsonBody<
                Parameters<typeof dataGeneracionRutina>[1]
            >(
                req,
                64 * 1024,
            );

        const generacionRutina = await dataGeneracionRutina(user, body);

        if (!generacionRutina) {
            return NextResponse.json({ error: "No se encontraron datos de generación de rutina" }, { status: 404 });
        }

        return NextResponse.json({ message: "Rutina generada correctamente", data: generacionRutina }, { status: 200 });
    } catch (error: unknown) {
        const authResponse = authorizationErrorResponse(error);
        if (authResponse) return authResponse;

        if (error instanceof HttpRuntimeError) {
            return runtimeErrorResponse(
                error,
                "Error en la generación de rutina",
            );
        }

        console.error("Error en la generación de rutina:", {
            name: error instanceof Error
                ? error.name
                : "UnknownError",
        });

        return NextResponse.json(
            { error: "Error en la generación de rutina" },
            { status: 500 },
        );
    }
}
