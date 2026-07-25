import { getAllProveedores, createProveedor, updateProveedor, deleteProveedor } from "@/services/proveedorService";
import { NextResponse } from "next/server";

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(
      req,
      [
        '/dashboard/proveedores',
        '/dashboard/productos',
        '/dashboard/comercial',
        '/dashboard/comercial/kiosco',
        '/dashboard/compras',
        '/dashboard/comercial/compras-reposicion',
      ],
      ['admin', 'usuario'],
    );
    const proveedores = await getAllProveedores();
    return NextResponse.json({ data: proveedores }, { status: 200 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Error al obtener los proveedores" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/proveedores', ['admin', 'usuario']);
    const body = await req.json();
    if (!body.nombre || typeof body.nombre !== "string" || body.nombre.trim().length === 0) {
      return NextResponse.json({ error: "El nombre comercial del proveedor es obligatorio" }, { status: 400 });
    }

    const proveedor = await createProveedor(body);
    return NextResponse.json({ message: "Proveedor creado con éxito", data: proveedor }, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error.message || "Error al crear el proveedor" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/proveedores', ['admin', 'usuario']);
    const { id, updateData } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para actualizar" }, { status: 400 });
    }

    const proveedorActualizado = await updateProveedor(id, updateData ?? {});
    return NextResponse.json({ message: "Proveedor actualizado con éxito", data: proveedorActualizado }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error.message || "Error al actualizar el proveedor" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/proveedores', ['admin', 'usuario']);
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID requerido para desactivar" }, { status: 400 });
    }

    await deleteProveedor(id);
    return NextResponse.json({ message: "Proveedor desactivado con éxito" }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error.message || "Error al desactivar el proveedor" }, { status: 500 });
  }
}
