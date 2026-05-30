import {
  createVenta,
  deleteVenta,
  getAllVentas,
  updateVenta,
} from '@/services/ventaService';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'No se pudo obtener el usuario' },
        { status: 401 }
      );
    }

    const ventas = await getAllVentas(user);
    return NextResponse.json({ data: ventas }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener las ventas' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'No se pudo obtener el usuario' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const detalles = body?.detalles ?? (body?.venta_detalle ? [body.venta_detalle] : []);

    if (!body?.venta || !Array.isArray(detalles) || detalles.length === 0) {
      return NextResponse.json(
        { error: 'La venta debe tener cabecera y al menos un producto o servicio' },
        { status: 400 }
      );
    }

    if (body.venta.cliente_tipo === 'socio' && !body.venta.socio_id) {
      return NextResponse.json(
        { error: 'Debe seleccionar un socio para una venta asociada a socio' },
        { status: 400 }
      );
    }

    const venta = await createVenta(user, { ...body, detalles });
    return NextResponse.json(
      { message: 'Venta registrada con éxito', data: venta },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar la venta' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'No se pudo obtener el usuario' },
        { status: 401 }
      );
    }

    const { id, updateData } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID inválido para actualizar' },
        { status: 400 }
      );
    }

    const ventaModificada = await updateVenta(user, id, updateData);
    return NextResponse.json(
      { message: 'Venta actualizada con éxito', data: ventaModificada },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar venta' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'No se pudo obtener el usuario' },
        { status: 401 }
      );
    }

    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID inválido para anular' },
        { status: 400 }
      );
    }

    await deleteVenta(user, id);
    return NextResponse.json(
      { message: 'Venta anulada con éxito' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al anular venta' },
      { status: 500 }
    );
  }
}
