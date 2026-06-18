import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

import type { Equipamento } from '@/interfaces/equipamiento.interface';
import type {
  CreateEquipamientoOrdenTecnicaDTO,
  CreateEquipamientoPlanPreventivoDTO,
  EquipamientoHistorialTecnico,
  EquipamientoOrdenTecnica,
  EquipamientoPlanPreventivo,
  EquipamientoPreventivosDashboard,
  UpdateEquipamientoOrdenTecnicaDTO,
} from '@/interfaces/equipamientoPreventivo.interface';

function getEquipamientoPreventivoClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada para operar preventivos de equipamientos.');
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
    .slice(0, 80);
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function nextRevisionDate(baseDate: string, frecuenciaDias?: number | null) {
  return dayjs(baseDate).add(Number(frecuenciaDias || 90), 'day').format('YYYY-MM-DD');
}

function calculateMetricas(equipos: Equipamento[], ordenes: EquipamientoOrdenTecnica[], planes: EquipamientoPlanPreventivo[]) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const activeOrders = ordenes.filter((orden) => orden.activo !== false);
  const costoTecnicoMes = activeOrders.reduce((total, orden) => {
    const fechaBase = orden.fecha_cierre || orden.fecha_inicio || orden.fecha_programada || orden.creado_en;
    const fecha = fechaBase ? new Date(fechaBase) : null;
    if (!fecha || Number.isNaN(fecha.getTime())) return total;
    if (fecha.getMonth() !== month || fecha.getFullYear() !== year) return total;
    return total + Number(orden.costo_real ?? orden.costo_estimado ?? 0);
  }, 0);

  return {
    totalPlanes: planes.filter((plan) => plan.activo !== false).length,
    totalOrdenes: activeOrders.length,
    ordenesAbiertas: activeOrders.filter((orden) => ['abierta', 'en_progreso'].includes(String(orden.estado))).length,
    ordenesVencidas: activeOrders.filter((orden) => {
      const vencimiento = daysUntil(orden.fecha_vencimiento);
      return orden.estado === 'vencida' || (vencimiento !== null && vencimiento < 0 && orden.estado !== 'completada');
    }).length,
    equiposFueraServicio: equipos.filter((equipo) => String(equipo.estado).toLowerCase() === 'fuera de servicio').length,
    equiposEnMantenimiento: equipos.filter((equipo) => String(equipo.estado).toLowerCase() === 'en mantenimiento').length,
    costoTecnicoMes,
    downtimeAbierto: activeOrders.filter((orden) => orden.downtime_inicio && !orden.downtime_fin && orden.estado !== 'completada').length,
  };
}

export async function getEquipamientosPreventivosDashboard(): Promise<EquipamientoPreventivosDashboard> {
  const supabase = getEquipamientoPreventivoClient();

  const [equiposResult, planesResult, ordenesResult, historialResult] = await Promise.all([
    supabase.from('equipamiento').select('*').eq('activo', true).order('nombre', { ascending: true }),
    supabase
      .from('equipamiento_plan_preventivo')
      .select('*, tareas:equipamiento_plan_tarea(*)')
      .eq('activo', true)
      .order('nombre', { ascending: true }),
    supabase
      .from('equipamiento_orden_tecnica')
      .select('*, equipamiento(*), plan:equipamiento_plan_preventivo(*), tareas:equipamiento_orden_tarea(*)')
      .eq('activo', true)
      .order('fecha_vencimiento', { ascending: true, nullsFirst: false })
      .order('creado_en', { ascending: false })
      .limit(120),
    supabase
      .from('equipamiento_historial_tecnico')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(40),
  ]);

  const firstError = equiposResult.error || planesResult.error || ordenesResult.error || historialResult.error;
  if (firstError) throw new Error(firstError.message);

  const equipos = (equiposResult.data ?? []) as Equipamento[];
  const planes = ((planesResult.data ?? []) as EquipamientoPlanPreventivo[]).map((plan) => ({
    ...plan,
    tareas: [...(plan.tareas ?? [])].sort((a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0)),
  }));
  const ordenes = ((ordenesResult.data ?? []) as EquipamientoOrdenTecnica[]).map((orden) => ({
    ...orden,
    tareas: [...(orden.tareas ?? [])].sort((a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0)),
  }));
  const historial = (historialResult.data ?? []) as EquipamientoHistorialTecnico[];

  return {
    generated_at: new Date().toISOString(),
    equipos,
    planes,
    ordenes,
    historial,
    metricas: calculateMetricas(equipos, ordenes, planes),
  };
}

