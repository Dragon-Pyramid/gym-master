import { authMiddleware } from "@/middlewares/auth.middleware";
import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import { dataRankingFallosEquipamiento } from "@/services/equipamientoService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { user } = await authMiddleware(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rolAdmin = rolAdminMiddleware(user);
    if (!rolAdmin) {
        return NextResponse.json({ error: "Unauthorized: User no tiene rol de admin" }, { status: 403 });
    }

    const topFallos = await dataRankingFallosEquipamiento(user);

    if (!topFallos) {
        return NextResponse.json({ error: "No se encontraron datos del ranking de fallos de equipamiento" }, { status: 404 });
    }

    return NextResponse.json(topFallos);
}
