import { authMiddleware } from "@/middlewares/auth.middleware";
import { getAllAsistencias, createAsistencia, updateAsistencia, deleteAsistencia } from "@/services/asistenciaService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const {user} = await authMiddleware(req);
        if(!user){
          return NextResponse.json({error: "No autorizado"}, {status: 401});
        }
    const asistencias = await getAllAsistencias(user);
    return NextResponse.json(asistencias, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Error al obtener asistencias" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {

    const {user} = await authMiddleware(req);
    if(!user){
      return NextResponse.json({error: "No autorizado"}, {status: 401});
    }

    const body = await req.json();
    if (!body.socio_id || !body.fecha || !body.hora_ingreso || !body.hora_egreso) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }
    const asistencia = await createAsistencia(user,body);
    return NextResponse.json({ message: "Asistencia registrada con éxito", data: asistencia }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al registrar asistencia" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const {user} = await authMiddleware(req);
    if(!user){
      return NextResponse.json({error: "No autorizado"}, {status: 401});
    }
    const { id, updateData } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido para actualizar" }, { status: 400 });
    }
    const asistenciaActualizada = await updateAsistencia(user,id, updateData);
    return NextResponse.json({ message: "Asistencia actualizada con éxito", data: asistenciaActualizada }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al actualizar asistencia" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const {user} = await authMiddleware(req);
    if(!user){
      return NextResponse.json({error: "No autorizado"}, {status: 401});
    }
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID requerido para eliminar" }, { status: 400 });
    }
    await deleteAsistencia(user,id);
    return NextResponse.json({ message: "Asistencia eliminada con éxito" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al eliminar asistencia" }, { status: 500 });
  }
}
