import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type {
  RagRutinasAssistantRequest,
  RagRutinasContextResult,
  RagRutinasContextSummary,
} from '@/interfaces/ragRutinasAssistant.interface';
import { getRagConfig } from '@/lib/rag/ragConfig';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { createSingleRagEmbedding } from './ragEmbeddingProviderService';

const DEFAULT_ROUTINE_MATCH_THRESHOLD = 0.3;
const DEFAULT_ROUTINE_MATCH_COUNT = 8;
const MAX_QUERY_LENGTH = 1600;

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

function mapRpcResult(row: Record<string, unknown>): RagRutinasContextResult {
  return {
    chunkId: String(row.chunk_id),
    documentId: String(row.document_id),
    title: String(row.title ?? 'Ejercicio RAG'),
    sourceId: String(row.source_id ?? ''),
    sourceTable: String(row.source_table ?? ''),
    domain: String(row.domain ?? ''),
    content: cleanText(row.content, 700),
    metadata: normalizeMetadata(row.metadata),
    documentMetadata: normalizeMetadata(row.document_metadata),
    similarity: Number(row.similarity ?? 0),
  };
}

async function getCatalogLabel(table: 'objetivo' | 'nivel', id: number | null) {
  if (!id) return null;

  const supabase = getSupabaseServerClient();

  if (table === 'objetivo') {
    const { data, error } = await supabase
      .from('objetivo')
      .select('nombre_objetivo')
      .eq('id_objetivo', id)
      .maybeSingle();

    if (error) {
      console.warn('No se pudo resolver etiqueta objetivo para RAG rutinas:', error.message);
      return null;
    }

    return typeof data?.nombre_objetivo === 'string' ? data.nombre_objetivo : null;
  }

  const { data, error } = await supabase
    .from('nivel')
    .select('nombre_nivel')
    .eq('id_nivel', id)
    .maybeSingle();

  if (error) {
    console.warn('No se pudo resolver etiqueta nivel para RAG rutinas:', error.message);
    return null;
  }

  return typeof data?.nombre_nivel === 'string' ? data.nombre_nivel : null;
}

function buildQuery(params: {
  payload: RagRutinasAssistantRequest;
  objetivoNombre?: string | null;
  nivelNombre?: string | null;
}) {
  const objetivo = params.objetivoNombre ? `Objetivo: ${params.objetivoNombre}.` : '';
  const nivel = params.nivelNombre ? `Nivel: ${params.nivelNombre}.` : '';
  const dias = params.payload.dias ? `Disponibilidad: ${params.payload.dias} días por semana.` : '';
  const mensaje = cleanText(params.payload.mensajeSocio);
  const restricciones = cleanText(params.payload.restricciones);

  return [
    'Armar rutina de gimnasio usando ejercicios reales del catálogo Gym Master.',
    objetivo,
    nivel,
    dias,
    mensaje ? `Pedido del socio: ${mensaje}.` : '',
    restricciones ? `Restricciones o cuidados: ${restricciones}.` : '',
    'Priorizar ejercicios compatibles con el objetivo, nivel y restricciones indicadas.',
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, MAX_QUERY_LENGTH);
}

function buildSummary(results: RagRutinasContextResult[]) {
  if (results.length === 0) {
    return 'No se recuperaron ejercicios desde el RAG. Se usó el generador formal de Gym Master con fallback seguro.';
  }

  const titles = results
    .slice(0, 5)
    .map((result) => result.title)
    .filter(Boolean)
    .join(', ');

  return `El RAG Coach recuperó ${results.length} referencias de ejercicios reales para orientar la rutina. Principales coincidencias: ${titles}.`;
}

export async function buildRutinasRagContext(
  _user: JwtUser,
  payload: RagRutinasAssistantRequest,
): Promise<RagRutinasContextSummary> {
  const warnings: string[] = [];
  const config = getRagConfig();

  if (!config.enabled) {
    return {
      enabled: false,
      used: false,
      query: '',
      results: [],
      summary: 'RAG desactivado. Se usa generación local segura.',
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
      warnings,
    };
  }

  const objetivoId = toPositiveInteger(payload.objetivo);
  const nivelId = toPositiveInteger(payload.nivel);
  const [objetivoNombre, nivelNombre] = await Promise.all([
    getCatalogLabel('objetivo', objetivoId),
    getCatalogLabel('nivel', nivelId),
  ]);

  const query = buildQuery({ payload, objetivoNombre, nivelNombre });
  const embedding = await createSingleRagEmbedding(query);
  const supabase = getSupabaseServerClient();
  const matchThreshold = readNumber(
    'RAG_ROUTINE_MATCH_THRESHOLD',
    Math.min(config.matchThreshold, DEFAULT_ROUTINE_MATCH_THRESHOLD),
    0,
    1,
  );
  const matchCount = readNumber('RAG_ROUTINE_MATCH_COUNT', DEFAULT_ROUTINE_MATCH_COUNT, 1, 20);

  const { data, error } = await supabase.rpc(config.vectorRpc, {
    query_embedding: embedding.embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_domain: ['exercise'],
    filter_source_table: ['ejercicio'],
    filter_metadata: {},
  });

  if (error) {
    return {
      enabled: true,
      used: false,
      query,
      results: [],
      summary: 'No se pudo consultar el RAG. Se usa generación local segura.',
      warnings: [`match_rag_chunks falló: ${error.message}`],
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
    warnings,
  };
}
