import { NextRequest, NextResponse } from 'next/server';
import { getPagoById } from '@/services/pagoService';
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/pagos', ['admin', 'usuario']);
    const { id } = await params;
    const pago = await getPagoById(id);
    return NextResponse.json({ data: pago }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al obtener el pago';
    const status = message.includes('No se encontró') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
