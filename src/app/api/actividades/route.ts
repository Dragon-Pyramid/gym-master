import { createActividad, deleteActividad, fetchAllActividades, updateActividad } from "@/services/actividadService";
import { NextResponse } from "next/server";

export async function GET(){
    try {
        const actividades = await fetchAllActividades();
        return NextResponse.json(actividades,{status:200})
    } catch (error) {
        console.log("Error al obtener las actividades:", error);
        return  NextResponse.json({error:" Error al obtener las actividades"},{status:500})
    }
}

export async function POST(req:Request){
    try {
        const body = await req.json();
        console.log("Datos recibidos para la creacion de actividades ",body);
        if(!body.nombre_actividad){
            return NextResponse.json({error:"El nombre de la actividad es obligatorio"},{status:400});
        }
        const actividad = await createActividad(body);
        return NextResponse.json({
            message:"Actividad creada con exito",
            data:actividad
        }, {status:201});
    } catch (error: any) {
    
        console.log("Error al crear la actividad:", error.message);
        return NextResponse.json({error:"Error al crear la actividad"},{status:500});
    }

}

export async function PUT(req:Request){
const{id,updateData} = await req.json();
console.log(id,updateData);

try {
    if (!id || typeof id !== 'string') {
          return NextResponse.json({ error: 'ID inválido para actualizar' }, { status: 400 })
        }
    const actividadModificada = await updateActividad(id,updateData);
    return NextResponse.json({
        message:"Actividad actualizada con exito",
        data:actividadModificada
    },{status:200});
} catch (error : any) {
      const msg = error.message || 'Error al actualizar actividad'
    return NextResponse.json({ error: msg }, { status: 500 })
  }


}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID requerido para eliminar' }, { status: 400 })
    }

    await deleteActividad(id)
    return NextResponse.json({ message: 'Actividad eliminada con éxito' }, { status: 200 })
  } catch (error: any) {
    const msg = error.message || 'Error al eliminar actividad'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
