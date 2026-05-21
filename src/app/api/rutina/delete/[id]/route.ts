import { authMiddleware } from "@/middlewares/auth.middleware";
import {
  eliminarRutina,
  historialRutinaSocio,
  historialRutinaSocioLogueado,
} from "@/services/rutinaService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const isAdmin = (rol?: string | null): boolean => {
  const normalizedRol = rol?.trim().toLowerCase();

  return normalizedRol === "admin" || normalizedRol === "administrador";
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await authMiddleware(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rutinas = isAdmin(user.rol)
      ? await historialRutinaSocio(user, params.id)
      : await historialRutinaSocioLogueado(user);

    return NextResponse.json(rutinas, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error al obtener rutinas:", error);

    return NextResponse.json(
      { error: error.message || "Error al obtener rutinas" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await authMiddleware(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await eliminarRutina(user, params.id);

    return NextResponse.json(
      {
        message: "Rutina eliminada correctamente",
        data: deleted,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Error al eliminar rutina:", error);

    const message = error.message || "Error al eliminar la rutina";
    const status = message.includes("No se encontró")
      ? 404
      : message.includes("permisos")
        ? 403
        : message.includes("no es válido")
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
