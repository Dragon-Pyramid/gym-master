import { authMiddleware } from "@/middlewares/auth.middleware";
import { getAllDietas } from "@/services/dietaService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { user } = await authMiddleware(req);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const dietas = await getAllDietas(user);
        if (!dietas || dietas.length === 0) {
            return NextResponse.json(
                { message: "No se encontraron dietas" },
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