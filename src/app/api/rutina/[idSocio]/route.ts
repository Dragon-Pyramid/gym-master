import { authMiddleware } from "@/middlewares/auth.middleware";
import { historialRutinaSocio } from "@/services/rutinaService";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ idSocio: string }> }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { idSocio } = await params;
    if (!idSocio) {
      return NextResponse.json(
        { error: "ID del socio es requerido" },
        { status: 400 }
      );
    }

    const rutinas = await historialRutinaSocio(user, idSocio);

    if (!rutinas) {
      return NextResponse.json(
        { error: "Rutinas no encontradas para el socio" },
        { status: 404 }
      );
    }

    return NextResponse.json(rutinas, { status: 200 });
  } catch (error: any) {
    console.error("Error al obtener las rutinas del socio:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
