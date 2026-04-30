import { authMiddleware } from "@/middlewares/auth.middleware";
import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import { dataAnalisisCostoBeneficio } from "@/services/equipamientoService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { user } = await authMiddleware(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rolAdmin = rolAdminMiddleware(user);
        if (!rolAdmin) {
            return NextResponse.json({ error: "Unauthorized: User no tiene rol de admin" }, { status: 403 });
        }

        const costoBeneficio = await dataAnalisisCostoBeneficio(user);

        if (!costoBeneficio) {
            return NextResponse.json({ error: "No se encontraron datos del análisis costo-beneficio" }, { status: 404 });
        }

        return NextResponse.json(costoBeneficio);
    } catch (error: any) {
        console.error("Error en el análisis costo-beneficio:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
