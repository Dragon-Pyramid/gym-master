import { authMiddleware } from "@/middlewares/auth.middleware";
import { getAllDietaSocio } from "@/services/dietaService";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { user } = await authMiddleware(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json(
                { error: "ID del socio es requerido" },
                { status: 400 }
            );
        }

        const dietas = await getAllDietaSocio(id, user);
        if (!dietas || dietas.length === 0) {
            return NextResponse.json(
                { message: "No se encontraron dietas para el socio" },
                { status: 404 }
            );
        }

        return NextResponse.json(dietas, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}