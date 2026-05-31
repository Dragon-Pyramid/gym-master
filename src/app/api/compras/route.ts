import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

export const dynamic = 'force-dynamic';

type CompraDetalleInput = {
  producto_id: string;
  cantidad: number;
  costo_unitario: number;
};

const estadosValidos = ['pendiente', 'pagada', 'anulada'];
const mediosPagoValidos = ['efectivo', 'transferencia', 'mercado_pago', 'stripe', 'otro'];

function parsePositiveInteger(value: unknown, field: string): number {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`${field} debe ser un número entero mayor a 0`);
  }
  return numeric;
}

function parseMoney(value: unknown, field: string): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`${field} debe ser un importe mayor o igual a 0`);
  }
  return Math.round(numeric * 100) / 100;
}

function normalizeDate(fecha?: string | null) {
  if (fecha && fecha.trim().length > 0) return fecha;
  return new Date().toISOString().slice(0, 10);
}

function calculateMargin(price: number, cost: number) {
  const margen = Math.round((price - cost) * 100) / 100;
  const porcentaje = price > 0 ? Math.round((margen / price) * 10000) / 100 : null;
  return { margen, porcentaje };
}

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

export async function GET(req: NextRequest) {
  try {
    await authMiddleware(req);
    const supabase = conexionBD();
    const { searchParams } = new URL(req.url);
    const proveedorId = searchParams.get('proveedor_id');
    const estado = searchParams.get('estado');

    let query = supabase
      .from('compra')
      .select(`
        *,
        proveedor:proveedor_id(id, nombre, razon_social, identificacion_fiscal, estado),
        compra_detalle(*, producto:producto_id(id, nombre, stock, costo, precio))
      `)
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false });

    if (proveedorId) query = query.eq('proveedor_id', proveedorId);
    if (estado && estadosValidos.includes(estado)) query = query.eq('estado', estado);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener compras' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
    const supabase = conexionBD();
    const body = await req.json();

    const proveedorId = String(body?.proveedor_id ?? '').trim();
    if (!proveedorId) {
      return NextResponse.json({ error: 'Debe seleccionar un proveedor' }, { status: 400 });
    }

    const { data: proveedor, error: proveedorError } = await supabase
      .from('proveedor')
      .select('id, nombre, estado')
      .eq('id', proveedorId)
      .single();

    if (proveedorError || !proveedor) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    if (proveedor.estado === 'inactivo' || proveedor.estado === 'discontinuado') {
      return NextResponse.json(
        { error: 'No se puede registrar compra con proveedor inactivo o discontinuado' },
        { status: 400 }
      );
    }

    const detallesInput = Array.isArray(body?.detalles) ? (body.detalles as CompraDetalleInput[]) : [];
    if (!detallesInput.length) {
      return NextResponse.json({ error: 'La compra debe tener al menos un producto' }, { status: 400 });
    }

    const normalizedDetalles = detallesInput.map((detalle, index) => {
      const productoId = String(detalle?.producto_id ?? '').trim();
      if (!productoId) throw new Error(`Debe seleccionar producto en el ítem ${index + 1}`);

      const cantidad = parsePositiveInteger(detalle?.cantidad, `La cantidad del ítem ${index + 1}`);
      const costoUnitario = parseMoney(detalle?.costo_unitario, `El costo unitario del ítem ${index + 1}`);
      if (costoUnitario <= 0) throw new Error(`El costo unitario del ítem ${index + 1} debe ser mayor a 0`);

      return {
        producto_id: productoId,
        cantidad,
        costo_unitario: costoUnitario,
        subtotal: Math.round(cantidad * costoUnitario * 100) / 100,
      };
    });

    const total = normalizedDetalles.reduce((acc, detalle) => acc + detalle.subtotal, 0);
    const estado = estadosValidos.includes(body?.estado) ? body.estado : 'pagada';
    const medioPago = mediosPagoValidos.includes(body?.medio_pago) ? body.medio_pago : 'efectivo';

    if (estado === 'anulada') {
      return NextResponse.json({ error: 'No se puede crear una compra ya anulada' }, { status: 400 });
    }

    const productoIds = Array.from(new Set(normalizedDetalles.map((detalle) => detalle.producto_id)));
    const { data: productos, error: productosError } = await supabase
      .from('producto')
      .select('id, nombre, stock, costo, precio, activo')
      .in('id', productoIds);

    if (productosError) throw new Error(productosError.message);
    const productoMap = new Map((productos ?? []).map((producto) => [producto.id, producto]));

    for (const detalle of normalizedDetalles) {
      const producto = productoMap.get(detalle.producto_id);
      if (!producto) throw new Error('Uno de los productos seleccionados no existe');
      if (producto.activo === false) {
        throw new Error(`El producto ${producto.nombre} está inactivo y no puede recibir compras`);
      }
    }

    const { data: compra, error: compraError } = await supabase
      .from('compra')
      .insert({
        proveedor_id: proveedorId,
        fecha: normalizeDate(body?.fecha),
        estado,
        medio_pago: medioPago,
        numero_comprobante: String(body?.numero_comprobante ?? '').trim() || null,
        observaciones: String(body?.observaciones ?? '').trim() || null,
        total,
        activo: true,
        registrado_por: user?.id ?? null,
      })
      .select('*')
      .single();

    if (compraError || !compra) throw new Error(compraError?.message || 'No se pudo crear la compra');

    try {
      const detallesToInsert = normalizedDetalles.map((detalle) => ({
        compra_id: compra.id,
        producto_id: detalle.producto_id,
        cantidad: detalle.cantidad,
        costo_unitario: detalle.costo_unitario,
        subtotal: detalle.subtotal,
      }));

      const { data: detalles, error: detallesError } = await supabase
        .from('compra_detalle')
        .insert(detallesToInsert)
        .select('*');

      if (detallesError) throw new Error(`No se pudo registrar detalle de compra: ${detallesError.message}`);

      for (const detalle of detalles ?? []) {
        const producto = productoMap.get(detalle.producto_id)!;
        const stockAnterior = Number(producto.stock ?? 0);
        const stockNuevo = stockAnterior + Number(detalle.cantidad ?? 0);
        const costoAnterior = Number(producto.costo ?? 0);
        const costoNuevo = Number(detalle.costo_unitario ?? 0);
        const precioActual = Number(producto.precio ?? 0);

        const { error: updateProductoError } = await supabase
          .from('producto')
          .update({
            stock: stockNuevo,
            costo: costoNuevo,
            actualizado_en: new Date().toISOString(),
          })
          .eq('id', detalle.producto_id);

        if (updateProductoError) {
          throw new Error(`No se pudo actualizar stock/costo del producto: ${updateProductoError.message}`);
        }

        const { error: movimientoError } = await supabase.from('producto_stock_movimiento').insert({
          producto_id: detalle.producto_id,
          tipo: 'compra',
          cantidad: detalle.cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          motivo: `Compra / reposición de stock${compra.numero_comprobante ? ` - comprobante ${compra.numero_comprobante}` : ''}`,
          creado_por: user?.id ?? null,
        });

        if (movimientoError) {
          throw new Error(`No se pudo registrar movimiento de stock: ${movimientoError.message}`);
        }

        if (costoAnterior !== costoNuevo) {
          const margen = calculateMargin(precioActual, costoNuevo);
          const { error: historialError } = await supabase.from('producto_precio_costo_historial').insert({
            producto_id: detalle.producto_id,
            precio_anterior: precioActual,
            precio_nuevo: precioActual,
            costo_anterior: costoAnterior,
            costo_nuevo: costoNuevo,
            moneda: 'ARS',
            margen_anterior: calculateMargin(precioActual, costoAnterior).margen,
            margen_nuevo: margen.margen,
            margen_porcentaje_nuevo: margen.porcentaje,
            motivo: `Actualización de costo por compra${compra.numero_comprobante ? ` ${compra.numero_comprobante}` : ''}`,
            fecha_vigencia: compra.fecha,
            usuario_responsable: user?.id ?? null,
            origen: 'manual',
          });

          if (historialError) {
            throw new Error(`No se pudo registrar historial de costo: ${historialError.message}`);
          }
        }
      }
    } catch (error) {
      await supabase.from('compra').delete().eq('id', compra.id);
      throw error;
    }

    const fullCompra = await fetchCompraById(supabase, compra.id);
    return NextResponse.json({ data: fullCompra }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar compra' },
      { status: 500 }
    );
  }
}
