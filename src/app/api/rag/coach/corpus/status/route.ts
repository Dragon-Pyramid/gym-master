import { NextResponse } from 'next/server';
import { getRagCorpusStatus } from '@/services/server/ragCorpusAdminService';

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

export async function GET(request: Request) {
  try {
    const user = await authorizeDashboardRequest(request, '/dashboard/rag-corpus', ['admin']);
    const status = await getRagCorpusStatus(user);
    return NextResponse.json(status, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const status = getAuthStatus(error);
    if (status === 500) console.error('Error al consultar estado del corpus RAG:', error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Error al consultar estado del corpus RAG.' },
      { status },
    );
  }
}
