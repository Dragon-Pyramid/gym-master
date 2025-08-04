import { authMiddleware } from "@/middlewares/auth.middleware";
import { getHorariosByEntrenadorId } from "@/services/entrenadorHorarioService";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { user } = await authMiddleware(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "ID del entrenador es requerido" }, { status: 400 });
        }

        const horarios = await getHorariosByEntrenadorId(id, user);

        if (!horarios) {
            return NextResponse.json({ error: "Horarios no encontrados para el entrenador" }, { status: 404 });
        }

        return NextResponse.json(horarios, { status: 200 });
    } catch (error: any) {
        console.error("Error al obtener los horarios del entrenador:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}