import { authMiddleware } from "@/middlewares/auth.middleware";
import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import { createEntrenador } from "@/services/entrenadorService";
import { NextResponse } from "next/server";

export async function POST(req: Request){
    try{
    const{user} = await authMiddleware(req);
    if(!user){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    //const isAdmin = rolAdminMiddleware(user);
    //if(!isAdmin){
      //  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    //}
    const body = await req.json();
    const {nombre_completo, dni, horarios} = body;

    if(!nombre_completo || !dni || !horarios){
        return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const entrenador = await createEntrenador({nombre_completo, dni, horarios},user);
    return NextResponse.json(entrenador, { status: 201 });

} catch (error:any) {
        return NextResponse.json({ error:error.message}, { status: 500 });
    }



}