import { NextResponse } from 'next/server';
import {
  getRespaldoNegocioHistory,
  getRespaldoNegocioModules,
} from '@/services/adminRespaldoNegocioService';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/respaldo-negocio', ['admin']);
    const [modulos, historial] = await Promise.all([
      Promise.resolve(getRespaldoNegocioModules(user)),
      getRespaldoNegocioHistory(user),
    ]);

    return NextResponse.json({ data: { modulos, historial } });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : '';
    if (message === "No autorizado: solo administradores pueden exportar respaldos del negocio") {
      return NextResponse.json(
        { error: "No autorizado: solo administradores pueden exportar respaldos del negocio" },
        { status: 403 }
      );
    }
    console.error("Error al obtener respaldo de negocio:", error);
    return NextResponse.json(
      { error: "Error al obtener respaldo de negocio" },
      { status: 500 }
    );
  }
}
