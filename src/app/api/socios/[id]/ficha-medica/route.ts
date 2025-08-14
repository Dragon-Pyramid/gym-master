
import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { createFichaMedicaSocio } from "@/services/fichaMedicaService";

export async function POST(req: Request, {params} : {params: {id:string}}) {
    try{
    const {user} = await authMiddleware(req);
    if(!user){
        return NextResponse.json({error: "Usuario no autorizado"}, {status: 401});
    }

    const {id} = params;

      if (!id) {
        return NextResponse.json({error: "ID de socio no proporcionado"}, {status: 400});
    }

    const body = await req.json();

    const ficha = await createFichaMedicaSocio(user, id, body);

    return NextResponse.json({message:"ficha cargada con exito", data: ficha}, {status: 201});

    }catch(error:any){
        console.log(error);
        return NextResponse.json({error: error.message}, {status: 500});
        
    }
}