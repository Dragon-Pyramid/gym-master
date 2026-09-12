import { NextResponse } from "next/server";
import { getAforoAsistencia } from "@/services/asistenciaService";

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

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
    const user = await authorizeDashboardRequest(req, '/dashboard/asistencias/aforo', ['admin', 'usuario']);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const aforo = await getAforoAsistencia(user);
    return NextResponse.json(aforo, { status: 200 });
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

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

    console.error(
      "Error al obtener aforo:",
      {
        name:
          error instanceof Error
            ? error.name
            : "UnknownError",
      },
    );

    return NextResponse.json(
      { error: "Error al obtener aforo" },
      { status: 500 },
    );
  }
}
