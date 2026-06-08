import { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  AdminCuotasEstadoResponse,
  EstadoCuotaSocio,
  ResumenEstadoCuotas,
  ResumenPagoPorMetodo,
} from '@/interfaces/cuotaEstado.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';

const managerRoles = new Set(['admin', 'usuario']);
const DIAS_GRACIA_CUOTA = 7;

function assertCanViewAdminCuotas(user: JwtUser) {
  if (!managerRoles.has(user.rol)) {
    throw new Error('No autorizado para consultar estados de cuota administrativos');
  }
}

function assertCanViewSocioCuota(user: JwtUser, socioId: string) {
  if (user.rol === 'socio' && user.id_socio !== socioId) {
    throw new Error('No autorizado para consultar la cuota de otro socio');
  }

  if (user.rol !== 'socio' && !managerRoles.has(user.rol)) {
    throw new Error('No autorizado para consultar estado de cuota');
  }
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDateOnly(date: Date | null): string | null {
  if (!date) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(value: string | null, days: number): string | null {
  const date = toDateOnly(value);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return formatDateOnly(date);
}

function normalizeEstadoCuota(row: any): Omit<EstadoCuotaSocio, 'vencimiento_cuota' | 'fecha_limite_pago' | 'dias_gracia' | 'monto_adeudado'> {
  return {
    id_socio: String(row.id_socio),
    nombre_completo: String(row.nombre_completo ?? ''),
    activo: Boolean(row.activo),
    ultimo_pago: row.ultimo_pago ?? null,
    ultimo_vencimiento: row.ultimo_vencimiento ?? null,
    periodo_hasta: row.periodo_hasta ?? null,
    estado_cuota: row.estado_cuota,
    dias_vencido: toNumber(row.dias_vencido),
    metodo_pago: row.metodo_pago ?? null,
    meses_cubiertos:
      row.meses_cubiertos === null || row.meses_cubiertos === undefined
        ? null
        : toNumber(row.meses_cubiertos),
  };
}

async function getCuotaVigenteMonto(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const { data, error } = await supabase
    .from('cuota')
    .select('monto, fecha_inicio, activo')
    .eq('activo', true)
    .order('fecha_inicio', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error al obtener cuota vigente:', error.message);
    return 0;
  }

  return toNumber(data?.[0]?.monto);
}

function enrichEstadoCuota(
  estado: Omit<EstadoCuotaSocio, 'vencimiento_cuota' | 'fecha_limite_pago' | 'dias_gracia' | 'monto_adeudado'>,
  cuotaVigenteMonto: number
): EstadoCuotaSocio {
  const vencimientoCuota = estado.periodo_hasta ?? estado.ultimo_vencimiento;
  const fechaLimitePago = addDays(vencimientoCuota, DIAS_GRACIA_CUOTA);

  return {
    ...estado,
    vencimiento_cuota: vencimientoCuota ?? null,
    fecha_limite_pago: fechaLimitePago,
    dias_gracia: DIAS_GRACIA_CUOTA,
    monto_adeudado: estado.estado_cuota === 'al_dia' ? 0 : cuotaVigenteMonto,
  };
}

function getTodayOnlyDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);
}

function isNextSevenDays(dateValue: string | null): boolean {
  if (!dateValue) return false;
  const today = getTodayOnlyDate();
  const target = new Date(`${dateValue}T00:00:00`);
  const diff = daysBetween(today, target);
  return diff >= 0 && diff <= 7;
}

function buildResumen(socios: EstadoCuotaSocio[]): ResumenEstadoCuotas {
  return socios.reduce<ResumenEstadoCuotas>(
    (acc, socio) => {
      acc.total_socios += 1;

      if (socio.estado_cuota === 'al_dia') acc.al_dia += 1;
      if (socio.estado_cuota === 'vencido') acc.vencidos += 1;
      if (socio.estado_cuota === 'sin_pagos') acc.sin_pagos += 1;
      if (socio.estado_cuota === 'al_dia' && isNextSevenDays(socio.periodo_hasta)) {
        acc.proximos_a_vencer += 1;
      }

      return acc;
    },
    {
      total_socios: 0,
      al_dia: 0,
      vencidos: 0,
      sin_pagos: 0,
      proximos_a_vencer: 0,
    }
  );
}

export async function getEstadoCuotaSocioServer(
  user: JwtUser,
  socioId: string
): Promise<EstadoCuotaSocio> {
  assertCanViewSocioCuota(user, socioId);

  const supabase = getSupabaseServerClient();
  const [{ data, error }, cuotaVigenteMonto] = await Promise.all([
    supabase.rpc('obtener_estado_cuota_socio', {
      p_id_socio: socioId,
    }),
    getCuotaVigenteMonto(supabase),
  ]);

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('No se encontró estado de cuota para el socio solicitado');

  return enrichEstadoCuota(normalizeEstadoCuota(row), cuotaVigenteMonto);
}

export async function getSociosEstadoCuotaServer(
  user: JwtUser
): Promise<EstadoCuotaSocio[]> {
  assertCanViewAdminCuotas(user);

  const supabase = getSupabaseServerClient();
  const [{ data, error }, cuotaVigenteMonto] = await Promise.all([
    supabase.rpc('obtener_socios_estado_cuota'),
    getCuotaVigenteMonto(supabase),
  ]);

  if (error) throw new Error(error.message);

  return ((data ?? []) as any[])
    .map((row) => enrichEstadoCuota(normalizeEstadoCuota(row), cuotaVigenteMonto))
    .sort((a, b) => {
      const statePriority: Record<string, number> = {
        vencido: 0,
        sin_pagos: 1,
        al_dia: 2,
      };

      const priorityDiff =
        (statePriority[a.estado_cuota] ?? 99) - (statePriority[b.estado_cuota] ?? 99);

      if (priorityDiff !== 0) return priorityDiff;
      return a.nombre_completo.localeCompare(b.nombre_completo);
    });
}

export async function getPagosPorMetodoServer(
  user: JwtUser
): Promise<ResumenPagoPorMetodo[]> {
  assertCanViewAdminCuotas(user);

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('pago')
    .select('metodo_pago, estado, monto_pagado, activo')
    .eq('activo', true);

  if (error) throw new Error(error.message);

  const grouped = new Map<string, ResumenPagoPorMetodo>();

  for (const pago of data ?? []) {
    const metodo = pago.metodo_pago ?? 'sin_metodo';
    const estado = pago.estado ?? 'sin_estado';
    const key = `${metodo}::${estado}`;
    const current = grouped.get(key) ?? {
      metodo_pago: metodo,
      estado,
      cantidad: 0,
      total_pagado: 0,
    };

    current.cantidad += 1;
    current.total_pagado += toNumber(pago.monto_pagado);
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).sort((a, b) =>
    `${a.metodo_pago}-${a.estado}`.localeCompare(`${b.metodo_pago}-${b.estado}`)
  );
}

export async function getAdminCuotasEstadoServer(
  user: JwtUser
): Promise<AdminCuotasEstadoResponse> {
  const socios = await getSociosEstadoCuotaServer(user);
  const pagosPorMetodo = await getPagosPorMetodoServer(user);

  return {
    resumen: buildResumen(socios),
    socios,
    vencidos: socios.filter((socio) => socio.estado_cuota === 'vencido'),
    sin_pagos: socios.filter((socio) => socio.estado_cuota === 'sin_pagos'),
    proximos_vencer: socios.filter(
      (socio) => socio.estado_cuota === 'al_dia' && isNextSevenDays(socio.periodo_hasta)
    ),
    pagos_por_metodo: pagosPorMetodo,
  };
}
