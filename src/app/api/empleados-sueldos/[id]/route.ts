import { authMiddleware } from "@/middlewares/auth.middleware";
import {
  anularEmpleadoSueldo,
  getEmpleadoSueldoById,
  updateEmpleadoSueldo,
} from "@/services/empleadoSueldoService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID de sueldo requerido" }, { status: 400 });
    }

    const sueldo = await getEmpleadoSueldoById(id, user);
    return NextResponse.json(sueldo);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID de sueldo requerido" }, { status: 400 });
    }

    const body = await req.json();
    const sueldo = await updateEmpleadoSueldo(id, body, user);
    return NextResponse.json(sueldo);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID de sueldo requerido" }, { status: 400 });
    }

    const sueldo = await anularEmpleadoSueldo(id, user);
    return NextResponse.json(sueldo);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
