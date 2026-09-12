import { NextResponse } from 'next/server';
import { createInfraestructuraQrCode } from '@/services/server/infraestructuraMantenimientoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, ['/dashboard/infraestructura/etiquetas-qr', '/dashboard/infraestructura/lector-qr-barra'], ['admin', 'usuario']);
    const body = await req.json();
    const qr = await createInfraestructuraQrCode(body);
    return NextResponse.json({ message: 'Código QR/barra generado con éxito', data: qr }, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message =
      error?.message ||
      'Error al generar código QR/barra.';

    switch (message) {
      case 'El tipo de destino QR es obligatorio.':
        return NextResponse.json(
          {
            error:
              'El tipo de destino QR es obligatorio.',
          },
          { status: 400 },
        );

      case 'El identificador destino del QR es obligatorio.':
        return NextResponse.json(
          {
            error:
              'El identificador destino del QR es obligatorio.',
          },
          { status: 400 },
        );

      case 'El target_id es obligatorio para generar QR/código de barras.':
        return NextResponse.json(
          {
            error:
              'El target_id es obligatorio para generar QR/código de barras.',
          },
          { status: 400 },
        );

      case 'Tipo de destino QR no soportado.':
        return NextResponse.json(
          {
            error:
              'Tipo de destino QR no soportado.',
          },
          { status: 400 },
        );

      case 'No se encontró el activo edilicio para generar QR.':
        return NextResponse.json(
          {
            error:
              'No se encontró el activo edilicio para generar QR.',
          },
          { status: 404 },
        );

      case 'No se encontró el sector edilicio para generar QR.':
        return NextResponse.json(
          {
            error:
              'No se encontró el sector edilicio para generar QR.',
          },
          { status: 404 },
        );

      case 'No se encontró la orden de mantenimiento edilicio para generar QR.':
        return NextResponse.json(
          {
            error:
              'No se encontró la orden de mantenimiento edilicio para generar QR.',
          },
          { status: 404 },
        );

      case 'No se encontró el equipamiento para generar QR.':
        return NextResponse.json(
          {
            error:
              'No se encontró el equipamiento para generar QR.',
          },
          { status: 404 },
        );

      case 'No se encontró el producto para generar código de barras/QR.':
        return NextResponse.json(
          {
            error:
              'No se encontró el producto para generar código de barras/QR.',
          },
          { status: 404 },
        );

      case 'No se encontró el servicio para generar QR.':
        return NextResponse.json(
          {
            error:
              'No se encontró el servicio para generar QR.',
          },
          { status: 404 },
        );
    }

    console.error(
      'Error al generar código QR/barra:',
      error,
    );

    return NextResponse.json(
      { error: 'Error al generar código QR/barra.' },
      { status: 500 },
    );
  }
}
