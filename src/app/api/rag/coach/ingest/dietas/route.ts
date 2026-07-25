import { NextResponse } from 'next/server';
import { ingestDietRulesForRag } from '@/services/server/ragCoachIngestionService';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

function getAuthStatus(error: any) {
  const message = error?.message ?? '';
  if (message.includes('Token no proporcionado') || message.includes('Token inválido')) return 401;
  if (message.includes('No autorizado')) return 403;
  return 500;
}

export async function POST(request: Request) {
  try {
    const user = await authorizeDashboardRequest(request, '/dashboard/rag-corpus', ['admin']);
    const payload = await request.json().catch(() => ({}));
    const result = await ingestDietRulesForRag(user, payload);
    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const status = getAuthStatus(error);
    if (status === 500) console.error('Error en ingesta RAG de dietas:', error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Error en ingesta RAG de dietas.' },
      { status },
    );
  }
}
