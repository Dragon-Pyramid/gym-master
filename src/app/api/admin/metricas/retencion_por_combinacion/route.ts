import { authMiddleware } from "@/middlewares/auth.middleware";
import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import { dataRetencionPorCombinacion } from "@/services/rutinaService";
import { NextResponse } from "next/server";

export async function GET(req:Request){
try {
    const {user} = await authMiddleware(req);
    if(!user){
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }


    const rolAdmin = rolAdminMiddleware(user);
    if(!rolAdmin){
        return NextResponse.json({error: "Unauthorized: User no tiene rol de admin"}, {status: 403});
    }

    const retencion = await dataRetencionPorCombinacion(user);
    if(!retencion){
        return NextResponse.json({error: "No se encontraron datos de retención por combinación"}, {status: 404});
    }

    return NextResponse.json({data: retencion}, {status: 200});

} catch (error) {
    console.log("Error en la obtención de métricas:", error);
    return NextResponse.json({error: "Error en la obtención de métricas"}, {status: 500});
}


}