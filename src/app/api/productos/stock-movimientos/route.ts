import { authMiddleware } from '@/middlewares/auth.middleware';
import { conexionBD } from '@/middlewares/conexionBd.middleware';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type OperacionStock =
  | 'ajuste_entrada'
  | 'ajuste_salida'
  | 'recuento'
  | 'devolucion'
  | 'merma'
  | 'compra';

const operacionesValidas: OperacionStock[] = [
  'ajuste_entrada',
  'ajuste_salida',
  'recuento',
  'devolucion',
  'merma',
  'compra',
];

function parsePositiveInteger(value: unknown, field: string): number {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`${field} debe ser un número entero mayor a 0`);
  }
  return numeric;
}

function parseNonNegativeInteger(value: unknown, field: string): number {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 0) {
    throw new Error(`${field} debe ser un número entero mayor o igual a 0`);
  }
  return numeric;
}

function resolveMovimientoTipo(operacion: OperacionStock): 'ajuste' | 'devolucion' | 'merma' | 'compra' {
  if (operacion === 'devolucion') return 'devolucion';
  if (operacion === 'merma') return 'merma';
  if (operacion === 'compra') return 'compra';
  return 'ajuste';
}

function buildMotivo(operacion: OperacionStock, motivo: string): string {
  const labels: Record<OperacionStock, string> = {
    ajuste_entrada: 'Ajuste manual de entrada',
    ajuste_salida: 'Ajuste manual de salida',
    recuento: 'Ajuste por recuento físico',
    devolucion: 'Devolución de producto',
    merma: 'Merma / producto no apto',
    compra: 'Compra / reposición de stock',
  };

  return `${labels[operacion]} - ${motivo.trim()}`;
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'No se pudo obtener el usuario' }, { status: 401 });
    }

    const supabase = conexionBD();
    const { searchParams } = new URL(req.url);
    const productoId = searchParams.get('producto_id');
    const limit = Math.min(Number(searchParams.get('limit') ?? 50) || 50, 200);

    let query = supabase
      .from('producto_stock_movimiento')
      .select(
        `
        *,
        producto:producto_id(id, nombre, stock)
      `
      )
      .order('creado_en', { ascending: false })
      .limit(limit);

    if (productoId) {
      query = query.eq('producto_id', productoId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener movimientos de stock' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'No se pudo obtener el usuario' }, { status: 401 });
    }

    const body = await req.json();
    const productoId = String(body?.producto_id ?? '').trim();
    const operacion = body?.tipo_operacion as OperacionStock;
    const motivo = String(body?.motivo ?? '').trim();

    if (!productoId) {
      return NextResponse.json({ error: 'Debe seleccionar un producto' }, { status: 400 });
    }

    if (!operacionesValidas.includes(operacion)) {
      return NextResponse.json({ error: 'Tipo de operación de stock inválido' }, { status: 400 });
    }

    if (motivo.length < 5) {
      return NextResponse.json(
        { error: 'Debe indicar un motivo claro de al menos 5 caracteres' },
        { status: 400 }
      );
    }

    const supabase = conexionBD();
    const { data: producto, error: productoError } = await supabase
      .from('producto')
      .select('id, nombre, stock, activo')
      .eq('id', productoId)
      .single();

    if (productoError || !producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const stockAnterior = Number(producto.stock ?? 0);
    let stockNuevo = stockAnterior;
    let cantidadMovimiento = 0;

    if (operacion === 'recuento') {
      stockNuevo = parseNonNegativeInteger(body?.stock_real, 'El stock real');
      cantidadMovimiento = Math.abs(stockNuevo - stockAnterior);
      if (cantidadMovimiento === 0) {
        return NextResponse.json(
          { error: 'El recuento físico no modifica el stock actual' },
          { status: 400 }
        );
      }
    } else {
      const cantidad = parsePositiveInteger(body?.cantidad, 'La cantidad');
      cantidadMovimiento = cantidad;

      if (operacion === 'ajuste_entrada' || operacion === 'devolucion' || operacion === 'compra') {
        stockNuevo = stockAnterior + cantidad;
      }

      if (operacion === 'ajuste_salida' || operacion === 'merma') {
        stockNuevo = stockAnterior - cantidad;
      }
    }

    if (stockNuevo < 0) {
      return NextResponse.json(
        { error: `La operación dejaría stock negativo. Stock actual: ${stockAnterior}` },
        { status: 400 }
      );
    }

    const { error: stockError } = await supabase
      .from('producto')
      .update({ stock: stockNuevo, actualizado_en: new Date().toISOString() })
      .eq('id', productoId);

    if (stockError) {
      throw new Error(`No se pudo actualizar el stock: ${stockError.message}`);
    }

    const { data: movimiento, error: movimientoError } = await supabase
      .from('producto_stock_movimiento')
      .insert({
        producto_id: productoId,
        venta_id: body?.venta_id || null,
        venta_detalle_id: body?.venta_detalle_id || null,
        tipo: resolveMovimientoTipo(operacion),
        cantidad: cantidadMovimiento,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        motivo: buildMotivo(operacion, motivo),
        creado_por: user.id ?? null,
      })
      .select(
        `
        *,
        producto:producto_id(id, nombre, stock)
      `
      )
      .single();

    if (movimientoError) {
      // Intento de rollback compensatorio básico para no dejar stock incoherente.
      await supabase
        .from('producto')
        .update({ stock: stockAnterior, actualizado_en: new Date().toISOString() })
        .eq('id', productoId);
      throw new Error(`No se pudo registrar el movimiento: ${movimientoError.message}`);
    }

    return NextResponse.json({ data: movimiento }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar movimiento de stock' },
      { status: 500 }
    );
  }
}
