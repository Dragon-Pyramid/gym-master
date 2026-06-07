import { isIP } from "node:net";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import {
  EjercicioMediaCatalogItem,
  EjercicioMediaCatalogResponse,
  EjercicioMediaItem,
  EjercicioMediaEquivalenceCandidate,
  EjercicioMediaEquivalenceSyncResponse,
  EjercicioMediaUpdatePayload,
  EjercicioYoutubeBulkImportResponse,
  EjercicioYoutubeImportItem,
  EjercicioYoutubeImportPreviewItem,
  EjercicioYoutubeAutoDiscoveryRequest,
  EjercicioYoutubeAutoDiscoveryResponse,
  EjercicioYoutubeAutoDiscoveryCandidate,
  EjercicioYoutubeAutoDiscoveryIdioma,
} from "@/interfaces/ejercicioMedia.interface";
import { uploadRemoteUrlCloudinaryWithResult } from "@/lib/cloudinary";
import { conexionBD } from "@/middlewares/conexionBd.middleware";

type SupabaseExerciseRow = Record<string, any>;

type EjercicioMediaImportPayload = {
  id_ejercicio: number;
  url: string;
  titulo?: string | null;
  descripcion_media?: string | null;
};

const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024;
const REMOTE_IMAGE_HEAD_TIMEOUT_MS = 8000;
const VALID_REMOTE_IMAGE_TYPES =
  /^image\/(png|jpe?g|webp|gif|svg\+xml|heic|heif)$/i;

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? "";
}

function assertCanManageExerciseMedia(user: JwtUser) {
  const role = normalizeRole(user.rol);

  if (role !== "admin" && role !== "administrador") {
    throw new Error("No autorizado para administrar media de ejercicios.");
  }
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  max = Number.MAX_SAFE_INTEGER,
) {
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
        item.activo && item.es_principal && tipos.includes(item.tipo_media),
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
    objetivo_nombre: extractRelatedName(row.objetivo, "nombre_objetivo"),
    nivel_nombre: extractRelatedName(row.nivel, "nombre_nivel"),
    grupo_muscular_nombre: extractRelatedName(row.grupo_muscular, "nombre_gp"),
    imagen: row.imagen ?? null,
    imagen_origen: row.imagen_origen ?? null,
    cloudinary_public_id: row.cloudinary_public_id ?? null,
    video_youtube_url: row.video_youtube_url ?? null,
    youtube_video_id: row.youtube_video_id ?? null,
    youtube_url_es: row.youtube_url_es ?? null,
    youtube_video_id_es: row.youtube_video_id_es ?? null,
    youtube_url_en: row.youtube_url_en ?? null,
    youtube_video_id_en: row.youtube_video_id_en ?? null,
    youtube_source: row.youtube_source ?? null,
    youtube_verified_at: row.youtube_verified_at ?? null,
    youtube_review_status: row.youtube_review_status ?? null,
    youtube_review_notes: row.youtube_review_notes ?? null,
    media_actualizada_en: row.media_actualizada_en ?? null,
    activo: row.activo !== false,
    media,
    media_principal: getPrimaryMedia(row, ["imagen", "gif"]),
    youtube_principal: getPrimaryMedia(row, ["youtube"]),
  };
}

function applyMediaStatusFilter(
  items: EjercicioMediaCatalogItem[],
  mediaStatus: string,
) {
  if (!mediaStatus || mediaStatus === "todos") {
    return items;
  }

  if (mediaStatus === "cloudinary") {
    return items.filter(
      (item) =>
        item.imagen_origen === "cloudinary" || !!item.cloudinary_public_id,
    );
  }

  if (mediaStatus === "pendiente_cloudinary") {
    return items.filter(
      (item) =>
        item.imagen_origen !== "cloudinary" || !item.cloudinary_public_id,
    );
  }

  if (mediaStatus === "youtube") {
    return items.filter(
      (item) =>
        !!item.video_youtube_url ||
        !!item.youtube_url_es ||
        !!item.youtube_url_en ||
        !!item.youtube_principal,
    );
  }

  if (mediaStatus === "pendiente_youtube") {
    return items.filter(
      (item) =>
        !item.video_youtube_url &&
        !item.youtube_url_es &&
        !item.youtube_url_en &&
        !item.youtube_principal,
    );
  }

  if (mediaStatus === "youtube_es") {
    return items.filter(
      (item) => !!item.youtube_url_es || !!item.video_youtube_url,
    );
  }

  if (mediaStatus === "pendiente_youtube_es") {
    return items.filter(
      (item) => !item.youtube_url_es && !item.video_youtube_url,
    );
  }

  if (mediaStatus === "youtube_en") {
    return items.filter((item) => !!item.youtube_url_en);
  }

  if (mediaStatus === "pendiente_youtube_en") {
    return items.filter((item) => !item.youtube_url_en);
  }

  if (mediaStatus === "youtube_validado") {
    return items.filter((item) => item.youtube_review_status === "validado");
  }

  if (mediaStatus === "youtube_revision") {
    return items.filter(
      (item) =>
        item.youtube_review_status === "pendiente" ||
        item.youtube_review_status === "requiere_revision" ||
        !item.youtube_review_status,
    );
  }

  if (mediaStatus === "fallback") {
    return items.filter(
      (item) =>
        item.imagen_origen === "fallback" || item.imagen?.includes("fallback"),
    );
  }

  return items;
}

function buildSummary(items: EjercicioMediaCatalogItem[]) {
  const total = items.length;
  const conCloudinary = items.filter(
    (item) =>
      item.imagen_origen === "cloudinary" || !!item.cloudinary_public_id,
  ).length;
  const conYoutube = items.filter(
    (item) =>
      !!item.video_youtube_url ||
      !!item.youtube_url_es ||
      !!item.youtube_url_en ||
      !!item.youtube_principal,
  ).length;
  const conYoutubeEs = items.filter(
    (item) => !!item.youtube_url_es || !!item.video_youtube_url,
  ).length;
  const conYoutubeEn = items.filter((item) => !!item.youtube_url_en).length;
  const youtubeValidados = items.filter(
    (item) => item.youtube_review_status === "validado",
  ).length;
  const youtubePendientesRevision = items.filter(
    (item) =>
      !item.youtube_review_status ||
      item.youtube_review_status === "pendiente" ||
      item.youtube_review_status === "requiere_revision",
  ).length;
  const conFallback = items.filter(
    (item) =>
      item.imagen_origen === "fallback" || item.imagen?.includes("fallback"),
  ).length;

  return {
    total,
    conCloudinary,
    conYoutube,
    conFallback,
    pendientesCloudinary: total - conCloudinary,
    pendientesYoutube: total - conYoutube,
    conYoutubeEs,
    conYoutubeEn,
    pendientesYoutubeEs: total - conYoutubeEs,
    pendientesYoutubeEn: total - conYoutubeEn,
    youtubeValidados,
    youtubePendientesRevision,
  };
}

