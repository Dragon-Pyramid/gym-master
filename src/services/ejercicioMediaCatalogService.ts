import { isIP } from 'node:net';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  EjercicioMediaCatalogItem,
  EjercicioMediaCatalogResponse,
  EjercicioMediaItem,
  EjercicioMediaEquivalenceCandidate,
  EjercicioMediaEquivalenceSyncResponse,
  EjercicioMediaUpdatePayload,
} from '@/interfaces/ejercicioMedia.interface';
import { uploadRemoteUrlCloudinaryWithResult } from '@/lib/cloudinary';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

type SupabaseExerciseRow = Record<string, any>;

type EjercicioMediaImportPayload = {
  id_ejercicio: number;
  url: string;
  titulo?: string | null;
  descripcion_media?: string | null;
};

const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024;
const REMOTE_IMAGE_HEAD_TIMEOUT_MS = 8000;
const VALID_REMOTE_IMAGE_TYPES = /^image\/(png|jpe?g|webp|gif|svg\+xml|heic|heif)$/i;


const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? '';
}

function assertCanManageExerciseMedia(user: JwtUser) {
  const role = normalizeRole(user.rol);

  if (role !== 'admin' && role !== 'administrador') {
    throw new Error('No autorizado para administrar media de ejercicios.');
  }
}

function parsePositiveInteger(value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function extractRelatedName(value: any, key: string): string | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0]?.[key] ?? null;
  }

  return value[key] ?? null;
}

function getPrimaryMedia(row: SupabaseExerciseRow, tipos: string[]) {
  const media = Array.isArray(row.ejercicio_media) ? row.ejercicio_media : [];

  return (
    media.find(
      (item: EjercicioMediaItem) =>
        item.activo && item.es_principal && tipos.includes(item.tipo_media)
    ) ?? null
  );
}

function mapExercise(row: SupabaseExerciseRow): EjercicioMediaCatalogItem {
  const media = Array.isArray(row.ejercicio_media) ? row.ejercicio_media : [];

  return {
    id_ejercicio: row.id_ejercicio,
    nombre_ejercicio: row.nombre_ejercicio,
    nombre_en: row.nombre_en ?? null,
    descripcion: row.descripcion ?? null,
    id_objetivo: row.id_objetivo,
    id_nivel: row.id_nivel,
    id_gm: row.id_gm,
    objetivo_nombre: extractRelatedName(row.objetivo, 'nombre_objetivo'),
    nivel_nombre: extractRelatedName(row.nivel, 'nombre_nivel'),
    grupo_muscular_nombre: extractRelatedName(row.grupo_muscular, 'nombre_gp'),
    imagen: row.imagen ?? null,
    imagen_origen: row.imagen_origen ?? null,
    cloudinary_public_id: row.cloudinary_public_id ?? null,
    video_youtube_url: row.video_youtube_url ?? null,
    youtube_video_id: row.youtube_video_id ?? null,
    media_actualizada_en: row.media_actualizada_en ?? null,
    activo: row.activo !== false,
    media,
    media_principal: getPrimaryMedia(row, ['imagen', 'gif']),
    youtube_principal: getPrimaryMedia(row, ['youtube']),
  };
}

function applyMediaStatusFilter(items: EjercicioMediaCatalogItem[], mediaStatus: string) {
  if (!mediaStatus || mediaStatus === 'todos') {
    return items;
  }

  if (mediaStatus === 'cloudinary') {
    return items.filter((item) => item.imagen_origen === 'cloudinary' || !!item.cloudinary_public_id);
  }

  if (mediaStatus === 'pendiente_cloudinary') {
    return items.filter((item) => item.imagen_origen !== 'cloudinary' || !item.cloudinary_public_id);
  }

  if (mediaStatus === 'youtube') {
    return items.filter((item) => !!item.video_youtube_url || !!item.youtube_principal);
  }

  if (mediaStatus === 'pendiente_youtube') {
    return items.filter((item) => !item.video_youtube_url && !item.youtube_principal);
  }

  if (mediaStatus === 'fallback') {
    return items.filter((item) => item.imagen_origen === 'fallback' || item.imagen?.includes('fallback'));
  }

  return items;
}