export async function createEquipamientoPlanPreventivo(
  payload: CreateEquipamientoPlanPreventivoDTO,
): Promise<EquipamientoPlanPreventivo> {
  const supabase = getEquipamientoPreventivoClient();
  const nombre = String(payload.nombre ?? '').trim();
  if (!nombre) throw new Error('El nombre del plan preventivo es obligatorio.');

  const codigo = payload.codigo?.trim() || normalizeCode(nombre);
  const frecuencia = Number(payload.frecuencia_dias || 90);

  const { data, error } = await supabase
    .from('equipamiento_plan_preventivo')
    .insert({
      codigo,
      nombre,
      descripcion: payload.descripcion || null,
      tipo_equipamiento: payload.tipo_equipamiento || null,
      id_tipo_equipamiento: payload.id_tipo_equipamiento || null,
      frecuencia_dias: frecuencia,
      criticidad: payload.criticidad || 'media',
      activo: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const tareas = (payload.tareas ?? [])
    .map((tarea) => String(tarea ?? '').trim())
    .filter(Boolean);

  if (tareas.length > 0) {
    const { error: tareasError } = await supabase.from('equipamiento_plan_tarea').insert(
      tareas.map((descripcion, index) => ({
        plan_id: data.id,
        descripcion,
        orden: (index + 1) * 10,
        requerido: true,
        activo: true,
      })),
    );
    if (tareasError) throw new Error(tareasError.message);
  }

  return data as EquipamientoPlanPreventivo;
}

export async function createEquipamientoOrdenTecnica(
  payload: CreateEquipamientoOrdenTecnicaDTO,
): Promise<EquipamientoOrdenTecnica> {
  const supabase = getEquipamientoPreventivoClient();
  const titulo = String(payload.titulo ?? '').trim();
  if (!titulo) throw new Error('El título de la orden técnica es obligatorio.');
  if (!payload.id_equipamiento) throw new Error('Seleccioná un equipamiento para crear la orden técnica.');

  let plan: EquipamientoPlanPreventivo | null = null;
  if (payload.plan_id) {
    const { data: planData, error: planError } = await supabase
      .from('equipamiento_plan_preventivo')
      .select('*, tareas:equipamiento_plan_tarea(*)')
      .eq('id', payload.plan_id)
      .maybeSingle();
    if (planError) throw new Error(planError.message);
    plan = planData as EquipamientoPlanPreventivo | null;
  }

  const fechaBase = payload.fecha_programada || new Date().toISOString().slice(0, 10);
  const fechaVencimiento = payload.fecha_vencimiento || fechaBase;

  const { data, error } = await supabase
    .from('equipamiento_orden_tecnica')
    .insert({
      id_equipamiento: payload.id_equipamiento,
      plan_id: payload.plan_id || null,
      tipo_orden: payload.tipo_orden || (payload.plan_id ? 'preventivo' : 'correctivo'),
      prioridad: payload.prioridad || plan?.criticidad || 'media',
      estado: 'abierta',
      titulo,
      descripcion: payload.descripcion || null,
      fecha_programada: fechaBase,
      fecha_vencimiento: fechaVencimiento,
      tecnico_responsable: payload.tecnico_responsable || null,
      costo_estimado: payload.costo_estimado ?? null,
      registrado_por: payload.registrado_por || null,
      activo: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const tareas = (plan?.tareas ?? []) as Array<{ descripcion: string; orden?: number | null }>;
  if (tareas.length > 0) {
    const { error: tareasError } = await supabase.from('equipamiento_orden_tarea').insert(
      tareas.map((tarea, index) => ({
        orden_id: data.id,
        descripcion: tarea.descripcion,
        orden: Number(tarea.orden ?? (index + 1) * 10),
        estado: 'pendiente',
        activo: true,
      })),
    );
    if (tareasError) throw new Error(tareasError.message);
  }

  await supabase
    .from('equipamiento')
    .update({ estado: 'en mantenimiento', observaciones: `Orden técnica abierta: ${titulo}` })
    .eq('id', payload.id_equipamiento);

  await supabase.from('equipamiento_historial_tecnico').insert({
    id_equipamiento: payload.id_equipamiento,
    orden_id: data.id,
    tipo_evento: 'orden_abierta',
    titulo: `Orden técnica abierta: ${titulo}`,
    detalle: payload.descripcion || null,
    costo: payload.costo_estimado ?? null,
  });

  return data as EquipamientoOrdenTecnica;
}

export async function updateEquipamientoOrdenTecnica(
  id: string,
  payload: UpdateEquipamientoOrdenTecnicaDTO,
): Promise<EquipamientoOrdenTecnica> {
  const supabase = getEquipamientoPreventivoClient();
  if (!id) throw new Error('ID de orden técnica inválido.');

  const updatePayload: Record<string, unknown> = {
    ...payload,
    actualizado_en: new Date().toISOString(),
  };

  if (payload.estado === 'completada' && !payload.fecha_cierre) {
    updatePayload.fecha_cierre = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('equipamiento_orden_tecnica')
    .update(updatePayload)
    .eq('id', id)
    .select('*, plan:equipamiento_plan_preventivo(*)')
    .single();

  if (error) throw new Error(error.message);
  const orden = data as EquipamientoOrdenTecnica;

  if (payload.estado === 'completada') {
    const fechaCierre = String(updatePayload.fecha_cierre || new Date().toISOString()).slice(0, 10);
    const frecuencia = Number(orden.plan?.frecuencia_dias || 90);
    await supabase
      .from('equipamiento')
      .update({
        estado: 'operativo',
        ultima_revision: fechaCierre,
        proxima_revision: nextRevisionDate(fechaCierre, frecuencia),
        observaciones: payload.resultado || payload.observaciones || 'Orden técnica completada.',
      })
      .eq('id', orden.id_equipamiento);

    await supabase.from('equipamiento_historial_tecnico').insert({
      id_equipamiento: orden.id_equipamiento,
      orden_id: orden.id,
      tipo_evento: 'orden_completada',
      titulo: `Orden técnica completada: ${orden.titulo}`,
      detalle: payload.resultado || payload.observaciones || null,
      costo: payload.costo_real ?? orden.costo_estimado ?? null,
    });
  }

  return orden;
}