export async function getExerciseMediaCatalog(
  user: JwtUser,
  searchParams: URLSearchParams,
): Promise<EjercicioMediaCatalogResponse> {
  assertCanManageExerciseMedia(user);

  const supabase = conexionBD();
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const pageSize = parsePositiveInteger(
    searchParams.get("pageSize"),
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );
  const q = searchParams.get("q")?.trim() ?? "";
  const objetivo = searchParams.get("objetivo")?.trim();
  const nivel = searchParams.get("nivel")?.trim();
  const mediaStatus = searchParams.get("mediaStatus")?.trim() ?? "todos";

  let query = supabase
    .from("ejercicio")
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
      youtube_url_es,
      youtube_video_id_es,
      youtube_url_en,
      youtube_video_id_en,
      youtube_source,
      youtube_verified_at,
      youtube_review_status,
      youtube_review_notes,
      media_actualizada_en,
      activo,
      objetivo:objetivo!ejercicio_id_objetivo_fkey(nombre_objetivo),
      nivel:nivel!ejercicio_id_nivel_fkey(nombre_nivel),
      grupo_muscular:grupo_muscular!ejercicio_id_gm_fkey(nombre_gp),
      ejercicio_media(*)
    `,
    )
    .eq("activo", true)
    .order("nombre_ejercicio", { ascending: true });

  if (q.length >= 2) {
    const safeQ = q.replace(/[,%]/g, "");
    query = query.or(
      `nombre_ejercicio.ilike.%${safeQ}%,nombre_en.ilike.%${safeQ}%`,
    );
  }

  if (objetivo && objetivo !== "todos") {
    query = query.eq("id_objetivo", Number(objetivo));
  }

  if (nivel && nivel !== "todos") {
    query = query.eq("id_nivel", Number(nivel));
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
    const host = parsedUrl.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (host.endsWith("youtube.com")) {
      if (parsedUrl.searchParams.get("v")) {
        return parsedUrl.searchParams.get("v");
      }

      const parts = parsedUrl.pathname.split("/").filter(Boolean);
      const embedIndex = parts.findIndex(
        (part) => part === "embed" || part === "shorts",
      );

      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getImageMediaType(url?: string | null): "imagen" | "gif" {
  return url?.toLowerCase().includes(".gif") ? "gif" : "imagen";
}

async function replacePrimaryMedia(params: {
  id_ejercicio: number;
  tipo_media: "imagen" | "gif" | "youtube";
  origen: string;
  url: string;
  cloudinary_public_id?: string | null;
  youtube_url?: string | null;
  youtube_video_id?: string | null;
  titulo?: string | null;
  descripcion?: string | null;
}) {
  const supabase = conexionBD();
  const tipoSet =
    params.tipo_media === "youtube" ? ["youtube"] : ["imagen", "gif"];

  const { error: deactivateError } = await supabase
    .from("ejercicio_media")
    .update({
      activo: false,
      es_principal: false,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id_ejercicio", params.id_ejercicio)
    .in("tipo_media", tipoSet)
    .eq("es_principal", true)
    .eq("activo", true);

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  const { error: insertError } = await supabase.from("ejercicio_media").insert({
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
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80")
    );
  }

  const parts = hostname.split(".").map(Number);

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
    throw new Error("Debe indicar una URL de imagen o GIF para importar.");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(cleanUrl);
  } catch {
    throw new Error("La URL de imagen no es válida.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("La URL debe usar protocolo http o https.");
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isPrivateIpAddress(hostname)
  ) {
    throw new Error("No se permiten URLs locales, privadas o internas.");
  }

  if (hostname.includes("cloudinary.com")) {
    throw new Error(
      "La imagen ya pertenece a Cloudinary. No es necesario importarla nuevamente.",
    );
  }

  return parsedUrl;
}

function getRemoteOriginalName(parsedUrl: URL, fallback: string) {
  const lastSegment = parsedUrl.pathname.split("/").filter(Boolean).pop();
  const decodedSegment = lastSegment ? decodeURIComponent(lastSegment) : "";

  return decodedSegment || `${fallback}.image`;
}

async function assertRemoteImageMetadata(parsedUrl: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REMOTE_IMAGE_HEAD_TIMEOUT_MS,
  );

  try {
    const response = await fetch(parsedUrl.toString(), {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `La URL externa respondió con estado ${response.status}.`,
      );
    }

    const contentType =
      response.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase() ?? "";

    if (!VALID_REMOTE_IMAGE_TYPES.test(contentType)) {
      throw new Error("La URL externa no parece ser una imagen/GIF válido.");
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);

    if (contentLength > MAX_REMOTE_IMAGE_BYTES) {
      throw new Error(
        "La imagen/GIF remoto supera el máximo permitido de 10MB.",
      );
    }
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("La URL externa tardó demasiado en responder.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function importExerciseMediaFromRemoteUrl(
  user: JwtUser,
  payload: EjercicioMediaImportPayload,
) {
  assertCanManageExerciseMedia(user);

  if (!Number.isInteger(Number(payload.id_ejercicio))) {
    throw new Error("Debe indicar un id_ejercicio válido.");
  }

  const parsedUrl = assertPublicRemoteImageUrl(payload.url);
  await assertRemoteImageMetadata(parsedUrl);

  const folder = `gym-master/exercises/${payload.id_ejercicio}`;
  const originalName = getRemoteOriginalName(
    parsedUrl,
    `ejercicio-${payload.id_ejercicio}`,
  );

  const uploadResult = await uploadRemoteUrlCloudinaryWithResult(
    parsedUrl.toString(),
    originalName,
    folder,
  );

  if (!uploadResult.secure_url || !uploadResult.public_id) {
    throw new Error(
      "Cloudinary no devolvió URL segura o public_id para la imagen importada.",
    );
  }

  const data = await updateExerciseMediaCatalogItem(user, {
    id_ejercicio: Number(payload.id_ejercicio),
    imagen: uploadResult.secure_url,
    imagen_origen: "cloudinary",
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

const EXERCISE_FALLBACK_PATH =
  "/images/exercises/gym-master-exercise-fallback.svg";
const SYNC_SOURCE_OBJECTIVE = "volumen";
const SYNC_SOURCE_LEVEL = "avanzado";

const OBJECTIVE_PREFIXES_TO_STRIP = [
  "definicion",
  "definición",
  "metabolico",
  "metabólico",
  "fuerza",
  "resistencia",
  "rehabilitacion",
  "rehabilitación",
  "salud general",
  "competencia",
  "postparto",
  "estres",
  "estrés",
  "control del estres",
  "control del estrés",
];

const CANONICAL_EXERCISE_ALIASES: Record<string, string> = {
  "press de pecho con barra": "press plano con barra",
  "press inclinado": "press inclinado con barra",
  "press inclinado con barra": "press inclinado con barra",
  "aperturas de pecho": "apertura con mancuernas en banco plano",
  "aperturas de pecho con mancuernas": "apertura con mancuernas en banco plano",
  "jalon al pecho con barra": "dominadas en polea",
  "remo sentado": "remo en polea",
  "remo unilateral": "remo con mancuerna",
  "pullover en polea": "pull over en polea",
  "pull over en polea": "pull over en polea",
  "sentadilla con barra": "sentadilla",
  "prensa de piernas": "prensa",
  "hip thrust con barra": "elevacion de cadera con barra",
  "patada de gluteo": "patada de gluteos",
  "curl de biceps con barra": "curl con barra",
  "curl inclinado": "curl en banco inclinado con mancuernas",
  "curl martillo": "martillo con mancuernas",
  "jalon de triceps": "triceps en polea con soga",
  "extension sobre cabeza": "extension de triceps por encima de la cabeza",
  "elevaciones laterales": "vuelo lateral con mancuernas",
  "elevacion de piernas": "elevacion de piernas colgado",
  "plancha con barra": "plancha con carga",
  "pallof press": "pallof press",
};

function normalizeForEquivalence(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripObjectivePrefixFromExerciseName(value?: string | null) {
  const rawValue = value ?? "";
  const parts = rawValue.split(" - ");

  if (parts.length < 2) {
    return rawValue;
  }

  const normalizedPrefix = normalizeForEquivalence(parts[0]);

  if (OBJECTIVE_PREFIXES_TO_STRIP.includes(normalizedPrefix)) {
    return parts.slice(1).join(" - ");
  }

  return rawValue;
}

function canonicalizeExerciseName(value?: string | null) {
  let normalized = normalizeForEquivalence(
    stripObjectivePrefixFromExerciseName(value),
  );

  normalized = normalized
    .replace(
      /\b(pesado|pesada|avanzado|avanzada|controlado|controlada|con pausa|en pausa)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  return CANONICAL_EXERCISE_ALIASES[normalized] ?? normalized;
}

function isFallbackImageUrl(url?: string | null) {
  const cleanUrl = url?.trim().toLowerCase();
  return (
    !cleanUrl ||
    cleanUrl.includes("fallback") ||
    cleanUrl === EXERCISE_FALLBACK_PATH
  );
}

function getRowPrimaryImage(row: ExerciseMediaSyncRow) {
  const mediaPrincipal = getPrimaryMedia(row, ["imagen", "gif"]);
  return {
    url: mediaPrincipal?.url ?? row.imagen ?? null,
    origen: mediaPrincipal?.origen ?? row.imagen_origen ?? null,
    publicId:
      mediaPrincipal?.cloudinary_public_id ?? row.cloudinary_public_id ?? null,
  };
}

function getRowPrimaryYoutube(row: ExerciseMediaSyncRow) {
  const youtubePrincipal = getPrimaryMedia(row, ["youtube"]);
  return {
    url:
      row.video_youtube_url ??
      youtubePrincipal?.youtube_url ??
      youtubePrincipal?.url ??
      null,
    videoId: row.youtube_video_id ?? youtubePrincipal?.youtube_video_id ?? null,
  };
}

function getRelatedNameForSync(
  row: ExerciseMediaSyncRow,
  relationName: string,
  key: string,
) {
  return extractRelatedName(row[relationName], key);
}

function getSourcePriority(row: ExerciseMediaSyncRow) {
  const objetivoNombre = normalizeForEquivalence(
    getRelatedNameForSync(row, "objetivo", "nombre_objetivo"),
  );
  const nivelNombre = normalizeForEquivalence(
    getRelatedNameForSync(row, "nivel", "nombre_nivel"),
  );
  const image = getRowPrimaryImage(row);
  const youtube = getRowPrimaryYoutube(row);

  let priority = 0;

  if (
    objetivoNombre === SYNC_SOURCE_OBJECTIVE &&
    nivelNombre === SYNC_SOURCE_LEVEL
  ) {
    priority += 1000;
  }

  if (image.origen === "cloudinary" || image.publicId) {
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
  return isFallbackImageUrl(image.url) || row.imagen_origen === "fallback";
}

function buildCandidateFromRows(
  source: ExerciseMediaSyncRow,
  target: ExerciseMediaSyncRow,
): EjercicioMediaEquivalenceCandidate {
  const image = getRowPrimaryImage(source);
  const youtube = getRowPrimaryYoutube(source);

  return {
    source_id_ejercicio: source.id_ejercicio,
    source_nombre_ejercicio: source.nombre_ejercicio,
    source_objetivo: getRelatedNameForSync(
      source,
      "objetivo",
      "nombre_objetivo",
    ),
    source_nivel: getRelatedNameForSync(source, "nivel", "nombre_nivel"),
    target_id_ejercicio: target.id_ejercicio,
    target_nombre_ejercicio: target.nombre_ejercicio,
    target_objetivo: getRelatedNameForSync(
      target,
      "objetivo",
      "nombre_objetivo",
    ),
    target_nivel: getRelatedNameForSync(target, "nivel", "nombre_nivel"),
    canonical_name:
      target._canonical ?? canonicalizeExerciseName(target.nombre_ejercicio),
    image_url: image.url ?? "",
    imagen_origen: image.origen ?? null,
    cloudinary_public_id: image.publicId ?? null,
    video_youtube_url: youtube.url ?? null,
    youtube_video_id: youtube.videoId ?? null,
    confidence: "alta",
    reason:
      "Coincidencia conservadora por nombre canónico y mismo grupo muscular. Fuente prioritaria: Volumen Avanzado cuando existe.",
  };
}

async function loadExercisesForMediaSync(): Promise<ExerciseMediaSyncRow[]> {
  const supabase = conexionBD();

  const { data, error } = await supabase
    .from("ejercicio")
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
      youtube_url_es,
      youtube_video_id_es,
      youtube_url_en,
      youtube_video_id_en,
      youtube_source,
      youtube_verified_at,
      youtube_review_status,
      youtube_review_notes,
      media_actualizada_en,
      activo,
      objetivo:objetivo!ejercicio_id_objetivo_fkey(nombre_objetivo),
      nivel:nivel!ejercicio_id_nivel_fkey(nombre_nivel),
      grupo_muscular:grupo_muscular!ejercicio_id_gm_fkey(nombre_gp),
      ejercicio_media(*)
    `,
    )
    .eq("activo", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExerciseMediaSyncRow[];
}

