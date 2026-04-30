import { createOtrosGastos, deleteOtrosGastos, getAllOtrosGastos, updateOtrosGastos } from "@/services/otrosGastosService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const gastos = await getAllOtrosGastos();
    return NextResponse.json({ data: gastos }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener los gastos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.descripcion || !body.monto || !body.fecha) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }
    const gasto = await createOtrosGastos(body);
    return NextResponse.json({ message: "Gasto creado con éxito", data: gasto }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al crear el gasto" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { id, updateData } = await req.json();
  try {
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para actualizar" }, { status: 400 });
    }
    const gastoModificado = await updateOtrosGastos(id, updateData);
    return NextResponse.json({ message: "Gasto actualizado con éxito", data: gastoModificado }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al actualizar gasto" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  try {
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para eliminar" }, { status: 400 });
    }
    await deleteOtrosGastos(id);
    return NextResponse.json({ message: "Gasto eliminado con éxito" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al eliminar gasto" }, { status: 500 });
  }
}
