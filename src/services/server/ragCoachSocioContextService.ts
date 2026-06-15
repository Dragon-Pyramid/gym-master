import type { JwtUser } from '@/interfaces/jwtUser.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';

export type RagCoachSocioContext = {
  socioId: string;
  socio: {
    nombre?: string | null;
    nivel?: number | null;
    objetivo?: number | null;
    diasPorSemana?: number | null;
    sexo?: string | null;
    edad?: number | null;
    fechaAlta?: string | null;
  } | null;
  rutinas: {
    total: number;
    recientes: Array<{
      id: number | string;
      nombre?: string | null;
      semana?: number | null;
      creadoEn?: string | null;
    }>;
  };
  dietas: {
    total: number;
    recientes: Array<{
      id: string;
      nombrePlan?: string | null;
      objetivo?: string | null;
      fechaInicio?: string | null;
      fechaFin?: string | null;
    }>;
  };
  evolucion: {
    total: number;
    tieneInicial: boolean;
    ultimaFecha?: string | null;
    ultimoPeso?: number | null;
    ultimaCintura?: number | null;
    ultimoImc?: number | null;
    ultimoPorcentajeGrasa?: number | null;
    ultimaMasaMuscular?: number | null;
  };
  asistencia: {
    ultimos30Dias: number;
    ultimos7Dias: number;
    ultimaFecha?: string | null;
  };
  fichaMedica: {
    existe: boolean;
    altura?: number | null;
    peso?: number | null;
    imc?: number | null;
    aprobacionMedica?: boolean | null;
    proximaRevision?: string | null;
    restriccionesSeguras: string[];
  };
  resumenHumano: string;
  hints: string[];
};

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toIsoDate(date);
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : null;
}