export async function syncExerciseMediaEquivalences(
  user: JwtUser,
  options: { apply?: boolean; limit?: number } = {},
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
      const canonical =
        target._canonical ?? canonicalizeExerciseName(target.nombre_ejercicio);
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
        .from("ejercicio")
        .update({
          imagen: candidate.image_url,
          imagen_origen: candidate.imagen_origen ?? "externa",
          cloudinary_public_id: candidate.cloudinary_public_id ?? null,
          video_youtube_url: candidate.video_youtube_url ?? null,
          youtube_video_id: candidate.youtube_video_id ?? null,
          media_actualizada_en: now,
          actualizado_en: now,
        })
        .eq("id_ejercicio", candidate.target_id_ejercicio);

      if (error) {
        throw new Error(error.message);
      }

      await replacePrimaryMedia({
        id_ejercicio: candidate.target_id_ejercicio,
        tipo_media: imageType,
        origen: candidate.imagen_origen ?? "externa",
        url: candidate.image_url,
        cloudinary_public_id: candidate.cloudinary_public_id ?? null,
        titulo: candidate.target_nombre_ejercicio,
        descripcion: `Media principal sincronizada desde ejercicio equivalente ${candidate.source_nombre_ejercicio}.`,
      });

      if (candidate.video_youtube_url) {
        await replacePrimaryMedia({
          id_ejercicio: candidate.target_id_ejercicio,
          tipo_media: "youtube",
          origen: "youtube",
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
  payload: EjercicioMediaUpdatePayload,
) {
  assertCanManageExerciseMedia(user);

  const supabase = conexionBD();
  const now = new Date().toISOString();
  const youtubeUrl = normalizeYoutubeUrl(payload.video_youtube_url);
  const explicitYoutubeUrlEs =
    payload.youtube_url_es !== undefined
      ? normalizeYoutubeUrl(payload.youtube_url_es)
      : undefined;
  const explicitYoutubeUrlEn =
    payload.youtube_url_en !== undefined
      ? normalizeYoutubeUrl(payload.youtube_url_en)
      : undefined;
  const effectiveYoutubeUrlEs =
    explicitYoutubeUrlEs !== undefined ? explicitYoutubeUrlEs : youtubeUrl;
  const youtubeVideoId =
    payload.youtube_video_id ?? extractYoutubeVideoId(youtubeUrl);
  const youtubeVideoIdEs =
    payload.youtube_video_id_es ?? extractYoutubeVideoId(effectiveYoutubeUrlEs);
  const youtubeVideoIdEn =
    payload.youtube_video_id_en ?? extractYoutubeVideoId(explicitYoutubeUrlEn);

  const exerciseUpdate: Record<string, any> = {
    actualizado_en: now,
    media_actualizada_en: now,
  };

  const imageUrl = payload.imagen?.trim();

  if (imageUrl !== undefined) {
    exerciseUpdate.imagen = imageUrl || null;
    exerciseUpdate.imagen_origen =
      payload.imagen_origen ?? (imageUrl ? "externa" : null);
    exerciseUpdate.cloudinary_public_id = payload.cloudinary_public_id ?? null;
  }

  if (payload.video_youtube_url !== undefined) {
    exerciseUpdate.video_youtube_url = youtubeUrl;
    exerciseUpdate.youtube_video_id = youtubeVideoId;

    if (payload.youtube_url_es === undefined) {
      exerciseUpdate.youtube_url_es = youtubeUrl;
      exerciseUpdate.youtube_video_id_es = youtubeVideoId;
    }
  }

  if (payload.youtube_url_es !== undefined) {
    exerciseUpdate.youtube_url_es = explicitYoutubeUrlEs;
    exerciseUpdate.youtube_video_id_es = youtubeVideoIdEs;
    exerciseUpdate.video_youtube_url = explicitYoutubeUrlEs;
    exerciseUpdate.youtube_video_id = youtubeVideoIdEs;
  }

  if (payload.youtube_url_en !== undefined) {
    exerciseUpdate.youtube_url_en = explicitYoutubeUrlEn;
    exerciseUpdate.youtube_video_id_en = youtubeVideoIdEn;
  }

  if (payload.youtube_source !== undefined) {
    exerciseUpdate.youtube_source = payload.youtube_source?.trim() || null;
  }

  if (payload.youtube_review_status !== undefined) {
    exerciseUpdate.youtube_review_status = normalizeYoutubeReviewStatus(
      payload.youtube_review_status,
    );
  }

  if (payload.youtube_review_notes !== undefined) {
    exerciseUpdate.youtube_review_notes =
      payload.youtube_review_notes?.trim() || null;
  }

  if (payload.youtube_verified_at !== undefined) {
    exerciseUpdate.youtube_verified_at = payload.youtube_verified_at;
  } else if (
    payload.youtube_review_status === "validado" ||
    (payload.video_youtube_url !== undefined && youtubeUrl) ||
    (payload.youtube_url_es !== undefined && explicitYoutubeUrlEs)
  ) {
    exerciseUpdate.youtube_verified_at = now;
  }

  const { data, error } = await supabase
    .from("ejercicio")
    .update(exerciseUpdate)
    .eq("id_ejercicio", payload.id_ejercicio)
    .select(
      "id_ejercicio,nombre_ejercicio,imagen,imagen_origen,cloudinary_public_id,video_youtube_url,youtube_video_id,youtube_url_es,youtube_video_id_es,youtube_url_en,youtube_video_id_en,youtube_source,youtube_verified_at,youtube_review_status,youtube_review_notes",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (imageUrl) {
    await replacePrimaryMedia({
      id_ejercicio: payload.id_ejercicio,
      tipo_media: getImageMediaType(imageUrl),
      origen: payload.imagen_origen ?? "externa",
      url: imageUrl,
      cloudinary_public_id: payload.cloudinary_public_id ?? null,
      titulo: payload.titulo ?? data?.nombre_ejercicio ?? null,
      descripcion:
        payload.descripcion_media ??
        "Media principal actualizada desde el catálogo administrativo.",
    });
  }

  if (
    payload.video_youtube_url !== undefined ||
    payload.youtube_url_es !== undefined
  ) {
    const primaryYoutubeUrl =
      explicitYoutubeUrlEs !== undefined ? explicitYoutubeUrlEs : youtubeUrl;
    const primaryYoutubeVideoId =
      explicitYoutubeUrlEs !== undefined ? youtubeVideoIdEs : youtubeVideoId;

    if (primaryYoutubeUrl) {
      await replacePrimaryMedia({
        id_ejercicio: payload.id_ejercicio,
        tipo_media: "youtube",
        origen: "youtube",
        url: primaryYoutubeUrl,
        youtube_url: primaryYoutubeUrl,
        youtube_video_id: primaryYoutubeVideoId,
        titulo: payload.titulo ?? data?.nombre_ejercicio ?? null,
        descripcion:
          payload.descripcion_media ??
          "Video recomendado en español para explicar la técnica del ejercicio.",
      });
    } else {
      const { error: deactivateError } = await supabase
        .from("ejercicio_media")
        .update({ activo: false, es_principal: false, actualizado_en: now })
        .eq("id_ejercicio", payload.id_ejercicio)
        .eq("tipo_media", "youtube")
        .eq("activo", true);

      if (deactivateError) {
        throw new Error(deactivateError.message);
      }
    }
  }

  return data;
}

const VALID_YOUTUBE_REVIEW_STATUSES = new Set([
  "pendiente",
  "sugerido",
  "validado",
  "rechazado",
  "requiere_revision",
]);

function normalizeYoutubeReviewStatus(value?: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "pendiente";
  return VALID_YOUTUBE_REVIEW_STATUSES.has(normalized)
    ? normalized
    : "pendiente";
}

function normalizeImportText(value?: string | null) {
  return value?.trim() ? value.trim() : null;
}

function normalizeImportName(value?: string | null) {
  return normalizeForEquivalence(value);
}

async function loadExerciseLookupForYoutubeImport() {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from("ejercicio")
    .select(
      "id_ejercicio,nombre_ejercicio,nombre_en,video_youtube_url,youtube_video_id,youtube_url_es,youtube_video_id_es,youtube_url_en,youtube_video_id_en",
    )
    .eq("activo", true);

  if (error) {
    throw new Error(error.message);
  }

  const byId = new Map<number, SupabaseExerciseRow>();
  const byName = new Map<string, SupabaseExerciseRow>();

  (data ?? []).forEach((exercise: SupabaseExerciseRow) => {
    byId.set(Number(exercise.id_ejercicio), exercise);
    const nameKey = normalizeImportName(exercise.nombre_ejercicio);
    const englishNameKey = normalizeImportName(exercise.nombre_en);

    if (nameKey && !byName.has(nameKey)) byName.set(nameKey, exercise);
    if (englishNameKey && !byName.has(englishNameKey))
      byName.set(englishNameKey, exercise);
  });

  return { byId, byName };
}

function resolveExerciseForYoutubeImport(
  item: EjercicioYoutubeImportItem,
  lookup: Awaited<ReturnType<typeof loadExerciseLookupForYoutubeImport>>,
) {
  const id = Number(item.id_ejercicio);

  if (Number.isInteger(id) && id > 0) {
    return lookup.byId.get(id) ?? null;
  }

  const nameKey = normalizeImportName(item.nombre_ejercicio);
  return nameKey ? (lookup.byName.get(nameKey) ?? null) : null;
}

function buildImportUpdate(item: EjercicioYoutubeImportItem, now: string) {
  const youtubeUrlEs = normalizeImportText(item.youtube_url_es);
  const youtubeUrlEn = normalizeImportText(item.youtube_url_en);
  const youtubeVideoIdEs = extractYoutubeVideoId(youtubeUrlEs);
  const youtubeVideoIdEn = extractYoutubeVideoId(youtubeUrlEn);
  const reviewStatus = normalizeYoutubeReviewStatus(
    item.youtube_review_status ??
      (youtubeUrlEs || youtubeUrlEn ? "sugerido" : "pendiente"),
  );
  const source = normalizeImportText(item.youtube_source) ?? "csv_import";

  return {
    youtubeUrlEs,
    youtubeUrlEn,
    youtubeVideoIdEs,
    youtubeVideoIdEn,
    reviewStatus,
    source,
    notes: normalizeImportText(item.youtube_review_notes),
    update: {
      youtube_url_es: youtubeUrlEs,
      youtube_video_id_es: youtubeVideoIdEs,
      youtube_url_en: youtubeUrlEn,
      youtube_video_id_en: youtubeVideoIdEn,
      video_youtube_url: youtubeUrlEs,
      youtube_video_id: youtubeVideoIdEs,
      youtube_source: source,
      youtube_review_status: reviewStatus,
      youtube_review_notes: normalizeImportText(item.youtube_review_notes),
      youtube_verified_at: reviewStatus === "validado" ? now : null,
      media_actualizada_en: now,
      actualizado_en: now,
    },
  };
}

export async function importExerciseYoutubeVideos(
  user: JwtUser,
  payload: { apply?: boolean; items?: EjercicioYoutubeImportItem[] },
): Promise<EjercicioYoutubeBulkImportResponse> {
  assertCanManageExerciseMedia(user);

  const items = Array.isArray(payload.items)
    ? payload.items.slice(0, 1500)
    : [];
  const dryRun = payload.apply !== true;
  const preview: EjercicioYoutubeImportPreviewItem[] = [];
  let matched = 0;
  let applied = 0;
  let skipped = 0;
  let errors = 0;

  if (items.length === 0) {
    return {
      dryRun,
      total: 0,
      matched: 0,
      applied: 0,
      skipped: 0,
      errors: 0,
      preview: [],
    };
  }

  const supabase = conexionBD();
  const lookup = await loadExerciseLookupForYoutubeImport();
  const now = new Date().toISOString();

  for (const [index, item] of items.entries()) {
    const row = index + 1;
    const exercise = resolveExerciseForYoutubeImport(item, lookup);

    if (!exercise) {
      errors += 1;
      preview.push({
        row,
        id_ejercicio: item.id_ejercicio ? Number(item.id_ejercicio) : null,
        nombre_ejercicio: item.nombre_ejercicio ?? null,
        action: "error",
        message: "No se encontró ejercicio por id_ejercicio o nombre exacto.",
      });
      continue;
    }

    const updateData = buildImportUpdate(item, now);

    if (!updateData.youtubeUrlEs && !updateData.youtubeUrlEn) {
      skipped += 1;
      preview.push({
        row,
        id_ejercicio: Number(exercise.id_ejercicio),
        nombre_ejercicio: exercise.nombre_ejercicio ?? null,
        action: "skip",
        message: "Fila sin URL ES ni URL EN.",
      });
      continue;
    }

    matched += 1;

    if (!dryRun) {
      const { error } = await supabase
        .from("ejercicio")
        .update(updateData.update)
        .eq("id_ejercicio", Number(exercise.id_ejercicio));

      if (error) {
        errors += 1;
        preview.push({
          row,
          id_ejercicio: Number(exercise.id_ejercicio),
          nombre_ejercicio: exercise.nombre_ejercicio ?? null,
          action: "error",
          message: error.message,
        });
        continue;
      }

      if (updateData.youtubeUrlEs) {
        await replacePrimaryMedia({
          id_ejercicio: Number(exercise.id_ejercicio),
          tipo_media: "youtube",
          origen: "youtube",
          url: updateData.youtubeUrlEs,
          youtube_url: updateData.youtubeUrlEs,
          youtube_video_id: updateData.youtubeVideoIdEs,
          titulo: exercise.nombre_ejercicio ?? null,
          descripcion:
            "Video recomendado en español importado desde proceso masivo revisable.",
        });
      }

      applied += 1;
    }

    preview.push({
      row,
      id_ejercicio: Number(exercise.id_ejercicio),
      nombre_ejercicio: exercise.nombre_ejercicio ?? null,
      youtube_url_es: updateData.youtubeUrlEs,
      youtube_video_id_es: updateData.youtubeVideoIdEs,
      youtube_url_en: updateData.youtubeUrlEn,
      youtube_video_id_en: updateData.youtubeVideoIdEn,
      action: dryRun ? "skip" : "update",
      message: dryRun
        ? "Preview: ejercicio encontrado; no se aplicaron cambios."
        : "Video YouTube actualizado.",
    });
  }

  return {
    dryRun,
    total: items.length,
    matched,
    applied,
    skipped,
    errors,
    preview: preview.slice(0, 300),
  };
}

type YoutubeApiSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    description?: string;
  };
};

type YoutubeApiVideoItem = {
  id?: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
  };
  statistics?: {
    viewCount?: string;
  };
  contentDetails?: {
    duration?: string;
  };
  status?: {
    embeddable?: boolean;
  };
};

const YOUTUBE_AUTO_DISCOVERY_MAX_LIMIT = 10;
const YOUTUBE_AUTO_DISCOVERY_DEFAULT_LIMIT = 10;

function clampYoutubeDiscoveryLimit(value?: number | string | null) {
  const parsed = Number(value ?? YOUTUBE_AUTO_DISCOVERY_DEFAULT_LIMIT);
  if (!Number.isInteger(parsed) || parsed <= 0)
    return YOUTUBE_AUTO_DISCOVERY_DEFAULT_LIMIT;
  return Math.min(parsed, YOUTUBE_AUTO_DISCOVERY_MAX_LIMIT);
}

function normalizeYoutubeDiscoveryIdiomas(
  value?: string[] | null,
): EjercicioYoutubeAutoDiscoveryIdioma[] {
  const requested = Array.isArray(value) ? value : ["es", "en"];
  const valid = requested
    .map((idioma) => idioma?.trim().toLowerCase())
    .filter(
      (idioma): idioma is EjercicioYoutubeAutoDiscoveryIdioma =>
        idioma === "es" || idioma === "en",
    );
  return Array.from(new Set(valid.length > 0 ? valid : ["es", "en"]));
}

function hasYoutubeForLanguage(
  row: SupabaseExerciseRow,
  idioma: EjercicioYoutubeAutoDiscoveryIdioma,
) {
  if (idioma === "es") {
    return Boolean(
      row.youtube_url_es ||
      row.youtube_video_id_es ||
      row.video_youtube_url ||
      row.youtube_video_id,
    );
  }

  return Boolean(row.youtube_url_en || row.youtube_video_id_en);
}

function buildYoutubeDiscoveryQuery(
  row: SupabaseExerciseRow,
  idioma: EjercicioYoutubeAutoDiscoveryIdioma,
) {
  if (idioma === "en") {
    const englishName =
      normalizeImportText(row.nombre_en) ??
      normalizeImportText(row.nombre_ejercicio);
    return `${englishName} exercise tutorial proper form gym`;
  }

  return `${row.nombre_ejercicio} ejercicio técnica tutorial gimnasio`;
}

function youtubeWatchUrl(videoId?: string | null) {
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

function isLikelyYoutubeShort(video: YoutubeApiVideoItem) {
  const title = video.snippet?.title?.toLowerCase() ?? "";
  const duration = video.contentDetails?.duration ?? "";
  return (
    title.includes("#shorts") ||
    title.includes(" shorts") ||
    duration === "PT0S"
  );
}

function parseYoutubeViewCount(video: YoutubeApiVideoItem) {
  const value = Number(video.statistics?.viewCount ?? 0);
  return Number.isFinite(value) ? value : 0;
}

const YOUTUBE_DISCOVERY_STOP_WORDS = new Set([
  "de",
  "del",
  "con",
  "para",
  "por",
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "ejercicio",
  "ejercicios",
  "tecnica",
  "técnica",
  "tutorial",
  "gimnasio",
  "gym",
  "exercise",
  "exercises",
  "proper",
  "form",
  "workout",
  "training",
  "how",
  "to",
  "do",
  "the",
  "a",
  "an",
  "and",
  "with",
]);

function normalizeYoutubeDiscoveryText(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeYoutubeDiscovery(value?: string | null) {
  return normalizeYoutubeDiscoveryText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(
      (token) => token.length >= 3 && !YOUTUBE_DISCOVERY_STOP_WORDS.has(token),
    );
}

function containsAnyYoutubeToken(text: string, tokens: string[]) {
  return tokens.some((token) => text.includes(token));
}

function scoreYoutubeCandidate(
  video: YoutubeApiVideoItem,
  params: {
    exerciseName: string;
    englishName?: string | null;
    idioma: EjercicioYoutubeAutoDiscoveryIdioma;
  },
) {
  const title = normalizeYoutubeDiscoveryText(video.snippet?.title);
  const channel = normalizeYoutubeDiscoveryText(video.snippet?.channelTitle);
  const description = normalizeYoutubeDiscoveryText((video.snippet as { description?: string } | undefined)?.description);
  const searchable = `${title} ${channel} ${description}`;
  const targetName =
    params.idioma === "en"
      ? params.englishName || params.exerciseName
      : params.exerciseName;
  const targetTokens = tokenizeYoutubeDiscovery(targetName);

  let score = 0;

  for (const token of targetTokens) {
    if (title.includes(token)) score += 3;
    else if (searchable.includes(token)) score += 1;
  }

  if (
    targetTokens.length > 0 &&
    targetTokens.every((token) => title.includes(token))
  ) {
    score += 8;
  }

  if (
    containsAnyYoutubeToken(title, [
      "tutorial",
      "tecnica",
      "tecnica",
      "proper",
      "form",
      "how to",
      "guia",
      "guía",
    ])
  ) {
    score += 2;
  }

  const target = normalizeYoutubeDiscoveryText(targetName);
  const titleHasLowerBody = containsAnyYoutubeToken(title, [
    "pierna",
    "piernas",
    "leg",
    "legs",
    "cuadriceps",
    "quadriceps",
    "gluteo",
    "gluteos",
    "glute",
  ]);
  const targetIsLowerBody = containsAnyYoutubeToken(target, [
    "pierna",
    "piernas",
    "leg",
    "legs",
    "cuadriceps",
    "quadriceps",
    "gluteo",
    "gluteos",
    "sentadilla",
    "squat",
  ]);
  const targetLooksLikeChestPress =
    containsAnyYoutubeToken(target, ["press", "pecho", "banca", "bench"]) &&
    !targetIsLowerBody;

  if (targetLooksLikeChestPress && titleHasLowerBody) {
    score -= 100;
  }

  if (
    targetLooksLikeChestPress &&
    containsAnyYoutubeToken(title, [
      "row",
      "remo",
      "bent over",
      "bent-over",
      "shoulder press",
      "press militar",
      "military press",
      "overhead press",
      "leg press",
      "prensa",
      "prensa de piernas",
    ])
  ) {
    score -= 100;
  }

  if (
    containsAnyYoutubeToken(target, ["inclinado", "incline", "inclined"]) &&
    containsAnyYoutubeToken(title, ["flat", "plano", "decline", "declinado"])
  ) {
    score -= 20;
  }

  if (
    containsAnyYoutubeToken(target, ["declinado", "decline"]) &&
    containsAnyYoutubeToken(title, ["flat", "plano", "incline", "inclinado"])
  ) {
    score -= 20;
  }

  if (
    containsAnyYoutubeToken(target, ["press", "banca", "bench"]) &&
    !containsAnyYoutubeToken(title, ["press", "banca", "bench"])
  ) {
    score -= 40;
  }

  if (
    target.includes("barra") &&
    containsAnyYoutubeToken(title, [
      "mancuerna",
      "mancuernas",
      "dumbbell",
      "dumbbells",
    ])
  ) {
    score -= 15;
  }

  if (
    target.includes("mancuerna") &&
    containsAnyYoutubeToken(title, ["barra", "barbell"])
  ) {
    score -= 15;
  }

  if (
    containsAnyYoutubeToken(title, [
      "motivacion",
      "motivation",
      "fail",
      "fails",
      "compilacion",
      "compilation",
      "music",
      "musica",
    ])
  ) {
    score -= 20;
  }

  if (isLikelyYoutubeShort(video)) {
    score -= 10;
  }

  return score;
}

class YoutubeQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YoutubeQuotaExceededError";
  }
}

function isYoutubeQuotaExceededError(error: unknown) {
  return error instanceof YoutubeQuotaExceededError;
}

async function youtubeApiGet<T>(url: URL): Promise<T> {
  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const message = `YouTube API respondió ${response.status}. ${body.slice(0, 300)}`;

    if (
      response.status === 429 ||
      body.toLowerCase().includes("quota exceeded") ||
      body.toLowerCase().includes("quotaexceeded")
    ) {
      throw new YoutubeQuotaExceededError(
        `${message}. Se detuvo la corrida para no seguir consumiendo cuota ni generar resultados incompletos. Reintentá cuando se renueve la cuota diaria de YouTube.`,
      );
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function findBestYoutubeVideo(params: {
  apiKey: string;
  query: string;
  idioma: EjercicioYoutubeAutoDiscoveryIdioma;
  regionCode: string;
  exerciseName: string;
  englishName?: string | null;
}) {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "8");
  searchUrl.searchParams.set("order", "viewCount");
  searchUrl.searchParams.set("q", params.query);
  searchUrl.searchParams.set("safeSearch", "moderate");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("regionCode", params.regionCode);
  searchUrl.searchParams.set("relevanceLanguage", params.idioma);
  searchUrl.searchParams.set("key", params.apiKey);

  const searchResult = await youtubeApiGet<{ items?: YoutubeApiSearchItem[] }>(
    searchUrl,
  );
  const videoIds = (searchResult.items ?? [])
    .map((item) => item.id?.videoId)
    .filter(Boolean) as string[];

  if (videoIds.length === 0) {
    return null;
  }

  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set(
    "part",
    "snippet,statistics,contentDetails,status",
  );
  detailsUrl.searchParams.set("id", videoIds.join(","));
  detailsUrl.searchParams.set("key", params.apiKey);

  const detailsResult = await youtubeApiGet<{ items?: YoutubeApiVideoItem[] }>(
    detailsUrl,
  );
  const candidates = (detailsResult.items ?? [])
    .filter((video) => video.id)
    .filter((video) => video.status?.embeddable !== false)
    .map((video) => ({
      video,
      score: scoreYoutubeCandidate(video, {
        exerciseName: params.exerciseName,
        englishName: params.englishName,
        idioma: params.idioma,
      }),
      viewCount: parseYoutubeViewCount(video),
    }))
    .filter((candidate) => candidate.score >= 1)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.viewCount - a.viewCount;
    });

  const preferredCandidate =
    candidates.find((candidate) => !isLikelyYoutubeShort(candidate.video)) ??
    candidates[0];

  if (!preferredCandidate?.video?.id) {
    return null;
  }

  return {
    videoId: preferredCandidate.video.id,
    url: youtubeWatchUrl(preferredCandidate.video.id),
    title: preferredCandidate.video.snippet?.title ?? null,
    channelTitle: preferredCandidate.video.snippet?.channelTitle ?? null,
    viewCount: preferredCandidate.viewCount,
    duration: preferredCandidate.video.contentDetails?.duration ?? null,
    score: preferredCandidate.score,
  };
}

