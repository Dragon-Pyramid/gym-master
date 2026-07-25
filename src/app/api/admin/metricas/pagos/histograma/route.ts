import { NextResponse } from "next/server";
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from "@/lib/auth/serverAuthorization";
import { dataAnalisisConductaPagos } from "@/services/pagoService";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(
      req,
      '/dashboard/finanzas',
      ['admin', 'usuario'],
    );

    const histograma = await dataAnalisisConductaPagos(user);

    if (!histograma) {
      return NextResponse.json(
        { error: 'No se encontraron datos del histograma de pagos' },
        { status: 404 },
      );
    }

    return NextResponse.json(histograma);
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error en el histograma de pagos:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el histograma de pagos' },
      { status: 500 },
    );
  }
}
