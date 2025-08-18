
import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { FindFichaMedicaSocio } from "@/services/fichaMedicaService";

export async function GET(req: Request, {params} : {params: {id:string}}) {
    try{  
    const {user} = await authMiddleware(req);
   if(!user){
        return NextResponse.json({error: "Usuario no autorizado"}, {status: 401});
    }

    const {id} = await params;
    if (!id) {
        return NextResponse.json({error: "ID de socio no proporcionado"}, {status: 400});
    }

    const ficha = await FindFichaMedicaSocio(user, id);

    return NextResponse.json({data: ficha}, {status: 200});

    }catch(error:any){
        console.log(error);
        return NextResponse.json({error: error.message}, {status: 500});
        
    }
}