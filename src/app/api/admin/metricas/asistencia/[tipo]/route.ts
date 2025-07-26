import { authMiddleware } from "@/middlewares/auth.middleware";
import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import {
  dataConcurrenciaAnual,
  dataConcurrenciaMensual,
  dataConcurrenciaSemanal,
} from "@/services/asistenciaService";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { tipo: string } }
) {
  const { user } = await authMiddleware(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rolAdmin = rolAdminMiddleware(user);
  if (!rolAdmin) {
    return NextResponse.json(
      { error: "Unauthorized: User no tiene rol de admin" },
      { status: 403 }
    );
  }

  const { tipo } = await params;
  let concurrencia;

  if (tipo === "semanal") {
    concurrencia = await dataConcurrenciaSemanal(user);
  } else if (tipo === "mensual") {
    concurrencia = await dataConcurrenciaMensual(user);
  } else if (tipo === "anual") {
    concurrencia = await dataConcurrenciaAnual(user);
  } else {
    return NextResponse.json(
      { error: "Param 'tipo' requerido (semanal|mensual|anual)" },
      { status: 400 }
    );
  }

  if (!concurrencia) {
    return NextResponse.json(
      { error: "No se encontraron datos de concurrencia" },
      { status: 404 }
    );
  }

  return NextResponse.json(concurrencia);
}
