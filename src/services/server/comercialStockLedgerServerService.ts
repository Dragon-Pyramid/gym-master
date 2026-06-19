import { createClient } from '@supabase/supabase-js';
import type {
  ComercialProductoStockUbicacion,
  ComercialStockLedgerDashboard,
  ComercialStockMovimiento,
  ComercialStockMovimientoTipo,
  ComercialStockResumenItem,
  ComercialUbicacionStock,
  CreateComercialStockMovimientoDTO,
} from '@/interfaces/comercialStockLedger.interface';

function getComercialDbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada para operar Comercial desde API server.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

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

function resolveStockStatus(stockTotal: number, stockMinimo: number): ComercialStockResumenItem['estado_stock'] {
  if (stockTotal <= 0) return 'sin_stock';
  if (stockTotal <= Math.max(1, Math.floor(stockMinimo / 2))) return 'critico';
  if (stockTotal <= stockMinimo) return 'bajo_minimo';
  return 'ok';
}

function movementRequiresOrigin(tipo: ComercialStockMovimientoTipo) {
  return ['venta', 'ajuste_salida', 'transferencia', 'merma', 'vencimiento', 'uso_interno'].includes(tipo);
}

function movementRequiresDestination(tipo: ComercialStockMovimientoTipo) {
  return ['compra', 'ajuste_entrada', 'transferencia', 'devolucion', 'conteo_fisico'].includes(tipo);
}

function isIncomingMovement(tipo: ComercialStockMovimientoTipo) {
  return ['compra', 'ajuste_entrada', 'devolucion'].includes(tipo);
}

function isOutgoingMovement(tipo: ComercialStockMovimientoTipo) {
  return ['venta', 'ajuste_salida', 'merma', 'vencimiento', 'uso_interno'].includes(tipo);
}

