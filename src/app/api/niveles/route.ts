import { authMiddleware } from "@/middlewares/auth.middleware";
import { getAllNiveles } from "@/services/nivelesService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { user } = await authMiddleware(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const niveles = await getAllNiveles(user);
        return NextResponse.json(niveles, { status: 200 });

    } catch (error: any) {
        console.error("Error al traer los niveles", error);
        return NextResponse.json({ error: "Error al traer los niveles" }, { status: 500 });
    }
}