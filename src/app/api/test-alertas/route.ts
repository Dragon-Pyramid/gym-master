import { desactivarSociosPorDeuda, obtenerSociosDeudores } from "@/services/brevoService";
import { NextResponse } from "next/server";

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/socios', ['admin']);

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Endpoint de diagnóstico no disponible en producción' },
        { status: 404 }
      );
    }
    const deudores = await obtenerSociosDeudores();
    const deudoresDesactivados= await desactivarSociosPorDeuda();
   return NextResponse.json({message:"Obteniendo socios con la cuota vencida", data:deudores, message2: "Deudores desactivados", data2: deudoresDesactivados},{status:200});
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error en validación interna de alertas:', error);
    return NextResponse.json(
      { error: 'No se pudo completar la validación interna de alertas.' },
      { status: 500 }
    );
  }
}
