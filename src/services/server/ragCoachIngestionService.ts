import { createHash } from 'node:crypto';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { RagIngestExercisesRequest, RagIngestExercisesResponse } from '@/interfaces/ragCoach.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { createSingleRagEmbedding } from './ragEmbeddingProviderService';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

type ExerciseRow = Record<string, any>;

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

async function fetchExercises(limit: number) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
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
    .eq('activo', true)
    .order('nombre_ejercicio', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function upsertExerciseDocument(row: ExerciseRow, force: boolean) {
  const supabase = getSupabaseServerClient();
  const { content, metadata } = buildExerciseContent(row);
  const contentHash = hashContent(content);
  const sourceId = String(row.id_ejercicio);

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

  const embedding = await createSingleRagEmbedding(content);
  const tokenCount = Math.ceil(content.length / 4);

  const { error: chunkError } = await supabase.from('rag_document_chunk').upsert(
    {
      document_id: document.id,
      chunk_index: 0,
      content,
      token_count: tokenCount,
      embedding: embedding.embedding,
      metadata,
      active: true,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'document_id,chunk_index' },
  );

  if (chunkError) {
    throw new Error(chunkError.message);
  }

  return { indexed: true, skipped: false };
}

export async function ingestExercisesForRag(
  user: JwtUser,
  payload: RagIngestExercisesRequest = {},
): Promise<RagIngestExercisesResponse> {
  assertAdmin(user);

  const limit = safeLimit(payload.limit);
  const exercises = await fetchExercises(limit);
  const response: RagIngestExercisesResponse = {
    ok: true,
    processed: exercises.length,
    indexed: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const exercise of exercises) {
    try {
      const result = await upsertExerciseDocument(exercise, Boolean(payload.force));
      if (result.indexed) response.indexed += 1;
      if (result.skipped) response.skipped += 1;
    } catch (error: any) {
      response.failed += 1;
      response.errors.push(`${exercise.nombre_ejercicio}: ${error?.message ?? 'error desconocido'}`);
    }
  }

  response.ok = response.failed === 0;
  return response;
}
