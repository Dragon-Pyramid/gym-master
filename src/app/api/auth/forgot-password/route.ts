import { NextResponse } from 'next/server';

import {
  getPasswordRecoveryErrorStatus,
  requestPasswordReset,
} from '@/services/authRecoveryService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await requestPasswordReset({
      email: body.email,
      rol: body.rol,
      requestUrl: req.url,
      headers: req.headers,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const status = getPasswordRecoveryErrorStatus(error);
    const message = error instanceof Error ? error.message : 'No se pudo procesar la solicitud';

    return NextResponse.json({ error: message }, { status });
  }
}
