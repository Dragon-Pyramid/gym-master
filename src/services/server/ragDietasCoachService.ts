import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type {
  RagDietasAssistantRequest,
  RagDietasContextResult,
  RagDietasContextSummary,
} from '@/interfaces/ragDietasAssistant.interface';
import { getRagConfig } from '@/lib/rag/ragConfig';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { createSingleRagEmbedding } from './ragEmbeddingProviderService';
import {
  aiGeneratedContentTx,
  buildAiDietBaseDisclaimers,
  normalizeAiGeneratedContentLocale,
  translateAiGeneratedTechnicalList,
  translateAiGeneratedTechnicalText,
} from '@/utils/aiGeneratedContentI18n';

const DEFAULT_DIET_MATCH_THRESHOLD = 0.3;
const DEFAULT_DIET_MATCH_COUNT = 8;
const MAX_QUERY_LENGTH = 1800;


function cleanText(value: unknown, maxLength = MAX_QUERY_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function readNumber(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function toPositiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapRpcResult(row: Record<string, unknown>): RagDietasContextResult {
  return {
    chunkId: String(row.chunk_id),
    documentId: String(row.document_id),
    title: String(row.title ?? 'Regla nutricional RAG'),
    sourceId: String(row.source_id ?? ''),
    sourceTable: String(row.source_table ?? ''),
    domain: String(row.domain ?? ''),
    content: cleanText(row.content, 900),
    metadata: normalizeMetadata(row.metadata),
    documentMetadata: normalizeMetadata(row.document_metadata),
    similarity: Number(row.similarity ?? 0),
  };
}

async function getObjectiveLabel(id: number | null) {
  if (!id) return null;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('objetivo')
    .select('nombre_objetivo')
    .eq('id_objetivo', id)
    .maybeSingle();

  if (error) {
    console.warn('No se pudo resolver objetivo para RAG dietas:', error.message);
    return null;
  }

  return typeof data?.nombre_objetivo === 'string' ? data.nombre_objetivo : null;
}

function detectHighRiskWarnings(payload: RagDietasAssistantRequest) {
  const text = cleanText(
    `${payload.mensajeSocio ?? ''} ${payload.restricciones ?? ''} ${payload.preferencias ?? ''}`,
    4000,
  )
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const locale = normalizeAiGeneratedContentLocale(payload.idioma);
  const warnings: string[] = [];
  const risks: Array<[RegExp, string]> = [
    [/\b(diabetes|glucemia|insulina)\b/, aiGeneratedContentTx(locale, 'Condición relacionada con diabetes/glucemia informada. Requiere revisión profesional.', 'Diabetes/glucose-related condition reported. Professional review is required.')],
    [/\b(hipertension|presion alta|cardiopatia|corazon)\b/, aiGeneratedContentTx(locale, 'Condición cardiovascular o presión alta informada. Requiere revisión profesional.', 'Cardiovascular condition or high blood pressure reported. Professional review is required.')],
    [/\b(embarazo|embarazada|lactancia)\b/, aiGeneratedContentTx(locale, 'Embarazo o lactancia informado. Requiere indicación profesional específica.', 'Pregnancy or breastfeeding reported. Specific professional guidance is required.')],
    [/\b(renal|rinon|riñon|hepatica|higado)\b/, aiGeneratedContentTx(locale, 'Condición renal/hepática informada. Requiere revisión profesional.', 'Kidney/liver condition reported. Professional review is required.')],
    [/\b(anorexia|bulimia|trastorno alimentario|tca)\b/, aiGeneratedContentTx(locale, 'Posible trastorno de la conducta alimentaria informado. No generar indicaciones restrictivas sin profesional.', 'Possible eating disorder reported. Do not generate restrictive guidance without a professional.')],
  ];

  for (const [pattern, warning] of risks) {
    if (pattern.test(text)) warnings.push(warning);
  }

  return warnings;
}

function buildQuery(params: {
  payload: RagDietasAssistantRequest;
  objetivoNombre?: string | null;
}) {
  const objetivo = params.objetivoNombre ? `Objetivo nutricional/de entrenamiento: ${params.objetivoNombre}.` : '';
  const fechas = params.payload.fecha_inicio && params.payload.fecha_fin
    ? `Periodo del plan: desde ${params.payload.fecha_inicio} hasta ${params.payload.fecha_fin}.`
    : '';
  const mensaje = cleanText(params.payload.mensajeSocio);
  const restricciones = cleanText(params.payload.restricciones);
  const preferencias = cleanText(params.payload.preferencias);

  return [
    'Armar dieta orientativa para socio de gimnasio usando reglas nutricionales reales de Gym Master.',
    objetivo,
    fechas,
    mensaje ? `Pedido del socio: ${mensaje}.` : '',
    restricciones ? `Restricciones, salud o cuidados: ${restricciones}.` : '',
    preferencias ? `Preferencias alimentarias: ${preferencias}.` : '',
    'Priorizar seguridad, adherencia, comidas simples y advertencias claras cuando corresponda.',
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, MAX_QUERY_LENGTH);
}

function buildSummary(results: RagDietasContextResult[], locale: ReturnType<typeof normalizeAiGeneratedContentLocale>) {
  if (results.length === 0) {
    return aiGeneratedContentTx(locale, 'No se recuperaron reglas nutricionales desde el RAG. Se usó el generador formal de Gym Master con fallback seguro.', "No nutrition rules were retrieved from RAG. Gym Master's formal generator was used with a safe fallback.");
  }

  const titles = results
    .slice(0, 5)
    .map((result) => result.title)
    .filter(Boolean)
    .join(', ');

  return aiGeneratedContentTx(
    locale,
    `El RAG Coach recuperó ${results.length} referencias nutricionales reales para orientar la dieta. Principales coincidencias: ${titles}.`,
    `The RAG Coach retrieved ${results.length} real nutrition references to guide the diet. Main matches: ${titles}.`,
  );
}

export async function buildDietasRagContext(
  _user: JwtUser,
  payload: RagDietasAssistantRequest,
): Promise<RagDietasContextSummary> {
  const locale = normalizeAiGeneratedContentLocale(payload.idioma);
  const warnings: string[] = [];
  const config = getRagConfig();

  if (!config.enabled) {
    return {
      enabled: false,
      used: false,
      query: '',
      results: [],
      summary: aiGeneratedContentTx(locale, 'RAG desactivado. Se usa generación local segura.', 'RAG is disabled. Safe local generation is used.'),
      disclaimers: buildAiDietBaseDisclaimers(locale),
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
      summary: aiGeneratedContentTx(locale, 'RAG configurado parcialmente. Se usa generación local segura.', 'RAG is partially configured. Safe local generation is used.'),
      disclaimers: buildAiDietBaseDisclaimers(locale),
      warnings,
    };
  }

  const objetivoId = toPositiveInteger(payload.objetivo);
  const objetivoNombre = await getObjectiveLabel(objetivoId);
  const query = buildQuery({ payload, objetivoNombre });
  const embedding = await createSingleRagEmbedding(query);
  const supabase = getSupabaseServerClient();
  const matchThreshold = readNumber(
    'RAG_DIET_MATCH_THRESHOLD',
    Math.min(config.matchThreshold, DEFAULT_DIET_MATCH_THRESHOLD),
    0,
    1,
  );
  const matchCount = readNumber('RAG_DIET_MATCH_COUNT', DEFAULT_DIET_MATCH_COUNT, 1, 20);

  const { data, error } = await supabase.rpc(config.vectorRpc, {
    query_embedding: embedding.embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_domain: ['diet_rule', 'safety'],
    filter_source_table: null,
    filter_metadata: {},
  });

  const highRiskWarnings = detectHighRiskWarnings(payload);

  if (error) {
    return {
      enabled: true,
      used: false,
      query,
      results: [],
      summary: aiGeneratedContentTx(locale, 'No se pudo consultar el RAG de dietas. Se usa generación local segura.', 'The diet RAG service could not be queried. Safe local generation is used.'),
      disclaimers: buildAiDietBaseDisclaimers(locale),
      warnings: [translateAiGeneratedTechnicalText(`match_rag_chunks falló: ${error.message}`, locale), ...highRiskWarnings],
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
    summary: buildSummary(results, locale),
    disclaimers: buildAiDietBaseDisclaimers(locale),
    warnings: translateAiGeneratedTechnicalList([...warnings, ...highRiskWarnings], locale),
  };
}
