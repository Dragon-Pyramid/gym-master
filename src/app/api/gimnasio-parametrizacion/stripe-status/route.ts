import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getGimnasioStripeStatus } from '@/services/gimnasioParametrizacionServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authMiddleware(req);
    const data = await getGimnasioStripeStatus();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('Token') || message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
