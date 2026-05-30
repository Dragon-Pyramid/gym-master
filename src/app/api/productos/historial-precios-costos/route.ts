import { getProductoHistorialPreciosCostos } from "@/services/productoService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productoId = searchParams.get("producto_id");

    if (!productoId) {
      return NextResponse.json(
        { error: "producto_id es obligatorio" },
        { status: 400 }
      );
    }

    const historial = await getProductoHistorialPreciosCostos(productoId);
    return NextResponse.json({ data: historial }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener historial de precios/costos" },
      { status: 500 }
    );
  }
}
