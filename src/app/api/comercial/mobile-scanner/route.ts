import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  closeComercialMobileScannerSession,
  createComercialMobileScannerSession,
  getComercialMobileScannerState,
  markComercialMobileScannerEventProcessed,
} from '@/services/server/comercialMobileScannerServerService';

export const dynamic = 'force-dynamic';

function sanitizeScannerRouteError(value: unknown, fallback: string) {
  const message = String(value ?? '').trim();
  if (!message) return fallback;
  if (message.includes('<html') || message.includes('<body') || message.includes('cloudflare') || message.length > 220) {
    return fallback;
  }
  return message;
}

export async function GET(req: NextRequest) {
  try {
    await authMiddleware(req);
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const state = await getComercialMobileScannerState(sessionId);
    return NextResponse.json({ data: state }, { status: 200 });
  } catch (error: any) {
    const message = sanitizeScannerRouteError(error?.message, 'Error transitorio al obtener scanner móvil comercial');
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
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
  } catch (error: any) {
    const message = sanitizeScannerRouteError(error?.message, 'Error al operar scanner móvil comercial');
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
