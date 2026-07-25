import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from "@/lib/auth/serverAuthorization";
import { findAllEvolucionesSocioByIdSocio } from "@/services/evolucionSocioService";
import { NextResponse } from "next/server";


export const dynamic = 'force-dynamic';

const getStatusFromError = (message?: string) => {
  if (!message) return 500;
  if (
    message.includes("Token") ||
    message.includes("Unauthorized")
  ) {
    return 401;
  }
  if (message.includes("No autorizado")) return 403;
  if (message.includes("Debe") || message.includes("socio asociado")) {
    return 400;
  }
  return 500;
};

export async function GET(
  req: Request,
  context: { params: { socio_id: string } }
) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/evolucion-fisica', '/dashboard/gestor-evolucion-fisica'],
      ['admin', 'usuario'],
      ['socio'],
    );
    const requestedSocioId = context.params.socio_id;
    const socioId = requestedSocioId === "me" ? user.id_socio : requestedSocioId;

    if (!socioId) {
      return NextResponse.json(
        { error: "El usuario no tiene un socio asociado" },
        { status: 400 }
      );
    }

    const evolucionSocio = await findAllEvolucionesSocioByIdSocio(user, socioId);

    return NextResponse.json({ data: evolucionSocio }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message =
      error instanceof Error ? error.message : "Error al obtener evolución";

    console.error("ERROR evolucion_socio/[socio_id]:", message);

    return NextResponse.json(
      { error: message },
      { status: getStatusFromError(message) }
    );
  }
}
