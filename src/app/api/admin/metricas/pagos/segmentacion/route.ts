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

    const segmentacion = await dataAnalisisConductaPagos(user);

    if (!segmentacion) {
      return NextResponse.json(
        { error: 'No se encontraron datos de segmentación de pagos' },
        { status: 404 },
      );
    }

    return NextResponse.json(segmentacion);
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error en la segmentación de pagos:', error);
    return NextResponse.json(
      { error: "Error en la segmentación de pagos" },
      { status: 500 },
    );
  }
}
