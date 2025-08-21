import { authMiddleware } from "@/middlewares/auth.middleware";
import { createVenta, deleteVenta, getAllVentas, updateVenta } from "@/services/ventaService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const{user} = await authMiddleware(req);
    if(!user){
      return NextResponse.json({ error: "No se pudo obtener el usuario" }, { status: 401 });
    }
    const ventas = await getAllVentas(user);
    return NextResponse.json({ data: ventas }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener las ventas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
      const{user} = await authMiddleware(req);
    if(!user){
      return NextResponse.json({ error: "No se pudo obtener el usuario" }, { status: 401 });
    }
    const body = await req.json();
    if ( !body.venta || !body.venta.socio_id || !body.venta.fecha || !body.venta_detalle) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }
    const venta = await createVenta(user,body);
    return NextResponse.json({ message: "Venta registrada con éxito", data: venta }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al registrar la venta" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { id, updateData } = await req.json();
  try {

      const{user} = await authMiddleware(req);
    if(!user){
      return NextResponse.json({ error: "No se pudo obtener el usuario" }, { status: 401 });
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para actualizar" }, { status: 400 });
    }
    const ventaModificada = await updateVenta(user,id, updateData);
    return NextResponse.json({ message: "Venta actualizada con éxito", data: ventaModificada }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al actualizar venta" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  try {
      const{user} = await authMiddleware(req);
    if(!user){
      return NextResponse.json({ error: "No se pudo obtener el usuario" }, { status: 401 });
    }
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para eliminar" }, { status: 400 });
    }
    await deleteVenta(user,id);
    return NextResponse.json({ message: "Venta eliminada con éxito" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al eliminar venta" }, { status: 500 });
  }
}
