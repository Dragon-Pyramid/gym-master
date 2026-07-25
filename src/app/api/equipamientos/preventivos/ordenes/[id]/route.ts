import { NextResponse } from 'next/server';
import { updateEquipamientoOrdenTecnica } from '@/services/server/equipamientoPreventivoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/infraestructura/equipamientos/preventivos', ['admin', 'usuario']);
    const { id } = await params;
    const body = await req.json();
    const orden = await updateEquipamientoOrdenTecnica(id, body);
    return NextResponse.json({ message: 'Orden técnica actualizada con éxito', data: orden }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: error?.message || 'Error al actualizar orden técnica.' },
      { status: 500 },
    );
  }
}
