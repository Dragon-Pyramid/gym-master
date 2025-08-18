import { authMiddleware } from "@/middlewares/auth.middleware";
import { findAllEvolucionesSocioByIdSocio } from "@/services/evolucionSocioService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const socio_id = user.id_socio;

    const evolucionSocio = await findAllEvolucionesSocioByIdSocio(
      user,
      socio_id
    );

    return NextResponse.json({ data: evolucionSocio }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
