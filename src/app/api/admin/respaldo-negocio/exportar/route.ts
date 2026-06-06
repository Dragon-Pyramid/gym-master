import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { exportRespaldoNegocio } from '@/services/adminRespaldoNegocioService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const body = await req.json().catch(() => ({}));
    const result = await exportRespaldoNegocio(user, body);

    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') || message.includes('Token') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