async function getLocationStock(supabase: ReturnType<typeof getComercialDbClient>, productoId: string, ubicacionId: string) {
  const { data, error } = await supabase
    .from('comercial_producto_stock_ubicacion')
    .select('*')
    .eq('producto_id', productoId)
    .eq('ubicacion_id', ubicacionId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (data) return data;

  const { data: created, error: createError } = await supabase
    .from('comercial_producto_stock_ubicacion')
    .insert({ producto_id: productoId, ubicacion_id: ubicacionId, cantidad: 0 })
    .select('*')
    .single();

  if (createError) throw new Error(createError.message);
  return created;
}

async function getProductTotalStock(supabase: ReturnType<typeof getComercialDbClient>, productoId: string) {
  const { data, error } = await supabase
    .from('comercial_producto_stock_ubicacion')
    .select('cantidad')
    .eq('producto_id', productoId);

  if (error) throw new Error(error.message);
  return (data ?? []).reduce((total, row) => total + Number(row.cantidad ?? 0), 0);
}

export async function getComercialStockLedgerDashboard(): Promise<ComercialStockLedgerDashboard> {
  const supabase = getComercialDbClient();

  const [ubicacionesResult, stockResult, movimientosResult, productosResult] = await Promise.all([
    supabase
      .from('comercial_ubicacion_stock')
      .select('*')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('comercial_producto_stock_ubicacion')
      .select(
        `
        *,
        producto:producto_id(id, nombre, sku, codigo_barras, precio, costo, stock, activo),
        ubicacion:ubicacion_id(*)
      `
      )
      .order('actualizado_en', { ascending: false }),
    supabase
      .from('comercial_stock_movimiento')
      .select(
        `
        *,
        producto:producto_id(id, nombre, sku, codigo_barras),
        ubicacion_origen:ubicacion_origen_id(*),
        ubicacion_destino:ubicacion_destino_id(*)
      `
      )
      .order('creado_en', { ascending: false })
      .limit(80),
    supabase
      .from('producto')
      .select('id, nombre, precio, costo, stock, stock_minimo, sku, codigo_barras, activo')
      .eq('activo', true)
      .order('nombre', { ascending: true }),
  ]);

  if (ubicacionesResult.error) throw new Error(ubicacionesResult.error.message);
  if (stockResult.error) throw new Error(stockResult.error.message);
  if (movimientosResult.error) throw new Error(movimientosResult.error.message);
  if (productosResult.error) throw new Error(productosResult.error.message);

  const ubicaciones = (ubicacionesResult.data ?? []) as ComercialUbicacionStock[];
  const stockPorUbicacion = (stockResult.data ?? []) as ComercialProductoStockUbicacion[];
  const movimientos = (movimientosResult.data ?? []) as ComercialStockMovimiento[];
  const productos = productosResult.data ?? [];

  const stockByProduct = new Map<string, ComercialProductoStockUbicacion[]>();
  for (const item of stockPorUbicacion) {
    const list = stockByProduct.get(item.producto_id) ?? [];
    list.push(item);
    stockByProduct.set(item.producto_id, list);
  }

  const resumen: ComercialStockResumenItem[] = productos.map((producto: any) => {
    const locations = stockByProduct.get(producto.id) ?? [];
    const stockTotal = locations.reduce((total, row) => total + Number(row.cantidad ?? 0), 0);
    const stockMinimo = Math.max(...locations.map((row) => Number(row.stock_minimo ?? 0)), Number(producto.stock_minimo ?? 0), 0);
    const stockObjetivo = Math.max(...locations.map((row) => Number(row.stock_objetivo ?? 0)), stockMinimo, 0);
    const costo = asNumber(producto.costo, 0);
    const precio = asNumber(producto.precio, 0);

    return {
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      sku: producto.sku,
      codigo_barras: producto.codigo_barras,
      precio,
      costo,
      stock_total: stockTotal,
      stock_minimo: stockMinimo,
      stock_objetivo: stockObjetivo,
      ubicaciones_count: locations.filter((row) => Number(row.cantidad ?? 0) > 0).length,
      valor_inventario: stockTotal * costo,
      margen_unitario: precio - costo,
      estado_stock: resolveStockStatus(stockTotal, stockMinimo),
    };
  });

  const metricas = {
    productos: resumen.length,
    productosSinStock: resumen.filter((item) => item.estado_stock === 'sin_stock').length,
    productosCriticos: resumen.filter((item) => item.estado_stock === 'critico' || item.estado_stock === 'bajo_minimo').length,
    stockTotal: resumen.reduce((total, item) => total + item.stock_total, 0),
    valorInventario: resumen.reduce((total, item) => total + item.valor_inventario, 0),
    movimientos: movimientos.length,
    ubicacionesActivas: ubicaciones.filter((ubicacion) => ubicacion.activo !== false).length,
  };

  return {
    ubicaciones,
    stockPorUbicacion,
    movimientos,
    resumen,
    metricas,
  };
}

export async function createComercialStockMovimiento(
  payload: CreateComercialStockMovimientoDTO,
  userId?: string | null
): Promise<ComercialStockMovimiento> {
  const supabase = getComercialDbClient();
  const productoId = String(payload.producto_id ?? '').trim();
  const tipo = payload.tipo;
  const motivo = String(payload.motivo ?? '').trim();

  if (!productoId) throw new Error('Debe seleccionar un producto');
  if (!tipo) throw new Error('Debe seleccionar un tipo de movimiento');
  if (motivo.length < 5) throw new Error('Debe indicar un motivo claro de al menos 5 caracteres');

  const ubicacionOrigenId = payload.ubicacion_origen_id || null;
  const ubicacionDestinoId = payload.ubicacion_destino_id || null;

  if (movementRequiresOrigin(tipo) && !ubicacionOrigenId) {
    throw new Error('El movimiento requiere ubicación de origen');
  }

  if (movementRequiresDestination(tipo) && !ubicacionDestinoId) {
    throw new Error('El movimiento requiere ubicación de destino');
  }

  if (tipo === 'transferencia' && ubicacionOrigenId === ubicacionDestinoId) {
    throw new Error('La ubicación de origen y destino deben ser distintas');
  }

  const { data: producto, error: productoError } = await supabase
    .from('producto')
    .select('id, nombre, stock, costo, precio, activo')
    .eq('id', productoId)
    .single();

  if (productoError || !producto) throw new Error('Producto no encontrado');
  if (producto.activo === false) throw new Error('No se puede operar stock de un producto inactivo');

  const stockAnteriorTotal = await getProductTotalStock(supabase, productoId);
  let cantidadMovimiento = tipo === 'conteo_fisico'
    ? 0
    : parsePositiveInteger(payload.cantidad, 'La cantidad');

  if (isIncomingMovement(tipo)) {
    const target = await getLocationStock(supabase, productoId, ubicacionDestinoId!);
    const newQty = Number(target.cantidad ?? 0) + cantidadMovimiento;
    const { error } = await supabase
      .from('comercial_producto_stock_ubicacion')
      .update({ cantidad: newQty, actualizado_en: new Date().toISOString() })
      .eq('id', target.id);
    if (error) throw new Error(error.message);
  }

  if (isOutgoingMovement(tipo)) {
    const source = await getLocationStock(supabase, productoId, ubicacionOrigenId!);
    const currentQty = Number(source.cantidad ?? 0);
    if (currentQty < cantidadMovimiento) {
      throw new Error(`La ubicación de origen no tiene stock suficiente. Stock actual: ${currentQty}`);
    }
    const { error } = await supabase
      .from('comercial_producto_stock_ubicacion')
      .update({ cantidad: currentQty - cantidadMovimiento, actualizado_en: new Date().toISOString() })
      .eq('id', source.id);
    if (error) throw new Error(error.message);
  }

  if (tipo === 'transferencia') {
    const source = await getLocationStock(supabase, productoId, ubicacionOrigenId!);
    const target = await getLocationStock(supabase, productoId, ubicacionDestinoId!);
    const sourceQty = Number(source.cantidad ?? 0);
    if (sourceQty < cantidadMovimiento) {
      throw new Error(`La ubicación de origen no tiene stock suficiente. Stock actual: ${sourceQty}`);
    }

    const { error: sourceError } = await supabase
      .from('comercial_producto_stock_ubicacion')
      .update({ cantidad: sourceQty - cantidadMovimiento, actualizado_en: new Date().toISOString() })
      .eq('id', source.id);
    if (sourceError) throw new Error(sourceError.message);

    const { error: targetError } = await supabase
      .from('comercial_producto_stock_ubicacion')
      .update({ cantidad: Number(target.cantidad ?? 0) + cantidadMovimiento, actualizado_en: new Date().toISOString() })
      .eq('id', target.id);
    if (targetError) throw new Error(targetError.message);
  }

  if (tipo === 'conteo_fisico') {
    const stockReal = parseNonNegativeInteger(payload.stock_real, 'El stock real');
    const target = await getLocationStock(supabase, productoId, ubicacionDestinoId!);
    const currentQty = Number(target.cantidad ?? 0);
    cantidadMovimiento = Math.abs(stockReal - currentQty);
    if (cantidadMovimiento === 0) {
      throw new Error('El conteo físico no modifica la cantidad de la ubicación');
    }
    const { error } = await supabase
      .from('comercial_producto_stock_ubicacion')
      .update({ cantidad: stockReal, actualizado_en: new Date().toISOString() })
      .eq('id', target.id);
    if (error) throw new Error(error.message);
  }

  const stockNuevoTotal = await getProductTotalStock(supabase, productoId);

  const { error: productoStockError } = await supabase
    .from('producto')
    .update({ stock: stockNuevoTotal, actualizado_en: new Date().toISOString() })
    .eq('id', productoId);

  if (productoStockError) throw new Error(productoStockError.message);

  const { data: movimiento, error: movimientoError } = await supabase
    .from('comercial_stock_movimiento')
    .insert({
      producto_id: productoId,
      tipo,
      cantidad: cantidadMovimiento,
      ubicacion_origen_id: ubicacionOrigenId,
      ubicacion_destino_id: ubicacionDestinoId,
      stock_anterior_total: stockAnteriorTotal,
      stock_nuevo_total: stockNuevoTotal,
      costo_unitario: payload.costo_unitario ?? producto.costo ?? null,
      precio_unitario: payload.precio_unitario ?? producto.precio ?? null,
      motivo,
      referencia_tipo: payload.referencia_tipo || null,
      referencia_id: payload.referencia_id || null,
      creado_por: userId || null,
    })
    .select(
      `
      *,
      producto:producto_id(id, nombre, sku, codigo_barras),
      ubicacion_origen:ubicacion_origen_id(*),
      ubicacion_destino:ubicacion_destino_id(*)
    `
    )
    .single();

  if (movimientoError) throw new Error(movimientoError.message);
  return movimiento as ComercialStockMovimiento;
}
