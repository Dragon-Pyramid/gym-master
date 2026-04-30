import { createMantenimiento, getAllMantenimientos, updateMantenimiento } from "@/services/mantenimientoService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
try{
    const body = await req.json();
if(!body || !body.id_equipamiento || !body.tipo_mantenimiento || !body.descripcion  || !body.tecnico_responsable || !body.costo){
    return NextResponse.json({ error: "El cuerpo de la solicitud no puede estar vacío" }, { status: 400 });
}

const mantenimiento = await createMantenimiento(body);

return NextResponse.json({message:"Mantenimiento creado",data: mantenimiento}, {status:201});

}catch(error:any){
    console.log(error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
}
}

export async function GET() {
  try {
        const mantenimientos = await getAllMantenimientos();
        return NextResponse.json({data:mantenimientos},{status:200})
    } catch (error: any) {
        console.log(error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });        
    }
}

export async function PUT(req: NextRequest) {
    const { id, updateData } = await req.json();
    try {
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'ID inválido para actualizar' }, { status: 400 })
        }
        const mantenimiento = await updateMantenimiento(id, updateData);
        return NextResponse.json({
            message: "Mantenimiento actualizado correctamente",
            data: mantenimiento
        }, { status: 200 });
    } catch (error: any) {
       console.log(error.message);
        return NextResponse.json({ error: "error al modificar el mantenimiento"}, { status: 500 })
    }
}