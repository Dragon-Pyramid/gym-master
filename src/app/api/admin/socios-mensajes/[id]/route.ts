import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  getMensajeAdminById,
  updateMensajeAdmin,
} from '@/services/socioMensajeService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mensaje = await getMensajeAdminById(params.id, user);
    return NextResponse.json({ data: mensaje });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const mensaje = await updateMensajeAdmin(params.id, body, user);
    return NextResponse.json({ data: mensaje });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
