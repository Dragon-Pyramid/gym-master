import { authMiddleware } from "@/middlewares/auth.middleware";
import { rankingMensualAsistencia } from "@/services/asistenciaService";
import { NextResponse } from "next/server";


export async function POST(req : Request){
    try{
    const {user} = await authMiddleware(req);
    if(!user){
        return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }

    //console.log(await req.json());
    const body = await req.json();
    

    const rankingMensual = await rankingMensualAsistencia(body, user);

    return NextResponse.json(rankingMensual);
    }catch(error:any){
        console.log(error);
       return NextResponse.json({message: error.message}, {status: 500});
   }
}