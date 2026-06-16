export type RagCorpusBatchAction =
  | 'ingest_exercises'
  | 'ingest_diet_rules'
  | 'vectorize_pending'
  | 'all';

export type RagCorpusDomainStatus = {
  domain: string;
  documents: number;
  chunks: number;
  embeddedChunks: number;
  pendingChunks: number;
};

export type RagCorpusStatusResponse = {
  ok: boolean;
  generatedAt: string;
  totals: {
    documents: number;
    chunks: number;
    activeChunks: number;
    embeddedChunks: number;
    pendingChunks: number;
  };
  sources: {
    activeExercises: number;
    indexedExercises: number;
    dietRules: number;
    indexedDietRules: number;
  };
  domains: RagCorpusDomainStatus[];
  recommendations: string[];
  warnings: string[];
};

export type RagCorpusBatchRequest = {
  action: RagCorpusBatchAction;
  limit?: number;
  force?: boolean;
  onlyMissing?: boolean;
  delayMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
};

export type RagCorpusBatchStep = {
  action: Exclude<RagCorpusBatchAction, 'all'>;
  ok: boolean;
  result: unknown;
};

export type RagCorpusBatchResponse = {
  ok: boolean;
  action: RagCorpusBatchAction;
  steps: RagCorpusBatchStep[];
  status?: RagCorpusStatusResponse;
  warnings: string[];
};
