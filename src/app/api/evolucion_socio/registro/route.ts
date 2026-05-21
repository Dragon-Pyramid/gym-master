import { authMiddleware } from "@/middlewares/auth.middleware";
import { createEvolucionSocio } from "@/services/evolucionSocioService";
import { NextResponse } from "next/server";

const getStatusFromError = (message?: string) => {
  if (!message) return 500;
  if (
    message.includes("Token") ||
    message.includes("Unauthorized") ||
    message.includes("No autorizado")
  ) {
    return 401;
  }
  if (
    message.includes("obligatorio") ||
    message.includes("obligatoria") ||
    message.includes("Debe") ||
    message.includes("socio asociado")
  ) {
    return 400;
  }
  return 500;
};

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const body = await req.json();

    const evolucion = await createEvolucionSocio(
      {
        ...body,
        socio_id: body.socio_id || user.id_socio,
      },
      user
    );

    return NextResponse.json(
      {
        message: "Evolución física registrada con éxito",
        data: evolucion,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al registrar evolución";

    console.error("ERROR evolucion_socio/registro:", message);

    return NextResponse.json(
      { error: message },
      { status: getStatusFromError(message) }
    );
  }
}
