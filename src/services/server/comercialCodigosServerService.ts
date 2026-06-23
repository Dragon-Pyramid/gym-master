import { createClient } from '@supabase/supabase-js';
import type {
  ComercialCodigoLabelItem,
  ComercialCodigosLabelsDashboard,
  GenerateComercialQrCodeDTO,
} from '@/interfaces/comercialCodigos.interface';

function getComercialDbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada para operar códigos comerciales.');
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function normalizeQrCode(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function buildGeneratedCode(targetType: string, targetId: string) {
  const prefix = targetType === 'producto' ? 'GM-PROD' : targetType === 'servicio' ? 'GM-SERV' : 'GM-PACK';
  return normalizeQrCode(`${prefix}-${targetId.slice(0, 8)}`);
}

function priceSubtitle(value: unknown, extra?: string | null) {
  const price = Number(value ?? 0);
  const priceText = Number.isFinite(price) ? `$ ${Math.round(price).toLocaleString('es-AR')}` : '$ 0';
  return [priceText, extra].filter(Boolean).join(' · ');
}

function qrByTarget(qrCodes: any[]) {
  const map = new Map<string, any>();
  for (const qr of qrCodes) {
    if (!qr?.target_type || !qr?.target_id) continue;
    map.set(`${qr.target_type}:${qr.target_id}`, qr);
  }
  return map;
}

export async function getComercialCodigosLabelsDashboard(): Promise<ComercialCodigosLabelsDashboard> {
  const supabase = getComercialDbClient();
  const [productosResult, serviciosResult, packsResult, qrResult] = await Promise.all([
    supabase.from('producto').select('id,nombre,descripcion,precio,stock,sku,codigo_barras,activo').order('nombre', { ascending: true }),
    supabase.from('servicio').select('id,nombre,descripcion,precio,codigo,categoria,activo').order('nombre', { ascending: true }),
    supabase.from('comercial_pack').select('id,codigo,nombre,descripcion,precio,activo,disponible_pos').order('nombre', { ascending: true }),
    supabase
      .from('infraestructura_qr_codigo')
      .select('*')
      .in('target_type', ['producto', 'servicio'])
      .eq('activo', true)
      .order('target_type', { ascending: true })
      .order('titulo', { ascending: true }),
  ]);

  const firstError = productosResult.error || serviciosResult.error || packsResult.error || qrResult.error;
  if (firstError) throw new Error(firstError.message);

  const qrCodes = qrResult.data ?? [];
  const qrMap = qrByTarget(qrCodes);

  const productos: ComercialCodigoLabelItem[] = (productosResult.data ?? []).map((producto: any) => {
    const qr = qrMap.get(`producto:${producto.id}`);
    const codigoPrincipal = producto.codigo_barras || producto.sku || qr?.codigo || null;
    return {
      id: producto.id,
      target_type: 'producto',
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? null,
      precio: Number(producto.precio ?? 0),
      codigo_principal: codigoPrincipal,
      sku: producto.sku ?? null,
      codigo_barras: producto.codigo_barras ?? null,
      qr_codigo: qr?.codigo ?? null,
      qr_id: qr?.id ?? null,
      activo: producto.activo,
      subtitulo: priceSubtitle(producto.precio, producto.stock != null ? `Stock ${producto.stock}` : null),
      metadata: { stock: producto.stock ?? null },
    };
  });

  const servicios: ComercialCodigoLabelItem[] = (serviciosResult.data ?? []).map((servicio: any) => {
    const qr = qrMap.get(`servicio:${servicio.id}`);
    const codigoPrincipal = servicio.codigo || qr?.codigo || null;
    return {
      id: servicio.id,
      target_type: 'servicio',
      nombre: servicio.nombre,
      descripcion: servicio.descripcion ?? null,
      precio: Number(servicio.precio ?? 0),
      codigo_principal: codigoPrincipal,
      qr_codigo: qr?.codigo ?? null,
      qr_id: qr?.id ?? null,
      activo: servicio.activo,
      subtitulo: priceSubtitle(servicio.precio, servicio.categoria ?? null),
      metadata: { categoria: servicio.categoria ?? null },
    };
  });

  const packs: ComercialCodigoLabelItem[] = (packsResult.data ?? []).map((pack: any) => ({
    id: pack.id,
    target_type: 'pack',
    nombre: pack.nombre,
    descripcion: pack.descripcion ?? null,
    precio: Number(pack.precio ?? 0),
    codigo_principal: pack.codigo ?? null,
    qr_codigo: pack.codigo ?? null,
    activo: pack.activo,
    subtitulo: priceSubtitle(pack.precio, pack.disponible_pos ? 'POS' : null),
    metadata: { disponible_pos: pack.disponible_pos ?? null },
  }));

  return {
    generated_at: new Date().toISOString(),
    productos,
    servicios,
    packs,
    qrCodes: qrCodes as any,
    metricas: {
      productosConCodigo: productos.filter((item) => item.codigo_principal).length,
      productosSinCodigo: productos.filter((item) => !item.codigo_principal && item.activo !== false).length,
      serviciosConCodigo: servicios.filter((item) => item.codigo_principal).length,
      serviciosSinCodigo: servicios.filter((item) => !item.codigo_principal && item.activo !== false).length,
      packsConCodigo: packs.filter((item) => item.codigo_principal).length,
      etiquetasQrGeneradas: qrCodes.length,
    },
  };
}

export async function generateComercialQrCode(payload: GenerateComercialQrCodeDTO) {
  const supabase = getComercialDbClient();
  const targetType = String(payload.target_type ?? '').trim();
  const targetId = String(payload.target_id ?? '').trim();

  if (!['producto', 'servicio'].includes(targetType)) {
    throw new Error('Solo productos y servicios requieren QR interno. Los packs usan su código comercial.');
  }
  if (!targetId) throw new Error('Seleccioná un producto o servicio para generar QR.');

  const table = targetType === 'producto' ? 'producto' : 'servicio';
  const { data: target, error: targetError } = await supabase
    .from(table)
    .select('*')
    .eq('id', targetId)
    .maybeSingle();

  if (targetError) throw new Error(targetError.message);
  if (!target) throw new Error('No se encontró el ítem comercial seleccionado.');

  const codigo = normalizeQrCode(payload.codigo || buildGeneratedCode(targetType, targetId));
  const route = targetType === 'producto' ? '/dashboard/productos' : '/dashboard/servicios';
  const titulo = String(payload.titulo || target.nombre || 'Ítem comercial').trim();

  const { data, error } = await supabase
    .from('infraestructura_qr_codigo')
    .upsert(
      {
        codigo,
        target_type: targetType,
        target_id: targetId,
        titulo,
        route,
        metadata: {
          origen: 'comercial_codigos',
          precio: target.precio ?? null,
          sku: target.sku ?? null,
          codigo_barras: target.codigo_barras ?? null,
          codigo_servicio: target.codigo ?? null,
        },
        activo: true,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'codigo' },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
