import { RagEmbeddingProvider, RagProviderStatus } from '@/interfaces/ragCoach.interface';

function readBool(name: string, fallback: boolean) {
  const value = process.env[name];
  if (value === undefined || value === null || value.trim() === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on', 'si', 'sí'].includes(value.trim().toLowerCase());
}

function readNumber(name: string, fallback: number, min?: number, max?: number) {
  const parsed = Number(process.env[name]);
  if (!Number.isFinite(parsed)) return fallback;
  if (min !== undefined && parsed < min) return fallback;
  if (max !== undefined && parsed > max) return fallback;
  return parsed;
}

function normalizeProvider(provider?: string | null): RagEmbeddingProvider {
  const normalized = provider?.trim().toLowerCase();
  if (normalized === 'openai') return 'openai';
  return 'github';
}

function normalizeGithubEmbeddingModelId(model: string, explicitModelId?: string | null) {
  const explicit = explicitModelId?.trim();
  if (explicit) return explicit;

  const clean = model.trim();
  if (clean.includes('/')) return clean;
  return `openai/${clean}`;
}

export function getRagConfig() {
  const githubEmbeddingModel = process.env.GITHUB_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small';
  const openaiEmbeddingModel = process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small';
  const provider = normalizeProvider(process.env.EMBEDDING_PROVIDER);
  const vectorDimensions = readNumber('RAG_VECTOR_DIMENSIONS', 1536, 1, 4096);

  return {
    enabled: readBool('RAG_ENABLED', false),
    provider,
    vectorDimensions,
    vectorTable: process.env.RAG_VECTOR_TABLE?.trim() || 'rag_document_chunk',
    vectorRpc: process.env.RAG_VECTOR_RPC?.trim() || 'match_rag_chunks',
    matchThreshold: readNumber('RAG_MATCH_THRESHOLD', 0.72, 0, 1),
    matchCount: readNumber('RAG_MATCH_COUNT', 8, 1, 30),
    contextMaxChars: readNumber('RAG_CONTEXT_MAX_CHARS', 12000, 1000, 100000),
    debug: readBool('RAG_DEBUG', false),

    githubToken: process.env.GITHUB_TOKEN?.trim() || '',
    githubBaseUrl: process.env.GITHUB_MODELS_BASE_URL?.trim() || 'https://models.github.ai/inference',
    githubApiVersion: process.env.GITHUB_MODELS_API_VERSION?.trim() || '2026-03-10',
    githubEmbeddingModel,
    githubEmbeddingModelId: normalizeGithubEmbeddingModelId(
      githubEmbeddingModel,
      process.env.GITHUB_EMBEDDING_MODEL_ID,
    ),

    openaiApiKey: process.env.OPENAI_API_KEY?.trim() || '',
    openaiEmbeddingModel,

    queryRewriteEnabled: readBool('RAG_ENABLE_QUERY_REWRITE', true),
    fusionEnabled: readBool('RAG_ENABLE_FUSION', true),
    fusionQueryCount: readNumber('RAG_FUSION_QUERY_COUNT', 3, 1, 5),
    heuristicRerankEnabled: readBool('RAG_ENABLE_HEURISTIC_RERANK', true),
    safetyValidatorEnabled: readBool('RAG_ENABLE_SAFETY_VALIDATOR', true),
    explainabilityEnabled: readBool('RAG_ENABLE_EXPLAINABILITY', true),
    traceEnabled: readBool('RAG_ENABLE_TRACE', true),

    coachLanguage: process.env.RAG_COACH_LANGUAGE?.trim() || 'es-AR',
    coachTone: process.env.RAG_COACH_TONE?.trim() || 'empatico_motivacional',
    medicalDisclaimerEnabled: readBool('RAG_MEDICAL_DISCLAIMER_ENABLED', true),
    requireHumanReviewForHighRisk: readBool('RAG_REQUIRE_HUMAN_REVIEW_FOR_HIGH_RISK', true),
  };
}

export function getRagProviderStatus(): RagProviderStatus {
  const config = getRagConfig();
  return {
    provider: config.provider,
    enabled: config.enabled,
    vectorDimensions: config.vectorDimensions,
    vectorTable: config.vectorTable,
    vectorRpc: config.vectorRpc,
    githubConfigured: Boolean(config.githubToken),
    openaiConfigured: Boolean(config.openaiApiKey),
    githubEmbeddingModel: config.githubEmbeddingModel,
    githubEmbeddingModelId: config.githubEmbeddingModelId,
    openaiEmbeddingModel: config.openaiEmbeddingModel,
    matchThreshold: config.matchThreshold,
    matchCount: config.matchCount,
    queryRewriteEnabled: config.queryRewriteEnabled,
    fusionEnabled: config.fusionEnabled,
    safetyValidatorEnabled: config.safetyValidatorEnabled,
    explainabilityEnabled: config.explainabilityEnabled,
    traceEnabled: config.traceEnabled,
    coachLanguage: config.coachLanguage,
    coachTone: config.coachTone,
  };
}

export function assertRagEnabled() {
  const config = getRagConfig();
  if (!config.enabled) {
    throw new Error('RAG_ENABLED no está activo. Activá RAG_ENABLED=true para usar Gym Master RAG Coach.');
  }
  return config;
}
