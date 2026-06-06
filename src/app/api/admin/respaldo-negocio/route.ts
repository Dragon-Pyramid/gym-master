import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  getRespaldoNegocioHistory,
  getRespaldoNegocioModules,
} from '@/services/adminRespaldoNegocioService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const [modulos, historial] = await Promise.all([
      Promise.resolve(getRespaldoNegocioModules(user)),
      getRespaldoNegocioHistory(user),
    ]);

    return NextResponse.json({ data: { modulos, historial } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') || message.includes('Token') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
