import { createClient } from '@supabase/supabase-js';
import type {
  ComercialPosDashboard,
  ComercialPosProducto,
  ComercialPosStockUbicacion,
  ComercialPosUbicacion,
  ComercialPosVentaResumen,
  CreateComercialPosVentaDTO,
  CreateComercialPosVentaItemDTO,
} from '@/interfaces/comercialPos.interface';
import type { JwtUser } from '@/interfaces/jwtUser.interface';

function getComercialDbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada para operar POS/Kiosco desde API server.');
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

function parsePositiveInteger(value: unknown, label: string) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`${label} debe ser un número entero mayor a 0`);
  }
  return numeric;
}

function parseMoney(value: unknown, label: string) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`${label} debe ser un importe mayor o igual a 0`);
  }
  return Math.round(numeric * 100) / 100;
}

function normalizeClienteTipo(value: unknown) {
  if (value === 'socio' || value === 'visitante') return value;
  return 'consumidor_final';
}

function normalizeMetodoPago(value: unknown) {
  const allowed = ['efectivo', 'transferencia', 'debito', 'credito', 'mercado_pago', 'stripe', 'otro'];
  return allowed.includes(String(value)) ? String(value) : 'efectivo';
}

function buildComprobanteCodigo() {
  return `GM-POS-${Date.now().toString(36).toUpperCase()}`;
}

