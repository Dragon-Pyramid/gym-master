import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { getAforoAsistencia } from "@/services/asistenciaService";

export const dynamic = "force-dynamic";

function isAuthError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    message.includes("token") ||
    message.includes("jwt") ||
    message.includes("authorization") ||
    message.includes("unauthorized") ||
    message.includes("no autorizado")
  );
}

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const aforo = await getAforoAsistencia(user);
    return NextResponse.json(aforo, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener aforo";

    if (isAuthError(error)) {
      return NextResponse.json(
        {
          error:
            "La sesión expiró o el token no fue enviado. Iniciá sesión nuevamente.",
          error_code: "AUTH_SESSION_EXPIRED",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
