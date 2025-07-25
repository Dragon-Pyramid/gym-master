import { authMiddleware } from "@/middlewares/auth.middleware";
import { dataAdherenciaMensualRutinas } from "@/services/rutinaService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { user } = await authMiddleware(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //TODO VALIDAR QUE TENGA ROL ADMIN

    const adherencia = await dataAdherenciaMensualRutinas(user);

    if (!adherencia) {
        return NextResponse.json({ error: "No se encontraron datos de adherencia de rutinas" }, { status: 404 });
    }

    return NextResponse.json(adherencia);
}
