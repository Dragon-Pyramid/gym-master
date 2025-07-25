import { authMiddleware } from "@/middlewares/auth.middleware";
import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import { dataGeneracionRutinaPersonalizada } from "@/services/rutinaService";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { user } = await authMiddleware(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
const rolAdmin = rolAdminMiddleware(user);
        if (!rolAdmin) {
            return NextResponse.json({ error: "Unauthorized: User no tiene rol de admin" }, { status: 403 });
        }
    const body = await req.json();

    const generacionRutina = await dataGeneracionRutinaPersonalizada(user, body);

    if (!generacionRutina) {
        return NextResponse.json({ error: "No se encontraron datos de generación de rutina" }, { status: 404 });
    }

    return NextResponse.json("generacionRutinaPersonalizada", { status: 200 });
}
