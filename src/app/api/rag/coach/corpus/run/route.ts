import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { runRagCorpusBatch } from '@/services/server/ragCorpusAdminService';

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
    const payload = await request.json().catch(() => ({}));
    const result = await runRagCorpusBatch(user, payload);
    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (error: any) {
    const status = getAuthStatus(error);
    if (status === 500) console.error('Error al ejecutar tanda de corpus RAG:', error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Error al ejecutar tanda de corpus RAG.' },
      { status },
    );
  }
}
