import { getVentaById } from '@/services/ventaService';
import { NextRequest, NextResponse } from 'next/server';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/ventas', ['admin', 'usuario']);
    if (!user) {
      return NextResponse.json(
        { error: 'No se pudo obtener el usuario' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const venta = await getVentaById(user, id);
    return NextResponse.json({ data: venta }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: error.message || 'Error al obtener la venta' },
      { status: 500 }
    );
  }
}
