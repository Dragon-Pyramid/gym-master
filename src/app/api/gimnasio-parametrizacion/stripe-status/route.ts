import { NextResponse } from 'next/server';
import { getGimnasioStripeStatus } from '@/services/gimnasioParametrizacionServerService';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(
      req,
      ['/dashboard/gimnasio-parametrizacion', '/dashboard/mi-cuenta/pagar-cuota'],
      ['admin', 'socio'],
    );
    const data = await getGimnasioStripeStatus();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('Token') || message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
