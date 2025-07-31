import { authMiddleware } from "@/middlewares/auth.middleware";
import { getAllObjetivos } from "@/services/objetivoService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { user } = await authMiddleware(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const objetivos = await getAllObjetivos(user);
        return NextResponse.json(objetivos, { status: 200 });

    } catch (error: any) {
        console.error("Error al traer los objetivos", error);
        return NextResponse.json({ error: "Error al traer los objetivos" }, { status: 500 });
    }
}