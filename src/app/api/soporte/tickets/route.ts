import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  createSoporteTicket,
  getSoporteTickets,
} from '@/services/soporteTicketService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const tickets = await getSoporteTickets(user, {
      estado: url.searchParams.get('estado'),
      q: url.searchParams.get('q'),
    });

    return NextResponse.json({ data: tickets });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const ticket = await createSoporteTicket(body, user);
    return NextResponse.json({ data: ticket }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
