import { authMiddleware } from "@/middlewares/auth.middleware";
import { createEmpleado, getEmpleados } from "@/services/empleadoService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const empleados = await getEmpleados(user);
    return NextResponse.json(empleados);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const empleado = await createEmpleado(body, user);
    return NextResponse.json(empleado, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
