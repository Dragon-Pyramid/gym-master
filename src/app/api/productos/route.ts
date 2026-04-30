import { createProducto, deleteProducto, getAllProductos, updateProducto } from "@/services/productoService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const productos = await getAllProductos();
    return NextResponse.json({ data: productos }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener los productos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.nombre || !body.descripcion || !body.precio || !body.stock || !body.proveedor_id) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }
    const producto = await createProducto(body);
    return NextResponse.json({ message: "Producto creado con éxito", data: producto }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al crear el producto" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { id, updateData } = await req.json();
  try {
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para actualizar" }, { status: 400 });
    }
    const productoModificado = await updateProducto(id, updateData);
    return NextResponse.json({ message: "Producto actualizado con éxito", data: productoModificado }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al actualizar producto" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  try {
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para eliminar" }, { status: 400 });
    }
    await deleteProducto(id);
    return NextResponse.json({ message: "Producto eliminado con éxito" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al eliminar producto" }, { status: 500 });
  }
}
