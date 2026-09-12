import { createActividad, deleteActividad, fetchAllActividades, updateActividad } from "@/services/actividadService";
import { NextResponse } from "next/server";

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export async function GET(req: Request){
    try {
    await authorizeDashboardRequest(req, '/dashboard/actividades', ['admin', 'usuario', 'socio']);
        const actividades = await fetchAllActividades();
        return NextResponse.json(actividades,{status:200})
    } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
        console.error("Error al obtener las actividades:", error);
        return  NextResponse.json({error:"Error al obtener las actividades"},{status:500})
    }
}

export async function POST(req:Request){
    try {
    await authorizeDashboardRequest(req, '/dashboard/actividades', ['admin', 'usuario']);
        const body = await req.json();
        if(!body.nombre_actividad){
            return NextResponse.json({error:"El nombre de la actividad es obligatorio"},{status:400});
        }
        const actividad = await createActividad(body);
        return NextResponse.json({
            message:"Actividad creada con éxito",
            data:actividad
        }, {status:201});
    } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    
        console.error("Error al crear la actividad:", error.message);
        return NextResponse.json({error:"Error al crear la actividad"},{status:500});
    }

}

export async function PUT(req:Request){
try {
    await authorizeDashboardRequest(req, '/dashboard/actividades', ['admin', 'usuario']);
    const{id,updateData} = await req.json();
    if (!id || typeof id !== 'string') {
          return NextResponse.json({ error: 'ID inválido para actualizar' }, { status: 400 })
        }
    const actividadModificada = await updateActividad(id,updateData);
    return NextResponse.json({
        message:"Actividad actualizada con éxito",
        data:actividadModificada
    },{status:200});
} catch (error : any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    if (error?.message === "No se encontró la actividad con ese id") {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 },
      );
    }
      console.error('Error al actualizar actividad:', error)
    return NextResponse.json({ error: 'Error al actualizar actividad' }, { status: 500 })
  }


}

export async function DELETE(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/actividades', ['admin', 'usuario']);
    const { id } = await req.json()

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID requerido para eliminar' }, { status: 400 })
    }

    await deleteActividad(id)
    return NextResponse.json({ message: 'Actividad eliminada con éxito' }, { status: 200 })
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    if (error?.message === "No se encontró la actividad con ese id") {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 },
      );
    }
    console.error('Error al eliminar actividad:', error)
    return NextResponse.json({ error: 'Error al eliminar actividad' }, { status: 500 })
  }
}
