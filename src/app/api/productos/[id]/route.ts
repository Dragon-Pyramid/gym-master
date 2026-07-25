import { getProductoById } from '@/services/productoService';
import { NextRequest, NextResponse } from 'next/server';


import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(
      req,
      [
        '/dashboard/productos',
        '/dashboard/comercial',
        '/dashboard/comercial/kiosco',
        '/dashboard/compras',
        '/dashboard/comercial/compras-reposicion',
        '/dashboard/ventas',
      ],
      ['admin', 'usuario'],
    );
    const { id } = await params;
    const producto = await getProductoById(id);
    return NextResponse.json({ data: producto }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error.message });
  }
}
