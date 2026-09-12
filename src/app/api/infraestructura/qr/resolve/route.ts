import { NextResponse } from 'next/server';
import { resolveInfraestructuraQrCode } from '@/services/server/infraestructuraMantenimientoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(req, ['/dashboard/infraestructura/lector-qr-barra', '/dashboard/infraestructura/etiquetas-qr'], ['admin', 'usuario']);
    const { searchParams } = new URL(req.url);
    const codigo = searchParams.get('codigo') || '';
    const result = await resolveInfraestructuraQrCode(codigo);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message =
      error?.message ||
      'Error al resolver código QR/barra.';

    if (
      message ===
      'Ingresá o escaneá un código QR/barra válido.'
    ) {
      return NextResponse.json(
        {
          error:
            'Ingresá o escaneá un código QR/barra válido.',
        },
        { status: 400 },
      );
    }

    console.error(
      'Error al resolver código QR/barra:',
      error,
    );

    return NextResponse.json(
      { error: 'Error al resolver código QR/barra.' },
      { status: 500 },
    );
  }
}
