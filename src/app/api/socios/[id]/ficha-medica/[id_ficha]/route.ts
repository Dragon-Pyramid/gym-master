import { authMiddleware } from "@/middlewares/auth.middleware";
import { FindOneFichaMedicaSocio } from "@/services/fichaMedicaService";
import { NextResponse } from "next/server";

export async function GET(req:Request, {params} : {params : {id: string, id_ficha: string }}){
   try{
 const {user} = await authMiddleware(req);
    const {id} = params;
    const {id_ficha} = params;

    const ficha = await FindOneFichaMedicaSocio(user, id, id_ficha);

    return NextResponse.json({data: ficha}, {status: 200});
   } catch(error:any){
       console.log(error);
       return NextResponse.json({error: error.message}, {status: 500});
   }


}