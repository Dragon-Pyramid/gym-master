import { NextResponse } from "next/server";
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from "@/lib/auth/serverAuthorization";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(
      req,
      '/dashboard/finanzas',
      ['admin', 'usuario'],
    );

    // TODO: implementar lógica de proyección de ingresos.
    return NextResponse.json({ error: 'Endpoint no implementado' }, { status: 501 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error en la proyección de ingresos:', error);
    return NextResponse.json(
      { error: error.message || 'Error en la proyección de ingresos' },
      { status: 500 },
    );
  }
}
