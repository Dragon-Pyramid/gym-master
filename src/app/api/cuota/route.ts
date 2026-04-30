import { createCuota, deleteCuota, getAllCuotas, updateCuota } from "@/services/cuotaService";
import { error } from "console";
import { NextResponse } from "next/server";

export async function GET(){
    try{
const cuotas = await getAllCuotas();
return NextResponse.json({data:cuotas},{status:200})
}catch(error:any){
    console.log("error al obtener las cuotas:", error.message);
    return NextResponse.json({error:"Error al obtener las cuotas"},{status:500})
}
}

export async function POST(req: Request){
    try {
        const body = await req.json();
        if(!body.descripcion || !body.monto || body.monto <= 0 || !body.fecha_inicio || !body.fecha_fin){
            return NextResponse.json({error:"Todos los campos son obligatorios y el monto debe ser mayor que 0"},{status:400})
        }
        const cuota = await createCuota(body);
        return NextResponse.json({
            message:"Cuota creada con exito",
            data:cuota
        },{status:201})
            
    } catch (error:any) {
        console.log("Error al crear la cuota: ", error.message);
        return NextResponse.json({error:"Error al crear la cuota"},{status:500})
        
    }

}

export async function PUT(req:Request){
    const { id, updateData } = await req.json();
    try {
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'ID inválido para actualizar' }, { status: 400 })
        }
        const cuotaModificada = await updateCuota(id, updateData);
        return NextResponse.json({
            message: "Cuota actualizada con éxito",
            data: cuotaModificada
        }, { status: 200 });
    } catch (error: any) {
        const msg = error.message || 'Error al actualizar cuota'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

export async function DELETE(req:Request){
     const { id } = await req.json();
    try {
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'ID inválido para eliminar' }, { status: 400 })
        }
           await deleteCuota(id)
            return NextResponse.json({ message: 'Cuota eliminada con éxito' }, { status: 200 })
          } catch (error: any) {
            const msg = error.message || 'Error al eliminar cuota'
            return NextResponse.json({ error: msg }, { status: 500 })
          }
}
