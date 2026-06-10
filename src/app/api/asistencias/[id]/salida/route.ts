import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import {
  getAforoAsistencia,
  registrarSalidaAsistencia,
} from "@/services/asistenciaService";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!params.id) {
      return NextResponse.json(
        { error: "ID de asistencia requerido" },
        { status: 400 },
      );
    }

    const salida = await registrarSalidaAsistencia(user, params.id);
    const aforo = await getAforoAsistencia(user);

    return NextResponse.json({ ...salida, aforo }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al registrar salida";
    const status = message.toLowerCase().includes("no autorizado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
