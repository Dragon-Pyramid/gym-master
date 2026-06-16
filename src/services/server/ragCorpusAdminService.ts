import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type {
  RagCorpusBatchAction,
  RagCorpusBatchRequest,
  RagCorpusBatchResponse,
  RagCorpusBatchStep,
  RagCorpusDomainStatus,
  RagCorpusStatusResponse,
} from '@/interfaces/ragCorpus.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import {
  ingestDietRulesForRag,
  ingestExercisesForRag,
  vectorizePendingRagChunks,
} from './ragCoachIngestionService';

const DOMAINS = ['exercise', 'diet_rule', 'routine_rule', 'safety', 'evolution', 'business', 'general'];

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? '';
}

function assertAdmin(user: JwtUser) {
  const role = normalizeRole(user.rol);
  if (role !== 'admin' && role !== 'administrador') {
    throw new Error('No autorizado para administrar el corpus RAG.');
  }
}

async function safeCount(table: string, filters?: (query: any) => any) {
  const supabase = getSupabaseServerClient();
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filters) query = filters(query);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countChunksForDomain(domain: string, embedded: 'all' | 'embedded' | 'pending') {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from('rag_document_chunk')
    .select('id, rag_document!inner(domain)', { count: 'exact', head: true })
    .eq('active', true)
    .eq('rag_document.domain', domain);

  if (embedded === 'embedded') query = query.not('embedding', 'is', null);
  if (embedded === 'pending') query = query.is('embedding', null);

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function getDomainStatus(domain: string): Promise<RagCorpusDomainStatus> {
  const [documents, chunks, embeddedChunks, pendingChunks] = await Promise.all([
    safeCount('rag_document', (query) => query.eq('domain', domain).eq('active', true)),
    countChunksForDomain(domain, 'all'),
    countChunksForDomain(domain, 'embedded'),
    countChunksForDomain(domain, 'pending'),
  ]);

  return {
    domain,
    documents,
    chunks,
    embeddedChunks,
    pendingChunks,
  };
}

function buildRecommendations(status: Omit<RagCorpusStatusResponse, 'recommendations' | 'warnings' | 'ok' | 'generatedAt'>) {
  const recommendations: string[] = [];
  const missingExercises = Math.max(status.sources.activeExercises - status.sources.indexedExercises, 0);
  const missingDietRules = Math.max(status.sources.dietRules - status.sources.indexedDietRules, 0);

  if (missingExercises > 0) {
    recommendations.push(`Faltan indexar aproximadamente ${missingExercises} ejercicios activos.`);
  }

  if (missingDietRules > 0) {
    recommendations.push(`Faltan indexar aproximadamente ${missingDietRules} reglas nutricionales.`);
  }

  if (status.totals.pendingChunks > 0) {
    recommendations.push(`Hay ${status.totals.pendingChunks} chunks activos pendientes de vectorizar. Ejecutar vectorización por tandas.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('El corpus base de ejercicios y dietas no muestra pendientes principales. Mantener monitoreo por dominio.');
  }

  return recommendations;
}

export async function getRagCorpusStatus(user: JwtUser): Promise<RagCorpusStatusResponse> {
  assertAdmin(user);

  const [
    documents,
    chunks,
    activeChunks,
    embeddedChunks,
    pendingChunks,
    activeExercises,
    indexedExercises,
    dietRules,
    indexedDietRules,
    domains,
  ] = await Promise.all([
    safeCount('rag_document', (query) => query.eq('active', true)),
    safeCount('rag_document_chunk'),
    safeCount('rag_document_chunk', (query) => query.eq('active', true)),
    safeCount('rag_document_chunk', (query) => query.eq('active', true).not('embedding', 'is', null)),
    safeCount('rag_document_chunk', (query) => query.eq('active', true).is('embedding', null)),
    safeCount('ejercicio', (query) => query.eq('activo', true)),
    safeCount('rag_document', (query) => query.eq('domain', 'exercise').eq('source_table', 'ejercicio').eq('active', true)),
    safeCount('comida_base'),
    safeCount('rag_document', (query) => query.eq('domain', 'diet_rule').eq('source_table', 'comida_base').eq('active', true)),
    Promise.all(DOMAINS.map(getDomainStatus)),
  ]);

  const base = {
    totals: {
      documents,
      chunks,
      activeChunks,
      embeddedChunks,
      pendingChunks,
    },
    sources: {
      activeExercises,
      indexedExercises,
      dietRules,
      indexedDietRules,
    },
    domains,
  };

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    ...base,
    recommendations: buildRecommendations(base),
    warnings: pendingChunks > 0 ? ['Existen chunks pendientes sin embedding.'] : [],
  };
}

function normalizeAction(value?: string): RagCorpusBatchAction {
  if (
    value === 'ingest_exercises' ||
    value === 'ingest_diet_rules' ||
    value === 'vectorize_pending' ||
    value === 'all'
  ) {
    return value;
  }

  return 'vectorize_pending';
}

async function runStep(
  user: JwtUser,
  action: Exclude<RagCorpusBatchAction, 'all'>,
  payload: RagCorpusBatchRequest,
): Promise<RagCorpusBatchStep> {
  if (action === 'ingest_exercises') {
    const result = await ingestExercisesForRag(user, payload);
    return { action, ok: result.ok, result };
  }

  if (action === 'ingest_diet_rules') {
    const result = await ingestDietRulesForRag(user, payload);
    return { action, ok: result.ok, result };
  }

  const result = await vectorizePendingRagChunks(user, payload);
  return { action: 'vectorize_pending', ok: result.ok, result };
}

export async function runRagCorpusBatch(
  user: JwtUser,
  payload: RagCorpusBatchRequest,
): Promise<RagCorpusBatchResponse> {
  assertAdmin(user);

  const action = normalizeAction(payload.action);
  const actions: Array<Exclude<RagCorpusBatchAction, 'all'>> = action === 'all'
    ? ['ingest_exercises', 'ingest_diet_rules', 'vectorize_pending']
    : [action];

  const steps: RagCorpusBatchStep[] = [];
  for (const stepAction of actions) {
    steps.push(await runStep(user, stepAction, payload));
  }

  const status = await getRagCorpusStatus(user).catch(() => undefined);
  const warnings: string[] = [];
  if (steps.some((step) => !step.ok)) {
    warnings.push('Una o más tandas finalizaron con errores parciales. Revisar detalle y continuar con vectorización pendiente.');
  }

  return {
    ok: steps.every((step) => step.ok),
    action,
    steps,
    status,
    warnings,
  };
}
