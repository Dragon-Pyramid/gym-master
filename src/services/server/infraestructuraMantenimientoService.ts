import { createClient } from '@supabase/supabase-js';
import type {
  CreateInfraestructuraActivoDTO,
  CreateInfraestructuraChecklistEjecucionDTO,
  CreateInfraestructuraQrDTO,
  CreateInfraestructuraSectorDTO,
  CreateMantenimientoEdilicioOrdenDTO,
  InfraestructuraActivo,
  InfraestructuraCategoriaActivo,
  InfraestructuraChecklistEjecucion,
  InfraestructuraChecklistTemplate,
  InfraestructuraMantenimientoDashboard,
  InfraestructuraQrCodigo,
  InfraestructuraQrLabelsDashboard,
  InfraestructuraQrResolveResult,
  InfraestructuraSector,
  MantenimientoEdilicioOrden,
  UpdateMantenimientoEdilicioOrdenDTO,
} from '@/interfaces/infraestructuraMantenimiento.interface';


const ALERT_THRESHOLD_DAYS = 30;

function getInfraestructuraDbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada para operar Infraestructura desde API server.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}


function normalizeCode(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

function daysUntil(date?: string | null) {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function buildNextMaintenanceDate(baseDate: string, frequencyDays?: number | null) {
  if (!frequencyDays || frequencyDays <= 0) return null;
  const base = new Date(`${baseDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + frequencyDays);
  return base.toISOString().slice(0, 10);
}

function calculateMetricas(
  sectores: InfraestructuraSector[],
  activos: InfraestructuraActivo[],
  ordenes: MantenimientoEdilicioOrden[],
) {
  const activosActivos = activos.filter((activo) => activo.activo !== false);
  const ordenesActivas = ordenes.filter((orden) => orden.activo !== false);

  const activosVencidos = activosActivos.filter((activo) => {
    const vencimiento = daysUntil(activo.fecha_vencimiento);
    const proximoMantenimiento = daysUntil(activo.fecha_proximo_mantenimiento);
    return (
      activo.estado === 'vencido' ||
      (vencimiento !== null && vencimiento < 0) ||
      (proximoMantenimiento !== null && proximoMantenimiento < 0)
    );
  }).length;

  const activosProximosVencer = activosActivos.filter((activo) => {
    const vencimiento = daysUntil(activo.fecha_vencimiento);
    const proximoMantenimiento = daysUntil(activo.fecha_proximo_mantenimiento);
    return (
      (vencimiento !== null && vencimiento >= 0 && vencimiento <= ALERT_THRESHOLD_DAYS) ||
      (proximoMantenimiento !== null && proximoMantenimiento >= 0 && proximoMantenimiento <= ALERT_THRESHOLD_DAYS)
    );
  }).length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const costoOrdenesMes = ordenesActivas.reduce((total, orden) => {
    const fechaBase = orden.fecha_cierre || orden.fecha_inicio || orden.fecha_programada || orden.creado_en;
    const fecha = fechaBase ? new Date(fechaBase) : null;
    if (!fecha || Number.isNaN(fecha.getTime())) return total;
    if (fecha.getFullYear() !== currentYear || fecha.getMonth() !== currentMonth) return total;
    return total + Number(orden.costo_real ?? orden.costo_estimado ?? 0);
  }, 0);

  return {
    totalSectores: sectores.filter((sector) => sector.activo !== false).length,
    totalActivos: activosActivos.length,
    activosCriticos: activosActivos.filter((activo) => activo.criticidad === 'critica').length,
    activosVencidos,
    activosProximosVencer,
    ordenesAbiertas: ordenesActivas.filter((orden) => ['abierta', 'en_progreso'].includes(String(orden.estado))).length,
    ordenesVencidas: ordenesActivas.filter((orden) => {
      const vencimiento = daysUntil(orden.fecha_vencimiento);
      return orden.estado === 'vencida' || (vencimiento !== null && vencimiento < 0 && orden.estado !== 'completada');
    }).length,
    costoOrdenesMes,
  };
}

function buildAlertas(activos: InfraestructuraActivo[]) {
  return activos
    .filter((activo) => activo.activo !== false)
    .filter((activo) => {
      const vencimiento = daysUntil(activo.fecha_vencimiento);
      const mantenimiento = daysUntil(activo.fecha_proximo_mantenimiento);
      return (
        activo.criticidad === 'critica' ||
        activo.estado === 'vencido' ||
        (vencimiento !== null && vencimiento <= ALERT_THRESHOLD_DAYS) ||
        (mantenimiento !== null && mantenimiento <= ALERT_THRESHOLD_DAYS)
      );
    })
    .sort((a, b) => {
      const aDays = Math.min(
        daysUntil(a.fecha_vencimiento) ?? 9999,
        daysUntil(a.fecha_proximo_mantenimiento) ?? 9999,
      );
      const bDays = Math.min(
        daysUntil(b.fecha_vencimiento) ?? 9999,
        daysUntil(b.fecha_proximo_mantenimiento) ?? 9999,
      );
      return aDays - bDays;
    })
    .slice(0, 12);
}


function normalizeQrCode(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function buildQrRoute(targetType: string) {
  switch (targetType) {
    case 'infra_activo':
    case 'infra_sector':
    case 'edilicio_orden':
      return '/dashboard/infraestructura/mantenimiento-edilicio';
    case 'equipamiento':
      return '/dashboard/equipamientos';
    case 'producto':
      return '/dashboard/productos';
    case 'servicio':
      return '/dashboard/servicios';
    default:
      return '/dashboard/infraestructura/lector-qr-barra';
  }
}

function buildGeneratedQrCode(targetType: string, targetId: string) {
  return normalizeQrCode(`GM-${targetType.replace(/_/g, '-').toUpperCase()}-${targetId.slice(0, 8)}`);
}

async function getQrTargetTitle(supabase: ReturnType<typeof getInfraestructuraDbClient>, targetType: string, targetId: string) {
  if (!targetId) throw new Error('El target_id es obligatorio para generar QR/código de barras.');

  if (targetType === 'infra_activo') {
    const { data, error } = await supabase.from('infraestructura_activo').select('id,nombre,codigo').eq('id', targetId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('No se encontró el activo edilicio para generar QR.');
    return { titulo: String(data.nombre), metadata: { codigo_activo: data.codigo } };
  }

  if (targetType === 'infra_sector') {
    const { data, error } = await supabase.from('infraestructura_sector').select('id,nombre,codigo,tipo').eq('id', targetId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('No se encontró el sector edilicio para generar QR.');
    return { titulo: String(data.nombre), metadata: { codigo_sector: data.codigo, tipo: data.tipo } };
  }

  if (targetType === 'edilicio_orden') {
    const { data, error } = await supabase.from('mantenimiento_edilicio_orden').select('id,titulo,estado').eq('id', targetId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('No se encontró la orden de mantenimiento edilicio para generar QR.');
    return { titulo: String(data.titulo), metadata: { estado: data.estado } };
  }

  if (targetType === 'equipamiento') {
    const { data, error } = await supabase.from('equipamiento').select('id,nombre,tipo,ubicacion').eq('id', targetId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('No se encontró el equipamiento para generar QR.');
    return { titulo: String(data.nombre), metadata: { tipo: data.tipo, ubicacion: data.ubicacion } };
  }

  if (targetType === 'producto') {
    const { data, error } = await supabase.from('producto').select('id,nombre,stock,precio').eq('id', targetId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('No se encontró el producto para generar código de barras/QR.');
    return { titulo: String(data.nombre), metadata: { stock: data.stock, precio: data.precio } };
  }

  if (targetType === 'servicio') {
    const { data, error } = await supabase.from('servicio').select('id,nombre,precio').eq('id', targetId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('No se encontró el servicio para generar QR.');
    return { titulo: String(data.nombre), metadata: { precio: data.precio } };
  }

  throw new Error('Tipo de destino QR no soportado.');
}

export async function getInfraestructuraMantenimientoDashboard(): Promise<InfraestructuraMantenimientoDashboard> {
  const supabase = getInfraestructuraDbClient();

  const [sectoresResult, categoriasResult, activosResult, ordenesResult, checklistsResult, ejecucionesResult, qrCodesResult] = await Promise.all([
    supabase
      .from('infraestructura_sector')
      .select('*')
      .order('tipo', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('infraestructura_categoria_activo')
      .select('*')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('infraestructura_activo')
      .select('*, sector:infraestructura_sector(*), categoria:infraestructura_categoria_activo(*)')
      .order('criticidad', { ascending: false })
      .order('nombre', { ascending: true }),
    supabase
      .from('mantenimiento_edilicio_orden')
      .select('*, infraestructura_activo(*), infraestructura_sector(*)')
      .order('fecha_vencimiento', { ascending: true, nullsFirst: false })
      .order('creado_en', { ascending: false })
      .limit(80),
    supabase
      .from('infraestructura_checklist_template')
      .select('*, items:infraestructura_checklist_item(*)')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('infraestructura_checklist_ejecucion')
      .select('*, template:infraestructura_checklist_template(*), infraestructura_activo(*), infraestructura_sector(*), mantenimiento_edilicio_orden(*)')
      .eq('activo', true)
      .order('ejecutado_en', { ascending: false })
      .limit(20),
    supabase
      .from('infraestructura_qr_codigo')
      .select('*')
      .eq('activo', true)
      .order('actualizado_en', { ascending: false })
      .limit(50),
  ]);

  const firstError = sectoresResult.error || categoriasResult.error || activosResult.error || ordenesResult.error || checklistsResult.error || ejecucionesResult.error || qrCodesResult.error;
  if (firstError) {
    throw new Error(firstError.message);
  }

  const sectores = (sectoresResult.data ?? []) as InfraestructuraSector[];
  const categorias = (categoriasResult.data ?? []) as InfraestructuraCategoriaActivo[];
  const activos = (activosResult.data ?? []) as InfraestructuraActivo[];
  const ordenes = (ordenesResult.data ?? []) as MantenimientoEdilicioOrden[];
  const checklists = ((checklistsResult.data ?? []) as InfraestructuraChecklistTemplate[]).map((template) => ({
    ...template,
    items: [...(template.items ?? [])].sort((a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0)),
  }));
  const checklistEjecuciones = (ejecucionesResult.data ?? []) as InfraestructuraChecklistEjecucion[];
  const qrCodes = (qrCodesResult.data ?? []) as InfraestructuraQrCodigo[];

  return {
    generated_at: new Date().toISOString(),
    sectores,
    categorias,
    activos,
    ordenes,
    alertas: buildAlertas(activos),
    checklists,
    checklistEjecuciones,
    qrCodes,
    metricas: calculateMetricas(sectores, activos, ordenes),
  };
}


export async function getInfraestructuraQrLabelsDashboard(): Promise<InfraestructuraQrLabelsDashboard> {
  const supabase = getInfraestructuraDbClient();

  const [qrCodesResult, activosResult, sectoresResult, equipamientosResult] = await Promise.all([
    supabase
      .from('infraestructura_qr_codigo')
      .select('*')
      .eq('activo', true)
      .order('target_type', { ascending: true })
      .order('titulo', { ascending: true }),
    supabase
      .from('infraestructura_activo')
      .select('id,nombre,codigo,estado,criticidad,sector:infraestructura_sector(nombre,tipo)')
      .eq('activo', true)
      .order('nombre', { ascending: true }),
    supabase
      .from('infraestructura_sector')
      .select('id,nombre,codigo,tipo,ubicacion_referencia')
      .eq('activo', true)
      .order('tipo', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('equipamiento')
      .select('id,nombre,tipo,marca,modelo,ubicacion,estado,activo')
      .eq('activo', true)
      .order('nombre', { ascending: true }),
  ]);

  const firstError = qrCodesResult.error || activosResult.error || sectoresResult.error || equipamientosResult.error;
  if (firstError) {
    throw new Error(firstError.message);
  }

  const activos = (activosResult.data ?? []).map((activo: any) => ({
    id: String(activo.id),
    nombre: String(activo.nombre ?? 'Activo edilicio'),
    codigo: activo.codigo ?? null,
    target_type: 'infra_activo',
    subtitulo: [activo.sector?.nombre, labelFromDbValue(activo.estado), labelFromDbValue(activo.criticidad)]
      .filter(Boolean)
      .join(' · '),
    metadata: {
      codigo_activo: activo.codigo ?? null,
      sector: activo.sector?.nombre ?? null,
      estado: activo.estado ?? null,
      criticidad: activo.criticidad ?? null,
    },
  }));

  const sectores = (sectoresResult.data ?? []).map((sector: any) => ({
    id: String(sector.id),
    nombre: String(sector.nombre ?? 'Sector'),
    codigo: sector.codigo ?? null,
    target_type: 'infra_sector',
    subtitulo: [labelFromDbValue(sector.tipo), sector.ubicacion_referencia].filter(Boolean).join(' · '),
    metadata: {
      codigo_sector: sector.codigo ?? null,
      tipo: sector.tipo ?? null,
      ubicacion_referencia: sector.ubicacion_referencia ?? null,
    },
  }));

  const equipamientos = (equipamientosResult.data ?? []).map((equipo: any) => ({
    id: String(equipo.id),
    nombre: String(equipo.nombre ?? 'Equipamiento'),
    codigo: null,
    target_type: 'equipamiento',
    subtitulo: [equipo.tipo, equipo.marca, equipo.modelo, equipo.ubicacion, labelFromDbValue(equipo.estado)]
      .filter(Boolean)
      .join(' · '),
    metadata: {
      tipo: equipo.tipo ?? null,
      marca: equipo.marca ?? null,
      modelo: equipo.modelo ?? null,
      ubicacion: equipo.ubicacion ?? null,
      estado: equipo.estado ?? null,
    },
  }));

  return {
    generated_at: new Date().toISOString(),
    qrCodes: (qrCodesResult.data ?? []) as InfraestructuraQrCodigo[],
    activos,
    sectores,
    equipamientos,
  };
}

function labelFromDbValue(value?: string | null) {
  if (!value) return '';
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function createInfraestructuraSector(
  payload: CreateInfraestructuraSectorDTO,
): Promise<InfraestructuraSector> {
  const supabase = getInfraestructuraDbClient();

  const nombre = String(payload.nombre ?? '').trim();
  if (!nombre) throw new Error('El nombre del sector es obligatorio.');

  const insertPayload = {
    nombre,
    codigo: payload.codigo?.trim() || normalizeCode(nombre),
    tipo: payload.tipo || 'otro',
    descripcion: payload.descripcion || null,
    parent_id: payload.parent_id || null,
    piso: payload.piso ?? null,
    superficie_m2: payload.superficie_m2 ?? null,
    capacidad: payload.capacidad ?? null,
    ubicacion_referencia: payload.ubicacion_referencia || null,
    activo: true,
  };

  const { data, error } = await supabase
    .from('infraestructura_sector')
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as InfraestructuraSector;
}

export async function createInfraestructuraActivo(
  payload: CreateInfraestructuraActivoDTO,
): Promise<InfraestructuraActivo> {
  const supabase = getInfraestructuraDbClient();

  const nombre = String(payload.nombre ?? '').trim();
  if (!nombre) throw new Error('El nombre del activo edilicio es obligatorio.');

  let categoria: InfraestructuraCategoriaActivo | null = null;
  if (payload.categoria_id) {
    const { data, error } = await supabase
      .from('infraestructura_categoria_activo')
      .select('*')
      .eq('id', payload.categoria_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    categoria = data as InfraestructuraCategoriaActivo | null;
  }

  const nowCodeSuffix = Date.now().toString().slice(-6);
  const codigo = payload.codigo?.trim() || `INF-${normalizeCode(nombre).toUpperCase()}-${nowCodeSuffix}`;
  const fechaBase = payload.fecha_instalacion || payload.fecha_adquisicion || new Date().toISOString().slice(0, 10);
  const frecuencia = categoria?.frecuencia_mantenimiento_dias ?? null;

  const insertPayload = {
    nombre,
    codigo,
    categoria_id: payload.categoria_id || null,
    sector_id: payload.sector_id || null,
    descripcion: payload.descripcion || null,
    marca: payload.marca || null,
    modelo: payload.modelo || null,
    nro_serie: payload.nro_serie || null,
    fecha_adquisicion: payload.fecha_adquisicion || null,
    fecha_instalacion: payload.fecha_instalacion || null,
    costo_adquisicion: payload.costo_adquisicion ?? null,
    vida_util_meses: payload.vida_util_meses ?? categoria?.vida_util_meses ?? null,
    valor_residual: payload.valor_residual ?? null,
    estado: payload.estado || 'operativo',
    criticidad: payload.criticidad || categoria?.criticidad_sugerida || 'media',
    fecha_ultimo_mantenimiento: null,
    fecha_proximo_mantenimiento:
      payload.fecha_proximo_mantenimiento || buildNextMaintenanceDate(fechaBase, frecuencia),
    fecha_vencimiento: payload.fecha_vencimiento || null,
    requiere_certificado: payload.requiere_certificado ?? categoria?.requiere_certificado ?? false,
    certificado_url: payload.certificado_url || null,
    imagen_url: payload.imagen_url || null,
    documento_url: payload.documento_url || null,
    observaciones: payload.observaciones || null,
    metadata: {},
    activo: true,
  };

  const { data, error } = await supabase
    .from('infraestructura_activo')
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as InfraestructuraActivo;
}

export async function createMantenimientoEdilicioOrden(
  payload: CreateMantenimientoEdilicioOrdenDTO,
): Promise<MantenimientoEdilicioOrden> {
  const supabase = getInfraestructuraDbClient();

  const titulo = String(payload.titulo ?? '').trim();
  if (!titulo) throw new Error('El título de la orden es obligatorio.');
  if (!payload.activo_id && !payload.sector_id) {
    throw new Error('La orden debe estar asociada a un activo edilicio o a un sector.');
  }

  const insertPayload = {
    activo_id: payload.activo_id || null,
    sector_id: payload.sector_id || null,
    tipo_orden: payload.tipo_orden || 'correctivo',
    prioridad: payload.prioridad || 'media',
    estado: 'abierta',
    titulo,
    descripcion: payload.descripcion || null,
    fecha_programada: payload.fecha_programada || null,
    fecha_vencimiento: payload.fecha_vencimiento || null,
    tecnico_responsable: payload.tecnico_responsable || null,
    proveedor_id: payload.proveedor_id || null,
    costo_estimado: payload.costo_estimado ?? null,
    observaciones: payload.observaciones || null,
    requiere_certificado: payload.requiere_certificado ?? false,
    registrado_por: payload.registrado_por || null,
    activo: true,
  };

  const { data, error } = await supabase
    .from('mantenimiento_edilicio_orden')
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (payload.activo_id) {
    await supabase
      .from('infraestructura_activo')
      .update({ estado: 'en_mantenimiento', actualizado_en: new Date().toISOString() })
      .eq('id', payload.activo_id);
  }

  return data as MantenimientoEdilicioOrden;
}

export async function updateMantenimientoEdilicioOrden(
  id: string,
  payload: UpdateMantenimientoEdilicioOrdenDTO,
): Promise<MantenimientoEdilicioOrden> {
  const supabase = getInfraestructuraDbClient();

  if (!id) throw new Error('ID de orden inválido.');

  const updatePayload: Record<string, unknown> = {
    ...payload,
    actualizado_en: new Date().toISOString(),
  };

  if (payload.estado === 'completada' && !payload.fecha_cierre) {
    updatePayload.fecha_cierre = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('mantenimiento_edilicio_orden')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const orden = data as MantenimientoEdilicioOrden;
  if (orden.activo_id && payload.estado === 'completada') {
    const fechaBase = String(updatePayload.fecha_cierre || new Date().toISOString()).slice(0, 10);

    const { data: activoData } = await supabase
      .from('infraestructura_activo')
      .select('categoria:infraestructura_categoria_activo(frecuencia_mantenimiento_dias)')
      .eq('id', orden.activo_id)
      .maybeSingle();

    const activoDataAny = activoData as { categoria?: { frecuencia_mantenimiento_dias?: number | null } | Array<{ frecuencia_mantenimiento_dias?: number | null }> } | null;
    const categoria = Array.isArray(activoDataAny?.categoria)
      ? activoDataAny?.categoria?.[0]
      : activoDataAny?.categoria;
    const proxima = buildNextMaintenanceDate(fechaBase, categoria?.frecuencia_mantenimiento_dias ?? null);

    await supabase
      .from('infraestructura_activo')
      .update({
        estado: 'operativo',
        fecha_ultimo_mantenimiento: fechaBase,
        fecha_proximo_mantenimiento: proxima,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', orden.activo_id);
  }

  return orden;
}


export async function createInfraestructuraQrCode(payload: CreateInfraestructuraQrDTO): Promise<InfraestructuraQrCodigo> {
  const supabase = getInfraestructuraDbClient();
  const targetType = String(payload.target_type ?? '').trim();
  const targetId = String(payload.target_id ?? '').trim();

  if (!targetType) throw new Error('El tipo de destino QR es obligatorio.');
  if (!targetId) throw new Error('El identificador destino del QR es obligatorio.');

  const targetInfo = await getQrTargetTitle(supabase, targetType, targetId);
  const codigo = normalizeQrCode(payload.codigo || buildGeneratedQrCode(targetType, targetId));
  const titulo = String(payload.titulo || targetInfo.titulo).trim();
  const route = buildQrRoute(targetType);

  const { data, error } = await supabase
    .from('infraestructura_qr_codigo')
    .upsert(
      {
        codigo,
        target_type: targetType,
        target_id: targetId,
        titulo,
        route,
        metadata: { ...(targetInfo.metadata ?? {}), ...(payload.metadata ?? {}) },
        activo: true,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'codigo' },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as InfraestructuraQrCodigo;
}

export async function resolveInfraestructuraQrCode(codigoInput: string): Promise<InfraestructuraQrResolveResult> {
  const supabase = getInfraestructuraDbClient();
  const codigo = normalizeQrCode(String(codigoInput ?? ''));
  if (!codigo) throw new Error('Ingresá o escaneá un código QR/barra válido.');

  const { data, error } = await supabase
    .from('infraestructura_qr_codigo')
    .select('*')
    .eq('codigo', codigo)
    .eq('activo', true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    return { found: false, codigo };
  }

  const qr = data as InfraestructuraQrCodigo;
  return {
    found: true,
    codigo: qr.codigo,
    target_type: qr.target_type,
    target_id: qr.target_id,
    titulo: qr.titulo,
    route: qr.route,
    metadata: qr.metadata ?? null,
  };
}

export async function createInfraestructuraChecklistEjecucion(
  payload: CreateInfraestructuraChecklistEjecucionDTO,
): Promise<InfraestructuraChecklistEjecucion> {
  const supabase = getInfraestructuraDbClient();
  const templateId = String(payload.template_id ?? '').trim();
  if (!templateId) throw new Error('Seleccioná un checklist para ejecutar.');
  if (!payload.activo_id && !payload.sector_id && !payload.orden_id) {
    throw new Error('La ejecución debe estar asociada a un activo, sector u orden edilicia.');
  }

  const { data: template, error: templateError } = await supabase
    .from('infraestructura_checklist_template')
    .select('*, items:infraestructura_checklist_item(*)')
    .eq('id', templateId)
    .maybeSingle();
  if (templateError) throw new Error(templateError.message);
  if (!template) throw new Error('No se encontró el checklist seleccionado.');

  const resultadoGeneral = payload.resultado_general || 'ok';
  const { data: ejecucion, error: ejecucionError } = await supabase
    .from('infraestructura_checklist_ejecucion')
    .insert({
      template_id: templateId,
      activo_id: payload.activo_id || null,
      sector_id: payload.sector_id || null,
      orden_id: payload.orden_id || null,
      resultado_general: resultadoGeneral,
      notas: payload.notas || null,
      foto_antes_url: payload.foto_antes_url || null,
      foto_despues_url: payload.foto_despues_url || null,
      ejecutado_por: payload.ejecutado_por || null,
      activo: true,
    })
    .select()
    .single();

  if (ejecucionError) throw new Error(ejecucionError.message);

  const templateItems = (template.items ?? []) as Array<{ id: string }>;
  const explicitResponses = payload.respuestas ?? [];
  const responsesByItem = new Map(explicitResponses.map((respuesta) => [respuesta.item_id, respuesta]));
  const responsesPayload = templateItems.map((item) => {
    const explicit = responsesByItem.get(item.id);
    return {
      ejecucion_id: ejecucion.id,
      item_id: item.id,
      resultado: explicit?.resultado || resultadoGeneral || 'ok',
      observacion: explicit?.observacion || null,
      foto_url: explicit?.foto_url || null,
    };
  });

  if (responsesPayload.length > 0) {
    const { error: respuestasError } = await supabase
      .from('infraestructura_checklist_respuesta')
      .insert(responsesPayload);
    if (respuestasError) throw new Error(respuestasError.message);
  }

  const { data: fullData, error: fullError } = await supabase
    .from('infraestructura_checklist_ejecucion')
    .select('*, template:infraestructura_checklist_template(*), infraestructura_activo(*), infraestructura_sector(*), mantenimiento_edilicio_orden(*), respuestas:infraestructura_checklist_respuesta(*)')
    .eq('id', ejecucion.id)
    .single();
  if (fullError) throw new Error(fullError.message);

  return fullData as InfraestructuraChecklistEjecucion;
}
