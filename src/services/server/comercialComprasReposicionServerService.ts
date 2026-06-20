import { createClient } from '@supabase/supabase-js';
import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type {
  ComercialComprasReposicionDashboard,
  ComercialOrdenCompra,
  ComercialProveedorProducto,
  ComercialReposicionSugeridaItem,
  CreateOrdenCompraDTO,
  RecibirOrdenCompraDTO,
  UpsertProveedorProductoDTO,
} from '@/interfaces/comercialComprasReposicion.interface';
import { createComercialStockMovimiento } from './comercialStockLedgerServerService';

function getComercialDbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada para operar Compras/Reposición desde API server.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
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

function parseMoney(value: unknown, field: string): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`${field} debe ser un importe mayor o igual a 0`);
  }
  return Math.round(numeric * 100) / 100;
}

function normalizeDate(value: unknown) {
  const text = String(value ?? '').trim();
  return text.length ? text : new Date().toISOString().slice(0, 10);
}

function buildNumeroOrden() {
  return `GM-OC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}`;
}

function calculateMargin(price: number, cost: number) {
  const margen = Math.round((price - cost) * 100) / 100;
  const porcentaje = price > 0 ? Math.round((margen / price) * 10000) / 100 : null;
  return { margen, porcentaje };
}

function mapOrden(row: any): ComercialOrdenCompra {
  const detalles = row.detalles ?? row.comercial_orden_compra_detalle ?? [];
  return {
    ...row,
    detalles,
    comercial_orden_compra_detalle: detalles,
  };
}

