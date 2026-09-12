import { ComercialValidationError } from '@/lib/comercial/comercialErrorBoundary';
import 'server-only';

import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import type {
  ComercialCupon,
  ComercialPack,
  ComercialPromocion,
  ComercialServiciosPromocionesDashboard,
  CreateComercialCuponDTO,
  CreateComercialPackDTO,
  CreateComercialPromocionDTO,
} from '@/interfaces/comercialServiciosPromociones.interface';

function parseMoney(value: unknown, field: string) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric < 0) throw new ComercialValidationError("El importe ingresado debe ser mayor o igual a 0.", `${field} debe ser un importe mayor o igual a 0`);
  return Math.round(numeric * 100) / 100;
}

function parsePositiveInteger(value: unknown, field: string, optional = false) {
  if (optional && (value === null || value === undefined || value === '')) return null;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) throw new ComercialValidationError("El número ingresado debe ser un entero mayor a 0.", `${field} debe ser un entero mayor a 0`);
  return numeric;
}

function slugify(value: string, prefix: string) {
  const base = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${prefix}-${base || Date.now().toString(36).toUpperCase()}`;
}

function normalizeDate(value: unknown) {
  const text = String(value ?? '').trim();
  return text || null;
}

function normalizePromoType(value: unknown) {
  const allowed = ['descuento_porcentaje', 'descuento_fijo', 'combo', 'beneficio'];
  const text = String(value ?? 'descuento_porcentaje');
  return allowed.includes(text) ? text : 'descuento_porcentaje';
}

function mapPack(row: any): ComercialPack {
  const items = row.items ?? row.comercial_pack_item ?? [];
  return { ...row, items, comercial_pack_item: items };
}

async function fetchPackById(supabase: ReturnType<typeof getSupabaseServerClient>, id: string): Promise<ComercialPack> {
  const { data, error } = await supabase
    .from('comercial_pack')
    .select(
      `
      *,
      canal:canal_venta_id(*),
      grupo_cliente:grupo_cliente_id(*),
      items:comercial_pack_item(
        *,
        producto:producto_id(id, nombre, precio, stock),
        servicio:servicio_id(id, nombre, precio, categoria)
      )
    `
    )
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return mapPack(data);
}

export async function getComercialServiciosPromocionesDashboard(): Promise<ComercialServiciosPromocionesDashboard> {
  const supabase = getSupabaseServerClient();
  const [productosResult, serviciosResult, canalesResult, gruposResult, packsResult, promocionesResult, cuponesResult, itemsResult] = await Promise.all([
    supabase.from('producto').select('id, nombre, descripcion, precio, costo, stock, sku, codigo_barras, activo').eq('activo', true).order('nombre', { ascending: true }),
    supabase.from('servicio').select('*').eq('activo', true).order('nombre', { ascending: true }),
    supabase.from('comercial_canal_venta').select('*').eq('activo', true).order('orden', { ascending: true }),
    supabase.from('comercial_grupo_cliente').select('*').eq('activo', true).order('orden', { ascending: true }),
    supabase
      .from('comercial_pack')
      .select('*, canal:canal_venta_id(*), grupo_cliente:grupo_cliente_id(*), items:comercial_pack_item(*, producto:producto_id(id, nombre, precio, stock), servicio:servicio_id(id, nombre, precio, categoria))')
      .order('creado_en', { ascending: false })
      .limit(80),
    supabase
      .from('comercial_promocion')
      .select('*, canal:canal_venta_id(*), grupo_cliente:grupo_cliente_id(*)')
      .order('creado_en', { ascending: false })
      .limit(80),
    supabase
      .from('comercial_cupon')
      .select('*, promocion:promocion_id(id, codigo, nombre, tipo, valor)')
      .order('creado_en', { ascending: false })
      .limit(80),
    supabase.from('vw_comercial_items').select('*').order('nombre', { ascending: true }),
  ]);

  if (productosResult.error) throw new Error(productosResult.error.message);
  if (serviciosResult.error) throw new Error(serviciosResult.error.message);
  if (canalesResult.error) throw new Error(canalesResult.error.message);
  if (gruposResult.error) throw new Error(gruposResult.error.message);
  if (packsResult.error) throw new Error(packsResult.error.message);
  if (promocionesResult.error) throw new Error(promocionesResult.error.message);
  if (cuponesResult.error) throw new Error(cuponesResult.error.message);
  if (itemsResult.error) throw new Error(itemsResult.error.message);

  const packs = (packsResult.data ?? []).map(mapPack);
  const promociones = promocionesResult.data ?? [];
  const cupones = cuponesResult.data ?? [];
  const items = itemsResult.data ?? [];

  return {
    productos: (productosResult.data ?? []) as any,
    servicios: (serviciosResult.data ?? []) as any,
    canales: (canalesResult.data ?? []) as any,
    grupos: (gruposResult.data ?? []) as any,
    packs,
    promociones: promociones as ComercialPromocion[],
    cupones: cupones as ComercialCupon[],
    items: items as any,
    metricas: {
      serviciosActivos: (serviciosResult.data ?? []).length,
      packsActivos: packs.filter((pack) => pack.activo !== false).length,
      promocionesActivas: promociones.filter((promo: any) => promo.activo !== false).length,
      cuponesActivos: cupones.filter((cupon: any) => cupon.activo !== false).length,
      itemsVendibles: items.filter((item: any) => item.activo !== false).length,
    },
  };
}

export async function createComercialPack(payload: CreateComercialPackDTO): Promise<ComercialPack> {
  const nombre = String(payload.nombre ?? '').trim();
  if (nombre.length < 3) throw new ComercialValidationError('El nombre del pack debe tener al menos 3 caracteres');
  const precio = parseMoney(payload.precio, 'El precio del pack');
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw new ComercialValidationError('El pack debe tener al menos un ítem');

  const normalizedItems = items.map((item, index) => {
    const itemTipo = item.item_tipo === 'servicio' ? 'servicio' : 'producto';
    const productoId = itemTipo === 'producto' ? String(item.producto_id ?? '').trim() : null;
    const servicioId = itemTipo === 'servicio' ? String(item.servicio_id ?? '').trim() : null;
    if (itemTipo === 'producto' && !productoId) throw new ComercialValidationError("Debe seleccionar un producto en el ítem.", `Debe seleccionar producto en el ítem ${index + 1}`);
    if (itemTipo === 'servicio' && !servicioId) throw new ComercialValidationError("Debe seleccionar un servicio en el ítem.", `Debe seleccionar servicio en el ítem ${index + 1}`);
    const cantidad = parsePositiveInteger(item.cantidad, `Cantidad del ítem ${index + 1}`) ?? 1;
    const precioReferencia = parseMoney(item.precio_referencia ?? 0, `Precio referencia del ítem ${index + 1}`);
    return { item_tipo: itemTipo, producto_id: productoId, servicio_id: servicioId, cantidad, precio_referencia: precioReferencia };
  });

  const codigo = String(payload.codigo ?? '').trim() || slugify(nombre, 'PACK');
  const vigenciaDias = parsePositiveInteger(
    payload.vigencia_dias,
    'La vigencia',
    true
  );
  const supabase = getSupabaseServerClient();

  const { data: pack, error: packError } = await supabase
    .from('comercial_pack')
    .insert({
      codigo,
      nombre,
      descripcion: String(payload.descripcion ?? '').trim() || null,
      precio,
      vigencia_dias: vigenciaDias,
      canal_venta_id: payload.canal_venta_id || null,
      grupo_cliente_id: payload.grupo_cliente_id || null,
      disponible_pos: payload.disponible_pos !== false,
      disponible_online: Boolean(payload.disponible_online),
      activo: true,
    })
    .select('*')
    .single();

  if (packError || !pack) throw new Error(packError?.message || 'No se pudo crear el pack');

  try {
    const { error: itemsError } = await supabase
      .from('comercial_pack_item')
      .insert(normalizedItems.map((item) => ({ ...item, pack_id: pack.id })));
    if (itemsError) throw new Error(itemsError.message);
  } catch (error) {
    await supabase.from('comercial_pack').delete().eq('id', pack.id);
    throw error;
  }

  return fetchPackById(supabase, pack.id);
}

export async function createComercialPromocion(payload: CreateComercialPromocionDTO): Promise<ComercialPromocion> {
  const nombre = String(payload.nombre ?? '').trim();
  if (nombre.length < 3) throw new ComercialValidationError('El nombre de la promoción debe tener al menos 3 caracteres');
  const tipo = normalizePromoType(payload.tipo);
  const valor = parseMoney(payload.valor, 'El valor de la promoción');
  if (tipo === 'descuento_porcentaje' && valor > 100) throw new ComercialValidationError('El descuento porcentual no puede superar 100%');
  const codigo = String(payload.codigo ?? '').trim() || slugify(nombre, 'PROMO');
  const fechaInicio = normalizeDate(payload.fecha_inicio);
  const fechaFin = normalizeDate(payload.fecha_fin);
  const maxUsos = parsePositiveInteger(
    payload.max_usos,
    'Máximo de usos',
    true
  );
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('comercial_promocion')
    .insert({
      codigo,
      nombre,
      descripcion: String(payload.descripcion ?? '').trim() || null,
      tipo,
      valor,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      canal_venta_id: payload.canal_venta_id || null,
      grupo_cliente_id: payload.grupo_cliente_id || null,
      acumulable: Boolean(payload.acumulable),
      max_usos: maxUsos,
      activo: true,
    })
    .select('*, canal:canal_venta_id(*), grupo_cliente:grupo_cliente_id(*)')
    .single();

  if (error) throw new Error(error.message);
  return data as ComercialPromocion;
}

export async function createComercialCupon(payload: CreateComercialCuponDTO): Promise<ComercialCupon> {
  const promocionId = String(payload.promocion_id ?? '').trim();
  const codigo = String(payload.codigo ?? '').trim().toUpperCase();
  if (!promocionId) throw new ComercialValidationError('Debe seleccionar una promoción');
  if (codigo.length < 3) throw new ComercialValidationError('El código de cupón debe tener al menos 3 caracteres');

  const maxUsos = parsePositiveInteger(
    payload.max_usos,
    'Máximo de usos',
    true
  );
  const fechaExpiracion = normalizeDate(payload.fecha_expiracion);
  const supabase = getSupabaseServerClient();

  const { data: promocion, error: promoError } = await supabase
    .from('comercial_promocion')
    .select('id, activo')
    .eq('id', promocionId)
    .single();
  if (promoError) throw new Error(promoError.message);
  if (!promocion) throw new ComercialValidationError('Promoción no encontrada');
  if (promocion.activo === false) throw new ComercialValidationError('No se puede crear cupón sobre promoción inactiva');

  const { data, error } = await supabase
    .from('comercial_cupon')
    .insert({
      promocion_id: promocionId,
      codigo,
      max_usos: maxUsos,
      fecha_expiracion: fechaExpiracion,
      activo: true,
    })
    .select('*, promocion:promocion_id(id, codigo, nombre, tipo, valor)')
    .single();

  if (error) throw new Error(error.message);
  return data as ComercialCupon;
}
