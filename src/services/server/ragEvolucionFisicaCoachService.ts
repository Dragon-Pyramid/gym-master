import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type { EvolucionSocio } from '@/interfaces/evolucionSocio.interface';
import type {
  RagEvolucionFisicaAssistantRequest,
  RagEvolucionFisicaContextResult,
  RagEvolucionFisicaContextSummary,
  RagEvolucionFisicaMetricDelta,
  RagEvolucionFisicaProgressSummary,
} from '@/interfaces/ragEvolucionFisicaAssistant.interface';
import { getRagConfig } from '@/lib/rag/ragConfig';
import { findAllEvolucionesSocioByIdSocio } from '@/services/evolucionSocioService';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { createSingleRagEmbedding } from './ragEmbeddingProviderService';
import {
  aiGeneratedContentTx,
  buildAiEvolutionBaseDisclaimers,
  normalizeAiGeneratedContentLocale,
  translateAiGeneratedTechnicalText,
} from '@/utils/aiGeneratedContentI18n';

const DEFAULT_EVOLUTION_MATCH_THRESHOLD = 0.3;
const DEFAULT_EVOLUTION_MATCH_COUNT = 8;
const MAX_QUERY_LENGTH = 1800;


function cleanText(value: unknown, maxLength = MAX_QUERY_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readNumber(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null;
}

function round2(value: number) {
  return Number(value.toFixed(2));
}

function diffMetric(initial?: number | null, current?: number | null): RagEvolucionFisicaMetricDelta {
  const inicial = toNumber(initial);
  const actual = toNumber(current);

  if (inicial === null || actual === null) {
    return { inicial, actual, diferencia: null, porcentajeCambio: null };
  }

  const diferencia = round2(actual - inicial);
  const porcentajeCambio = inicial !== 0 ? round2((diferencia / inicial) * 100) : null;

  return { inicial, actual, diferencia, porcentajeCambio };
}

function sortRowsAsc(rows: EvolucionSocio[]) {
  return [...rows].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  );
}

