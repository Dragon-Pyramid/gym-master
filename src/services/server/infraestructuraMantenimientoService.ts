import { createClient } from '@supabase/supabase-js';
import type {
  CreateInfraestructuraActivoDTO,
  CreateInfraestructuraSectorDTO,
  CreateMantenimientoEdilicioOrdenDTO,
  InfraestructuraActivo,
  InfraestructuraCategoriaActivo,
  InfraestructuraMantenimientoDashboard,
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

export async function getInfraestructuraMantenimientoDashboard(): Promise<InfraestructuraMantenimientoDashboard> {
  const supabase = getInfraestructuraDbClient();

  const [sectoresResult, categoriasResult, activosResult, ordenesResult] = await Promise.all([
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
  ]);

  const firstError = sectoresResult.error || categoriasResult.error || activosResult.error || ordenesResult.error;
  if (firstError) {
    throw new Error(firstError.message);
  }

  const sectores = (sectoresResult.data ?? []) as InfraestructuraSector[];
  const categorias = (categoriasResult.data ?? []) as InfraestructuraCategoriaActivo[];
  const activos = (activosResult.data ?? []) as InfraestructuraActivo[];
  const ordenes = (ordenesResult.data ?? []) as MantenimientoEdilicioOrden[];

  return {
    generated_at: new Date().toISOString(),
    sectores,
    categorias,
    activos,
    ordenes,
    alertas: buildAlertas(activos),
    metricas: calculateMetricas(sectores, activos, ordenes),
  };
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
