import { NextResponse } from 'next/server';
import {
  getGimnasioParametrizacion,
  updateGimnasioParametrizacion,
} from '@/services/gimnasioParametrizacionServerService';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/gimnasio-parametrizacion', ['admin']);
    const data = await getGimnasioParametrizacion();
    return NextResponse.json({ data });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('Token') || message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/gimnasio-parametrizacion', ['admin']);
    const body = await req.json();
    const data = await updateGimnasioParametrizacion(body, user);
    return NextResponse.json({ data });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') || message.includes('Token') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
