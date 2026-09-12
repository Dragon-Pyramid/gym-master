import { createServicio, deleteServicio, getAllServicios, updateServicio } from "@/services/servicioService";
import { NextResponse } from "next/server";

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(
      req,
      [
        '/dashboard/servicios',
        '/dashboard/comercial',
        '/dashboard/comercial/kiosco',
        '/dashboard/comercial/servicios-promociones',
      ],
      ['admin', 'usuario'],
    );
    const servicios = await getAllServicios();
    return NextResponse.json({ data: servicios }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error al obtener los servicios:", error);
    return NextResponse.json(
      { error: "Error al obtener los servicios" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/servicios', ['admin', 'usuario']);
    const body = await req.json();
    if (!body.nombre || !body.descripcion || body.precio === undefined || body.precio === null || Number(body.precio) < 0) {
      return NextResponse.json({ error: "Nombre, descripción y precio válido son obligatorios" }, { status: 400 });
    }
    const servicio = await createServicio(body);
    return NextResponse.json({ message: "Servicio creado con éxito", data: servicio }, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error?.message === "El código del servicio ya está asociado a otro servicio.") {
      return NextResponse.json(
        { error: "El código del servicio ya está asociado a otro servicio." },
        { status: 409 },
      );
    }

    console.error("Error al crear el servicio:", error);
    return NextResponse.json(
      { error: "Error al crear el servicio" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/servicios', ['admin', 'usuario']);
    const { id, updateData } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para actualizar" }, { status: 400 });
    }
    const servicioModificado = await updateServicio(id, updateData);
    return NextResponse.json({ message: "Servicio actualizado con éxito", data: servicioModificado }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error?.message === "El código del servicio ya está asociado a otro servicio.") {
      return NextResponse.json(
        { error: "El código del servicio ya está asociado a otro servicio." },
        { status: 409 },
      );
    }

    if (error?.message === "No se encontró el servicio con ese id") {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 },
      );
    }

    console.error("Error al actualizar el servicio:", error);
    return NextResponse.json(
      { error: "Error al actualizar el servicio" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/servicios', ['admin', 'usuario']);
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para eliminar" }, { status: 400 });
    }
    await deleteServicio(id);
    return NextResponse.json(
      { message: "Estado del servicio actualizado con éxito" },
      { status: 200 },
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error?.message === "No se encontró el servicio con ese id") {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 },
      );
    }

    console.error("Error al actualizar estado del servicio:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado del servicio" },
      { status: 500 },
    );
  }
}
