import { authMiddleware } from "@/middlewares/auth.middleware";
import { dataAnalisisConductaPagos } from "@/services/pagoService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { user } = await authMiddleware(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //TODO VALIDAR QUE TENGA ROL ADMIN

    const histograma = await dataAnalisisConductaPagos(user);

    if (!histograma) {
        return NextResponse.json({ error: "No se encontraron datos del histograma de pagos" }, { status: 404 });
    }

    return NextResponse.json(histograma);
}
