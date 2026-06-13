import { JwtUser } from '@/interfaces/jwtUser.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import {
  getEstadoCuotaSocioServer,
  getSociosEstadoCuotaServer,
} from '@/services/server/cuotaEstadoServerService';

export type HeaderNotificationSeverity = 'alta' | 'media' | 'baja';
export type HeaderNotificationAudience = 'socio' | 'gestion';

export interface HeaderNotificationItem {
  id: string;
  audience: HeaderNotificationAudience;
  type:
    | 'cuota'
    | 'acceso'
    | 'mensaje'
    | 'ficha_medica'
    | 'stock'
    | 'mantenimiento'
    | 'sistema';
  severity: HeaderNotificationSeverity;
  title: string;
  summary: string;
  route: string;
  count?: number;
  created_at?: string | null;
}

export interface HeaderNotificationsResponse {
  total: number;
  items: HeaderNotificationItem[];
  generated_at: string;
}

const managerRoles = new Set(['admin', 'usuario']);
const DIAS_GRACIA_CUOTA = 7;
const MAX_ITEMS = 9;

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);
}

function todayOnlyDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function sortNotifications(items: HeaderNotificationItem[]) {
  const severityPriority: Record<HeaderNotificationSeverity, number> = {
    alta: 0,
    media: 1,
    baja: 2,
  };

  return [...items].sort((a, b) => {
    const severityDiff = severityPriority[a.severity] - severityPriority[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return (b.count ?? 0) - (a.count ?? 0);
  });
}

async function buildSocioNotifications(user: JwtUser): Promise<HeaderNotificationItem[]> {
  const socioId = user.id_socio;
  if (!socioId) return [];

  const supabase = getSupabaseServerClient();
  const items: HeaderNotificationItem[] = [];

  try {
    const estado = await getEstadoCuotaSocioServer(user, socioId);
    const estadoCuota = estado.estado_cuota;
    const diasVencido = toNumber(estado.dias_vencido);

    if (estadoCuota === 'vencido' || estadoCuota === 'sin_pagos') {
      items.push({
        id: `socio-cuota-${socioId}`,
        audience: 'socio',
        type: 'cuota',
        severity: 'alta',
        title: estadoCuota === 'sin_pagos' ? 'Cuota sin pagos registrados' : 'Cuota vencida',
        summary:
          estadoCuota === 'sin_pagos'
            ? 'No registrás pagos activos. Regularizá tu cuota para mantener el acceso.'
            : `Tu cuota está vencida${diasVencido > 0 ? ` hace ${diasVencido} días` : ''}.`,
        route: '/dashboard/mi-cuenta/pagar-cuota',
        count: 1,
      });
    }

    if (estadoCuota === 'vencido' && diasVencido >= Math.max(DIAS_GRACIA_CUOTA - 2, 1)) {
      const diasRestantes = Math.max(DIAS_GRACIA_CUOTA - diasVencido, 0);
      items.push({
        id: `socio-acceso-${socioId}`,
        audience: 'socio',
        type: 'acceso',
        severity: 'alta',
        title: diasRestantes > 0 ? 'Tu acceso puede bloquearse pronto' : 'Acceso en riesgo por mora',
        summary:
          diasRestantes > 0
            ? `Te quedan ${diasRestantes} día(s) de gracia para regularizar la cuota.`
            : 'Regularizá tu cuota para evitar restricciones de ingreso al sistema o al gimnasio.',
        route: '/dashboard/mi-cuenta/pagar-cuota',
        count: 1,
      });
    }

    if (estadoCuota === 'al_dia') {
      const vencimiento = estado.periodo_hasta ?? estado.vencimiento_cuota;
      const vencimientoDate = toDateOnly(vencimiento);
      if (vencimientoDate) {
        const diff = daysBetween(todayOnlyDate(), vencimientoDate);
        if (diff >= 0 && diff <= 7) {
          items.push({
            id: `socio-cuota-proxima-${socioId}`,
            audience: 'socio',
            type: 'cuota',
            severity: 'media',
            title: 'Tu cuota está por vencer',
            summary: `Tu período vigente vence en ${diff} día(s).`,
            route: '/dashboard/mi-cuenta/pagar-cuota',
            count: 1,
          });
        }
      }
    }
  } catch (error) {
    console.warn('No se pudo construir notificación de cuota del socio:', error);
  }

  const [{ count: mensajesRespondidos }, { data: fichaMedica }] = await Promise.all([
    supabase
      .from('socio_mensaje')
      .select('id', { count: 'exact', head: true })
      .eq('socio_id', socioId)
      .eq('activo', true)
      .eq('estado', 'respondido'),
    supabase
      .from('ficha_medica')
      .select('id, proxima_revision')
      .eq('id_socio', socioId)
      .order('actualizado_en', { ascending: false })
      .limit(1),
  ]);

  if ((mensajesRespondidos ?? 0) > 0) {
    items.push({
      id: `socio-mensajes-${socioId}`,
      audience: 'socio',
      type: 'mensaje',
      severity: 'media',
      title: 'Tenés mensajes en tu casilla',
      summary: `Tenés ${mensajesRespondidos} mensaje(s) respondidos por administración.`,
      route: '/dashboard/mensajes',
      count: mensajesRespondidos ?? 0,
    });
  }

  const ficha = Array.isArray(fichaMedica) ? fichaMedica[0] : null;
  if (!ficha) {
    items.push({
      id: `socio-ficha-${socioId}`,
      audience: 'socio',
      type: 'ficha_medica',
      severity: 'media',
      title: 'Completá tu ficha médica',
      summary: 'Tu ficha médica todavía no está cargada. Completala para mejorar tu seguimiento.',
      route: '/dashboard/ficha-medica',
      count: 1,
    });
  } else if (ficha.proxima_revision) {
    const revisionDate = toDateOnly(ficha.proxima_revision);
    if (revisionDate && revisionDate <= todayOnlyDate()) {
      items.push({
        id: `socio-ficha-revision-${socioId}`,
        audience: 'socio',
        type: 'ficha_medica',
        severity: 'baja',
        title: 'Actualizá tu ficha médica',
        summary: 'La próxima revisión médica indicada ya venció o corresponde actualizarla.',
        route: '/dashboard/ficha-medica',
        count: 1,
      });
    }
  }

  return sortNotifications(items).slice(0, MAX_ITEMS);
}

async function buildGestionNotifications(user: JwtUser): Promise<HeaderNotificationItem[]> {
  if (!managerRoles.has(user.rol)) return [];

  const supabase = getSupabaseServerClient();
  const items: HeaderNotificationItem[] = [];

  try {
    const estados = await getSociosEstadoCuotaServer(user);
    const vencidos = estados.filter((socio) => socio.estado_cuota === 'vencido').length;
    const sinPagos = estados.filter((socio) => socio.estado_cuota === 'sin_pagos').length;
    const totalDeuda = vencidos + sinPagos;

    if (totalDeuda > 0) {
      items.push({
        id: 'gestion-cuotas-vencidas',
        audience: 'gestion',
        type: 'cuota',
        severity: 'alta',
        title: 'Socios con cuotas vencidas',
        summary: `${totalDeuda} socio(s) requieren seguimiento: ${vencidos} vencido(s), ${sinPagos} sin pagos.`,
        route: '/dashboard/pagos',
        count: totalDeuda,
      });
    }
  } catch (error) {
    console.warn('No se pudo construir notificación administrativa de cuotas:', error);
  }

  const [productosResponse, mensajesResponse, mantenimientosResponse, equiposResponse] = await Promise.all([
    supabase
      .from('producto')
      .select('id,nombre,stock,stock_minimo,activo')
      .eq('activo', true)
      .limit(500),
    supabase
      .from('socio_mensaje')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true)
      .in('estado', ['pendiente', 'leido']),
    supabase
      .from('mantenimiento')
      .select('id, estado, fecha_mantenimiento')
      .neq('estado', 'completado')
      .limit(500),
    supabase
      .from('equipamiento')
      .select('id, proxima_revision, activo')
      .eq('activo', true)
      .not('proxima_revision', 'is', null)
      .limit(500),
  ]);

  const productosCriticos = (productosResponse.data ?? []).filter((producto: any) => {
    const stock = toNumber(producto.stock);
    const minimo = toNumber(producto.stock_minimo);
    return stock <= minimo;
  });

  if (productosCriticos.length > 0) {
    const agotados = productosCriticos.filter((producto: any) => toNumber(producto.stock) <= 0).length;
    items.push({
      id: 'gestion-stock-critico',
      audience: 'gestion',
      type: 'stock',
      severity: agotados > 0 ? 'alta' : 'media',
      title: 'Stock crítico',
      summary:
        agotados > 0
          ? `${productosCriticos.length} producto(s) en stock crítico; ${agotados} sin stock.`
          : `${productosCriticos.length} producto(s) están en stock mínimo o por debajo.`,
      route: '/dashboard/productos',
      count: productosCriticos.length,
    });
  }

  const mensajesPendientes = mensajesResponse.count ?? 0;
  if (mensajesPendientes > 0) {
    items.push({
      id: 'gestion-mensajes-socios',
      audience: 'gestion',
      type: 'mensaje',
      severity: 'media',
      title: 'Mensajes de socios pendientes',
      summary: `${mensajesPendientes} mensaje(s) requieren lectura o respuesta.`,
      route: '/dashboard/mensajes-admin',
      count: mensajesPendientes,
    });
  }

  const today = todayOnlyDate();
  const mantenimientos = (mantenimientosResponse.data ?? []) as Array<{
    id: string;
    estado?: string | null;
    fecha_mantenimiento?: string | null;
  }>;
  const mantenimientosVencidos = mantenimientos.filter((mantenimiento) => {
    const fecha = toDateOnly(mantenimiento.fecha_mantenimiento);
    return fecha ? fecha <= today : true;
  }).length;

  const equiposRevision = (equiposResponse.data ?? []).filter((equipo: any) => {
    const fecha = toDateOnly(equipo.proxima_revision);
    return fecha ? fecha <= today : false;
  }).length;

  const totalMantenimiento = mantenimientosVencidos + equiposRevision;
  if (totalMantenimiento > 0) {
    items.push({
      id: 'gestion-mantenimiento-equipos',
      audience: 'gestion',
      type: 'mantenimiento',
      severity: 'media',
      title: 'Mantenimientos de equipos pendientes',
      summary: `${totalMantenimiento} alerta(s): ${mantenimientosVencidos} mantenimiento(s) y ${equiposRevision} revisión(es) vencida(s).`,
      route: '/dashboard/equipamientos',
      count: totalMantenimiento,
    });
  }

  return sortNotifications(items).slice(0, MAX_ITEMS);
}

export async function getHeaderNotificationsServer(
  user: JwtUser
): Promise<HeaderNotificationsResponse> {
  const items = user.rol === 'socio'
    ? await buildSocioNotifications(user)
    : await buildGestionNotifications(user);

  const total = items.reduce((acc, item) => acc + Math.max(1, toNumber(item.count)), 0);

  return {
    total,
    items,
    generated_at: new Date().toISOString(),
  };
}
