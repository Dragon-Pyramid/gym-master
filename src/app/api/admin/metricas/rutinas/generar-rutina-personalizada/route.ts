import { authMiddleware } from "@/middlewares/auth.middleware";
import { dataGeneracionRutinaPersonalizada } from "@/services/rutinaService";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { user } = await authMiddleware(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    //TODO VALIDAR QUE TENGA ROL ADMIN

    const body = await req.json();

    const generacionRutina = await dataGeneracionRutinaPersonalizada(user, body);

    if (!generacionRutina) {
        return NextResponse.json({ error: "No se encontraron datos de generación de rutina" }, { status: 404 });
    }

    return NextResponse.json("generacionRutinaPersonalizada", { status: 200 });
}
