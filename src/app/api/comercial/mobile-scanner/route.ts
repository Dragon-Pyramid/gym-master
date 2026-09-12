import { comercialErrorResponse } from '@/lib/comercial/comercialErrorBoundary';
import { NextRequest, NextResponse } from 'next/server';
import {
  closeComercialMobileScannerSession,
  createComercialMobileScannerSession,
  getComercialMobileScannerState,
  markComercialMobileScannerEventProcessed,
} from '@/services/server/comercialMobileScannerServerService';

import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';



export async function GET(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/kiosco', ['admin', 'usuario']);
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const state = await getComercialMobileScannerState(sessionId);
    return NextResponse.json({ data: state }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error transitorio al obtener scanner móvil comercial");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/comercial/kiosco', ['admin', 'usuario']);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? '');

    if (action === 'crear_sesion') {
      const session = await createComercialMobileScannerSession(user ?? null);
      return NextResponse.json({ data: { session }, message: 'Sesión de scanner móvil creada' }, { status: 201 });
    }

    if (action === 'cerrar_sesion') {
      const session = await closeComercialMobileScannerSession(String(body?.session_id ?? ''));
      return NextResponse.json({ data: { session }, message: 'Sesión de scanner móvil cerrada' }, { status: 200 });
    }

    if (action === 'marcar_evento_procesado') {
      const event = await markComercialMobileScannerEventProcessed(String(body?.event_id ?? ''));
      return NextResponse.json({ data: { event }, message: 'Evento de scanner procesado' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Acción de scanner no soportada' }, { status: 400 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al operar scanner móvil comercial");
  }
}
