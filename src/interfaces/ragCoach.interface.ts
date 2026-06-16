export type RagEmbeddingProvider = 'github' | 'openai';

export type RagDocumentDomain =
  | 'exercise'
  | 'routine_rule'
  | 'diet_rule'
  | 'safety'
  | 'evolution'
  | 'business'
  | 'general';

export interface RagProviderStatus {
  provider: RagEmbeddingProvider;
  enabled: boolean;
  vectorDimensions: number;
  vectorTable: string;
  vectorRpc: string;
  githubConfigured: boolean;
  openaiConfigured: boolean;
  githubEmbeddingModel: string;
  githubEmbeddingModelId: string;
  openaiEmbeddingModel: string;
  matchThreshold: number;
  matchCount: number;
  queryRewriteEnabled: boolean;
  fusionEnabled: boolean;
  safetyValidatorEnabled: boolean;
  explainabilityEnabled: boolean;
  traceEnabled: boolean;
  coachLanguage: string;
  coachTone: string;
}

export interface RagHealthResponse {
  ok: boolean;
  status: RagProviderStatus;
  counts?: {
    documents: number;
    chunks: number;
    exerciseDocuments: number;
    dietDocuments?: number;
    activeChunks: number;
    embeddedChunks?: number;
    pendingEmbeddingChunks?: number;
  };
  warnings: string[];
}

export interface RagEmbeddingRequest {
  input: string | string[];
}

export interface RagEmbeddingResponse {
  embeddings: number[][];
  model: string;
  provider: RagEmbeddingProvider;
  usage?: {
    promptTokens?: number;
    totalTokens?: number;
  };
}

export interface RagIngestExercisesRequest {
  limit?: number;
  force?: boolean;
  onlyMissing?: boolean;
  delayMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface RagIngestExercisesResponse {
  ok: boolean;
  processed: number;
  indexed: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface RagIngestDietRulesRequest {
  limit?: number;
  force?: boolean;
  onlyMissing?: boolean;
  delayMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface RagIngestDietRulesResponse {
  ok: boolean;
  processed: number;
  indexed: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface RagVectorizePendingRequest {
  limit?: number;
  force?: boolean;
  delayMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface RagVectorizePendingResponse {
  ok: boolean;
  processed: number;
  vectorized: number;
  skipped: number;
  failed: number;
  provider?: RagEmbeddingProvider;
  model?: string;
  errors: string[];
}

export interface RagSearchRequest {
  query: string;
  domains?: RagDocumentDomain[];
  sourceTables?: string[];
  metadata?: Record<string, unknown>;
  matchThreshold?: number;
  matchCount?: number;
}

export interface RagSearchResult {
  chunkId: string;
  documentId: string;
  domain: RagDocumentDomain;
  sourceTable: string;
  sourceId: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  documentMetadata: Record<string, unknown>;
  similarity: number;
}

export interface RagSearchResponse {
  ok: boolean;
  query: string;
  provider: RagEmbeddingProvider;
  model: string;
  results: RagSearchResult[];
  warnings: string[];
}
