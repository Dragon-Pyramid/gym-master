import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from "@/lib/auth/serverAuthorization";
import {
  eliminarRutina,
  historialRutinaSocio,
  historialRutinaSocioLogueado,
} from "@/services/rutinaService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const isManager = (rol?: string | null): boolean => {
  const normalizedRol = rol?.trim().toLowerCase();

  return (
    normalizedRol === "admin" ||
    normalizedRol === "administrador" ||
    normalizedRol === "usuario"
  );
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/rutinas/asistente', '/dashboard/gestor-rutinas'],
      ['admin', 'usuario'],
      ['socio'],
    );


    const rutinas = isManager(user.rol)
      ? await historialRutinaSocio(user, params.id)
      : await historialRutinaSocioLogueado(user);

    return NextResponse.json(rutinas, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error al obtener rutinas:", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { error: "Error al obtener rutinas" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/rutinas/asistente', '/dashboard/gestor-rutinas'],
      ['admin', 'usuario'],
      ['socio'],
    );


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
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error ? error.message : '';

    if (message === "El id de rutina no es válido") {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message === "No se encontró la rutina") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message === "No tenés permisos para eliminar esta rutina") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("Error al eliminar rutina:", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { error: "Error al eliminar la rutina" },
      { status: 500 },
    );
  }
}
