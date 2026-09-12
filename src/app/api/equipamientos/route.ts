import { createEquipamiento, getAllEquipamientos } from "@/services/equipamientoService";
import { NextResponse } from "next/server";

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export async function GET(req: Request){
    try {
    await authorizeDashboardRequest(req, '/dashboard/equipamientos', ['admin', 'usuario']);
        const equipamientos = await getAllEquipamientos();
        return NextResponse.json({data:equipamientos},{status:200})
    } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
        console.error('Error al obtener los equipamientos:', error);
        return NextResponse.json(
            { error: 'Error al obtener los equipamientos' },
            { status: 500 }
        );
    }
}

export async function POST(req : Request){
    try {
    await authorizeDashboardRequest(req, '/dashboard/equipamientos', ['admin', 'usuario']);
const body = await req.json();
if (!body || !body.nombre || !body.tipo || !body.marca || !body.modelo || !body.ubicacion) {
    return NextResponse.json({ error: "El cuerpo de la solicitud no puede estar vacío" }, { status: 400 });
}

    const equipamiento = await createEquipamiento(body);
    return NextResponse.json({message:"Equipamiento creado",data: equipamiento}, {status:201});
} catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
        console.error('Error al crear el equipamiento:', error);
        return NextResponse.json(
            { error: 'Error al crear el equipamiento' },
            { status: 500 }
        );
}
}