async function getDefaultLocation(supabase: ReturnType<typeof getComercialDbClient>, requestedId?: string | null) {
  if (requestedId) {
    const { data, error } = await supabase
      .from('comercial_ubicacion_stock')
      .select('*')
      .eq('id', requestedId)
      .eq('activo', true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (data) return data as ComercialPosUbicacion;
    throw new Error('La ubicación de stock seleccionada no está activa o no existe');
  }

  const { data: kiosco, error: kioscoError } = await supabase
    .from('comercial_ubicacion_stock')
    .select('*')
    .eq('codigo', 'kiosco')
    .eq('activo', true)
    .maybeSingle();

  if (kioscoError) throw new Error(kioscoError.message);
  if (kiosco) return kiosco as ComercialPosUbicacion;

  const { data, error } = await supabase
    .from('comercial_ubicacion_stock')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No hay ubicaciones de stock activas para operar POS/Kiosco');
  return data as ComercialPosUbicacion;
}

async function getProductTotalStock(supabase: ReturnType<typeof getComercialDbClient>, productoId: string) {
  const { data, error } = await supabase
    .from('comercial_producto_stock_ubicacion')
    .select('cantidad')
    .eq('producto_id', productoId);

  if (error) throw new Error(error.message);
  return (data ?? []).reduce((total, row) => total + Number(row.cantidad ?? 0), 0);
}

async function getLocationStockRow(
  supabase: ReturnType<typeof getComercialDbClient>,
  productoId: string,
  ubicacionId: string
) {
  const { data, error } = await supabase
    .from('comercial_producto_stock_ubicacion')
    .select('*')
    .eq('producto_id', productoId)
    .eq('ubicacion_id', ubicacionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

function mapVenta(venta: any): ComercialPosVentaResumen {
  const detalles = venta.venta_detalle ?? venta.detalles ?? [];
  return {
    id: venta.id,
    cliente_tipo: venta.cliente_tipo ?? 'consumidor_final',
    cliente_nombre: venta.cliente_nombre ?? null,
    cliente_documento: venta.cliente_documento ?? null,
    metodo_pago: venta.metodo_pago ?? 'efectivo',
    total: asNumber(venta.total, 0),
    fecha: venta.fecha,
    comprobante_codigo: venta.comprobante_codigo ?? null,
    estado: venta.estado ?? 'pagada',
    creado_en: venta.creado_en ?? null,
    venta_detalle: detalles,
    detalles,
  };
}

export async function getComercialKioscoPosDashboard(): Promise<ComercialPosDashboard> {
  const supabase = getComercialDbClient();
  const today = new Date().toISOString().slice(0, 10);

  const [productosResult, stockResult, ubicacionesResult, ventasResult] = await Promise.all([
    supabase
      .from('vw_comercial_stock_resumen')
      .select('*')
      .order('producto_nombre', { ascending: true }),
    supabase
      .from('comercial_producto_stock_ubicacion')
      .select('*, ubicacion:ubicacion_id(*)'),
    supabase
      .from('comercial_ubicacion_stock')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('venta')
      .select(
        `
        *,
        detalles:venta_detalle!venta_detalle_venta_id_fkey(
          id,
          item_tipo,
          producto_id,
          servicio_id,
          cantidad,
          precio_unitario,
          descuento,
          subtotal,
          total_linea,
          producto:producto_id(id, nombre)
        )
      `
      )
      .eq('activo', true)
      .eq('estado', 'pagada')
      .order('creado_en', { ascending: false })
      .limit(30),
  ]);

  if (productosResult.error) throw new Error(productosResult.error.message);
  if (stockResult.error) throw new Error(stockResult.error.message);
  if (ubicacionesResult.error) throw new Error(ubicacionesResult.error.message);
  if (ventasResult.error) throw new Error(ventasResult.error.message);

  const productos = (productosResult.data ?? []) as ComercialPosProducto[];
  const stockPorUbicacion = (stockResult.data ?? []) as ComercialPosStockUbicacion[];
  const ubicaciones = (ubicacionesResult.data ?? []) as ComercialPosUbicacion[];
  const ventasRecientes = (ventasResult.data ?? []).map(mapVenta);
  const ubicacionDefault = ubicaciones.find((ubicacion) => ubicacion.codigo === 'kiosco') ?? ubicaciones[0] ?? null;

  const ventasHoy = ventasRecientes.filter((venta) => String(venta.fecha).slice(0, 10) === today);
  const itemsHoy = ventasHoy.reduce(
    (total, venta) => total + (venta.venta_detalle ?? []).reduce((sub, item) => sub + Number(item.cantidad ?? 0), 0),
    0
  );

  return {
    productos,
    stockPorUbicacion,
    ubicaciones,
    ventasRecientes,
    ubicacionDefaultId: ubicacionDefault?.id ?? null,
    metricas: {
      ventasHoy: ventasHoy.length,
      totalHoy: ventasHoy.reduce((total, venta) => total + Number(venta.total ?? 0), 0),
      itemsHoy,
      productosDisponibles: productos.filter((producto) => Number(producto.stock_total ?? 0) > 0).length,
      productosCriticos: productos.filter((producto) => producto.estado_stock === 'critico' || producto.estado_stock === 'bajo_minimo' || producto.estado_stock === 'sin_stock').length,
    },
  };
}

export async function createComercialKioscoPosVenta(
  payload: CreateComercialPosVentaDTO,
  user?: JwtUser | null
): Promise<ComercialPosVentaResumen> {
  const supabase = getComercialDbClient();
  const clienteTipo = normalizeClienteTipo(payload.cliente_tipo);
  const metodoPago = normalizeMetodoPago(payload.metodo_pago);
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!items.length) throw new Error('La venta debe tener al menos un producto');
  if (clienteTipo === 'socio') throw new Error('La venta POS v1 opera consumidor final o visitante. La venta a socio queda para la etapa de POS avanzado.');

  const ubicacion = await getDefaultLocation(supabase, payload.ubicacion_stock_id ?? null);
  const productoIds = Array.from(new Set(items.map((item) => String(item.producto_id ?? '').trim()).filter(Boolean)));
  if (!productoIds.length) throw new Error('Debe seleccionar productos válidos');

  const { data: productosData, error: productosError } = await supabase
    .from('producto')
    .select('id, nombre, precio, costo, activo')
    .in('id', productoIds);

  if (productosError) throw new Error(productosError.message);

  const productosById = new Map((productosData ?? []).map((producto: any) => [producto.id, producto]));
  const normalizedItems: Array<CreateComercialPosVentaItemDTO & { precio_final: number; total_linea: number; producto_nombre: string; costo: number }> = [];

  for (const item of items) {
    const productoId = String(item.producto_id ?? '').trim();
    const producto = productosById.get(productoId);
    if (!producto || producto.activo === false) throw new Error('Uno de los productos no existe o está inactivo');

    const cantidad = parsePositiveInteger(item.cantidad, `Cantidad de ${producto.nombre}`);
    const precio = parseMoney(item.precio_unitario ?? producto.precio, `Precio de ${producto.nombre}`);
    const descuento = parseMoney(item.descuento ?? 0, `Descuento de ${producto.nombre}`);
    const subtotal = cantidad * precio;
    if (descuento > subtotal) throw new Error(`El descuento no puede superar el subtotal de ${producto.nombre}`);

    const stockRow = await getLocationStockRow(supabase, productoId, ubicacion.id);
    const stockUbicacion = Number(stockRow?.cantidad ?? 0);
    if (!stockRow || stockUbicacion < cantidad) {
      throw new Error(`Stock insuficiente para ${producto.nombre} en ${ubicacion.nombre}. Disponible: ${stockUbicacion}`);
    }

    normalizedItems.push({
      ...item,
      producto_id: productoId,
      cantidad,
      precio_unitario: precio,
      descuento,
      precio_final: precio,
      total_linea: subtotal - descuento,
      producto_nombre: producto.nombre,
      costo: asNumber(producto.costo, 0),
    });
  }

  const total = normalizedItems.reduce((sum, item) => sum + item.total_linea, 0);
  const comprobanteCodigo = buildComprobanteCodigo();

  const { data: venta, error: ventaError } = await supabase
    .from('venta')
    .insert({
      socio_id: null,
      cliente_tipo: clienteTipo,
      cliente_nombre: payload.cliente_nombre?.trim() || (clienteTipo === 'visitante' ? 'Visitante' : 'Consumidor Final'),
      cliente_documento: payload.cliente_documento?.trim() || null,
      metodo_pago: metodoPago,
      observaciones: payload.observaciones?.trim() || `Venta POS/Kiosco desde ${ubicacion.nombre}`,
      fecha: new Date().toISOString().slice(0, 10),
      total,
      estado: 'pagada',
      activo: true,
      comprobante_codigo: comprobanteCodigo,
      registrado_por: user?.id ?? null,
    })
    .select('*')
    .single();

  if (ventaError) throw new Error(ventaError.message);

  const detallesCreados: any[] = [];

  for (const item of normalizedItems) {
    const { data: detalle, error: detalleError } = await supabase
      .from('venta_detalle')
      .insert({
        venta_id: venta.id,
        item_tipo: 'producto',
        producto_id: item.producto_id,
        servicio_id: null,
        cantidad: item.cantidad,
        precio_unitario: item.precio_final,
        descuento: item.descuento ?? 0,
      })
      .select('*, producto:producto_id(id, nombre)')
      .single();

    if (detalleError) throw new Error(detalleError.message);
    detallesCreados.push(detalle);

    const stockRow = await getLocationStockRow(supabase, item.producto_id, ubicacion.id);
    if (!stockRow) throw new Error(`No se encontró stock de ${item.producto_nombre} en ${ubicacion.nombre}`);

    const stockAnteriorTotal = await getProductTotalStock(supabase, item.producto_id);
    const stockUbicacionAnterior = Number(stockRow.cantidad ?? 0);
    const stockUbicacionNuevo = stockUbicacionAnterior - item.cantidad;

    if (stockUbicacionNuevo < 0) {
      throw new Error(`Stock insuficiente para ${item.producto_nombre} al confirmar venta`);
    }

    const { error: stockUpdateError } = await supabase
      .from('comercial_producto_stock_ubicacion')
      .update({ cantidad: stockUbicacionNuevo, actualizado_en: new Date().toISOString() })
      .eq('id', stockRow.id);

    if (stockUpdateError) throw new Error(stockUpdateError.message);

    const stockNuevoTotal = await getProductTotalStock(supabase, item.producto_id);

    const { error: productoUpdateError } = await supabase
      .from('producto')
      .update({ stock: stockNuevoTotal, actualizado_en: new Date().toISOString() })
      .eq('id', item.producto_id);

    if (productoUpdateError) throw new Error(productoUpdateError.message);

    await supabase.from('comercial_stock_movimiento').insert({
      producto_id: item.producto_id,
      tipo: 'venta',
      cantidad: item.cantidad,
      ubicacion_origen_id: ubicacion.id,
      ubicacion_destino_id: null,
      stock_anterior_total: stockAnteriorTotal,
      stock_nuevo_total: stockNuevoTotal,
      costo_unitario: item.costo,
      precio_unitario: item.precio_final,
      motivo: `Venta POS/Kiosco ${comprobanteCodigo}`,
      referencia_tipo: 'venta',
      referencia_id: venta.id,
      creado_por: user?.id ?? null,
    });

    await supabase.from('producto_stock_movimiento').insert({
      producto_id: item.producto_id,
      venta_id: venta.id,
      venta_detalle_id: detalle.id,
      tipo: 'venta',
      cantidad: item.cantidad,
      stock_anterior: stockAnteriorTotal,
      stock_nuevo: stockNuevoTotal,
      motivo: `Venta POS/Kiosco ${comprobanteCodigo}`,
      creado_por: user?.id ?? null,
    });
  }

  if (detallesCreados[0]?.id) {
    await supabase
      .from('venta')
      .update({ id_venta_detalle: detallesCreados[0].id })
      .eq('id', venta.id);
  }

  return mapVenta({ ...venta, venta_detalle: detallesCreados });
}
