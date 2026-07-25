import { NextResponse } from 'next/server';
import { createEquipamientoPlanPreventivo } from '@/services/server/equipamientoPreventivoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/infraestructura/equipamientos/preventivos', ['admin', 'usuario']);
    const body = await req.json();
    const plan = await createEquipamientoPlanPreventivo(body);
    return NextResponse.json({ message: 'Plan preventivo creado con éxito', data: plan }, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error?.message || 'Error al crear plan preventivo.';
    return NextResponse.json({ error: message }, { status: message.includes('obligatorio') ? 400 : 500 });
  }
}
