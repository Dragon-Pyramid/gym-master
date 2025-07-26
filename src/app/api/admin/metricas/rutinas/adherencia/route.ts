import { authMiddleware } from "@/middlewares/auth.middleware";
import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import { dataAdherenciaMensualRutinas } from "@/services/rutinaService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
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

  const adherencia = await dataAdherenciaMensualRutinas(user);

  if (!adherencia) {
    return NextResponse.json(
      { error: "No se encontraron datos de adherencia de rutinas" },
      { status: 404 }
    );
  }

  return NextResponse.json(adherencia);
}
