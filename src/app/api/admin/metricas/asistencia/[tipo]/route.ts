import { authMiddleware } from "@/middlewares/auth.middleware";
import { dataConcurrenciaAnual, dataConcurrenciaMensual, dataConcurrenciaSemanal } from "@/services/asistenciaService";
import { getSupabaseClient } from "@/services/supabaseClient";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { tipo: string } }) {
    const { user } = await authMiddleware(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //TODO VALIDAR QUE TENGA ROL ADMIN

    const { tipo } = params;
    let concurrencia;
    
    if (tipo === 'semanal') {
        concurrencia = await dataConcurrenciaSemanal(user);
    } else if (tipo === 'mensual') {
        concurrencia = await dataConcurrenciaMensual(user);
    } else if (tipo === "anual"){
        concurrencia = await dataConcurrenciaAnual(user);
    }
    
    else {
        return NextResponse.json({ error: "Param 'tipo' requerido (semanal|mensual|anual)" }, { status: 400 });
    }

    if (!concurrencia) {
        return NextResponse.json({ error: "No se encontraron datos de concurrencia" }, { status: 404 });
    }

    return NextResponse.json(concurrencia);
}