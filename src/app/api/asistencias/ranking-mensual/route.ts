import { rankingMensualAsistencia } from "@/services/asistenciaService";
import { NextResponse } from "next/server";



import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req : Request){
    try{
    const user = await authorizeDashboardRequest(req, '/dashboard/socios-ranking-bonificacion', ['admin', 'usuario']);
    if(!user){
        return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }

    //console.log(await req.json());
    const body = await req.json();
    

    const rankingMensual = await rankingMensualAsistencia(body, user);

    return NextResponse.json(rankingMensual);
    }catch(error:any){
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
        console.log(error);
       return NextResponse.json({message: error.message}, {status: 500});
   }
}