function calculateAge(dateValue?: string | null) {
  if (!dateValue) return null;
  const birth = new Date(dateValue);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

function buildSafeMedicalRestrictions(row: Record<string, unknown> | null) {
  if (!row) return [];
  const restrictions: string[] = [];

  if (row.problemas_cardiacos === true) {
    restrictions.push('Tiene antecedente cardíaco registrado: evitar intensidades agresivas sin validación profesional.');
  }

  if (row.problemas_respiratorios === true) {
    restrictions.push('Tiene antecedente respiratorio registrado: progresar volumen e intensidad con prudencia.');
  }

  if (typeof row.lesiones_previas === 'string' && row.lesiones_previas.trim()) {
    restrictions.push('Tiene lesiones previas registradas: priorizar técnica, progresión gradual y evitar dolor.');
  }

  if (typeof row.enfermedades_cronicas === 'string' && row.enfermedades_cronicas.trim()) {
    restrictions.push('Tiene antecedentes clínicos registrados: recomendar validación profesional ante cambios fuertes.');
  }

  if (typeof row.alergias === 'string' && row.alergias.trim()) {
    restrictions.push('Tiene alergias registradas: cuidar recomendaciones alimentarias.');
  }

  return restrictions;
}

function buildHumanSummary(context: Omit<RagCoachSocioContext, 'resumenHumano' | 'hints'>) {
  const parts = [
    `${context.rutinas.total} rutina${context.rutinas.total === 1 ? '' : 's'}`,
    `${context.dietas.total} dieta${context.dietas.total === 1 ? '' : 's'}`,
    `${context.evolucion.total} registro${context.evolucion.total === 1 ? '' : 's'} de evolución`,
    `${context.asistencia.ultimos30Dias} asistencia${context.asistencia.ultimos30Dias === 1 ? '' : 's'} en 30 días`,
  ];

  if (context.fichaMedica.existe) parts.push('ficha médica cargada');
  return `Usé tu contexto del sistema: ${parts.join(', ')}.`;
}

function buildHints(context: Omit<RagCoachSocioContext, 'resumenHumano' | 'hints'>) {
  const hints: string[] = [];

  if (context.rutinas.total === 0) {
    hints.push('No tiene rutinas previas: conviene iniciar con una rutina simple y sostenible.');
  } else {
    hints.push('Tiene rutinas previas: evitar repetir exactamente el mismo enfoque si pide una nueva rutina.');
  }

  if (context.dietas.total === 0) {
    hints.push('No tiene dietas previas: si genera rutina, ofrecer una dieta orientativa complementaria.');
  }

  if (context.evolucion.total === 0) {
    hints.push('No tiene evolución física inicial: recomendar cargar medidas iniciales.');
  } else {
    hints.push('Tiene evolución física: recomendar actualización mensual para comparar progreso real.');
  }

  if (context.asistencia.ultimos7Dias === 0) {
    hints.push('No registra asistencia reciente en 7 días: sugerir retomar de forma progresiva.');
  }

  if (context.fichaMedica.restriccionesSeguras.length > 0) {
    hints.push('Tiene observaciones preventivas de ficha médica: priorizar recomendaciones prudentes.');
  }

  return hints;
}

export async function buildRagCoachSocioContext(
  user: JwtUser,
  socioId: string,
): Promise<RagCoachSocioContext> {
  if (!socioId || socioId === 'me') {
    throw new Error('Debe indicar un socio real para construir contexto.');
  }

  if (user.rol === 'socio' && user.id_socio && user.id_socio !== socioId) {
    throw new Error('No autorizado para construir contexto de otro socio.');
  }

  const supabase = getSupabaseServerClient();
  const start30 = daysAgo(30);
  const start7 = daysAgo(7);

  const [socioRes, rutinasRes, dietasRes, evolucionRes, asistenciaRes, fichaRes] = await Promise.all([
    supabase
      .from('socio')
      .select('id_socio,nombre_completo,nivel,objetivo,dias_por_semana,sexo,fecnac,fecha_alta')
      .eq('id_socio', socioId)
      .maybeSingle(),
    supabase
      .from('rutina')
      .select('id_rutina,nombre,semana,creado_en')
      .eq('id_socio', socioId)
      .order('creado_en', { ascending: false })
      .limit(3),
    supabase
      .from('dieta')
      .select('id,nombre_plan,objetivo,fecha_inicio,fecha_fin,created_at')
      .eq('socio_id', socioId)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('evolucion_socio')
      .select('id,fecha,peso,cintura,imc,porcentaje_grasa,masa_muscular,es_registro_inicial')
      .eq('socio_id', socioId)
      .order('fecha', { ascending: false })
      .limit(5),
    supabase
      .from('asistencia')
      .select('fecha,hora_ingreso,hora_egreso')
      .eq('socio_id', socioId)
      .gte('fecha', start30)
      .order('fecha', { ascending: false })
      .limit(30),
    supabase
      .from('ficha_medica')
      .select('altura,peso,imc,aprobacion_medica,problemas_cardiacos,problemas_respiratorios,alergias,lesiones_previas,enfermedades_cronicas,proxima_revision')
      .eq('id_socio', socioId)
      .order('actualizado_en', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (socioRes.error) throw new Error(`Error al obtener contexto del socio: ${socioRes.error.message}`);
  if (rutinasRes.error) throw new Error(`Error al obtener rutinas del socio: ${rutinasRes.error.message}`);
  if (dietasRes.error) throw new Error(`Error al obtener dietas del socio: ${dietasRes.error.message}`);
  if (evolucionRes.error) throw new Error(`Error al obtener evolución del socio: ${evolucionRes.error.message}`);
  if (asistenciaRes.error) throw new Error(`Error al obtener asistencia del socio: ${asistenciaRes.error.message}`);
  if (fichaRes.error) throw new Error(`Error al obtener ficha médica del socio: ${fichaRes.error.message}`);

  const socioRow = (socioRes.data ?? null) as Record<string, unknown> | null;
  const rutinasRows = (rutinasRes.data ?? []) as Array<Record<string, unknown>>;
  const dietasRows = (dietasRes.data ?? []) as Array<Record<string, unknown>>;
  const evolucionRows = (evolucionRes.data ?? []) as Array<Record<string, unknown>>;
  const asistenciaRows = (asistenciaRes.data ?? []) as Array<Record<string, unknown>>;
  const fichaRow = (fichaRes.data ?? null) as Record<string, unknown> | null;
  const latestEvolution = evolucionRows[0] ?? null;
  const asistencia7 = asistenciaRows.filter((row) => typeof row.fecha === 'string' && row.fecha >= start7).length;

  const baseContext: Omit<RagCoachSocioContext, 'resumenHumano' | 'hints'> = {
    socioId,
    socio: socioRow
      ? {
          nombre: typeof socioRow.nombre_completo === 'string' ? socioRow.nombre_completo : null,
          nivel: toNumber(socioRow.nivel),
          objetivo: toNumber(socioRow.objetivo),
          diasPorSemana: toNumber(socioRow.dias_por_semana),
          sexo: typeof socioRow.sexo === 'string' ? socioRow.sexo : null,
          edad: typeof socioRow.fecnac === 'string' ? calculateAge(socioRow.fecnac) : null,
          fechaAlta: typeof socioRow.fecha_alta === 'string' ? socioRow.fecha_alta : null,
        }
      : null,
    rutinas: {
      total: rutinasRows.length,
      recientes: rutinasRows.map((row) => ({
        id: typeof row.id_rutina === 'number' || typeof row.id_rutina === 'string' ? row.id_rutina : '',
        nombre: typeof row.nombre === 'string' ? row.nombre : null,
        semana: toNumber(row.semana),
        creadoEn: typeof row.creado_en === 'string' ? row.creado_en : null,
      })),
    },
    dietas: {
      total: dietasRows.length,
      recientes: dietasRows.map((row) => ({
        id: typeof row.id === 'string' ? row.id : '',
        nombrePlan: typeof row.nombre_plan === 'string' ? row.nombre_plan : null,
        objetivo: typeof row.objetivo === 'string' ? row.objetivo : null,
        fechaInicio: typeof row.fecha_inicio === 'string' ? row.fecha_inicio : null,
        fechaFin: typeof row.fecha_fin === 'string' ? row.fecha_fin : null,
      })),
    },
    evolucion: {
      total: evolucionRows.length,
      tieneInicial: evolucionRows.some((row) => row.es_registro_inicial === true),
      ultimaFecha: typeof latestEvolution?.fecha === 'string' ? latestEvolution.fecha : null,
      ultimoPeso: toNumber(latestEvolution?.peso),
      ultimaCintura: toNumber(latestEvolution?.cintura),
      ultimoImc: toNumber(latestEvolution?.imc),
      ultimoPorcentajeGrasa: toNumber(latestEvolution?.porcentaje_grasa),
      ultimaMasaMuscular: toNumber(latestEvolution?.masa_muscular),
    },
    asistencia: {
      ultimos30Dias: asistenciaRows.length,
      ultimos7Dias: asistencia7,
      ultimaFecha: typeof asistenciaRows[0]?.fecha === 'string' ? asistenciaRows[0].fecha : null,
    },
    fichaMedica: {
      existe: Boolean(fichaRow),
      altura: toNumber(fichaRow?.altura),
      peso: toNumber(fichaRow?.peso),
      imc: toNumber(fichaRow?.imc),
      aprobacionMedica: toBoolean(fichaRow?.aprobacion_medica),
      proximaRevision: typeof fichaRow?.proxima_revision === 'string' ? fichaRow.proxima_revision : null,
      restriccionesSeguras: buildSafeMedicalRestrictions(fichaRow),
    },
  };

  return {
    ...baseContext,
    resumenHumano: buildHumanSummary(baseContext),
    hints: buildHints(baseContext),
  };
}
