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
import type { ComercialCupon, ComercialPack, ComercialPromocion } from '@/interfaces/comercialServiciosPromociones.interface';
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

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
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
  return roundMoney(numeric);
}

function normalizeClienteTipo(value: unknown) {
  if (value === 'socio' || value === 'visitante') return value;
  return 'consumidor_final';
}

function normalizeMetodoPago(value: unknown) {
  const allowed = ['efectivo', 'transferencia', 'debito', 'credito', 'mercado_pago', 'stripe', 'otro'];
  return allowed.includes(String(value)) ? String(value) : 'efectivo';
}

function normalizeItemTipo(value: unknown): 'producto' | 'servicio' | 'pack' {
  if (value === 'servicio') return 'servicio';
  if (value === 'pack') return 'pack';
  return 'producto';
}

function buildComprobanteCodigo() {
  return `GM-POS-${Date.now().toString(36).toUpperCase()}`;
}

function isDateActive(start?: string | null, end?: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  if (start && String(start).slice(0, 10) > today) return false;
  if (end && String(end).slice(0, 10) < today) return false;
  return true;
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

async function getOpenCashSessionId(supabase: ReturnType<typeof getComercialDbClient>) {
  const { data, error } = await supabase
    .from('comercial_caja_sesion')
    .select('id')
    .eq('estado', 'abierta')
    .order('fecha_apertura', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data?.id ?? null;
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
    observaciones: venta.observaciones ?? null,
    venta_detalle: detalles,
    detalles,
  };
}

function mapPack(row: any): ComercialPack {
  const items = row.items ?? row.comercial_pack_item ?? [];
  return { ...row, items, comercial_pack_item: items };
}

export async function getComercialKioscoPosDashboard(): Promise<ComercialPosDashboard> {
  const supabase = getComercialDbClient();
  const today = new Date().toISOString().slice(0, 10);

  const [productosResult, stockResult, ubicacionesResult, ventasResult, packsResult, promocionesResult, cuponesResult] = await Promise.all([
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
          producto:producto_id(id, nombre),
          servicio:servicio_id(id, nombre)
        )
      `
      )
      .eq('activo', true)
      .eq('estado', 'pagada')
      .order('creado_en', { ascending: false })
      .limit(30),
    supabase
      .from('comercial_pack')
      .select('*, canal:canal_venta_id(*), grupo_cliente:grupo_cliente_id(*), items:comercial_pack_item(*, producto:producto_id(id, nombre, precio, stock, activo), servicio:servicio_id(id, nombre, precio, categoria, activo))')
      .eq('activo', true)
      .eq('disponible_pos', true)
      .order('nombre', { ascending: true })
      .limit(80),
    supabase
      .from('comercial_promocion')
      .select('*, canal:canal_venta_id(*), grupo_cliente:grupo_cliente_id(*)')
      .eq('activo', true)
      .order('creado_en', { ascending: false })
      .limit(80),
    supabase
      .from('comercial_cupon')
      .select('*, promocion:promocion_id(id, codigo, nombre, tipo, valor, fecha_inicio, fecha_fin, activo)')
      .eq('activo', true)
      .order('creado_en', { ascending: false })
      .limit(80),
  ]);

  if (productosResult.error) throw new Error(productosResult.error.message);
  if (stockResult.error) throw new Error(stockResult.error.message);
  if (ubicacionesResult.error) throw new Error(ubicacionesResult.error.message);
  if (ventasResult.error) throw new Error(ventasResult.error.message);
  if (packsResult.error) throw new Error(packsResult.error.message);
  if (promocionesResult.error) throw new Error(promocionesResult.error.message);
  if (cuponesResult.error) throw new Error(cuponesResult.error.message);

  const productos = (productosResult.data ?? []) as ComercialPosProducto[];
  const stockPorUbicacion = (stockResult.data ?? []) as ComercialPosStockUbicacion[];
  const ubicaciones = (ubicacionesResult.data ?? []) as ComercialPosUbicacion[];
  const ventasRecientes = (ventasResult.data ?? []).map(mapVenta);
  const packs = (packsResult.data ?? []).map(mapPack);
  const promociones = (promocionesResult.data ?? []).filter((promo: any) => isDateActive(promo.fecha_inicio, promo.fecha_fin)) as ComercialPromocion[];
  const cupones = (cuponesResult.data ?? []).filter((cupon: any) => {
    const promo = cupon.promocion as any;
    if (cupon.fecha_expiracion && String(cupon.fecha_expiracion).slice(0, 10) < today) return false;
    if (cupon.max_usos && Number(cupon.usos_actuales ?? 0) >= Number(cupon.max_usos)) return false;
    return promo?.activo !== false && isDateActive(promo?.fecha_inicio, promo?.fecha_fin);
  }) as ComercialCupon[];
  const ubicacionDefault = ubicaciones.find((ubicacion) => ubicacion.codigo === 'kiosco') ?? ubicaciones[0] ?? null;

  const ventasHoy = ventasRecientes.filter((venta) => String(venta.fecha).slice(0, 10) === today);
  const itemsHoy = ventasHoy.reduce(
    (total, venta) => total + (venta.venta_detalle ?? []).reduce((sub, item) => sub + Number(item.cantidad ?? 0), 0),
    0
  );

  return {
    productos,
    packs,
    promociones,
    cupones,
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
      packsDisponibles: packs.length,
      promocionesActivas: promociones.length,
    },
  };
}

type NormalizedVentaItem = CreateComercialPosVentaItemDTO & {
  item_tipo: 'producto' | 'servicio';
  precio_final: number;
  total_linea: number;
  item_nombre: string;
  costo: number;
  pack_id?: string | null;
  pack_nombre?: string | null;
};

function getPackReferenceLine(item: any, cantidadPack: number) {
  const cantidad = Number(item.cantidad ?? 1) * cantidadPack;
  const precioReferencia = Number(item.precio_referencia ?? 0) > 0
    ? Number(item.precio_referencia)
    : item.item_tipo === 'servicio'
      ? Number(item.servicio?.precio ?? 0)
      : Number(item.producto?.precio ?? 0);
  return {
    item_tipo: item.item_tipo === 'servicio' ? 'servicio' as const : 'producto' as const,
    producto_id: item.producto_id ?? null,
    servicio_id: item.servicio_id ?? null,
    cantidad,
    precioReferencia: roundMoney(precioReferencia),
    nombre: item.item_tipo === 'servicio'
      ? (item.servicio?.nombre ?? 'Servicio del pack')
      : (item.producto?.nombre ?? 'Producto del pack'),
    costo: item.item_tipo === 'producto' ? asNumber(item.producto?.costo, 0) : 0,
  };
}

function applyDistributedDiscount(items: NormalizedVentaItem[], discount: number, reason: string) {
  const targetDiscount = roundMoney(Math.max(discount, 0));
  if (!targetDiscount) return 0;

  const available = items.reduce((sum, item) => sum + Math.max(item.cantidad * item.precio_final - Number(item.descuento ?? 0), 0), 0);
  if (available <= 0) return 0;

  let remaining = Math.min(targetDiscount, roundMoney(available));
  items.forEach((item, index) => {
    const lineAvailable = Math.max(item.cantidad * item.precio_final - Number(item.descuento ?? 0), 0);
    if (lineAvailable <= 0 || remaining <= 0) return;
    const share = index === items.length - 1 ? remaining : roundMoney(targetDiscount * (lineAvailable / available));
    const applied = Math.min(lineAvailable, share, remaining);
    item.descuento = roundMoney(Number(item.descuento ?? 0) + applied);
    item.total_linea = roundMoney(item.cantidad * item.precio_final - Number(item.descuento ?? 0));
    remaining = roundMoney(remaining - applied);
  });

  if (remaining > 0.01) {
    const last = [...items].reverse().find((item) => Math.max(item.cantidad * item.precio_final - Number(item.descuento ?? 0), 0) > 0);
    if (last) {
      const lineAvailable = Math.max(last.cantidad * last.precio_final - Number(last.descuento ?? 0), 0);
      const applied = Math.min(lineAvailable, remaining);
      last.descuento = roundMoney(Number(last.descuento ?? 0) + applied);
      last.total_linea = roundMoney(last.cantidad * last.precio_final - Number(last.descuento ?? 0));
      remaining = roundMoney(remaining - applied);
    }
  }

  return roundMoney(targetDiscount - remaining);
}

async function resolveCoupon(supabase: ReturnType<typeof getComercialDbClient>, rawCode?: string | null) {
  const codigo = String(rawCode ?? '').trim().toUpperCase();
  if (!codigo) return null;

  const { data, error } = await supabase
    .from('comercial_cupon')
    .select('*, promocion:promocion_id(*)')
    .eq('codigo', codigo)
    .eq('activo', true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Cupón no encontrado o inactivo');
  if (data.fecha_expiracion && String(data.fecha_expiracion).slice(0, 10) < new Date().toISOString().slice(0, 10)) {
    throw new Error('El cupón está vencido');
  }
  if (data.max_usos && Number(data.usos_actuales ?? 0) >= Number(data.max_usos)) {
    throw new Error('El cupón ya alcanzó su máximo de usos');
  }
  const promo = data.promocion;
  if (!promo || promo.activo === false || !isDateActive(promo.fecha_inicio, promo.fecha_fin)) {
    throw new Error('La promoción asociada al cupón no está vigente');
  }
  if (!['descuento_porcentaje', 'descuento_fijo'].includes(promo.tipo)) {
    throw new Error('Este cupón pertenece a una promoción informativa/combo y no puede aplicarse como descuento automático en POS');
  }
  return data;
}

export async function createComercialKioscoPosVenta(
  payload: CreateComercialPosVentaDTO,
  user?: JwtUser | null
): Promise<ComercialPosVentaResumen> {
  const supabase = getComercialDbClient();
  const clienteTipo = normalizeClienteTipo(payload.cliente_tipo);
  const metodoPago = normalizeMetodoPago(payload.metodo_pago);
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!items.length) throw new Error('La venta debe tener al menos un ítem');
  if (clienteTipo === 'socio') throw new Error('La venta POS v1 opera consumidor final o visitante. La venta a socio queda para la etapa de POS avanzado.');

  const ubicacion = await getDefaultLocation(supabase, payload.ubicacion_stock_id ?? null);
  const directProductoIds = Array.from(new Set(items.map((item) => normalizeItemTipo(item.item_tipo) === 'producto' ? String(item.producto_id ?? '').trim() : '').filter(Boolean)));
  const directServicioIds = Array.from(new Set(items.map((item) => normalizeItemTipo(item.item_tipo) === 'servicio' ? String(item.servicio_id ?? '').trim() : '').filter(Boolean)));
  const packIds = Array.from(new Set(items.map((item) => normalizeItemTipo(item.item_tipo) === 'pack' ? String(item.pack_id ?? '').trim() : '').filter(Boolean)));

  if (!directProductoIds.length && !directServicioIds.length && !packIds.length) throw new Error('Debe seleccionar productos, servicios o packs válidos');

  const packsResult = packIds.length
    ? await supabase
      .from('comercial_pack')
      .select('*, items:comercial_pack_item(*, producto:producto_id(id, nombre, precio, costo, stock, activo), servicio:servicio_id(id, nombre, precio, categoria, activo))')
      .in('id', packIds)
    : { data: [], error: null } as any;

  if (packsResult.error) throw new Error(packsResult.error.message);
  const packsById = new Map<string, any>((packsResult.data ?? []).map((pack: any) => [String(pack.id), mapPack(pack)]));

  const packProductoIds: string[] = [];
  const packServicioIds: string[] = [];
  for (const pack of packsById.values()) {
    for (const packItem of pack.items ?? []) {
      if (packItem.item_tipo === 'servicio' && packItem.servicio_id) packServicioIds.push(String(packItem.servicio_id));
      if (packItem.item_tipo !== 'servicio' && packItem.producto_id) packProductoIds.push(String(packItem.producto_id));
    }
  }

  const productoIds = Array.from(new Set([...directProductoIds, ...packProductoIds]));
  const servicioIds = Array.from(new Set([...directServicioIds, ...packServicioIds]));

  const [productosResult, serviciosResult] = await Promise.all([
    productoIds.length
      ? supabase.from('producto').select('id, nombre, precio, costo, activo').in('id', productoIds)
      : Promise.resolve({ data: [], error: null } as any),
    servicioIds.length
      ? supabase.from('servicio').select('id, nombre, precio, activo').in('id', servicioIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  if (productosResult.error) throw new Error(productosResult.error.message);
  if (serviciosResult.error) throw new Error(serviciosResult.error.message);

  const productosById = new Map<string, any>((productosResult.data ?? []).map((producto: any) => [String(producto.id), producto]));
  const serviciosById = new Map<string, any>((serviciosResult.data ?? []).map((servicio: any) => [String(servicio.id), servicio]));
  const normalizedItems: NormalizedVentaItem[] = [];
  const packNotes: string[] = [];

  for (const item of items) {
    const itemTipo = normalizeItemTipo(item.item_tipo);
    const cantidad = parsePositiveInteger(item.cantidad, 'Cantidad del ítem');

    if (itemTipo === 'producto') {
      const productoId = String(item.producto_id ?? '').trim();
      const producto = productosById.get(productoId);
      if (!producto || producto.activo === false) throw new Error('Uno de los productos no existe o está inactivo');

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
        item_tipo: 'producto',
        producto_id: productoId,
        servicio_id: null,
        cantidad,
        precio_unitario: precio,
        descuento,
        precio_final: precio,
        total_linea: roundMoney(subtotal - descuento),
        item_nombre: producto.nombre,
        costo: asNumber(producto.costo, 0),
      });
      continue;
    }

    if (itemTipo === 'servicio') {
      const servicioId = String(item.servicio_id ?? '').trim();
      const servicio = serviciosById.get(servicioId);
      if (!servicio || servicio.activo === false) throw new Error('Uno de los servicios no existe o está inactivo');
      const precio = parseMoney(item.precio_unitario ?? servicio.precio, `Precio de ${servicio.nombre}`);
      const descuento = parseMoney(item.descuento ?? 0, `Descuento de ${servicio.nombre}`);
      const subtotal = cantidad * precio;
      if (descuento > subtotal) throw new Error(`El descuento no puede superar el subtotal de ${servicio.nombre}`);

      normalizedItems.push({
        ...item,
        item_tipo: 'servicio',
        producto_id: null,
        servicio_id: servicioId,
        cantidad,
        precio_unitario: precio,
        descuento,
        precio_final: precio,
        total_linea: roundMoney(subtotal - descuento),
        item_nombre: servicio.nombre,
        costo: 0,
      });
      continue;
    }

    const packId = String(item.pack_id ?? '').trim();
    const pack = packsById.get(packId);
    if (!pack || pack.activo === false || pack.disponible_pos === false) throw new Error('Uno de los packs no existe, está inactivo o no está disponible para POS');
    const packItems = Array.isArray(pack.items) ? pack.items : [];
    if (!packItems.length) throw new Error(`El pack ${pack.nombre} no tiene ítems configurados`);

    const packUnitPrice = parseMoney(item.precio_unitario ?? pack.precio, `Precio del pack ${pack.nombre}`);
    const packDiscount = parseMoney(item.descuento ?? 0, `Descuento del pack ${pack.nombre}`);
    const packTargetTotal = Math.max(roundMoney(cantidad * packUnitPrice - packDiscount), 0);
    const componentLines = packItems.map((packItem: any) => getPackReferenceLine(packItem, cantidad));
    const referenceTotal = componentLines.reduce((sum: number, line: any) => sum + line.cantidad * line.precioReferencia, 0);
    if (referenceTotal <= 0) throw new Error(`El pack ${pack.nombre} no tiene precios de referencia válidos`);

    let accumulated = 0;
    componentLines.forEach((line: any, index: number) => {
      const referenceLineTotal = line.cantidad * line.precioReferencia;
      const targetLineTotal = index === componentLines.length - 1
        ? roundMoney(packTargetTotal - accumulated)
        : roundMoney(packTargetTotal * (referenceLineTotal / referenceTotal));
      accumulated = roundMoney(accumulated + targetLineTotal);
      const precioFinal = roundMoney(targetLineTotal / line.cantidad);
      const source = line.item_tipo === 'servicio' ? serviciosById.get(String(line.servicio_id)) : productosById.get(String(line.producto_id));
      if (!source || source.activo === false) throw new Error(`El pack ${pack.nombre} contiene un ítem inactivo o inexistente`);

      normalizedItems.push({
        item_tipo: line.item_tipo,
        producto_id: line.item_tipo === 'producto' ? String(line.producto_id) : null,
        servicio_id: line.item_tipo === 'servicio' ? String(line.servicio_id) : null,
        pack_id: pack.id,
        pack_nombre: pack.nombre,
        cantidad: line.cantidad,
        precio_unitario: precioFinal,
        descuento: 0,
        precio_final: precioFinal,
        total_linea: roundMoney(line.cantidad * precioFinal),
        item_nombre: `${line.nombre} (${pack.nombre})`,
        costo: line.item_tipo === 'producto' ? asNumber(source.costo, 0) : 0,
      });
    });
    packNotes.push(`${cantidad} x ${pack.nombre} (${pack.codigo})`);
  }

  const subtotalBeforeCoupon = normalizedItems.reduce((sum, item) => sum + roundMoney(item.cantidad * item.precio_final - Number(item.descuento ?? 0)), 0);
  const coupon = await resolveCoupon(supabase, payload.cupon_codigo);
  let couponNote = '';
  if (coupon) {
    const promo = coupon.promocion as any;
    const discount = promo.tipo === 'descuento_porcentaje'
      ? roundMoney(subtotalBeforeCoupon * (Number(promo.valor ?? 0) / 100))
      : Math.min(roundMoney(Number(promo.valor ?? 0)), subtotalBeforeCoupon);
    const applied = applyDistributedDiscount(normalizedItems, discount, `Cupón ${coupon.codigo}`);
    couponNote = `Cupón ${coupon.codigo} / ${promo.nombre}: -${applied}`;
  }

  const total = roundMoney(normalizedItems.reduce((sum, item) => sum + roundMoney(item.cantidad * item.precio_final - Number(item.descuento ?? 0)), 0));
  const comprobanteCodigo = buildComprobanteCodigo();
  const cajaSesionId = await getOpenCashSessionId(supabase);
  const obsParts = [payload.observaciones?.trim() || `Venta POS/Kiosco desde ${ubicacion.nombre}`];
  if (packNotes.length) obsParts.push(`Packs: ${packNotes.join(', ')}`);
  if (couponNote) obsParts.push(couponNote);

  const { data: venta, error: ventaError } = await supabase
    .from('venta')
    .insert({
      socio_id: null,
      cliente_tipo: clienteTipo,
      cliente_nombre: payload.cliente_nombre?.trim() || (clienteTipo === 'visitante' ? 'Visitante' : 'Consumidor Final'),
      cliente_documento: payload.cliente_documento?.trim() || null,
      metodo_pago: metodoPago,
      observaciones: obsParts.filter(Boolean).join(' | '),
      fecha: new Date().toISOString().slice(0, 10),
      total,
      estado: 'pagada',
      activo: true,
      comprobante_codigo: comprobanteCodigo,
      registrado_por: user?.id ?? null,
      ...(cajaSesionId ? { caja_sesion_id: cajaSesionId } : {}),
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
        item_tipo: item.item_tipo,
        producto_id: item.item_tipo === 'producto' ? item.producto_id : null,
        servicio_id: item.item_tipo === 'servicio' ? item.servicio_id : null,
        cantidad: item.cantidad,
        precio_unitario: item.precio_final,
        descuento: item.descuento ?? 0,
      })
      .select('*, producto:producto_id(id, nombre), servicio:servicio_id(id, nombre)')
      .single();

    if (detalleError) throw new Error(detalleError.message);
    detallesCreados.push(detalle);

    if (item.item_tipo !== 'producto' || !item.producto_id) {
      continue;
    }

    const stockRow = await getLocationStockRow(supabase, item.producto_id, ubicacion.id);
    if (!stockRow) throw new Error(`No se encontró stock de ${item.item_nombre} en ${ubicacion.nombre}`);

    const stockAnteriorTotal = await getProductTotalStock(supabase, item.producto_id);
    const stockUbicacionAnterior = Number(stockRow.cantidad ?? 0);
    const stockUbicacionNuevo = stockUbicacionAnterior - item.cantidad;

    if (stockUbicacionNuevo < 0) {
      throw new Error(`Stock insuficiente para ${item.item_nombre} al confirmar venta`);
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
      motivo: item.pack_nombre ? `Venta POS/Kiosco ${comprobanteCodigo} / Pack ${item.pack_nombre}` : `Venta POS/Kiosco ${comprobanteCodigo}`,
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
      motivo: item.pack_nombre ? `Venta POS/Kiosco ${comprobanteCodigo} / Pack ${item.pack_nombre}` : `Venta POS/Kiosco ${comprobanteCodigo}`,
      creado_por: user?.id ?? null,
    });
  }

  if (coupon) {
    await supabase
      .from('comercial_cupon')
      .update({ usos_actuales: Number(coupon.usos_actuales ?? 0) + 1, actualizado_en: new Date().toISOString() })
      .eq('id', coupon.id);
  }

  if (detallesCreados[0]?.id) {
    await supabase
      .from('venta')
      .update({ id_venta_detalle: detallesCreados[0].id })
      .eq('id', venta.id);
  }

  return mapVenta({ ...venta, venta_detalle: detallesCreados });
}
