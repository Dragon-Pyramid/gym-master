import {
  authorizationErrorResponse,
  authorizeOwnUserOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import { getUsuarioById } from '@/services/usuarioService';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await authorizeOwnUserOrDashboardRequest(
      req,
      id,
      '/dashboard/usuarios',
      ['admin'],
    );
    const usuario = await getUsuarioById(user, id);
    return NextResponse.json({ data: usuario }, { status: 200 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error ? error.message : 'Error al obtener el perfil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
