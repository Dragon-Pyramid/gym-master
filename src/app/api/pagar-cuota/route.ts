import { authMiddleware } from '@/middlewares/auth.middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createSessionPago, previewSessionPago } from '@/services/stripeService';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.rol !== 'socio') {
      return NextResponse.json(
        { error: 'Solo los socios pueden consultar la vista previa de pago' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const mesesCubiertos = Number(url.searchParams.get('meses_cubiertos') ?? 1);
    const preview = await previewSessionPago(user, {
      meses_cubiertos: mesesCubiertos,
    });

    return NextResponse.json({ data: preview }, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener vista previa de pago:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener vista previa de pago' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.rol !== 'socio') {
      return NextResponse.json(
        { error: 'Solo los socios pueden pagar su cuota con Stripe desde este flujo' },
        { status: 403 }
      );
    }

    let body: { meses_cubiertos?: number } = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const session = await createSessionPago(user, {
      meses_cubiertos: body.meses_cubiertos,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    console.error('Error al crear la sesión de pago:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}
