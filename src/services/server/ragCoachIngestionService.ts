import { createHash } from 'node:crypto';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  RagIngestDietRulesRequest,
  RagIngestDietRulesResponse,
  RagIngestExercisesRequest,
  RagIngestExercisesResponse,
  RagVectorizePendingRequest,
  RagVectorizePendingResponse,
} from '@/interfaces/ragCoach.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { createSingleRagEmbedding } from './ragEmbeddingProviderService';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MAX_DELAY_MS = 5000;
const MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1500;

type ExerciseRow = Record<string, any>;
type DietRuleRow = Record<string, any>;

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? '';
}

function assertAdmin(user: JwtUser) {
  const role = normalizeRole(user.rol);
  if (role !== 'admin' && role !== 'administrador') {
    throw new Error('No autorizado para administrar la ingesta RAG.');
  }
}

function getRelatedName(value: any, key: string) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.[key] ?? null;
  return value[key] ?? null;
}

function hashContent(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

function safeLimit(value?: number) {
  if (!Number.isInteger(value) || !value || value <= 0) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
}

function safeDelayMs(value?: number) {
  if (!Number.isInteger(value) || !value || value <= 0) return 0;
  return Math.min(value, MAX_DELAY_MS);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeRetries(value?: number) {
  if (!Number.isInteger(value) || value === undefined || value < 0) return 1;
  return Math.min(value, MAX_RETRIES);
}

function safeRetryDelayMs(value?: number) {
  if (!Number.isInteger(value) || !value || value <= 0) return DEFAULT_RETRY_DELAY_MS;
  return Math.min(value, MAX_DELAY_MS);
}

async function fetchIndexedSourceIds(domain: string, sourceTable: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('rag_document')
    .select('source_id')
    .eq('domain', domain)
    .eq('source_table', sourceTable)
    .eq('active', true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => String(row.source_id ?? '').trim())
    .filter(Boolean);
}

async function runWithRetries<T>(fn: () => Promise<T>, retries: number, retryDelayMs: number): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      await sleep(retryDelayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Error desconocido al ejecutar reintento RAG.');
}

function hasCloudinary(row: ExerciseRow) {
  return row.imagen_origen === 'cloudinary' || Boolean(row.cloudinary_public_id);
}

function hasYoutube(row: ExerciseRow) {
  return Boolean(
    row.video_youtube_url || row.youtube_url_es || row.youtube_url_en || row.youtube_video_id,
  );
}

function mediaQuality(row: ExerciseRow) {
  const cloudinary = hasCloudinary(row);
  const youtube = hasYoutube(row);
  const reviewStatus = row.youtube_review_status;

  if (cloudinary && youtube && reviewStatus === 'validado') return 'completo';
  if (cloudinary && youtube) return 'revisar_video';
  if (cloudinary || youtube) return 'parcial';
  return 'pendiente';
}

function buildExerciseMetadata(row: ExerciseRow) {
  const objetivo = getRelatedName(row.objetivo, 'nombre_objetivo');
  const nivel = getRelatedName(row.nivel, 'nombre_nivel');
  const grupoMuscular = getRelatedName(row.grupo_muscular, 'nombre_gp');

  return {
    id_ejercicio: row.id_ejercicio,
    nombre_ejercicio: row.nombre_ejercicio,
    nombre_en: row.nombre_en ?? null,
    objetivo,
    nivel,
    grupo_muscular: grupoMuscular,
    id_objetivo: row.id_objetivo,
    id_nivel: row.id_nivel,
    id_gm: row.id_gm,
    tipo_ejercicio: row.tipo_ejercicio ?? null,
    patron_movimiento: row.patron_movimiento ?? null,
    equipamiento: row.equipamiento ?? null,
    dificultad: row.dificultad ?? null,
    intensidad: row.intensidad ?? null,
    series_sugeridas: row.series_sugeridas ?? null,
    repeticiones_sugeridas: row.repeticiones_sugeridas ?? null,
    descanso_sugerido_seg: row.descanso_sugerido_seg ?? null,
    rpe_sugerido: row.rpe_sugerido ?? null,
    frecuencia_semanal_sugerida: row.frecuencia_semanal_sugerida ?? null,
    tiene_cloudinary: hasCloudinary(row),
    tiene_youtube: hasYoutube(row),
    youtube_review_status: row.youtube_review_status ?? null,
    media_quality: mediaQuality(row),
  };
}

function buildExerciseContent(row: ExerciseRow) {
  const metadata = buildExerciseMetadata(row);
  const lines = [
    `Ejercicio: ${row.nombre_ejercicio}`,
    row.nombre_en ? `Nombre en inglés: ${row.nombre_en}` : null,
    metadata.objetivo ? `Objetivo principal: ${metadata.objetivo}` : null,
    metadata.nivel ? `Nivel recomendado: ${metadata.nivel}` : null,
    metadata.grupo_muscular ? `Grupo muscular: ${metadata.grupo_muscular}` : null,
    row.tipo_ejercicio ? `Tipo de ejercicio: ${row.tipo_ejercicio}` : null,
    row.patron_movimiento ? `Patrón de movimiento: ${row.patron_movimiento}` : null,
    row.equipamiento ? `Equipamiento: ${row.equipamiento}` : null,
    row.dificultad ? `Dificultad estimada: ${row.dificultad}` : null,
    row.descripcion ? `Descripción técnica: ${row.descripcion}` : null,
    row.descripcion_en ? `Descripción en inglés: ${row.descripcion_en}` : null,
    row.series_sugeridas ? `Series sugeridas: ${row.series_sugeridas}` : null,
    row.repeticiones_sugeridas ? `Repeticiones sugeridas: ${row.repeticiones_sugeridas}` : null,
    row.descanso_sugerido_seg ? `Descanso sugerido: ${row.descanso_sugerido_seg} segundos` : null,
    row.rpe_sugerido ? `RPE sugerido: ${row.rpe_sugerido}` : null,
    row.intensidad ? `Intensidad: ${row.intensidad}` : null,
    row.frecuencia_semanal_sugerida
      ? `Frecuencia semanal sugerida: ${row.frecuencia_semanal_sugerida}`
      : null,
    row.contraindicaciones ? `Contraindicaciones o cuidados: ${row.contraindicaciones}` : null,
    hasCloudinary(row) ? 'Imagen propia disponible en Cloudinary.' : 'Imagen propia pendiente de curación.',
    hasYoutube(row) ? 'Video de técnica disponible.' : 'Video de técnica pendiente de curación.',
    `Estado multimedia para socio/RAG: ${mediaQuality(row)}.`,
  ].filter(Boolean);

  return {
    content: lines.join('\n'),
    metadata,
  };
}

async function fetchExercises(limit: number, onlyMissing: boolean) {
  const supabase = getSupabaseServerClient();
  const indexedIds = onlyMissing ? await fetchIndexedSourceIds('exercise', 'ejercicio') : [];
  let query = supabase
    .from('ejercicio')
    .select(
      `
      id_ejercicio,
      nombre_ejercicio,
      nombre_en,
      descripcion,
      descripcion_en,
      id_objetivo,
      id_nivel,
      id_gm,
      tipo_ejercicio,
      patron_movimiento,
      equipamiento,
      dificultad,
      series_sugeridas,
      repeticiones_sugeridas,
      descanso_sugerido_seg,
      rpe_sugerido,
      intensidad,
      frecuencia_semanal_sugerida,
      contraindicaciones,
      imagen_origen,
      cloudinary_public_id,
      video_youtube_url,
      youtube_video_id,
      youtube_url_es,
      youtube_url_en,
      youtube_review_status,
      activo,
      objetivo:objetivo!ejercicio_id_objetivo_fkey(nombre_objetivo),
      nivel:nivel!ejercicio_id_nivel_fkey(nombre_nivel),
      grupo_muscular:grupo_muscular!ejercicio_id_gm_fkey(nombre_gp)
    `,
    )
    .eq('activo', true);

  if (indexedIds.length > 0) {
    query = query.not('id_ejercicio', 'in', `(${indexedIds.join(',')})`);
  }

  const { data, error } = await query
    .order('nombre_ejercicio', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}


function buildDietRuleMetadata(row: DietRuleRow) {
  const objetivo = getRelatedName(row.objetivo, 'nombre_objetivo');

  return {
    id: row.id,
    tipo_comida: row.tipo_comida,
    objetivo,
    objetivo_id: row.objetivo_id,
    calorias_aprox: row.calorias_aprox ?? null,
    proteinas_aprox: row.proteinas_aprox ?? null,
    carbohidratos_aprox: row.carbohidratos_aprox ?? null,
    grasas_aprox: row.grasas_aprox ?? null,
  };
}

function buildDietRuleContent(row: DietRuleRow) {
  const metadata = buildDietRuleMetadata(row);
  const lines = [
    `Regla nutricional Gym Master: ${row.tipo_comida}`,
    metadata.objetivo ? `Objetivo asociado: ${metadata.objetivo}` : null,
    row.descripcion ? `Descripción alimentaria: ${row.descripcion}` : null,
    row.calorias_aprox ? `Calorías aproximadas: ${row.calorias_aprox}` : null,
    row.proteinas_aprox ? `Proteínas aproximadas: ${row.proteinas_aprox} g` : null,
    row.carbohidratos_aprox ? `Carbohidratos aproximados: ${row.carbohidratos_aprox} g` : null,
    row.grasas_aprox ? `Grasas aproximadas: ${row.grasas_aprox} g` : null,
    'Uso recomendado: orientar una dieta de gimnasio de forma general, simple y segura.',
    'Límite de seguridad: no reemplaza nutricionista ni indicación médica individual.',
  ].filter(Boolean);

  return {
    content: lines.join('\n'),
    metadata,
  };
}

async function fetchDietRules(limit: number, onlyMissing: boolean) {
  const supabase = getSupabaseServerClient();
  const indexedIds = onlyMissing ? await fetchIndexedSourceIds('diet_rule', 'comida_base') : [];
  let query = supabase
    .from('comida_base')
    .select(
      `
      id,
      tipo_comida,
      objetivo_id,
      descripcion,
      calorias_aprox,
      proteinas_aprox,
      carbohidratos_aprox,
      grasas_aprox,
      objetivo:objetivo!comida_base_objetivo_id_fkey(nombre_objetivo)
    `,
    );

  if (indexedIds.length > 0) {
    query = query.not('id', 'in', `(${indexedIds.join(',')})`);
  }

  const { data, error } = await query
    .order('objetivo_id', { ascending: true })
    .order('tipo_comida', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function upsertDietRuleDocument(row: DietRuleRow, force: boolean, maxRetries: number, retryDelayMs: number) {
  const supabase = getSupabaseServerClient();
  const { content, metadata } = buildDietRuleContent(row);
  const contentHash = hashContent(content);
  const sourceId = String(row.id);
  const title = `${metadata.objetivo ? `${metadata.objetivo} - ` : ''}${row.tipo_comida}`;
  const tokenCount = Math.ceil(content.length / 4);

  const { data: existing, error: existingError } = await supabase
    .from('rag_document')
    .select('id, content_hash')
    .eq('domain', 'diet_rule')
    .eq('source_table', 'comida_base')
    .eq('source_id', sourceId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id && existing.content_hash === contentHash && !force) {
    return { indexed: false, skipped: true };
  }

  const { data: document, error: documentError } = await supabase
    .from('rag_document')
    .upsert(
      {
        id: existing?.id,
        domain: 'diet_rule',
        source_table: 'comida_base',
        source_id: sourceId,
        title,
        language: 'es-AR',
        metadata,
        content_hash: contentHash,
        active: true,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'domain,source_table,source_id' },
    )
    .select('id')
    .single();

  if (documentError) {
    throw new Error(documentError.message);
  }

  const { data: chunk, error: chunkUpsertError } = await supabase
    .from('rag_document_chunk')
    .upsert(
      {
        document_id: document.id,
        chunk_index: 0,
        content,
        token_count: tokenCount,
        embedding: null,
        metadata,
        active: true,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'document_id,chunk_index' },
    )
    .select('id')
    .single();

  if (chunkUpsertError) {
    throw new Error(chunkUpsertError.message);
  }

  const embedding = await runWithRetries(() => createSingleRagEmbedding(content), maxRetries, retryDelayMs);

  const { error: chunkVectorError } = await supabase
    .from('rag_document_chunk')
    .update({
      embedding: embedding.embedding,
      token_count: tokenCount,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', chunk.id);

  if (chunkVectorError) {
    throw new Error(chunkVectorError.message);
  }

  return { indexed: true, skipped: false };
}

async function upsertExerciseDocument(row: ExerciseRow, force: boolean, maxRetries: number, retryDelayMs: number) {
  const supabase = getSupabaseServerClient();
  const { content, metadata } = buildExerciseContent(row);
  const contentHash = hashContent(content);
  const sourceId = String(row.id_ejercicio);
  const tokenCount = Math.ceil(content.length / 4);

  const { data: existing, error: existingError } = await supabase
    .from('rag_document')
    .select('id, content_hash')
    .eq('domain', 'exercise')
    .eq('source_table', 'ejercicio')
    .eq('source_id', sourceId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id && existing.content_hash === contentHash && !force) {
    return { indexed: false, skipped: true };
  }

  const { data: document, error: documentError } = await supabase
    .from('rag_document')
    .upsert(
      {
        id: existing?.id,
        domain: 'exercise',
        source_table: 'ejercicio',
        source_id: sourceId,
        title: row.nombre_ejercicio,
        language: 'es-AR',
        metadata,
        content_hash: contentHash,
        active: true,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'domain,source_table,source_id' },
    )
    .select('id')
    .single();

  if (documentError) {
    throw new Error(documentError.message);
  }

  const { data: chunk, error: chunkUpsertError } = await supabase
    .from('rag_document_chunk')
    .upsert(
      {
        document_id: document.id,
        chunk_index: 0,
        content,
        token_count: tokenCount,
        embedding: null,
        metadata,
        active: true,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'document_id,chunk_index' },
    )
    .select('id')
    .single();

  if (chunkUpsertError) {
    throw new Error(chunkUpsertError.message);
  }

  const embedding = await runWithRetries(() => createSingleRagEmbedding(content), maxRetries, retryDelayMs);

  const { error: chunkVectorError } = await supabase
    .from('rag_document_chunk')
    .update({
      embedding: embedding.embedding,
      token_count: tokenCount,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', chunk.id);

  if (chunkVectorError) {
    throw new Error(chunkVectorError.message);
  }

  return { indexed: true, skipped: false };
}

export async function ingestExercisesForRag(
  user: JwtUser,
  payload: RagIngestExercisesRequest = {},
): Promise<RagIngestExercisesResponse> {
  assertAdmin(user);

  const limit = safeLimit(payload.limit);
  const delayMs = safeDelayMs(payload.delayMs);
  const maxRetries = safeRetries(payload.maxRetries);
  const retryDelayMs = safeRetryDelayMs(payload.retryDelayMs);
  const exercises = await fetchExercises(limit, Boolean(payload.onlyMissing));
  const response: RagIngestExercisesResponse = {
    ok: true,
    processed: exercises.length,
    indexed: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (let index = 0; index < exercises.length; index += 1) {
    const exercise = exercises[index];
    try {
      const result = await upsertExerciseDocument(exercise, Boolean(payload.force), maxRetries, retryDelayMs);
      if (result.indexed) response.indexed += 1;
      if (result.skipped) response.skipped += 1;
    } catch (error: any) {
      response.failed += 1;
      response.errors.push(`${exercise.nombre_ejercicio}: ${error?.message ?? 'error desconocido'}`);
    }

    if (delayMs > 0 && index < exercises.length - 1) {
      await sleep(delayMs);
    }
  }

  response.ok = response.failed === 0;
  return response;
}

export async function ingestDietRulesForRag(
  user: JwtUser,
  payload: RagIngestDietRulesRequest = {},
): Promise<RagIngestDietRulesResponse> {
  assertAdmin(user);

  const limit = safeLimit(payload.limit);
  const delayMs = safeDelayMs(payload.delayMs);
  const maxRetries = safeRetries(payload.maxRetries);
  const retryDelayMs = safeRetryDelayMs(payload.retryDelayMs);
  const dietRules = await fetchDietRules(limit, Boolean(payload.onlyMissing));
  const response: RagIngestDietRulesResponse = {
    ok: true,
    processed: dietRules.length,
    indexed: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (let index = 0; index < dietRules.length; index += 1) {
    const dietRule = dietRules[index];
    try {
      const result = await upsertDietRuleDocument(dietRule, Boolean(payload.force), maxRetries, retryDelayMs);
      if (result.indexed) response.indexed += 1;
      if (result.skipped) response.skipped += 1;
    } catch (error: any) {
      response.failed += 1;
      response.errors.push(`${dietRule.tipo_comida ?? dietRule.id}: ${error?.message ?? 'error desconocido'}`);
    }

    if (delayMs > 0 && index < dietRules.length - 1) {
      await sleep(delayMs);
    }
  }

  response.ok = response.failed === 0;
  return response;
}

export async function vectorizePendingRagChunks(
  user: JwtUser,
  payload: RagVectorizePendingRequest = {},
): Promise<RagVectorizePendingResponse> {
  assertAdmin(user);

  const limit = safeLimit(payload.limit);
  const delayMs = safeDelayMs(payload.delayMs);
  const maxRetries = safeRetries(payload.maxRetries);
  const retryDelayMs = safeRetryDelayMs(payload.retryDelayMs);
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from('rag_document_chunk')
    .select('id, content, token_count, active, document_id')
    .eq('active', true)
    .order('creado_en', { ascending: true })
    .limit(limit);

  if (!payload.force) {
    query = query.is('embedding', null);
  }

  const { data: chunks, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const response: RagVectorizePendingResponse = {
    ok: true,
    processed: chunks?.length ?? 0,
    vectorized: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const chunksToVectorize = chunks ?? [];
  for (let index = 0; index < chunksToVectorize.length; index += 1) {
    const chunk = chunksToVectorize[index];
    try {
      const content = String(chunk.content ?? '').replace(/\s+/g, ' ').trim();
      if (content.length < 3) {
        response.skipped += 1;
        continue;
      }

      const embedding = await runWithRetries(() => createSingleRagEmbedding(content), maxRetries, retryDelayMs);
      response.provider = embedding.provider;
      response.model = embedding.model;

      const { error: updateError } = await supabase
        .from('rag_document_chunk')
        .update({
          embedding: embedding.embedding,
          token_count: chunk.token_count ?? Math.ceil(content.length / 4),
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', chunk.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      response.vectorized += 1;
    } catch (error: any) {
      response.failed += 1;
      response.errors.push(`${chunk.id}: ${error?.message ?? 'error desconocido'}`);
    }

    if (delayMs > 0 && index < chunksToVectorize.length - 1) {
      await sleep(delayMs);
    }
  }

  response.ok = response.failed === 0;
  return response;
}
