import { rankingMensualAsistencia } from "@/services/asistenciaService";
import { NextResponse } from "next/server";



import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';
import {
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';

export const dynamic = 'force-dynamic';

export async function POST(req : Request){
    try{
    const user = await authorizeDashboardRequest(req, '/dashboard/socios-ranking-bonificacion', ['admin', 'usuario']);
    if(!user){
        return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }

    const body =
      await readJsonBody<
        Parameters<typeof rankingMensualAsistencia>[0]
      >(
        req,
        64 * 1024,
      );
    

    const rankingMensual = await rankingMensualAsistencia(body, user);

    return NextResponse.json(rankingMensual);
    } catch (error: unknown) {
      const authResponse =
        authorizationErrorResponse(error);

      if (authResponse) return authResponse;

      const response =
        runtimeErrorResponse(
          error,
          'Error al calcular el ranking mensual',
        );

      if (response.status >= 500) {
        console.error(
          'Error al calcular el ranking mensual:',
          {
            name:
              error instanceof Error
                ? error.name
                : 'UnknownError',
          },
        );
      }

      return response;
    }
}