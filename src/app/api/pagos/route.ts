import { createPago, deletePago, getAllPagos, updatePago } from "@/services/pagoService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pagos = await getAllPagos();
    
    return NextResponse.json({ data: pagos }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener los pagos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.socio_id || !body.registrado_por) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }
    const pago = await createPago(body);
    return NextResponse.json({ message: "Pago registrado con éxito", data: pago }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al registrar el pago" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { id, updateData } = await req.json();
  try {
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para actualizar" }, { status: 400 });
    }
    const pagoModificado = await updatePago(id, updateData);
    return NextResponse.json({ message: "Pago actualizado con éxito", data: pagoModificado }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al actualizar pago" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  try {
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para eliminar" }, { status: 400 });
    }
    await deletePago(id);
    return NextResponse.json({ message: "Pago eliminado con éxito" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al eliminar pago" }, { status: 500 });
  }
}
