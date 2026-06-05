import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  getSoporteTicketById,
  updateSoporteTicket,
} from '@/services/soporteTicketService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await authMiddleware(_req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ticket = await getSoporteTicketById(params.id, user);
    return NextResponse.json({ data: ticket });
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
    const ticket = await updateSoporteTicket(params.id, body, user);
    return NextResponse.json({ data: ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