function buildSummary(items: EjercicioMediaCatalogItem[]) {
  const total = items.length;
  const conCloudinary = items.filter((item) => item.imagen_origen === 'cloudinary' || !!item.cloudinary_public_id).length;
  const conYoutube = items.filter((item) => !!item.video_youtube_url || !!item.youtube_principal).length;
  const conFallback = items.filter((item) => item.imagen_origen === 'fallback' || item.imagen?.includes('fallback')).length;

  return {
    total,
    conCloudinary,
    conYoutube,
    conFallback,
    pendientesCloudinary: total - conCloudinary,
    pendientesYoutube: total - conYoutube,
  };
}

export async function getExerciseMediaCatalog(
  user: JwtUser,
  searchParams: URLSearchParams
): Promise<EjercicioMediaCatalogResponse> {
  assertCanManageExerciseMedia(user);

  const supabase = conexionBD();
  const page = parsePositiveInteger(searchParams.get('page'), 1);
  const pageSize = parsePositiveInteger(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const q = searchParams.get('q')?.trim() ?? '';
  const objetivo = searchParams.get('objetivo')?.trim();
  const nivel = searchParams.get('nivel')?.trim();
  const mediaStatus = searchParams.get('mediaStatus')?.trim() ?? 'todos';

  let query = supabase
    .from('ejercicio')
    .select(
      `
      id_ejercicio,
      nombre_ejercicio,
      nombre_en,
      descripcion,
      id_objetivo,
      id_nivel,
      id_gm,
      imagen,
      imagen_origen,
      cloudinary_public_id,
      video_youtube_url,
      youtube_video_id,
      media_actualizada_en,
      activo,
      objetivo:objetivo!ejercicio_id_objetivo_fkey(nombre_objetivo),
      nivel:nivel!ejercicio_id_nivel_fkey(nombre_nivel),
      grupo_muscular:grupo_muscular!ejercicio_id_gm_fkey(nombre_gp),
      ejercicio_media(*)
    `
    )
    .eq('activo', true)
    .order('nombre_ejercicio', { ascending: true });

  if (q.length >= 2) {
    const safeQ = q.replace(/[,%]/g, '');
    query = query.or(`nombre_ejercicio.ilike.%${safeQ}%,nombre_en.ilike.%${safeQ}%`);
  }

  if (objetivo && objetivo !== 'todos') {
    query = query.eq('id_objetivo', Number(objetivo));
  }

  if (nivel && nivel !== 'todos') {
    query = query.eq('id_nivel', Number(nivel));
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data ?? []).map(mapExercise);
  const filtered = applyMediaStatusFilter(mapped, mediaStatus);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize;

  return {
    data: filtered.slice(from, to),
    total,
    page: safePage,
    pageSize,
    totalPages,
    resumen: buildSummary(filtered),
  };
}

function normalizeYoutubeUrl(url?: string | null) {
  const cleanUrl = url?.trim();
  return cleanUrl && cleanUrl.length > 0 ? cleanUrl : null;
}

export function extractYoutubeVideoId(url?: string | null): string | null {
  const cleanUrl = normalizeYoutubeUrl(url);

  if (!cleanUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(cleanUrl);
    const host = parsedUrl.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return parsedUrl.pathname.split('/').filter(Boolean)[0] ?? null;
    }

    if (host.endsWith('youtube.com')) {
      if (parsedUrl.searchParams.get('v')) {
        return parsedUrl.searchParams.get('v');
      }

      const parts = parsedUrl.pathname.split('/').filter(Boolean);
      const embedIndex = parts.findIndex((part) => part === 'embed' || part === 'shorts');

      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getImageMediaType(url?: string | null): 'imagen' | 'gif' {
  return url?.toLowerCase().includes('.gif') ? 'gif' : 'imagen';
}

async function replacePrimaryMedia(params: {
  id_ejercicio: number;
  tipo_media: 'imagen' | 'gif' | 'youtube';
  origen: string;
  url: string;
  cloudinary_public_id?: string | null;
  youtube_url?: string | null;
  youtube_video_id?: string | null;
  titulo?: string | null;
  descripcion?: string | null;
}) {
  const supabase = conexionBD();
  const tipoSet = params.tipo_media === 'youtube' ? ['youtube'] : ['imagen', 'gif'];

  const { error: deactivateError } = await supabase
    .from('ejercicio_media')
    .update({ activo: false, es_principal: false, actualizado_en: new Date().toISOString() })
    .eq('id_ejercicio', params.id_ejercicio)
    .in('tipo_media', tipoSet)
    .eq('es_principal', true)
    .eq('activo', true);

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  const { error: insertError } = await supabase.from('ejercicio_media').insert({
    id_ejercicio: params.id_ejercicio,
    tipo_media: params.tipo_media,
    origen: params.origen,
    url: params.url,
    cloudinary_public_id: params.cloudinary_public_id ?? null,
    youtube_url: params.youtube_url ?? null,
    youtube_video_id: params.youtube_video_id ?? null,
    titulo: params.titulo ?? null,
    descripcion: params.descripcion ?? null,
    es_principal: true,
    activo: true,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}


function isPrivateIpAddress(hostname: string) {
  const ipVersion = isIP(hostname);

  if (ipVersion === 0) {
    return false;
  }

  if (ipVersion === 6) {
    const lower = hostname.toLowerCase();
    return (
      lower === '::1' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe80')
    );
  }

  const parts = hostname.split('.').map(Number);

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function assertPublicRemoteImageUrl(rawUrl?: string | null) {
  const cleanUrl = rawUrl?.trim();

  if (!cleanUrl) {
    throw new Error('Debe indicar una URL de imagen o GIF para importar.');
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(cleanUrl);
  } catch {
    throw new Error('La URL de imagen no es válida.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('La URL debe usar protocolo http o https.');
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    isPrivateIpAddress(hostname)
  ) {
    throw new Error('No se permiten URLs locales, privadas o internas.');
  }

  if (hostname.includes('cloudinary.com')) {
    throw new Error('La imagen ya pertenece a Cloudinary. No es necesario importarla nuevamente.');
  }

  return parsedUrl;
}

function getRemoteOriginalName(parsedUrl: URL, fallback: string) {
  const lastSegment = parsedUrl.pathname.split('/').filter(Boolean).pop();
  const decodedSegment = lastSegment ? decodeURIComponent(lastSegment) : '';

  return decodedSegment || `${fallback}.image`;
}

async function assertRemoteImageMetadata(parsedUrl: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_IMAGE_HEAD_TIMEOUT_MS);

  try {
    const response = await fetch(parsedUrl.toString(), {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`La URL externa respondió con estado ${response.status}.`);
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? '';

    if (!VALID_REMOTE_IMAGE_TYPES.test(contentType)) {
      throw new Error('La URL externa no parece ser una imagen/GIF válido.');
    }

    const contentLength = Number(response.headers.get('content-length') ?? 0);

    if (contentLength > MAX_REMOTE_IMAGE_BYTES) {
      throw new Error('La imagen/GIF remoto supera el máximo permitido de 10MB.');
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('La URL externa tardó demasiado en responder.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function importExerciseMediaFromRemoteUrl(
  user: JwtUser,
  payload: EjercicioMediaImportPayload
) {
  assertCanManageExerciseMedia(user);

  if (!Number.isInteger(Number(payload.id_ejercicio))) {
    throw new Error('Debe indicar un id_ejercicio válido.');
  }

  const parsedUrl = assertPublicRemoteImageUrl(payload.url);
  await assertRemoteImageMetadata(parsedUrl);

  const folder = `gym-master/exercises/${payload.id_ejercicio}`;
  const originalName = getRemoteOriginalName(parsedUrl, `ejercicio-${payload.id_ejercicio}`);

  const uploadResult = await uploadRemoteUrlCloudinaryWithResult(
    parsedUrl.toString(),
    originalName,
    folder
  );

  if (!uploadResult.secure_url || !uploadResult.public_id) {
    throw new Error('Cloudinary no devolvió URL segura o public_id para la imagen importada.');
  }

  const data = await updateExerciseMediaCatalogItem(user, {
    id_ejercicio: Number(payload.id_ejercicio),
    imagen: uploadResult.secure_url,
    imagen_origen: 'cloudinary',
    cloudinary_public_id: uploadResult.public_id,
    titulo: payload.titulo ?? null,
    descripcion_media:
      payload.descripcion_media ??
      `Media principal importada automáticamente a Cloudinary desde URL externa: ${parsedUrl.hostname}`,
  });

  return {
    data,
    cloudinary: {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      resource_type: uploadResult.resource_type,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
    },
  };
}


type ExerciseMediaSyncRow = SupabaseExerciseRow & {
  _canonical?: string;
  _sourcePriority?: number;
  _imageUrl?: string;
  _imageOrigin?: string | null;
  _cloudinaryPublicId?: string | null;
  _youtubeUrl?: string | null;
  _youtubeVideoId?: string | null;
};

const EXERCISE_FALLBACK_PATH = '/images/exercises/gym-master-exercise-fallback.svg';
const SYNC_SOURCE_OBJECTIVE = 'volumen';
const SYNC_SOURCE_LEVEL = 'avanzado';

const OBJECTIVE_PREFIXES_TO_STRIP = [
  'definicion',
  'definición',
  'metabolico',
  'metabólico',
  'fuerza',
  'resistencia',
  'rehabilitacion',
  'rehabilitación',
  'salud general',
  'competencia',
  'postparto',
  'estres',
  'estrés',
  'control del estres',
  'control del estrés',
];

const CANONICAL_EXERCISE_ALIASES: Record<string, string> = {
  'press de pecho con barra': 'press plano con barra',
  'press inclinado': 'press inclinado con barra',
  'press inclinado con barra': 'press inclinado con barra',
  'aperturas de pecho': 'apertura con mancuernas en banco plano',
  'aperturas de pecho con mancuernas': 'apertura con mancuernas en banco plano',
  'jalon al pecho con barra': 'dominadas en polea',
  'remo sentado': 'remo en polea',
  'remo unilateral': 'remo con mancuerna',
  'pullover en polea': 'pull over en polea',
  'pull over en polea': 'pull over en polea',
  'sentadilla con barra': 'sentadilla',
  'prensa de piernas': 'prensa',
  'hip thrust con barra': 'elevacion de cadera con barra',
  'patada de gluteo': 'patada de gluteos',
  'curl de biceps con barra': 'curl con barra',
  'curl inclinado': 'curl en banco inclinado con mancuernas',
  'curl martillo': 'martillo con mancuernas',
  'jalon de triceps': 'triceps en polea con soga',
  'extension sobre cabeza': 'extension de triceps por encima de la cabeza',
  'elevaciones laterales': 'vuelo lateral con mancuernas',
  'elevacion de piernas': 'elevacion de piernas colgado',
  'plancha con barra': 'plancha con carga',
  'pallof press': 'pallof press',
};

function normalizeForEquivalence(value?: string | null) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripObjectivePrefixFromExerciseName(value?: string | null) {
  const rawValue = value ?? '';
  const parts = rawValue.split(' - ');

  if (parts.length < 2) {
    return rawValue;
  }

  const normalizedPrefix = normalizeForEquivalence(parts[0]);

  if (OBJECTIVE_PREFIXES_TO_STRIP.includes(normalizedPrefix)) {
    return parts.slice(1).join(' - ');
  }

  return rawValue;
}

function canonicalizeExerciseName(value?: string | null) {
  let normalized = normalizeForEquivalence(stripObjectivePrefixFromExerciseName(value));

  normalized = normalized
    .replace(/\b(pesado|pesada|avanzado|avanzada|controlado|controlada|con pausa|en pausa)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return CANONICAL_EXERCISE_ALIASES[normalized] ?? normalized;
}

function isFallbackImageUrl(url?: string | null) {
  const cleanUrl = url?.trim().toLowerCase();
  return !cleanUrl || cleanUrl.includes('fallback') || cleanUrl === EXERCISE_FALLBACK_PATH;
}

function getRowPrimaryImage(row: ExerciseMediaSyncRow) {
  const mediaPrincipal = getPrimaryMedia(row, ['imagen', 'gif']);
  return {
    url: mediaPrincipal?.url ?? row.imagen ?? null,
    origen: mediaPrincipal?.origen ?? row.imagen_origen ?? null,
    publicId: mediaPrincipal?.cloudinary_public_id ?? row.cloudinary_public_id ?? null,
  };
}

function getRowPrimaryYoutube(row: ExerciseMediaSyncRow) {
  const youtubePrincipal = getPrimaryMedia(row, ['youtube']);
  return {
    url: row.video_youtube_url ?? youtubePrincipal?.youtube_url ?? youtubePrincipal?.url ?? null,
    videoId: row.youtube_video_id ?? youtubePrincipal?.youtube_video_id ?? null,
  };
}

function getRelatedNameForSync(row: ExerciseMediaSyncRow, relationName: string, key: string) {
  return extractRelatedName(row[relationName], key);
}

function getSourcePriority(row: ExerciseMediaSyncRow) {
  const objetivoNombre = normalizeForEquivalence(getRelatedNameForSync(row, 'objetivo', 'nombre_objetivo'));
  const nivelNombre = normalizeForEquivalence(getRelatedNameForSync(row, 'nivel', 'nombre_nivel'));
  const image = getRowPrimaryImage(row);
  const youtube = getRowPrimaryYoutube(row);

  let priority = 0;

  if (objetivoNombre === SYNC_SOURCE_OBJECTIVE && nivelNombre === SYNC_SOURCE_LEVEL) {
    priority += 1000;
  }

  if (image.origen === 'cloudinary' || image.publicId) {
    priority += 250;
  }

  if (image.url && !isFallbackImageUrl(image.url)) {
    priority += 100;
  }

  if (youtube.url) {
    priority += 15;
  }

  return priority;
}

function canUseAsMediaSource(row: ExerciseMediaSyncRow) {
  const image = getRowPrimaryImage(row);
  return Boolean(image.url && !isFallbackImageUrl(image.url));
}

function needsMediaSync(row: ExerciseMediaSyncRow) {
  const image = getRowPrimaryImage(row);
  return isFallbackImageUrl(image.url) || row.imagen_origen === 'fallback';
}

function buildCandidateFromRows(source: ExerciseMediaSyncRow, target: ExerciseMediaSyncRow): EjercicioMediaEquivalenceCandidate {
  const image = getRowPrimaryImage(source);
  const youtube = getRowPrimaryYoutube(source);

  return {
    source_id_ejercicio: source.id_ejercicio,
    source_nombre_ejercicio: source.nombre_ejercicio,
    source_objetivo: getRelatedNameForSync(source, 'objetivo', 'nombre_objetivo'),
    source_nivel: getRelatedNameForSync(source, 'nivel', 'nombre_nivel'),
    target_id_ejercicio: target.id_ejercicio,
    target_nombre_ejercicio: target.nombre_ejercicio,
    target_objetivo: getRelatedNameForSync(target, 'objetivo', 'nombre_objetivo'),
    target_nivel: getRelatedNameForSync(target, 'nivel', 'nombre_nivel'),
    canonical_name: target._canonical ?? canonicalizeExerciseName(target.nombre_ejercicio),
    image_url: image.url ?? '',
    imagen_origen: image.origen ?? null,
    cloudinary_public_id: image.publicId ?? null,
    video_youtube_url: youtube.url ?? null,
    youtube_video_id: youtube.videoId ?? null,
    confidence: 'alta',
    reason: 'Coincidencia conservadora por nombre canónico y mismo grupo muscular. Fuente prioritaria: Volumen Avanzado cuando existe.',
  };
}

async function loadExercisesForMediaSync(): Promise<ExerciseMediaSyncRow[]> {
  const supabase = conexionBD();

  const { data, error } = await supabase
    .from('ejercicio')
    .select(
      `
      id_ejercicio,
      nombre_ejercicio,
      id_objetivo,
      id_nivel,
      id_gm,
      imagen,
      imagen_origen,
      cloudinary_public_id,
      video_youtube_url,
      youtube_video_id,
      media_actualizada_en,
      activo,
      objetivo:objetivo!ejercicio_id_objetivo_fkey(nombre_objetivo),
      nivel:nivel!ejercicio_id_nivel_fkey(nombre_nivel),
      grupo_muscular:grupo_muscular!ejercicio_id_gm_fkey(nombre_gp),
      ejercicio_media(*)
    `
    )
    .eq('activo', true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExerciseMediaSyncRow[];
}

export async function syncExerciseMediaEquivalences(
  user: JwtUser,
  options: { apply?: boolean; limit?: number } = {}
): Promise<EjercicioMediaEquivalenceSyncResponse> {
  assertCanManageExerciseMedia(user);

  const apply = options.apply === true;
  const limit = Math.min(Math.max(Number(options.limit ?? 500), 1), 1000);
  const exercises = await loadExercisesForMediaSync();
  const sourceMap = new Map<string, ExerciseMediaSyncRow>();

  exercises.forEach((exercise) => {
    const canonical = canonicalizeExerciseName(exercise.nombre_ejercicio);
    exercise._canonical = canonical;

    if (!canonical || !canUseAsMediaSource(exercise)) {
      return;
    }

    const key = `${exercise.id_gm}:${canonical}`;
    const priority = getSourcePriority(exercise);
    exercise._sourcePriority = priority;

    const current = sourceMap.get(key);
    const currentPriority = current?._sourcePriority ?? -1;

    if (!current || priority > currentPriority) {
      sourceMap.set(key, exercise);
    }
  });

  const candidates = exercises
    .filter((target) => needsMediaSync(target))
    .map((target) => {
      const canonical = target._canonical ?? canonicalizeExerciseName(target.nombre_ejercicio);
      target._canonical = canonical;
      const source = sourceMap.get(`${target.id_gm}:${canonical}`);

      if (!source || source.id_ejercicio === target.id_ejercicio) {
        return null;
      }

      return buildCandidateFromRows(source, target);
    })
    .filter(Boolean) as EjercicioMediaEquivalenceCandidate[];

  const limitedCandidates = candidates.slice(0, limit);
  let applied = 0;

  if (apply) {
    const supabase = conexionBD();

    for (const candidate of limitedCandidates) {
      const now = new Date().toISOString();
      const imageType = getImageMediaType(candidate.image_url);

      const { error } = await supabase
        .from('ejercicio')
        .update({
          imagen: candidate.image_url,
          imagen_origen: candidate.imagen_origen ?? 'externa',
          cloudinary_public_id: candidate.cloudinary_public_id ?? null,
          video_youtube_url: candidate.video_youtube_url ?? null,
          youtube_video_id: candidate.youtube_video_id ?? null,
          media_actualizada_en: now,
          actualizado_en: now,
        })
        .eq('id_ejercicio', candidate.target_id_ejercicio);

      if (error) {
        throw new Error(error.message);
      }

      await replacePrimaryMedia({
        id_ejercicio: candidate.target_id_ejercicio,
        tipo_media: imageType,
        origen: candidate.imagen_origen ?? 'externa',
        url: candidate.image_url,
        cloudinary_public_id: candidate.cloudinary_public_id ?? null,
        titulo: candidate.target_nombre_ejercicio,
        descripcion: `Media principal sincronizada desde ejercicio equivalente ${candidate.source_nombre_ejercicio}.`,
      });

      if (candidate.video_youtube_url) {
        await replacePrimaryMedia({
          id_ejercicio: candidate.target_id_ejercicio,
          tipo_media: 'youtube',
          origen: 'youtube',
          url: candidate.video_youtube_url,
          youtube_url: candidate.video_youtube_url,
          youtube_video_id: candidate.youtube_video_id ?? null,
          titulo: candidate.target_nombre_ejercicio,
          descripcion: `Video sincronizado desde ejercicio equivalente ${candidate.source_nombre_ejercicio}.`,
        });
      }

      applied += 1;
    }
  }

  return {
    dryRun: !apply,
    total_candidates: candidates.length,
    applied,
    skipped: Math.max(0, candidates.length - applied),
    source_pool: sourceMap.size,
    candidates: limitedCandidates,
  };
}


export async function updateExerciseMediaCatalogItem(
  user: JwtUser,
  payload: EjercicioMediaUpdatePayload
) {
  assertCanManageExerciseMedia(user);

  const supabase = conexionBD();
  const now = new Date().toISOString();
  const youtubeUrl = normalizeYoutubeUrl(payload.video_youtube_url);
  const youtubeVideoId = payload.youtube_video_id ?? extractYoutubeVideoId(youtubeUrl);

  const exerciseUpdate: Record<string, any> = {
    actualizado_en: now,
    media_actualizada_en: now,
  };

  const imageUrl = payload.imagen?.trim();

  if (imageUrl !== undefined) {
    exerciseUpdate.imagen = imageUrl || null;
    exerciseUpdate.imagen_origen = payload.imagen_origen ?? (imageUrl ? 'externa' : null);
    exerciseUpdate.cloudinary_public_id = payload.cloudinary_public_id ?? null;
  }

  if (payload.video_youtube_url !== undefined) {
    exerciseUpdate.video_youtube_url = youtubeUrl;
    exerciseUpdate.youtube_video_id = youtubeVideoId;
  }

  const { data, error } = await supabase
    .from('ejercicio')
    .update(exerciseUpdate)
    .eq('id_ejercicio', payload.id_ejercicio)
    .select('id_ejercicio,nombre_ejercicio,imagen,imagen_origen,cloudinary_public_id,video_youtube_url,youtube_video_id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (imageUrl) {
    await replacePrimaryMedia({
      id_ejercicio: payload.id_ejercicio,
      tipo_media: getImageMediaType(imageUrl),
      origen: payload.imagen_origen ?? 'externa',
      url: imageUrl,
      cloudinary_public_id: payload.cloudinary_public_id ?? null,
      titulo: payload.titulo ?? data?.nombre_ejercicio ?? null,
      descripcion: payload.descripcion_media ?? 'Media principal actualizada desde el catálogo administrativo.',
    });
  }

  if (payload.video_youtube_url !== undefined) {
    if (youtubeUrl) {
      await replacePrimaryMedia({
        id_ejercicio: payload.id_ejercicio,
        tipo_media: 'youtube',
        origen: 'youtube',
        url: youtubeUrl,
        youtube_url: youtubeUrl,
        youtube_video_id: youtubeVideoId,
        titulo: payload.titulo ?? data?.nombre_ejercicio ?? null,
        descripcion: payload.descripcion_media ?? 'Video recomendado para explicar la técnica del ejercicio.',
      });
    } else {
      const { error: deactivateError } = await supabase
        .from('ejercicio_media')
        .update({ activo: false, es_principal: false, actualizado_en: now })
        .eq('id_ejercicio', payload.id_ejercicio)
        .eq('tipo_media', 'youtube')
        .eq('activo', true);

      if (deactivateError) {
        throw new Error(deactivateError.message);
      }
    }
  }

  return data;
}
