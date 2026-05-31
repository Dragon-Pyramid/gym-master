import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

export const dynamic = 'force-dynamic';

async function fetchCompraById(supabase: ReturnType<typeof conexionBD>, id: string) {
  const { data, error } = await supabase
    .from('compra')
    .select(`
      *,
      proveedor:proveedor_id(id, nombre, razon_social, identificacion_fiscal, estado),
      compra_detalle(*, producto:producto_id(id, nombre, stock, costo, precio))
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await authMiddleware(req);
    const supabase = conexionBD();
    const compra = await fetchCompraById(supabase, params.id);
    return NextResponse.json({ data: compra }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener compra' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await authMiddleware(req);
    const supabase = conexionBD();
    const body = await req.json();
    const estado = body?.estado;

    if (estado !== 'pendiente' && estado !== 'pagada') {
      return NextResponse.json({ error: 'Estado inválido para actualizar compra' }, { status: 400 });
    }

    const { error } = await supabase
      .from('compra')
      .update({
        estado,
        observaciones: typeof body?.observaciones === 'string' ? body.observaciones.trim() || null : undefined,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', params.id)
      .neq('estado', 'anulada');

    if (error) throw new Error(error.message);
    const compra = await fetchCompraById(supabase, params.id);
    return NextResponse.json({ data: compra }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar compra' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await authMiddleware(req);
    const supabase = conexionBD();
    const compra = await fetchCompraById(supabase, params.id);

    if (!compra) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 });
    }

    if (compra.estado === 'anulada' || compra.activo === false) {
      return NextResponse.json({ error: 'La compra ya está anulada' }, { status: 400 });
    }

    const detalles = compra.compra_detalle ?? [];
    for (const detalle of detalles) {
      const { data: producto, error: productoError } = await supabase
        .from('producto')
        .select('id, nombre, stock')
        .eq('id', detalle.producto_id)
        .single();

      if (productoError || !producto) {
        throw new Error('No se pudo encontrar un producto asociado a la compra');
      }

      const stockAnterior = Number(producto.stock ?? 0);
      const cantidad = Number(detalle.cantidad ?? 0);
      const stockNuevo = stockAnterior - cantidad;

      if (stockNuevo < 0) {
        throw new Error(
          `No se puede anular la compra porque ${producto.nombre} quedaría con stock negativo`
        );
      }

      const { error: updateError } = await supabase
        .from('producto')
        .update({ stock: stockNuevo, actualizado_en: new Date().toISOString() })
        .eq('id', producto.id);

      if (updateError) throw new Error(updateError.message);

      const { error: movimientoError } = await supabase.from('producto_stock_movimiento').insert({
        producto_id: producto.id,
        tipo: 'ajuste',
        cantidad,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        motivo: `Reversión de stock por anulación de compra ${compra.numero_comprobante ?? compra.id}`,
        creado_por: user?.id ?? null,
      });

      if (movimientoError) throw new Error(movimientoError.message);
    }

    const { error: compraError } = await supabase
      .from('compra')
      .update({ estado: 'anulada', activo: false, actualizado_en: new Date().toISOString() })
      .eq('id', params.id);

    if (compraError) throw new Error(compraError.message);

    const updated = await fetchCompraById(supabase, params.id);
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al anular compra' }, { status: 500 });
  }
}
