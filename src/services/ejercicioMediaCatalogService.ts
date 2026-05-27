import { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  EjercicioMediaCatalogItem,
  EjercicioMediaCatalogResponse,
  EjercicioMediaItem,
  EjercicioMediaUpdatePayload,
} from '@/interfaces/ejercicioMedia.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

type SupabaseExerciseRow = Record<string, any>;

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
