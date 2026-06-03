import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  createMensajeSocio,
  getMensajesSocio,
} from '@/services/socioMensajeService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mensajes = await getMensajesSocio(user);
    return NextResponse.json({ data: mensajes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const mensaje = await createMensajeSocio(body, user);
    return NextResponse.json({ data: mensaje }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
