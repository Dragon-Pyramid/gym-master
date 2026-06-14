import { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  RagHealthResponse,
  RagSearchRequest,
  RagSearchResponse,
  RagSearchResult,
} from '@/interfaces/ragCoach.interface';
import { getRagConfig, getRagProviderStatus } from '@/lib/rag/ragConfig';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { createSingleRagEmbedding } from './ragEmbeddingProviderService';

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? '';
}

function assertCanUseRagAdminTools(user: JwtUser) {
  const role = normalizeRole(user.rol);
  if (role !== 'admin' && role !== 'administrador' && role !== 'usuario') {
    throw new Error('No autorizado para usar herramientas RAG administrativas.');
  }
}

function sanitizeQuery(query?: string | null) {
  const clean = query?.replace(/\s+/g, ' ').trim() ?? '';
  if (clean.length < 3) {
    throw new Error('La consulta RAG debe tener al menos 3 caracteres.');
  }
  return clean.slice(0, 2000);
}

function toArrayOrNull<T>(value?: T[]) {
  return Array.isArray(value) && value.length > 0 ? value : null;
}

function mapRpcRow(row: Record<string, any>): RagSearchResult {
  return {
    chunkId: row.chunk_id,
    documentId: row.document_id,
    domain: row.domain,
    sourceTable: row.source_table,
    sourceId: row.source_id,
    title: row.title,
    content: row.content,
    metadata: row.metadata ?? {},
    documentMetadata: row.document_metadata ?? {},
    similarity: Number(row.similarity ?? 0),
  };
}

export async function searchRagKnowledge(
  user: JwtUser,
  payload: RagSearchRequest,
): Promise<RagSearchResponse> {
  assertCanUseRagAdminTools(user);

  const config = getRagConfig();
  if (!config.enabled) {
    throw new Error('RAG_ENABLED no está activo.');
  }

  const query = sanitizeQuery(payload.query);
  const embedding = await createSingleRagEmbedding(query);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc(config.vectorRpc, {
    query_embedding: embedding.embedding,
    match_threshold: payload.matchThreshold ?? config.matchThreshold,
    match_count: payload.matchCount ?? config.matchCount,
    filter_domain: toArrayOrNull(payload.domains),
    filter_source_table: toArrayOrNull(payload.sourceTables),
    filter_metadata: payload.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    ok: true,
    query,
    provider: embedding.provider,
    model: embedding.model,
    results: (data ?? []).map(mapRpcRow),
    warnings: [],
  };
}

async function safeCount(table: string, filters?: (query: any) => any) {
  const supabase = getSupabaseServerClient();
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filters) query = filters(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getRagHealth(user: JwtUser): Promise<RagHealthResponse> {
  assertCanUseRagAdminTools(user);

  const status = getRagProviderStatus();
  const warnings: string[] = [];

  if (!status.enabled) warnings.push('RAG_ENABLED=false. La base RAG está configurada pero no activa.');
  if (status.provider === 'github' && !status.githubConfigured) warnings.push('Falta GITHUB_TOKEN.');
  if (status.provider === 'openai' && !status.openaiConfigured) warnings.push('Falta OPENAI_API_KEY.');

  try {
    const [documents, chunks, exerciseDocuments, activeChunks] = await Promise.all([
      safeCount('rag_document'),
      safeCount('rag_document_chunk'),
      safeCount('rag_document', (query) => query.eq('domain', 'exercise')),
      safeCount('rag_document_chunk', (query) => query.eq('active', true)),
    ]);

    return {
      ok: true,
      status,
      counts: {
        documents,
        chunks,
        exerciseDocuments,
        activeChunks,
      },
      warnings,
    };
  } catch (error: any) {
    return {
      ok: false,
      status,
      warnings: [
        ...warnings,
        `No se pudo leer la base RAG. Verificar migración: ${error?.message ?? 'error desconocido'}`,
      ],
    };
  }
}
