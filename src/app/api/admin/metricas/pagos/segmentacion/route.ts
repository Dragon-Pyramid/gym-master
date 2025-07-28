import { authMiddleware } from "@/middlewares/auth.middleware";
import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import { dataAnalisisConductaPagos } from "@/services/pagoService";
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

        const segmentacion = await dataAnalisisConductaPagos(user);

        if (!segmentacion) {
            return NextResponse.json({ error: "No se encontraron datos de segmentación de pagos" }, { status: 404 });
        }

        return NextResponse.json(segmentacion);
    } catch (error: any) {
        console.error("Error en la segmentación de pagos:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
