import { authMiddleware } from "@/middlewares/auth.middleware";
import { dataEvolucionPromedioPorObjetivo } from "@/services/rutinaService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { user } = await authMiddleware(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //TODO VALIDAR QUE TENGA ROL ADMIN

    const evolucionPromedio = await dataEvolucionPromedioPorObjetivo(user);

    if (!evolucionPromedio) {
        return NextResponse.json({ error: "No se encontraron datos de evolución promedio por objetivo" }, { status: 404 });
    }

    return NextResponse.json(evolucionPromedio);
}
