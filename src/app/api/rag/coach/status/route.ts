import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getRagHealth } from '@/services/server/ragCoachSearchService';

export const dynamic = 'force-dynamic';

function getAuthStatus(error: any) {
  const message = error?.message ?? '';
  if (message.includes('Token no proporcionado') || message.includes('Token inválido')) return 401;
  if (message.includes('No autorizado')) return 403;
  return 500;
}

export async function GET(request: Request) {
  try {
    const { user } = await authMiddleware(request);
    const status = await getRagHealth(user);
    return NextResponse.json(status, { status: 200 });
  } catch (error: any) {
    const status = getAuthStatus(error);
    if (status === 500) console.error('Error al consultar estado RAG:', error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Error al consultar estado RAG.' },
      { status },
    );
  }
}
