import { NextResponse } from 'next/server';
import { resolveInfraestructuraQrCode } from '@/services/server/infraestructuraMantenimientoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(req, ['/dashboard/infraestructura/lector-qr-barra', '/dashboard/infraestructura/etiquetas-qr'], ['admin', 'usuario']);
    const { searchParams } = new URL(req.url);
    const codigo = searchParams.get('codigo') || '';
    const result = await resolveInfraestructuraQrCode(codigo);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: error?.message || 'Error al resolver código QR/barra.' },
      { status: error?.message?.includes('Ingresá') ? 400 : 500 },
    );
  }
}
