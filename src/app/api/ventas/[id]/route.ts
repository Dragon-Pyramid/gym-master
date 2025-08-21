import { authMiddleware } from "@/middlewares/auth.middleware";
import { getVentaById } from "@/services/ventaService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
      const{user} = await authMiddleware(req);
        if(!user){
          return NextResponse.json({ error: "No se pudo obtener el usuario" }, { status: 401 });
        }
    const id = params.id;
    const venta = await getVentaById(user,id);
    return NextResponse.json({ data: venta }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
