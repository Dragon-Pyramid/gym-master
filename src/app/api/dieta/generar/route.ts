import { authMiddleware } from "@/middlewares/auth.middleware";
import { createDietaSocio } from "@/services/dietaService";
import { NextResponse } from "next/server";

export async function POST (req: Request){
    try{
    const {user} = await authMiddleware(req);
    if (!user) {
        return NextResponse.json(
            { error: "Unauthorized" }, 
            { status: 401 }
        );
    }

    const body = await req.json();

    if(!body.socio_id || !body.objetivo || !body.fecha_inicio || !body.fecha_fin ) {
        return NextResponse.json(
            { error: "Debe enviar todos los campos requeridos" }, 
            { status: 400 }
        );
    }

    const dieta = await createDietaSocio( body, user )

    return NextResponse.json(dieta, { status: 201 });


} catch (error:any) {
    return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
    );
    }

}