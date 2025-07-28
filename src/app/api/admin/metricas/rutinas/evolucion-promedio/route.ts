import { authMiddleware } from "@/middlewares/auth.middleware";
import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import { dataEvolucionPromedioPorObjetivo } from "@/services/rutinaService";
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

    const evolucionPromedio = await dataEvolucionPromedioPorObjetivo(user);

    if (!evolucionPromedio) {
        return NextResponse.json({ error: "No se encontraron datos de evolución promedio por objetivo" }, { status: 404 });
    }

    return NextResponse.json(evolucionPromedio);
}
