import { getUsuarioById } from '@/services/usuarioService';
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
    const user = await authorizeDashboardRequest(req, '/dashboard/usuarios', ['admin']);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const usuario = await getUsuarioById(user, id);
    return NextResponse.json({ data: usuario }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error.message });
  }
}
