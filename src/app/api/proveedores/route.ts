import { getAllProveedores, createProveedor, updateProveedor, deleteProveedor } from "@/services/proveedorService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const proveedores = await getAllProveedores();
    return NextResponse.json(proveedores, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener los proveedores" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.nombre || !body.contacto || !body.telefono || !body.direccion) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }
    const proveedor = await createProveedor(body);
    return NextResponse.json({ message: "Proveedor creado con éxito", data: proveedor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al crear el proveedor" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, updateData } = await req.json();
    console.log(updateData);
    
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para actualizar" }, { status: 400 });
    }
    const proveedorActualizado = await updateProveedor(id, updateData);
    return NextResponse.json({ message: "Proveedor actualizado con éxito", data: proveedorActualizado }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al actualizar el proveedor" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID requerido para eliminar" }, { status: 400 });
    }
    await deleteProveedor(id);
    return NextResponse.json({ message: "Proveedor eliminado con éxito" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al eliminar el proveedor" }, { status: 500 });
  }
}
