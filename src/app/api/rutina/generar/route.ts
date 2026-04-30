import { authMiddleware } from "@/middlewares/auth.middleware";
import { dataGeneracionRutina } from "@/services/rutinaService";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { user } = await authMiddleware(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const generacionRutina = await dataGeneracionRutina(user, body);

        if (!generacionRutina) {
            return NextResponse.json({ error: "No se encontraron datos de generación de rutina" }, { status: 404 });
        }

        return NextResponse.json({ message: "Rutina generada correctamente", data: generacionRutina }, { status: 200 });
    } catch (error: any) {
        console.error("Error en la generación de rutina:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