async function fetchOrdenById(supabase: ReturnType<typeof getComercialDbClient>, id: string): Promise<ComercialOrdenCompra> {
  const { data, error } = await supabase
    .from('comercial_orden_compra')
    .select(
      `
      *,
      proveedor:proveedor_id(id, nombre, razon_social, estado),
      ubicacion_destino:ubicacion_destino_id(*),
      detalles:comercial_orden_compra_detalle(
        *,
        producto:producto_id(id, nombre, sku, codigo_barras, costo, precio, stock)
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return mapOrden(data);
}

async function updateOrdenTotals(supabase: ReturnType<typeof getComercialDbClient>, ordenId: string) {
  const { data: detalles, error } = await supabase
    .from('comercial_orden_compra_detalle')
    .select('cantidad_solicitada, costo_unitario')
    .eq('orden_compra_id', ordenId);
  if (error) throw new Error(error.message);

  const total = (detalles ?? []).reduce(
    (acc, item) => acc + Number(item.cantidad_solicitada ?? 0) * Number(item.costo_unitario ?? 0),
    0
  );

  const { error: updateError } = await supabase
    .from('comercial_orden_compra')
    .update({ total_estimado: Math.round(total * 100) / 100, actualizado_en: new Date().toISOString() })
    .eq('id', ordenId);
  if (updateError) throw new Error(updateError.message);
}

export async function getComercialComprasReposicionDashboard(): Promise<ComercialComprasReposicionDashboard> {
  const supabase = getComercialDbClient();

  const [proveedoresResult, productosResult, ubicacionesResult, relacionesResult, reposicionResult, ordenesResult] = await Promise.all([
    supabase.from('proveedor').select('*').order('nombre', { ascending: true }),
    supabase.from('producto').select('id, nombre, descripcion, precio, costo, stock, stock_minimo, sku, codigo_barras, proveedor_id, activo').eq('activo', true).order('nombre', { ascending: true }),
    supabase.from('comercial_ubicacion_stock').select('*').eq('activo', true).order('orden', { ascending: true }).order('nombre', { ascending: true }),
    supabase
      .from('comercial_proveedor_producto')
      .select('*, producto:producto_id(id, nombre, sku, codigo_barras, costo, precio, stock), proveedor:proveedor_id(id, nombre, razon_social, estado)')
      .eq('activo', true)
      .order('actualizado_en', { ascending: false })
      .limit(120),
    supabase.from('vw_comercial_reposicion_sugerida').select('*').order('estado_stock', { ascending: true }).order('cantidad_sugerida', { ascending: false }),
    supabase
      .from('comercial_orden_compra')
      .select(
        `
        *,
        proveedor:proveedor_id(id, nombre, razon_social, estado),
        ubicacion_destino:ubicacion_destino_id(*),
        detalles:comercial_orden_compra_detalle(
          *,
          producto:producto_id(id, nombre, sku, codigo_barras, costo, precio, stock)
        )
      `
      )
      .order('creado_en', { ascending: false })
      .limit(40),
  ]);

  if (proveedoresResult.error) throw new Error(proveedoresResult.error.message);
  if (productosResult.error) throw new Error(productosResult.error.message);
  if (ubicacionesResult.error) throw new Error(ubicacionesResult.error.message);
  if (relacionesResult.error) throw new Error(relacionesResult.error.message);
  if (reposicionResult.error) throw new Error(reposicionResult.error.message);
  if (ordenesResult.error) throw new Error(ordenesResult.error.message);

  const reposicionSugerida = (reposicionResult.data ?? []) as ComercialReposicionSugeridaItem[];
  const ordenes = (ordenesResult.data ?? []).map(mapOrden);
  const proveedores = proveedoresResult.data ?? [];

  const productosAReponer = reposicionSugerida.filter((item) => Number(item.cantidad_sugerida ?? 0) > 0);
  const ordenesAbiertas = ordenes.filter((orden) => orden.estado === 'pedida' || orden.estado === 'parcial');

  return {
    proveedores,
    productos: productosResult.data ?? [],
    ubicaciones: ubicacionesResult.data ?? [],
    relaciones: (relacionesResult.data ?? []) as ComercialProveedorProducto[],
    reposicionSugerida,
    ordenes,
    metricas: {
      productosAReponer: productosAReponer.length,
      costoReposicionSugerida: productosAReponer.reduce((acc, item) => acc + Number(item.costo_estimado_reposicion ?? 0), 0),
      ordenesAbiertas: ordenesAbiertas.length,
      ordenesParciales: ordenes.filter((orden) => orden.estado === 'parcial').length,
      proveedoresActivos: proveedores.filter((proveedor: any) => proveedor.estado !== 'inactivo' && proveedor.estado !== 'discontinuado').length,
    },
  };
}

export async function upsertComercialProveedorProducto(
  payload: UpsertProveedorProductoDTO,
  user?: JwtUser | null
): Promise<ComercialProveedorProducto> {
  const supabase = getComercialDbClient();
  const productoId = String(payload.producto_id ?? '').trim();
  const proveedorId = String(payload.proveedor_id ?? '').trim();
  if (!productoId) throw new Error('Debe seleccionar un producto');
  if (!proveedorId) throw new Error('Debe seleccionar un proveedor');

  const costoUnitario = parseMoney(payload.costo_unitario, 'El costo unitario');
  const compraMinima = payload.compra_minima == null ? 1 : parsePositiveInteger(payload.compra_minima, 'La compra mínima');
  const leadTimeDias = payload.lead_time_dias == null ? 0 : parseNonNegativeInteger(payload.lead_time_dias, 'El lead time');
  const principal = Boolean(payload.principal);

  const [{ data: producto, error: productoError }, { data: proveedor, error: proveedorError }] = await Promise.all([
    supabase.from('producto').select('id, nombre, activo').eq('id', productoId).single(),
    supabase.from('proveedor').select('id, nombre, estado').eq('id', proveedorId).single(),
  ]);

  if (productoError || !producto) throw new Error('Producto no encontrado');
  if (producto.activo === false) throw new Error('No se puede asociar proveedor a un producto inactivo');
  if (proveedorError || !proveedor) throw new Error('Proveedor no encontrado');
  if (proveedor.estado === 'inactivo' || proveedor.estado === 'discontinuado') {
    throw new Error('No se puede asociar un proveedor inactivo o discontinuado');
  }

  if (principal) {
    await supabase
      .from('comercial_proveedor_producto')
      .update({ principal: false, actualizado_en: new Date().toISOString() })
      .eq('producto_id', productoId);
  }

  const { data, error } = await supabase
    .from('comercial_proveedor_producto')
    .upsert(
      {
        producto_id: productoId,
        proveedor_id: proveedorId,
        sku_proveedor: String(payload.sku_proveedor ?? '').trim() || null,
        costo_unitario: costoUnitario,
        moneda: 'ARS',
        compra_minima: compraMinima,
        lead_time_dias: leadTimeDias,
        principal,
        activo: true,
        notas: String(payload.notas ?? '').trim() || null,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'producto_id,proveedor_id' }
    )
    .select('*, producto:producto_id(id, nombre, sku, codigo_barras, costo, precio, stock), proveedor:proveedor_id(id, nombre, razon_social, estado)')
    .single();

  if (error) throw new Error(error.message);

  if (principal) {
    const { error: productoUpdateError } = await supabase
      .from('producto')
      .update({ proveedor_id: proveedorId, costo: costoUnitario, actualizado_en: new Date().toISOString() })
      .eq('id', productoId);
    if (productoUpdateError) throw new Error(productoUpdateError.message);
  }

  return data as ComercialProveedorProducto;
}

export async function createComercialOrdenCompra(
  payload: CreateOrdenCompraDTO,
  user?: JwtUser | null
): Promise<ComercialOrdenCompra> {
  const supabase = getComercialDbClient();
  const proveedorId = String(payload.proveedor_id ?? '').trim();
  if (!proveedorId) throw new Error('Debe seleccionar un proveedor');

  const detallesInput = Array.isArray(payload.detalles) ? payload.detalles : [];
  if (!detallesInput.length) throw new Error('La orden debe tener al menos un producto');

  const { data: proveedor, error: proveedorError } = await supabase
    .from('proveedor')
    .select('id, nombre, estado')
    .eq('id', proveedorId)
    .single();
  if (proveedorError || !proveedor) throw new Error('Proveedor no encontrado');
  if (proveedor.estado === 'inactivo' || proveedor.estado === 'discontinuado') {
    throw new Error('No se puede crear una orden para proveedor inactivo o discontinuado');
  }

  const normalized = detallesInput.map((detalle, index) => {
    const productoId = String(detalle.producto_id ?? '').trim();
    if (!productoId) throw new Error(`Debe seleccionar producto en el ítem ${index + 1}`);
    const cantidadSolicitada = parsePositiveInteger(detalle.cantidad_solicitada, `Cantidad solicitada del ítem ${index + 1}`);
    const costoUnitario = parseMoney(detalle.costo_unitario, `Costo unitario del ítem ${index + 1}`);
    return {
      producto_id: productoId,
      cantidad_solicitada: cantidadSolicitada,
      costo_unitario: costoUnitario,
      subtotal_estimado: Math.round(cantidadSolicitada * costoUnitario * 100) / 100,
    };
  });

  const productoIds = Array.from(new Set(normalized.map((detalle) => detalle.producto_id)));
  const { data: productos, error: productosError } = await supabase
    .from('producto')
    .select('id, nombre, activo')
    .in('id', productoIds);
  if (productosError) throw new Error(productosError.message);
  const productoMap = new Map((productos ?? []).map((producto) => [producto.id, producto]));
  for (const detalle of normalized) {
    const producto = productoMap.get(detalle.producto_id);
    if (!producto) throw new Error('Uno de los productos seleccionados no existe');
    if (producto.activo === false) throw new Error(`El producto ${producto.nombre} está inactivo`);
  }

  const totalEstimado = normalized.reduce((acc, detalle) => acc + detalle.subtotal_estimado, 0);
  const { data: orden, error: ordenError } = await supabase
    .from('comercial_orden_compra')
    .insert({
      proveedor_id: proveedorId,
      numero_orden: buildNumeroOrden(),
      estado: 'pedida',
      fecha_orden: normalizeDate(payload.fecha_orden),
      fecha_estimada_recepcion: String(payload.fecha_estimada_recepcion ?? '').trim() || null,
      ubicacion_destino_id: payload.ubicacion_destino_id || null,
      observaciones: String(payload.observaciones ?? '').trim() || null,
      total_estimado: Math.round(totalEstimado * 100) / 100,
      creado_por: user?.id ?? null,
    })
    .select('*')
    .single();

  if (ordenError || !orden) throw new Error(ordenError?.message || 'No se pudo crear la orden de compra');

  try {
    const { error: detallesError } = await supabase
      .from('comercial_orden_compra_detalle')
      .insert(normalized.map((detalle) => ({ ...detalle, orden_compra_id: orden.id })));
    if (detallesError) throw new Error(detallesError.message);

    for (const detalle of normalized) {
      await supabase.from('comercial_proveedor_producto').upsert(
        {
          producto_id: detalle.producto_id,
          proveedor_id: proveedorId,
          costo_unitario: detalle.costo_unitario,
          moneda: 'ARS',
          compra_minima: 1,
          activo: true,
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: 'producto_id,proveedor_id' }
      );
    }
  } catch (error) {
    await supabase.from('comercial_orden_compra').delete().eq('id', orden.id);
    throw error;
  }

  return fetchOrdenById(supabase, orden.id);
}

export async function recibirComercialOrdenCompra(
  payload: RecibirOrdenCompraDTO,
  user?: JwtUser | null
): Promise<ComercialOrdenCompra> {
  const supabase = getComercialDbClient();
  const ordenId = String(payload.orden_compra_id ?? '').trim();
  if (!ordenId) throw new Error('Debe seleccionar una orden de compra');

  const orden = await fetchOrdenById(supabase, ordenId);
  if (orden.estado === 'recibida' || orden.estado === 'anulada') {
    throw new Error('La orden no admite recepción en su estado actual');
  }

  const ubicacionDestinoId = payload.ubicacion_destino_id || orden.ubicacion_destino_id;
  if (!ubicacionDestinoId) throw new Error('Debe seleccionar una ubicación destino para recibir stock');

  const detallesPayload = Array.isArray(payload.detalles) ? payload.detalles : [];
  if (!detallesPayload.length) throw new Error('Debe indicar al menos un producto a recibir');

  const detallesById = new Map((orden.detalles ?? []).map((detalle) => [detalle.id, detalle]));
  let huboRecepcion = false;

  for (const recibido of detallesPayload) {
    const detalleId = String(recibido.detalle_id ?? '').trim();
    const cantidadRecibir = parseNonNegativeInteger(recibido.cantidad_recibir, 'La cantidad a recibir');
    if (cantidadRecibir <= 0) continue;

    const detalle = detallesById.get(detalleId);
    if (!detalle) throw new Error('Uno de los detalles no pertenece a la orden seleccionada');

    const pendiente = Number(detalle.cantidad_solicitada ?? 0) - Number(detalle.cantidad_recibida ?? 0);
    if (cantidadRecibir > pendiente) {
      throw new Error(`No se puede recibir más de lo pendiente para ${detalle.producto?.nombre ?? 'producto'}`);
    }

    const { data: producto, error: productoError } = await supabase
      .from('producto')
      .select('id, nombre, costo, precio, proveedor_id')
      .eq('id', detalle.producto_id)
      .single();
    if (productoError || !producto) throw new Error('Producto no encontrado al recibir orden');

    await createComercialStockMovimiento(
      {
        producto_id: detalle.producto_id,
        tipo: 'compra',
        cantidad: cantidadRecibir,
        ubicacion_destino_id: ubicacionDestinoId,
        costo_unitario: detalle.costo_unitario,
        precio_unitario: producto.precio ?? null,
        motivo: `Recepción orden de compra ${orden.numero_orden}`,
        referencia_tipo: 'comercial_orden_compra',
        referencia_id: orden.id,
      },
      user?.id ?? null
    );

    const costoAnterior = asNumber(producto.costo, 0);
    const costoNuevo = asNumber(detalle.costo_unitario, 0);
    const precioActual = asNumber(producto.precio, 0);
    const { error: productoUpdateError } = await supabase
      .from('producto')
      .update({
        costo: costoNuevo,
        proveedor_id: orden.proveedor_id,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', producto.id);
    if (productoUpdateError) throw new Error(productoUpdateError.message);

    if (costoAnterior !== costoNuevo) {
      const margenAnterior = calculateMargin(precioActual, costoAnterior);
      const margenNuevo = calculateMargin(precioActual, costoNuevo);
      const { error: historialError } = await supabase.from('producto_precio_costo_historial').insert({
        producto_id: producto.id,
        precio_anterior: precioActual,
        precio_nuevo: precioActual,
        costo_anterior: costoAnterior,
        costo_nuevo: costoNuevo,
        moneda: 'ARS',
        margen_anterior: margenAnterior.margen,
        margen_nuevo: margenNuevo.margen,
        margen_porcentaje_nuevo: margenNuevo.porcentaje,
        motivo: `Actualización de costo por recepción de orden ${orden.numero_orden}`,
        fecha_vigencia: new Date().toISOString().slice(0, 10),
        usuario_responsable: user?.id ?? null,
        origen: 'manual',
      });
      if (historialError) throw new Error(historialError.message);
    }

    const { error: detalleUpdateError } = await supabase
      .from('comercial_orden_compra_detalle')
      .update({
        cantidad_recibida: Number(detalle.cantidad_recibida ?? 0) + cantidadRecibir,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', detalle.id);
    if (detalleUpdateError) throw new Error(detalleUpdateError.message);

    await supabase.from('comercial_proveedor_producto').upsert(
      {
        producto_id: detalle.producto_id,
        proveedor_id: orden.proveedor_id,
        costo_unitario: costoNuevo,
        moneda: 'ARS',
        activo: true,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'producto_id,proveedor_id' }
    );

    huboRecepcion = true;
  }

  if (!huboRecepcion) throw new Error('Debe recibir al menos una unidad');

  const { data: detallesActualizados, error: detallesError } = await supabase
    .from('comercial_orden_compra_detalle')
    .select('cantidad_solicitada, cantidad_recibida')
    .eq('orden_compra_id', orden.id);
  if (detallesError) throw new Error(detallesError.message);

  const allReceived = (detallesActualizados ?? []).every(
    (detalle) => Number(detalle.cantidad_recibida ?? 0) >= Number(detalle.cantidad_solicitada ?? 0)
  );
  const anyReceived = (detallesActualizados ?? []).some((detalle) => Number(detalle.cantidad_recibida ?? 0) > 0);
  const nextEstado = allReceived ? 'recibida' : anyReceived ? 'parcial' : 'pedida';

  await updateOrdenTotals(supabase, orden.id);

  const { error: ordenUpdateError } = await supabase
    .from('comercial_orden_compra')
    .update({
      estado: nextEstado,
      ubicacion_destino_id: ubicacionDestinoId,
      recibido_por: user?.id ?? null,
      recibido_en: allReceived ? new Date().toISOString() : orden.recibido_en ?? null,
      observaciones: String(payload.observaciones ?? '').trim() || orden.observaciones || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', orden.id);
  if (ordenUpdateError) throw new Error(ordenUpdateError.message);

  return fetchOrdenById(supabase, orden.id);
}
