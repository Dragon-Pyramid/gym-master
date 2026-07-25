import { getProveedorById } from '@/services/proveedorService';
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
        '/dashboard/proveedores',
        '/dashboard/productos',
        '/dashboard/compras',
        '/dashboard/comercial/compras-reposicion',
      ],
      ['admin', 'usuario'],
    );
    const { id } = await params;
    const proveedor = await getProveedorById(id);
    return NextResponse.json({ data: proveedor }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error.message });
  }
}
