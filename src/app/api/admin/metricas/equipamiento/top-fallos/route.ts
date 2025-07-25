import { authMiddleware } from "@/middlewares/auth.middleware";
import { dataRankingFallosEquipamiento } from "@/services/equipamientoService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { user } = await authMiddleware(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //TODO VALIDAR QUE TENGA ROL ADMIN

    const topFallos = await dataRankingFallosEquipamiento(user);

    if (!topFallos) {
        return NextResponse.json({ error: "No se encontraron datos del ranking de fallos de equipamiento" }, { status: 404 });
    }

    return NextResponse.json(topFallos);
}
