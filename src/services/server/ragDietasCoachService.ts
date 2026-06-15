import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type {
  RagDietasAssistantRequest,
  RagDietasContextResult,
  RagDietasContextSummary,
} from '@/interfaces/ragDietasAssistant.interface';
import { getRagConfig } from '@/lib/rag/ragConfig';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { createSingleRagEmbedding } from './ragEmbeddingProviderService';

const DEFAULT_DIET_MATCH_THRESHOLD = 0.3;
const DEFAULT_DIET_MATCH_COUNT = 8;
const MAX_QUERY_LENGTH = 1800;

const BASE_DIET_DISCLAIMERS = [
  'La dieta generada es orientativa y no reemplaza la evaluación de un nutricionista matriculado.',
  'Ante enfermedades, embarazo, medicación, diabetes, hipertensión, trastornos alimentarios o condiciones clínicas, consultar con un profesional de salud antes de aplicar cambios alimentarios.',
  'No se deben prometer resultados físicos o médicos garantizados desde el sistema.',
];

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

  const warnings: string[] = [];
  const risks: Array<[RegExp, string]> = [
    [/\b(diabetes|glucemia|insulina)\b/, 'Condición relacionada con diabetes/glucemia informada. Requiere revisión profesional.'],
    [/\b(hipertension|presion alta|cardiopatia|corazon)\b/, 'Condición cardiovascular o presión alta informada. Requiere revisión profesional.'],
    [/\b(embarazo|embarazada|lactancia)\b/, 'Embarazo o lactancia informado. Requiere indicación profesional específica.'],
    [/\b(renal|rinon|riñon|hepatica|higado)\b/, 'Condición renal/hepática informada. Requiere revisión profesional.'],
    [/\b(anorexia|bulimia|trastorno alimentario|tca)\b/, 'Posible trastorno de la conducta alimentaria informado. No generar indicaciones restrictivas sin profesional.'],
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

function buildSummary(results: RagDietasContextResult[]) {
  if (results.length === 0) {
    return 'No se recuperaron reglas nutricionales desde el RAG. Se usó el generador formal de Gym Master con fallback seguro.';
  }

  const titles = results
    .slice(0, 5)
    .map((result) => result.title)
    .filter(Boolean)
    .join(', ');

  return `El RAG Coach recuperó ${results.length} referencias nutricionales reales para orientar la dieta. Principales coincidencias: ${titles}.`;
}

export async function buildDietasRagContext(
  _user: JwtUser,
  payload: RagDietasAssistantRequest,
): Promise<RagDietasContextSummary> {
  const warnings: string[] = [];
  const config = getRagConfig();

  if (!config.enabled) {
    return {
      enabled: false,
      used: false,
      query: '',
      results: [],
      summary: 'RAG desactivado. Se usa generación local segura.',
      disclaimers: BASE_DIET_DISCLAIMERS,
      warnings: ['RAG_ENABLED=false.'],
    };
  }

  if (config.provider === 'github' && !config.githubToken) warnings.push('Falta GITHUB_TOKEN.');
  if (config.provider === 'openai' && !config.openaiApiKey) warnings.push('Falta OPENAI_API_KEY.');

  if (warnings.length > 0) {
    return {
      enabled: true,
      used: false,
      query: '',
      results: [],
      summary: 'RAG configurado parcialmente. Se usa generación local segura.',
      disclaimers: BASE_DIET_DISCLAIMERS,
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
      summary: 'No se pudo consultar el RAG de dietas. Se usa generación local segura.',
      disclaimers: BASE_DIET_DISCLAIMERS,
      warnings: [`match_rag_chunks falló: ${error.message}`, ...highRiskWarnings],
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
    summary: buildSummary(results),
    disclaimers: BASE_DIET_DISCLAIMERS,
    warnings: [...warnings, ...highRiskWarnings],
  };
}
