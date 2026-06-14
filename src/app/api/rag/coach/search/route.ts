import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { searchRagKnowledge } from '@/services/server/ragCoachSearchService';

export const dynamic = 'force-dynamic';

function getAuthStatus(error: any) {
  const message = error?.message ?? '';
  if (message.includes('Token no proporcionado') || message.includes('Token inválido')) return 401;
  if (message.includes('No autorizado')) return 403;
  return 500;
}

export async function POST(request: Request) {
  try {
    const { user } = await authMiddleware(request);
    const payload = await request.json();
    const result = await searchRagKnowledge(user, payload);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const status = getAuthStatus(error);
    if (status === 500) console.error('Error en búsqueda RAG:', error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Error en búsqueda RAG.' },
      { status },
    );
  }
}
