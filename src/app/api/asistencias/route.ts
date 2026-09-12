import {
  getAllAsistencias,
  createAsistencia,
  updateAsistencia,
  deleteAsistencia,
} from "@/services/asistenciaService";
import { NextResponse } from "next/server";

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';
import {
  HttpRuntimeError,
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/asistencias', ['admin', 'usuario']);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const asistencias = await getAllAsistencias(user);
    return NextResponse.json(asistencias, { status: 200 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: "Error al obtener asistencias" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/asistencias', ['admin', 'usuario']);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body =
      await readJsonBody<
        Parameters<typeof createAsistencia>[1]
      >(
        req,
        64 * 1024,
      );
    if (!body.socio_id || !body.fecha || !body.hora_ingreso) {
      return NextResponse.json(
        { error: "Socio, fecha y hora de ingreso son obligatorios" },
        { status: 400 },
      );
    }
    const asistencia = await createAsistencia(user, body);
    return NextResponse.json(
      { message: "Asistencia registrada con éxito", data: asistencia },
      { status: 201 },
    );
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    if (error instanceof HttpRuntimeError) {
      return runtimeErrorResponse(
        error,
        "Error al registrar asistencia",
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "El socio no existe o está inactivo"
    ) {
      return NextResponse.json(
        { error: message },
        { status: 400 },
      );
    }

    console.error(
      "Error al registrar asistencia:",
      {
        name:
          error instanceof Error
            ? error.name
            : "UnknownError",
      },
    );

    return NextResponse.json(
      { error: "Error al registrar asistencia" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/asistencias', ['admin', 'usuario']);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id, updateData } =
      await readJsonBody<{
        id?: unknown;
        updateData:
          Parameters<typeof updateAsistencia>[2];
      }>(
        req,
        64 * 1024,
      );
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID inválido para actualizar" },
        { status: 400 },
      );
    }
    const asistenciaActualizada = await updateAsistencia(user, id, updateData);
    return NextResponse.json(
      {
        message: "Asistencia actualizada con éxito",
        data: asistenciaActualizada,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    if (error instanceof HttpRuntimeError) {
      return runtimeErrorResponse(
        error,
        "Error al actualizar asistencia",
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "No se encontró asistencia con ese id"
    ) {
      return NextResponse.json(
        { error: message },
        { status: 404 },
      );
    }

    console.error(
      "Error al actualizar asistencia:",
      {
        name:
          error instanceof Error
            ? error.name
            : "UnknownError",
      },
    );

    return NextResponse.json(
      { error: "Error al actualizar asistencia" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/asistencias', ['admin', 'usuario']);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } =
      await readJsonBody<{
        id?: unknown;
      }>(
        req,
        64 * 1024,
      );
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID requerido para eliminar" },
        { status: 400 },
      );
    }
    await deleteAsistencia(user, id);
    return NextResponse.json(
      { message: "Asistencia eliminada con éxito" },
      { status: 200 },
    );
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    if (error instanceof HttpRuntimeError) {
      return runtimeErrorResponse(
        error,
        "Error al eliminar asistencia",
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "No se encontró asistencia con ese id"
    ) {
      return NextResponse.json(
        { error: message },
        { status: 404 },
      );
    }

    console.error(
      "Error al eliminar asistencia:",
      {
        name:
          error instanceof Error
            ? error.name
            : "UnknownError",
      },
    );

    return NextResponse.json(
      { error: "Error al eliminar asistencia" },
      { status: 500 },
    );
  }
}
