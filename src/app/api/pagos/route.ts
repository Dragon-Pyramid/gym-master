import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  createPagoManualServer,
  deactivatePagoServer,
  fetchPagoFormOptionsServer,
  fetchPagosServer,
  updatePagoServer,
} from '@/services/server/pagoServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const url = new URL(req.url);

    if (url.searchParams.get('options') === 'true') {
      const options = await fetchPagoFormOptionsServer(user);
      return NextResponse.json({ data: options }, { status: 200 });
    }

    const pagos = await fetchPagosServer(user);
    return NextResponse.json({ data: pagos }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener pagos' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const body = await req.json();
    const pago = await createPagoManualServer(user, body);

    return NextResponse.json(
      { message: 'Pago registrado con éxito', data: pago },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar el pago' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const { id, updateData } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID inválido para actualizar' },
        { status: 400 }
      );
    }

    const pago = await updatePagoServer(user, id, updateData);
    return NextResponse.json(
      { message: 'Pago actualizado con éxito', data: pago },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar pago' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const { id } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID inválido para eliminar' },
        { status: 400 }
      );
    }

    const pago = await deactivatePagoServer(user, id);
    return NextResponse.json(
      { message: 'Pago eliminado con éxito', data: pago },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar pago' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}