async function loadExercisesForYoutubeAutoDiscovery() {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from("ejercicio")
    .select(
      "id_ejercicio,nombre_ejercicio,nombre_en,video_youtube_url,youtube_video_id,youtube_url_es,youtube_video_id_es,youtube_url_en,youtube_video_id_en,activo",
    )
    .eq("activo", true)
    .order("id_ejercicio", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SupabaseExerciseRow[];
}

async function applyYoutubeDiscoveryCandidate(
  candidate: EjercicioYoutubeAutoDiscoveryCandidate,
) {
  const supabase = conexionBD();
  const now = new Date().toISOString();
  const update: Record<string, any> = {
    youtube_source: "youtube_api_auto",
    youtube_review_status: "sugerido",
    youtube_review_notes: `Candidato automático ${candidate.idioma.toUpperCase()} por YouTube Data API. Título: ${candidate.title ?? "sin título"} · Canal: ${candidate.channelTitle ?? "sin canal"} · Vistas: ${candidate.viewCount ?? 0}. Requiere revisión administrativa.`,
    media_actualizada_en: now,
    actualizado_en: now,
  };

  if (candidate.idioma === "es") {
    update.youtube_url_es = candidate.youtube_url;
    update.youtube_video_id_es = candidate.youtube_video_id;
    update.video_youtube_url = candidate.youtube_url;
    update.youtube_video_id = candidate.youtube_video_id;
  } else {
    update.youtube_url_en = candidate.youtube_url;
    update.youtube_video_id_en = candidate.youtube_video_id;
  }

  const { error } = await supabase
    .from("ejercicio")
    .update(update)
    .eq("id_ejercicio", candidate.id_ejercicio);

  if (error) {
    throw new Error(error.message);
  }

  if (candidate.idioma === "es" && candidate.youtube_url) {
    await replacePrimaryMedia({
      id_ejercicio: candidate.id_ejercicio,
      tipo_media: "youtube",
      origen: "youtube",
      url: candidate.youtube_url,
      youtube_url: candidate.youtube_url,
      youtube_video_id: candidate.youtube_video_id ?? null,
      titulo: candidate.nombre_ejercicio,
      descripcion:
        "Video candidato en español detectado automáticamente por YouTube Data API. Requiere revisión administrativa.",
    });
  }
}

export async function autoDiscoverExerciseYoutubeVideos(
  user: JwtUser,
  payload: EjercicioYoutubeAutoDiscoveryRequest = {},
): Promise<EjercicioYoutubeAutoDiscoveryResponse> {
  assertCanManageExerciseMedia(user);

  const apiKey = process.env.YOUTUBE_DATA_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Falta configurar YOUTUBE_DATA_API_KEY en el entorno del servidor.",
    );
  }

  const dryRun = payload.apply !== true;
  const limit = clampYoutubeDiscoveryLimit(
    payload.limit ?? process.env.YOUTUBE_AUTO_DISCOVERY_BATCH_SIZE,
  );
  const idiomas = normalizeYoutubeDiscoveryIdiomas(payload.idiomas);
  const onlyMissing = payload.onlyMissing !== false;
  const regionEs =
    payload.regionEs?.trim() ||
    process.env.YOUTUBE_AUTO_DISCOVERY_REGION_ES ||
    "AR";
  const regionEn =
    payload.regionEn?.trim() ||
    process.env.YOUTUBE_AUTO_DISCOVERY_REGION_EN ||
    "US";
  const allExercises = await loadExercisesForYoutubeAutoDiscovery();
  const pendingTasks = allExercises
    .flatMap((exercise) =>
      idiomas.map((idioma) => ({ exercise, idioma })),
    )
    .filter(
      ({ exercise, idioma }) =>
        !onlyMissing || !hasYoutubeForLanguage(exercise, idioma),
    )
    .slice(0, limit);

  const candidates: EjercicioYoutubeAutoDiscoveryCandidate[] = [];
  let totalConsultasYoutube = 0;
  let applied = 0;
  let skipped = 0;
  let errors = 0;
  let quotaExceeded = false;
  let quotaExceededMessage: string | null = null;

  for (const task of pendingTasks) {
    const { exercise, idioma } = task;
    const query = buildYoutubeDiscoveryQuery(exercise, idioma);

    try {
      const bestVideo = await findBestYoutubeVideo({
        apiKey,
        query,
        idioma,
        regionCode: idioma === "es" ? regionEs : regionEn,
        exerciseName: exercise.nombre_ejercicio,
        englishName: exercise.nombre_en ?? null,
      });
      totalConsultasYoutube += 1;

      if (!bestVideo?.url || !bestVideo.videoId) {
        skipped += 1;
        candidates.push({
          id_ejercicio: Number(exercise.id_ejercicio),
          nombre_ejercicio: exercise.nombre_ejercicio,
          nombre_en: exercise.nombre_en ?? null,
          idioma,
          query,
          action: "skip",
          message:
            "YouTube no devolvió candidato utilizable o el scoring descartó resultados poco relacionados.",
        });
        continue;
      }

      const candidate: EjercicioYoutubeAutoDiscoveryCandidate = {
        id_ejercicio: Number(exercise.id_ejercicio),
        nombre_ejercicio: exercise.nombre_ejercicio,
        nombre_en: exercise.nombre_en ?? null,
        idioma,
        query,
        youtube_url: bestVideo.url,
        youtube_video_id: bestVideo.videoId,
        title: bestVideo.title,
        channelTitle: bestVideo.channelTitle,
        viewCount: bestVideo.viewCount,
        duration: bestVideo.duration,
        action: dryRun ? "skip" : "update",
        message: dryRun
          ? `Preview: candidato detectado con score ${bestVideo.score ?? 0}; no se aplicaron cambios.`
          : "Candidato guardado como sugerido para revisión.",
      };

      if (!dryRun) {
        await applyYoutubeDiscoveryCandidate(candidate);
        applied += 1;
      }

      candidates.push(candidate);
    } catch (error: any) {
      errors += 1;
      const message = error?.message ?? "Error consultando YouTube Data API.";

      candidates.push({
        id_ejercicio: Number(exercise.id_ejercicio),
        nombre_ejercicio: exercise.nombre_ejercicio,
        nombre_en: exercise.nombre_en ?? null,
        idioma,
        query,
        action: "error",
        message,
      });

      if (isYoutubeQuotaExceededError(error)) {
        quotaExceeded = true;
        quotaExceededMessage = message;
        break;
      }
    }
  }

  return {
    dryRun,
    total_ejercicios_revisados: new Set(
      pendingTasks.map((task) => Number(task.exercise.id_ejercicio)),
    ).size,
    total_pendientes_revisados: pendingTasks.length,
    total_consultas_youtube: totalConsultasYoutube,
    applied,
    skipped,
    errors,
    quota_exceeded: quotaExceeded,
    quota_exceeded_message: quotaExceededMessage,
    candidates: candidates.slice(0, 250),
  };
}