function daysBetween(initial?: string | null, current?: string | null) {
  if (!initial || !current) return null;
  const a = new Date(initial).getTime();
  const b = new Date(current).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

function buildTrend(summary: Omit<RagEvolucionFisicaProgressSummary, 'tendenciaPrincipal'>) {
  const peso = summary.peso.diferencia;
  const cintura = summary.cintura.diferencia;
  const grasa = summary.porcentajeGrasa.diferencia;
  const masa = summary.masaMuscular.diferencia;

  if (summary.totalRegistros < 2) {
    return 'Hay un solo registro disponible. Se necesita al menos una segunda medición para analizar tendencia.';
  }

  if ((cintura ?? 0) < 0 && (grasa ?? 0) <= 0) {
    return 'La tendencia principal muestra mejora de composición corporal, especialmente por reducción de cintura/grasa.';
  }

  if ((masa ?? 0) > 0 && (cintura ?? 0) <= 0) {
    return 'La tendencia principal sugiere ganancia de masa muscular con control de perímetro abdominal.';
  }

  if ((peso ?? 0) > 0 && (cintura ?? 0) > 0) {
    return 'La tendencia principal muestra aumento de peso y cintura. Conviene revisar alimentación, adherencia y estímulo de entrenamiento.';
  }

  if ((peso ?? 0) < 0 && (masa ?? 0) < 0) {
    return 'La tendencia muestra descenso de peso con posible pérdida de masa muscular. Conviene revisar ingesta proteica y entrenamiento de fuerza.';
  }

  return 'La evolución es mixta o estable. Conviene sostener mediciones periódicas y ajustar según objetivo.';
}

export function buildEvolucionFisicaProgress(rows: EvolucionSocio[]): RagEvolucionFisicaProgressSummary {
  const ordered = sortRowsAsc(rows);
  const inicial = ordered[0] ?? null;
  const actual = ordered[ordered.length - 1] ?? null;

  const base = {
    totalRegistros: rows.length,
    fechaInicial: inicial?.fecha ?? null,
    fechaActual: actual?.fecha ?? null,
    diasAnalizados: daysBetween(inicial?.fecha, actual?.fecha),
    peso: diffMetric(inicial?.peso, actual?.peso),
    cintura: diffMetric(inicial?.cintura, actual?.cintura),
    imc: diffMetric(inicial?.imc, actual?.imc),
    porcentajeGrasa: diffMetric(inicial?.porcentaje_grasa, actual?.porcentaje_grasa),
    masaMuscular: diffMetric(inicial?.masa_muscular, actual?.masa_muscular),
  };

  return {
    ...base,
    tendenciaPrincipal: buildTrend(base),
  };
}

function formatMetric(label: string, metric: RagEvolucionFisicaMetricDelta, suffix = '') {
  if (metric.inicial === null && metric.actual === null) return `${label}: sin datos.`;
  return `${label}: inicial ${metric.inicial ?? '-'}${suffix}, actual ${metric.actual ?? '-'}${suffix}, diferencia ${metric.diferencia !== null ? `${metric.diferencia > 0 ? '+' : ''}${metric.diferencia}${suffix}` : '-'}.`;
}

function buildQuery(params: {
  payload: RagEvolucionFisicaAssistantRequest;
  progress: RagEvolucionFisicaProgressSummary;
}) {
  const objetivo = cleanText(params.payload.objetivo, 400);
  const mensaje = cleanText(params.payload.mensajeSocio, 700);
  const restricciones = cleanText(params.payload.restricciones, 700);
  const progress = params.progress;

  return [
    'Analizar evolución física de socio de gimnasio y sugerir ajustes prudentes de rutina, dieta y hábitos.',
    objetivo ? `Objetivo declarado: ${objetivo}.` : '',
    mensaje ? `Pedido del socio: ${mensaje}.` : '',
    restricciones ? `Restricciones o cuidados: ${restricciones}.` : '',
    `Tendencia: ${progress.tendenciaPrincipal}`,
    formatMetric('Peso', progress.peso, ' kg'),
    formatMetric('Cintura', progress.cintura, ' cm'),
    formatMetric('IMC', progress.imc),
    formatMetric('Grasa corporal', progress.porcentajeGrasa, '%'),
    formatMetric('Masa muscular', progress.masaMuscular, ' kg'),
    'Priorizar seguridad, progresión, adherencia, entrenamiento de fuerza, descanso y recomendaciones no médicas.',
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, MAX_QUERY_LENGTH);
}

function mapRpcResult(row: Record<string, unknown>): RagEvolucionFisicaContextResult {
  return {
    chunkId: String(row.chunk_id),
    documentId: String(row.document_id),
    title: String(row.title ?? 'Referencia RAG'),
    sourceId: String(row.source_id ?? ''),
    sourceTable: String(row.source_table ?? ''),
    domain: String(row.domain ?? ''),
    content: cleanText(row.content, 900),
    metadata: normalizeMetadata(row.metadata),
    documentMetadata: normalizeMetadata(row.document_metadata),
    similarity: Number(row.similarity ?? 0),
  };
}

function buildRagSummary(results: RagEvolucionFisicaContextResult[], locale: ReturnType<typeof normalizeAiGeneratedContentLocale>) {
  if (!results.length) {
    return aiGeneratedContentTx(locale, 'No se recuperaron referencias desde el RAG. Se utilizó análisis local seguro sobre la evolución física registrada.', 'No references were retrieved from RAG. Safe local analysis was used on the recorded physical evolution.');
  }

  const titles = results
    .slice(0, 5)
    .map((result) => result.title)
    .filter(Boolean)
    .join(', ');

  return aiGeneratedContentTx(
    locale,
    `El RAG Coach recuperó ${results.length} referencias para orientar la interpretación de evolución física. Principales coincidencias: ${titles}.`,
    `The RAG Coach retrieved ${results.length} references to guide the physical evolution interpretation. Main matches: ${titles}.`,
  );
}

function buildRecommendations(progress: RagEvolucionFisicaProgressSummary, locale: ReturnType<typeof normalizeAiGeneratedContentLocale>) {
  const recommendations: string[] = [];

  if (progress.totalRegistros < 2) {
    recommendations.push(aiGeneratedContentTx(locale, 'Registrar al menos una segunda medición en 2 a 4 semanas para poder comparar tendencia real.', 'Record at least a second measurement in 2 to 4 weeks to compare a real trend.'));
  }

  if ((progress.cintura.diferencia ?? 0) < 0) {
    recommendations.push(aiGeneratedContentTx(locale, 'Mantener el plan actual si el objetivo incluye recomposición o reducción de grasa, porque la cintura viene bajando.', 'Keep the current plan if the goal includes recomposition or fat reduction, because waist measurements are decreasing.'));
  }

  if ((progress.masaMuscular.diferencia ?? 0) > 0) {
    recommendations.push(aiGeneratedContentTx(locale, 'Sostener entrenamiento de fuerza progresivo y descanso, ya que la masa muscular muestra mejora.', 'Maintain progressive strength training and recovery, since muscle mass shows improvement.'));
  }

  if ((progress.peso.diferencia ?? 0) > 0 && (progress.cintura.diferencia ?? 0) > 0) {
    recommendations.push(aiGeneratedContentTx(locale, 'Revisar exceso calórico, calidad de alimentos y volumen semanal de actividad, porque subieron peso y cintura.', 'Review calorie surplus, food quality, and weekly activity volume, because weight and waist measurements increased.'));
  }

  if ((progress.peso.diferencia ?? 0) < 0 && (progress.masaMuscular.diferencia ?? 0) < 0) {
    recommendations.push(aiGeneratedContentTx(locale, 'Evitar recortes agresivos de calorías y reforzar proteína/entrenamiento de fuerza para proteger masa muscular.', 'Avoid aggressive calorie cuts and reinforce protein intake/strength training to protect muscle mass.'));
  }

  if (recommendations.length === 0) {
    recommendations.push(aiGeneratedContentTx(locale, 'Continuar con mediciones periódicas, adherencia a rutina y ajustes moderados según el objetivo del socio.', "Continue with periodic measurements, routine adherence, and moderate adjustments according to the member's goal."));
  }

  recommendations.push(aiGeneratedContentTx(locale, 'Validar cambios importantes de dieta o entrenamiento con profesional si existen lesiones, dolor o antecedentes clínicos.', 'Validate major diet or training changes with a professional if there are injuries, pain, or clinical history.'));

  return recommendations;
}

function buildAlerts(payload: RagEvolucionFisicaAssistantRequest, progress: RagEvolucionFisicaProgressSummary, locale: ReturnType<typeof normalizeAiGeneratedContentLocale>) {
  const alerts: string[] = [];
  const text = cleanText(`${payload.mensajeSocio ?? ''} ${payload.restricciones ?? ''}`, 2000)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (/\b(dolor|lesion|lesionado|rodilla|hombro|espalda|hernia)\b/.test(text)) {
    alerts.push(aiGeneratedContentTx(locale, 'Se detectó posible lesión/dolor. Evitar progresiones agresivas y validar con profesional.', 'Possible injury/pain detected. Avoid aggressive progressions and validate with a professional.'));
  }

  if (/\b(mareo|desmayo|pecho|taquicardia|presion|hipertension)\b/.test(text)) {
    alerts.push(aiGeneratedContentTx(locale, 'Se detectó posible señal cardiovascular o síntoma sensible. Requiere evaluación profesional antes de intensificar entrenamiento.', 'Possible cardiovascular signal or sensitive symptom detected. Professional evaluation is required before intensifying training.'));
  }

  if (progress.diasAnalizados !== null && progress.diasAnalizados <= 7 && Math.abs(progress.peso.diferencia ?? 0) >= 3) {
    alerts.push(aiGeneratedContentTx(locale, 'Cambio de peso brusco en pocos días. Revisar medición, hidratación y salud general.', 'Abrupt weight change in a few days. Review the measurement, hydration, and general health.'));
  }

  return alerts;
}

async function buildRagContext(
  payload: RagEvolucionFisicaAssistantRequest,
  progress: RagEvolucionFisicaProgressSummary,
): Promise<RagEvolucionFisicaContextSummary> {
  const locale = normalizeAiGeneratedContentLocale(payload.idioma);
  const warnings: string[] = [];
  const config = getRagConfig();

  if (!config.enabled) {
    return {
      enabled: false,
      used: false,
      query: '',
      results: [],
      summary: aiGeneratedContentTx(locale, 'RAG desactivado. Se usa análisis local seguro.', 'RAG is disabled. Safe local analysis is used.'),
      warnings: [translateAiGeneratedTechnicalText('RAG_ENABLED=false.', locale)],
    };
  }

  if (config.provider === 'github' && !config.githubToken) warnings.push(translateAiGeneratedTechnicalText('Falta GITHUB_TOKEN.', locale));
  if (config.provider === 'openai' && !config.openaiApiKey) warnings.push(translateAiGeneratedTechnicalText('Falta OPENAI_API_KEY.', locale));

  if (warnings.length > 0) {
    return {
      enabled: true,
      used: false,
      query: '',
      results: [],
      summary: aiGeneratedContentTx(locale, 'RAG configurado parcialmente. Se usa análisis local seguro.', 'RAG is partially configured. Safe local analysis is used.'),
      warnings,
    };
  }

  const query = buildQuery({ payload, progress });
  const embedding = await createSingleRagEmbedding(query);
  const supabase = getSupabaseServerClient();
  const matchThreshold = readNumber(
    'RAG_EVOLUTION_MATCH_THRESHOLD',
    Math.min(config.matchThreshold, DEFAULT_EVOLUTION_MATCH_THRESHOLD),
    0,
    1,
  );
  const matchCount = readNumber('RAG_EVOLUTION_MATCH_COUNT', DEFAULT_EVOLUTION_MATCH_COUNT, 1, 20);

  const { data, error } = await supabase.rpc(config.vectorRpc, {
    query_embedding: embedding.embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_domain: ['exercise', 'diet_rule', 'safety', 'evolution'],
    filter_source_table: null,
    filter_metadata: {},
  });

  if (error) {
    return {
      enabled: true,
      used: false,
      query,
      results: [],
      summary: aiGeneratedContentTx(locale, 'No se pudo consultar el RAG de evolución física. Se usa análisis local seguro.', 'The physical evolution RAG service could not be queried. Safe local analysis is used.'),
      warnings: [translateAiGeneratedTechnicalText(`match_rag_chunks falló: ${error.message}`, locale)],
    };
  }

  const results = (data ?? []).map(mapRpcResult);

  return {
    enabled: true,
    used: results.length > 0,
    query,
    provider: embedding.provider,
    model: embedding.model,
    matchThreshold,
    matchCount,
    results,
    summary: buildRagSummary(results, locale),
    warnings,
  };
}

export async function analyzeEvolucionFisicaWithRag(
  user: JwtUser,
  payload: RagEvolucionFisicaAssistantRequest,
) {
  const socioId = cleanText(payload.socio_id) && payload.socio_id !== 'me'
    ? cleanText(payload.socio_id)
    : user.id_socio;

  if (!socioId) {
    throw new Error(aiGeneratedContentTx(payload.idioma, 'Debe indicar socio_id o usar un usuario socio autenticado.', 'You must provide socio_id or use an authenticated member user.'));
  }

  const locale = normalizeAiGeneratedContentLocale(payload.idioma);
  const registros = await findAllEvolucionesSocioByIdSocio(user, socioId);
  const progress = buildEvolucionFisicaProgress(registros);
  const localizedProgress = {
    ...progress,
    tendenciaPrincipal: translateAiGeneratedTechnicalText(progress.tendenciaPrincipal, locale),
  };
  const recomendaciones = buildRecommendations(progress, locale);
  const alertas = buildAlerts(payload, progress, locale);

  let ragContext: RagEvolucionFisicaContextSummary | undefined;
  let ragError: string | undefined;

  try {
    ragContext = await buildRagContext(payload, progress);
  } catch (error) {
    ragError = error instanceof Error ? translateAiGeneratedTechnicalText(error.message, locale) : translateAiGeneratedTechnicalText('Error desconocido al consultar RAG de evolución física', locale);
    console.warn('RAG de evolución física no disponible. Se usa análisis local seguro:', ragError);
  }

  const warnings = [
    ...(ragContext?.warnings ?? []),
    ...(ragError ? [ragError] : []),
  ];

  const resumen = [
    localizedProgress.tendenciaPrincipal,
    ragContext?.summary,
    warnings.length ? aiGeneratedContentTx(locale, `Advertencias técnicas: ${warnings.join(' ')}`, `Technical warnings: ${warnings.join(' ')}`) : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    modo: ragContext?.used ? 'internal_rag' as const : 'local_fallback' as const,
    ragConfigurado: Boolean(ragContext?.enabled),
    socio_id: socioId,
    registrosAnalizados: sortRowsAsc(registros).slice(-8).reverse(),
    progreso: localizedProgress,
    resumen,
    recomendaciones,
    alertas: [...alertas, ...warnings],
    disclaimers: buildAiEvolutionBaseDisclaimers(locale),
    ragContext,
  };
}
