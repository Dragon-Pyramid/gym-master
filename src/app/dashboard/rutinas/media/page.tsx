"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Dumbbell,
  ExternalLink,
  Eye,
  ImageIcon,
  Loader2,
  RefreshCcw,
  Search,
  UploadCloud,
  Video,
  XCircle,
} from "lucide-react";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppHeader } from "@/components/header/AppHeader";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  EjercicioMediaCatalogItem,
  EjercicioMediaEquivalenceSyncResponse,
} from "@/interfaces/ejercicioMedia.interface";
import { Nivel } from "@/interfaces/niveles.interface";
import { Objetivo } from "@/interfaces/objetivo.interface";
import {
  getEjerciciosMediaCatalog,
  importEjercicioMediaFromUrl,
  importEjerciciosYoutubeVideos,
  autoDiscoverEjerciciosYoutubeVideos,
  syncEjercicioMediaEquivalences,
  getNiveles,
  getObjetivos,
  updateEjercicioMediaCatalog,
  uploadEjercicioMedia,
} from "@/services/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/i18n/I18nProvider";
import { translateCoreLevel } from "@/utils/coreSeedI18n";

type CatalogSummary = {
  total: number;
  conCloudinary: number;
  conYoutube: number;
  conFallback: number;
  pendientesCloudinary: number;
  pendientesYoutube: number;
  conYoutubeEs?: number;
  conYoutubeEn?: number;
  pendientesYoutubeEs?: number;
  pendientesYoutubeEn?: number;
  youtubeValidados?: number;
  youtubePendientesRevision?: number;
};

const DEFAULT_SUMMARY: CatalogSummary = {
  total: 0,
  conCloudinary: 0,
  conYoutube: 0,
  conFallback: 0,
  pendientesCloudinary: 0,
  pendientesYoutube: 0,
  conYoutubeEs: 0,
  conYoutubeEn: 0,
  pendientesYoutubeEs: 0,
  pendientesYoutubeEn: 0,
  youtubeValidados: 0,
  youtubePendientesRevision: 0,
};

function getYoutubePreviewUrl(videoId?: string | null) {
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function getYoutubeEsUrl(item?: EjercicioMediaCatalogItem | null) {
  if (!item) return null;

  return (
    item.youtube_url_es ||
    item.video_youtube_url ||
    item.youtube_principal?.youtube_url ||
    item.youtube_principal?.url ||
    getYoutubePreviewUrl(
      item.youtube_video_id_es ||
        item.youtube_video_id ||
        item.youtube_principal?.youtube_video_id,
    )
  );
}

function getYoutubeEnUrl(item?: EjercicioMediaCatalogItem | null) {
  if (!item) return null;

  return item.youtube_url_en || getYoutubePreviewUrl(item.youtube_video_id_en);
}

function mediaStatusLabel(status?: string | null, isEnglish = false) {
  if (status === "cloudinary") return "Cloudinary";
  if (status === "youtube") return "YouTube";
  if (status === "externa") return isEnglish ? "External URL" : "URL externa";
  if (status === "local") return "Local";
  if (status === "fallback") return "Fallback";
  return isEnglish ? "No source" : "Sin origen";
}

function getImageSource(item?: EjercicioMediaCatalogItem | null) {
  return (
    item?.media_principal?.url ||
    item?.imagen ||
    "/images/exercises/gym-master-exercise-fallback.svg"
  );
}


function hasCloudinaryMedia(item?: EjercicioMediaCatalogItem | null) {
  return Boolean(
    item?.imagen_origen === "cloudinary" || item?.cloudinary_public_id,
  );
}

function hasYoutubeMedia(item?: EjercicioMediaCatalogItem | null) {
  return Boolean(
    item?.video_youtube_url ||
      item?.youtube_url_es ||
      item?.youtube_url_en ||
      item?.youtube_principal,
  );
}

function getMediaQuality(item?: EjercicioMediaCatalogItem | null, isEnglish = false) {
  const hasImage = hasCloudinaryMedia(item);
  const hasYoutube = hasYoutubeMedia(item);
  const youtubeReviewed =
    item?.youtube_review_status === "validado" ||
    item?.youtube_review_status === "sugerido";

  if (hasImage && hasYoutube && youtubeReviewed) {
    return {
      label: isEnglish ? "Complete" : "Completo",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/45 dark:text-emerald-300",
    };
  }

  if (hasImage && hasYoutube) {
    return {
      label: isEnglish ? "Review video" : "Revisar video",
      className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/45 dark:text-sky-300",
    };
  }

  if (hasImage || hasYoutube) {
    return {
      label: isEnglish ? "Partial" : "Parcial",
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/45 dark:text-amber-300",
    };
  }

  return {
    label: isEnglish ? "Pending" : "Pendiente",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/45 dark:text-red-300",
  };
}

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function isAdminRole(role?: string | null) {
  const normalizedRole = role?.trim().toLowerCase();
  return normalizedRole === "admin" || normalizedRole === "administrador";
}

function getYoutubeAutoCandidateKey(row: any) {
  return `${row.id_ejercicio}-${row.idioma}-${row.youtube_video_id ?? row.youtube_url ?? "sin-video"}`;
}


function localizedMediaApiError(
  rawError: unknown,
  isEnglish: boolean,
  spanishFallback: string,
  englishFallback: string,
) {
  if (!isEnglish && typeof rawError === "string" && rawError.trim()) {
    return rawError;
  }

  return isEnglish ? englishFallback : spanishFallback;
}

function buildYoutubeAutoReviewNotes(row: any, isEnglish: boolean) {
  return isEnglish
    ? `Automatic ${String(row.idioma).toUpperCase()} candidate from YouTube Data API. Title: ${row.title ?? "untitled"} · Channel: ${row.channelTitle ?? "unknown channel"} · Views: ${row.viewCount ?? 0}. Administrative review required.`
    : `Candidato automático ${String(row.idioma).toUpperCase()} por YouTube Data API. Título: ${row.title ?? "sin título"} · Canal: ${row.channelTitle ?? "sin canal"} · Vistas: ${row.viewCount ?? 0}. Requiere revisión administrativa.`;
}

export default function RutinasExerciseMediaCatalogPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isAuthenticated, initializeAuth, isInitialized, user } =
    useAuthStore();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = useCallback((es: string, en: string) => (isEnglish ? en : es), [isEnglish]);
  const translateLevel = useCallback(
    (value?: string | null) => translateCoreLevel(value, isEnglish),
    [isEnglish],
  );

  const [items, setItems] = useState<EjercicioMediaCatalogItem[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [selectedExercise, setSelectedExercise] =
    useState<EjercicioMediaCatalogItem | null>(null);
  const [summary, setSummary] = useState<CatalogSummary>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncingEquivalences, setSyncingEquivalences] = useState(false);
  const [applyingEquivalences, setApplyingEquivalences] = useState(false);
  const [equivalenceSyncReport, setEquivalenceSyncReport] =
    useState<EjercicioMediaEquivalenceSyncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [objetivoFilter, setObjetivoFilter] = useState("todos");
  const [nivelFilter, setNivelFilter] = useState("todos");
  const [mediaStatus, setMediaStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeUrlEn, setYoutubeUrlEn] = useState("");
  const [youtubeSource, setYoutubeSource] = useState("manual");
  const [youtubeReviewStatus, setYoutubeReviewStatus] = useState("validado");
  const [youtubeReviewNotes, setYoutubeReviewNotes] = useState("");
  const [youtubeCsvInput, setYoutubeCsvInput] = useState("");
  const [youtubeImportApply, setYoutubeImportApply] = useState(false);
  const [youtubeImporting, setYoutubeImporting] = useState(false);
  const [youtubeImportReport, setYoutubeImportReport] = useState<any | null>(
    null,
  );
  const [youtubeAutoApply, setYoutubeAutoApply] = useState(false);
  const [youtubeAutoIncludeEs, setYoutubeAutoIncludeEs] = useState(true);
  const [youtubeAutoIncludeEn, setYoutubeAutoIncludeEn] = useState(true);
  const [youtubeAutoLimit, setYoutubeAutoLimit] = useState(25);
  const [youtubeAutoRunning, setYoutubeAutoRunning] = useState(false);
  const [youtubeAutoReport, setYoutubeAutoReport] = useState<any | null>(null);
  const [youtubeAutoSelectedKeys, setYoutubeAutoSelectedKeys] = useState<
    Set<string>
  >(new Set());
  const [externalImageUrl, setExternalImageUrl] = useState("");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && !isAdminRole(user?.rol)) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isInitialized, router, user?.rol]);

  const selectedPreviewUrl = useMemo(
    () => getImageSource(selectedExercise),
    [selectedExercise],
  );
  const selectedYoutubeUrl = useMemo(
    () =>
      selectedExercise?.youtube_url_es ||
      selectedExercise?.video_youtube_url ||
      selectedExercise?.youtube_principal?.youtube_url ||
      selectedExercise?.youtube_principal?.url ||
      "",
    [selectedExercise],
  );

  const catalogReadiness = useMemo(() => {
    const total = summary.total || 0;
    const imageCoverage = percentage(summary.conCloudinary, total);
    const youtubeCoverage = percentage(summary.conYoutube, total);
    const completeCoverage = percentage(
      Math.min(summary.conCloudinary, summary.conYoutube),
      total,
    );

    return { imageCoverage, youtubeCoverage, completeCoverage };
  }, [summary]);

  const loadFilters = useCallback(async () => {
    const [objetivosResponse, nivelesResponse] = await Promise.all([
      getObjetivos(),
      getNiveles(),
    ]);

    if (objetivosResponse.ok) {
      setObjetivos(objetivosResponse.data ?? []);
    }

    if (nivelesResponse.ok) {
      setNiveles(nivelesResponse.data ?? []);
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    if (!isAuthenticated || !isInitialized || !isAdminRole(user?.rol)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getEjerciciosMediaCatalog({
        q: searchTerm,
        objetivo: objetivoFilter,
        nivel: nivelFilter,
        mediaStatus,
        page,
        pageSize: 24,
      });

      if (!response.ok) {
        throw new Error(
          localizedMediaApiError(response.error, isEnglish, "No se pudo cargar el catálogo de media.", "The media catalog could not be loaded."),
        );
      }

      setItems(response.data ?? []);
      setSummary(response.resumen ?? DEFAULT_SUMMARY);
      setTotal(response.total ?? 0);
      setTotalPages(response.totalPages ?? 1);

      setSelectedExercise((prev) => {
        if (!prev) return response.data?.[0] ?? null;
        return (
          response.data?.find(
            (item: EjercicioMediaCatalogItem) =>
              item.id_ejercicio === prev.id_ejercicio,
          ) ??
          response.data?.[0] ??
          null
        );
      });
    } catch (loadError: any) {
      setError(loadError?.message ?? tx("No se pudo cargar el catálogo de media.", "The media catalog could not be loaded."));
      setItems([]);
      setSelectedExercise(null);
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    isEnglish,
    isInitialized,
    mediaStatus,
    nivelFilter,
    objetivoFilter,
    page,
    searchTerm,
    tx,
    user?.rol,
  ]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadFilters();
    }
  }, [isAuthenticated, isInitialized, loadFilters]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadCatalog();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadCatalog]);

  useEffect(() => {
    setYoutubeUrl(selectedYoutubeUrl);
    setYoutubeUrlEn(selectedExercise?.youtube_url_en ?? "");
    setYoutubeSource(selectedExercise?.youtube_source ?? "manual");
    setYoutubeReviewStatus(
      selectedExercise?.youtube_review_status ?? "validado",
    );
    setYoutubeReviewNotes(selectedExercise?.youtube_review_notes ?? "");
    setExternalImageUrl(selectedExercise?.imagen ?? "");
  }, [selectedExercise, selectedYoutubeUrl]);

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !selectedExercise) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const uploadResponse = await uploadEjercicioMedia(
        file,
        selectedExercise.id_ejercicio,
      );

      if (!uploadResponse.ok || !uploadResponse.url) {
        throw new Error(
          localizedMediaApiError(uploadResponse.error, isEnglish, "No se pudo subir la media a Cloudinary.", "The media could not be uploaded to Cloudinary."),
        );
      }

      const updateResponse = await updateEjercicioMediaCatalog({
        id_ejercicio: selectedExercise.id_ejercicio,
        imagen: uploadResponse.url,
        imagen_origen: "cloudinary",
        cloudinary_public_id: uploadResponse.public_id,
        titulo: selectedExercise.nombre_ejercicio,
        descripcion_media: tx(
          "Media principal subida a Cloudinary desde el catálogo administrativo.",
          "Primary media uploaded to Cloudinary from the administrative catalog."
        ),
      });

      if (!updateResponse.ok) {
        throw new Error(
          localizedMediaApiError(updateResponse.error, isEnglish, "La imagen se subió, pero no se pudo asociar al ejercicio.", "The image was uploaded but could not be linked to the exercise."),
        );
      }

      setSuccess(tx("Imagen/GIF subida a Cloudinary y asociada al ejercicio.", "Image/GIF uploaded to Cloudinary and linked to the exercise."));
      await loadCatalog();
    } catch (uploadError: any) {
      setError(
        uploadError?.message ?? tx("No se pudo subir la media del ejercicio.", "The exercise media could not be uploaded."),
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSaveExternalImage = async () => {
    if (!selectedExercise) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateEjercicioMediaCatalog({
        id_ejercicio: selectedExercise.id_ejercicio,
        imagen: externalImageUrl.trim(),
        imagen_origen: externalImageUrl.trim().includes("cloudinary.com")
          ? "cloudinary"
          : "externa",
        cloudinary_public_id: selectedExercise.cloudinary_public_id ?? null,
        titulo: selectedExercise.nombre_ejercicio,
        descripcion_media: tx("Media principal actualizada manualmente desde URL.", "Primary media updated manually from a URL."),
      });

      if (!response.ok) {
        throw new Error(
          localizedMediaApiError(response.error, isEnglish, "No se pudo guardar la URL de imagen.", "The image URL could not be saved."),
        );
      }

      setSuccess(tx("URL de imagen actualizada correctamente.", "Image URL updated successfully."));
      await loadCatalog();
    } catch (saveError: any) {
      setError(saveError?.message ?? tx("No se pudo guardar la URL de imagen.", "The image URL could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const handleImportExternalImage = async () => {
    if (!selectedExercise) return;

    const sourceUrl =
      externalImageUrl.trim() || selectedExercise.imagen?.trim();

    if (!sourceUrl) {
      setError(
        tx("Debe indicar una URL externa o usar la imagen actual del ejercicio.", "Enter an external URL or use the exercise’s current image."),
      );
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await importEjercicioMediaFromUrl({
        id_ejercicio: selectedExercise.id_ejercicio,
        url: sourceUrl,
        titulo: selectedExercise.nombre_ejercicio,
        descripcion_media: tx(
          "Media principal importada automáticamente a Cloudinary desde el catálogo administrativo.",
          "Primary media automatically imported to Cloudinary from the administrative catalog."
        ),
      });

      if (!response.ok) {
        throw new Error(
          localizedMediaApiError(response.error, isEnglish, "No se pudo importar la imagen/GIF a Cloudinary.", "The image/GIF could not be imported to Cloudinary."),
        );
      }

      setSuccess(tx("Imagen/GIF importada a Cloudinary y asociada al ejercicio.", "Image/GIF imported to Cloudinary and linked to the exercise."));
      await loadCatalog();
    } catch (importError: any) {
      setError(importError?.message ?? tx("No se pudo importar la media remota.", "The remote media could not be imported."));
    } finally {
      setImporting(false);
    }
  };

  const handleSaveYoutube = async () => {
    if (!selectedExercise) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateEjercicioMediaCatalog({
        id_ejercicio: selectedExercise.id_ejercicio,
        video_youtube_url: youtubeUrl.trim(),
        youtube_url_es: youtubeUrl.trim(),
        youtube_url_en: youtubeUrlEn.trim(),
        youtube_source: youtubeSource.trim() || "manual",
        youtube_review_status: youtubeReviewStatus,
        youtube_review_notes: youtubeReviewNotes.trim(),
        titulo: selectedExercise.nombre_ejercicio,
        descripcion_media: tx(
          "Video recomendado para explicar la técnica del ejercicio.",
          "Recommended video explaining the exercise technique."
        ),
      });

      if (!response.ok) {
        throw new Error(
          localizedMediaApiError(response.error, isEnglish, "No se pudo guardar el video de YouTube.", "The YouTube video could not be saved."),
        );
      }

      setSuccess(
        youtubeUrl.trim() || youtubeUrlEn.trim()
          ? tx("Videos de YouTube asociados al ejercicio.", "YouTube videos linked to the exercise.")
          : tx("Videos de YouTube quitados del ejercicio.", "YouTube videos removed from the exercise."),
      );
      await loadCatalog();
    } catch (saveError: any) {
      setError(saveError?.message ?? tx("No se pudo guardar el video de YouTube.", "The YouTube video could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const parseYoutubeCsv = (csv: string) => {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((header) => header.trim());

    return lines.slice(1).map((line) => {
      const columns = line.split(",").map((column) => column.trim());
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = columns[index] ?? "";
      });

      return {
        id_ejercicio: row.id_ejercicio || null,
        nombre_ejercicio: row.nombre_ejercicio || null,
        youtube_url_es: row.youtube_url_es || row.video_youtube_url || null,
        youtube_url_en: row.youtube_url_en || null,
        youtube_source: row.youtube_source || "csv_import",
        youtube_review_status: row.youtube_review_status || "sugerido",
        youtube_review_notes: row.youtube_review_notes || null,
      };
    });
  };

  const handleYoutubeCsvImport = async () => {
    const itemsToImport = parseYoutubeCsv(youtubeCsvInput);

    if (itemsToImport.length === 0) {
      setError(
        tx("Pegá un CSV con encabezado para previsualizar o importar videos de YouTube.", "Paste a CSV with headers to preview or import YouTube videos."),
      );
      return;
    }

    setYoutubeImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await importEjerciciosYoutubeVideos({
        apply: youtubeImportApply,
        items: itemsToImport,
      });

      if (!response.ok) {
        throw new Error(
          localizedMediaApiError(response.error, isEnglish, "No se pudo procesar la importación masiva de YouTube.", "The bulk YouTube import could not be processed."),
        );
      }

      setYoutubeImportReport(response);
      setSuccess(
        youtubeImportApply
          ? tx(`Importación aplicada: ${response.applied ?? 0} ejercicios actualizados.`, `Import applied: ${response.applied ?? 0} exercises updated.`)
          : tx(`Previsualización lista: ${response.matched ?? 0} ejercicios encontrados.`, `Preview ready: ${response.matched ?? 0} exercises matched.`),
      );

      if (youtubeImportApply) {
        await loadCatalog();
      }
    } catch (importError: any) {
      setError(
        importError?.message ??
          tx("No se pudo procesar la importación masiva de YouTube.", "The bulk YouTube import could not be processed."),
      );
    } finally {
      setYoutubeImporting(false);
    }
  };

  const handleYoutubeAutoDiscovery = async () => {
    const idiomas: Array<"es" | "en"> = [];
    if (youtubeAutoIncludeEs) idiomas.push("es");
    if (youtubeAutoIncludeEn) idiomas.push("en");

    if (idiomas.length === 0) {
      setError(tx("Seleccioná al menos un idioma para buscar videos en YouTube.", "Select at least one language to search for YouTube videos."));
      return;
    }

    setYoutubeAutoRunning(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await autoDiscoverEjerciciosYoutubeVideos({
        apply: youtubeAutoApply,
        limit: youtubeAutoLimit,
        idiomas,
        onlyMissing: true,
      });

      if (!response.ok) {
        throw new Error(
          localizedMediaApiError(response.error, isEnglish, "No se pudo ejecutar el descubrimiento automático de YouTube.", "Automatic YouTube discovery could not be completed."),
        );
      }

      setYoutubeAutoReport(response);
      const selectableKeys = new Set<string>(
        (response.candidates ?? [])
          .filter(
            (row: any) => Boolean(row.youtube_url) && row.action !== "error",
          )
          .map((row: any) => getYoutubeAutoCandidateKey(row)),
      );
      setYoutubeAutoSelectedKeys(selectableKeys);
      setSuccess(
        youtubeAutoApply
          ? tx(`Descubrimiento aplicado: ${response.applied ?? 0} videos sugeridos guardados sin pisar URLs existentes.`, `Discovery applied: ${response.applied ?? 0} suggested videos saved without overwriting existing URLs.`)
          : tx(`Previsualización lista: ${response.candidates?.length ?? 0} resultados/candidatos. Desmarcá candidatos incorrectos antes de aplicar.`, `Preview ready: ${response.candidates?.length ?? 0} results/candidates. Uncheck incorrect candidates before applying.`),
      );

      if (youtubeAutoApply) {
        await loadCatalog();
      }
    } catch (autoError: any) {
      setError(
        autoError?.message ??
          tx("No se pudo ejecutar el descubrimiento automático de YouTube.", "Automatic YouTube discovery could not be completed."),
      );
    } finally {
      setYoutubeAutoRunning(false);
    }
  };

  const handleToggleYoutubeAutoCandidate = (key: string, checked: boolean) => {
    setYoutubeAutoSelectedKeys((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleApplySelectedYoutubeAutoCandidates = async () => {
    const selectedCandidates = (youtubeAutoReport?.candidates ?? []).filter(
      (row: any) => {
        return (
          row.youtube_url &&
          youtubeAutoSelectedKeys.has(getYoutubeAutoCandidateKey(row))
        );
      },
    );

    if (selectedCandidates.length === 0) {
      setError(
        tx(
          "No hay candidatos seleccionados para aplicar. Marcá al menos un video correcto.",
          "No candidates are selected. Select at least one correct video."
        ),
      );
      return;
    }

    setYoutubeAutoRunning(true);
    setError(null);
    setSuccess(null);

    try {
      const itemsByExercise = new Map<number, any>();

      for (const row of selectedCandidates) {
        const id = Number(row.id_ejercicio);
        const current = itemsByExercise.get(id) ?? {
          id_ejercicio: id,
          nombre_ejercicio: row.nombre_ejercicio,
          youtube_source: "youtube_api_auto",
          youtube_review_status: "sugerido",
          youtube_review_notes: buildYoutubeAutoReviewNotes(row, isEnglish),
        };

        if (row.idioma === "en") {
          current.youtube_url_en = row.youtube_url;
        } else {
          current.youtube_url_es = row.youtube_url;
        }

        current.youtube_review_notes = buildYoutubeAutoReviewNotes(row, isEnglish);
        itemsByExercise.set(id, current);
      }

      const response = await importEjerciciosYoutubeVideos({
        apply: true,
        items: Array.from(itemsByExercise.values()),
      });

      if (!response.ok) {
        throw new Error(
          localizedMediaApiError(response.error, isEnglish, "No se pudieron aplicar los candidatos seleccionados.", "The selected candidates could not be applied."),
        );
      }

      setSuccess(
        tx(
          `Candidatos seleccionados aplicados: ${response.applied ?? 0}. Los descartados no se guardaron.`,
          `Selected candidates applied: ${response.applied ?? 0}. Discarded candidates were not saved.`
        ),
      );
      setYoutubeAutoReport(null);
      setYoutubeAutoSelectedKeys(new Set());
      await loadCatalog();
    } catch (applyError: any) {
      setError(
        applyError?.message ??
          tx("No se pudieron aplicar los candidatos seleccionados.", "The selected candidates could not be applied."),
      );
    } finally {
      setYoutubeAutoRunning(false);
    }
  };

  const handlePreviewEquivalenceSync = async () => {
    setSyncingEquivalences(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await syncEjercicioMediaEquivalences({
        apply: false,
        limit: 500,
      });

      if (!response.ok) {
        throw new Error(
          localizedMediaApiError(response.error, isEnglish, "No se pudieron detectar equivalencias de media.", "Media equivalences could not be detected."),
        );
      }

      setEquivalenceSyncReport(
        response as EjercicioMediaEquivalenceSyncResponse,
      );
      setSuccess(
        tx(`Se detectaron ${response.total_candidates ?? 0} equivalencias seguras para revisar.`, `${response.total_candidates ?? 0} safe equivalences were detected for review.`),
      );
    } catch (syncError: any) {
      setError(
        syncError?.message ?? tx("No se pudieron detectar equivalencias de media.", "Media equivalences could not be detected."),
      );
    } finally {
      setSyncingEquivalences(false);
    }
  };

  const handleApplyEquivalenceSync = async () => {
    const confirmed = window.confirm(
      tx("Se copiará media desde ejercicios equivalentes hacia ejercicios con fallback o imagen vacía. ¿Querés continuar?", "Media will be copied from equivalent exercises to exercises using a fallback or an empty image. Continue?"),
    );

    if (!confirmed) return;

    setApplyingEquivalences(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await syncEjercicioMediaEquivalences({
        apply: true,
        limit: 500,
      });

      if (!response.ok) {
        throw new Error(
          localizedMediaApiError(response.error, isEnglish, "No se pudo aplicar la sincronización de media equivalente.", "Equivalent-media synchronization could not be applied."),
        );
      }

      setEquivalenceSyncReport(
        response as EjercicioMediaEquivalenceSyncResponse,
      );
      setSuccess(
        tx(`Se sincronizaron ${response.applied ?? 0} ejercicios equivalentes.`, `${response.applied ?? 0} equivalent exercises were synchronized.`),
      );
      await loadCatalog();
    } catch (syncError: any) {
      setError(
        syncError?.message ??
          tx("No se pudo aplicar la sincronización de media equivalente.", "Equivalent-media synchronization could not be applied."),
      );
    } finally {
      setApplyingEquivalences(false);
    }
  };

  const handleShowCriticalPendings = () => {
    setPage(1);
    setMediaStatus("pendiente_cloudinary");
  };

  const handleShowYoutubeReview = () => {
    setPage(1);
    setMediaStatus("youtube_revision");
  };

  const handleClearCatalogFilters = () => {
    setPage(1);
    setSearchTerm("");
    setObjetivoFilter("todos");
    setNivelFilter("todos");
    setMediaStatus("todos");
  };

  if (loading && !items.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground dark:bg-black dark:text-neutral-100">
        {tx("Cargando catálogo de media...", "Loading media catalog...")}
      </div>
    );
  }

  if (!isAuthenticated || !isAdminRole(user?.rol)) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={tx("Media de Ejercicios", "Exercise media")} />
          <main className="flex-1 p-6 space-y-6 bg-slate-50 dark:bg-black">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-wide text-[#0ea5e9] uppercase">
                  {tx("Rutinas / Banco de media", "Routines / Media bank")}
                </p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-white">
                  {tx("Catálogo visual de ejercicios", "Visual exercise catalog")}
                </h1>
                <p className="max-w-3xl text-sm text-slate-600 dark:text-neutral-400">
                  {tx(
                    "Prepará una base visual consistente para web, mobile, PDFs y futuro RAG: imágenes/GIFs seguros en Cloudinary y videos de técnica revisados.",
                    "Prepare a consistent visual base for web, mobile, PDFs, and future RAG: safe Cloudinary images/GIFs and reviewed technique videos."
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={loadCatalog}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCcw className="w-4 h-4 mr-2" />
                  )}
                  {tx("Actualizar", "Refresh")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePreviewEquivalenceSync}
                  disabled={syncingEquivalences || applyingEquivalences}
                >
                  {syncingEquivalences ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCcw className="w-4 h-4 mr-2" />
                  )}
                  {tx("Detectar equivalencias", "Detect equivalences")}
                </Button>
                <Button
                  onClick={handleApplyEquivalenceSync}
                  disabled={syncingEquivalences || applyingEquivalences}
                >
                  {applyingEquivalences ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4 mr-2" />
                  )}
                  {tx("Aplicar equivalencias", "Apply equivalences")}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/gestor-rutinas">{tx("Volver a Gestor", "Back to manager")}</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Card className="border-emerald-100 bg-white dark:border-emerald-900/60 dark:bg-neutral-950/80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                        {tx("Total ejercicios", "Total exercises")}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {summary.total}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-neutral-500">
                        {tx("Base total del catálogo", "Total catalog base")}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/45 dark:text-emerald-300">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-sky-100 bg-white dark:border-sky-900/60 dark:bg-neutral-950/80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                        {tx("En Cloudinary", "In Cloudinary")}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-sky-700 dark:text-sky-300">
                        {summary.conCloudinary}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-neutral-500">
                        {tx("Ejercicios con imagen segura", "Exercises with secure image")}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-900/70 dark:bg-sky-950/45 dark:text-sky-300">
                      <Cloud className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-100 bg-white dark:border-amber-900/60 dark:bg-neutral-950/80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                        {tx("Pendientes Cloudinary", "Pending Cloudinary")}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">
                        {summary.pendientesCloudinary}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-neutral-500">
                        {tx("Aún sin imagen/GIF principal", "Still missing main image/GIF")}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/45 dark:text-amber-300">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-100 bg-white dark:border-red-900/60 dark:bg-neutral-950/80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                        {tx("Pendientes YouTube", "Pending YouTube")}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-red-700 dark:text-red-300">
                        {summary.pendientesYoutube}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-neutral-500">
                        {tx("Falta asociar técnica en video", "Technique video still missing")}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 shadow-sm dark:border-red-900/70 dark:bg-red-950/45 dark:text-red-300">
                      <Video className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-purple-100 bg-white dark:border-purple-900/60 dark:bg-neutral-950/80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                        {tx("Con fallback", "With fallback")}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {summary.conFallback}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-neutral-500">
                        {tx("Usan recurso genérico temporal", "Using a temporary generic resource")}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-700 shadow-sm dark:border-purple-900/70 dark:bg-purple-950/45 dark:text-purple-300">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950/80">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {tx("Preparación del catálogo para RAG y experiencia mobile", "Catalog preparation for RAG and mobile experience")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      {tx(
                        "Prioridad: ejercicios con imagen segura en Cloudinary, videos ES/EN revisados y sin fallback visible para socios.",
                        "Priority: exercises with safe Cloudinary images, reviewed ES/EN videos, and no visible fallback for members."
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3 lg:min-w-[460px]">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/35">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-emerald-800 dark:text-emerald-300">{tx("Imágenes Cloudinary", "Cloudinary images")}</p>
                          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{catalogReadiness.imageCoverage}%</p>
                        </div>
                        <Cloud className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-red-100 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/35">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-red-800 dark:text-red-300">{tx("Videos YouTube", "YouTube videos")}</p>
                          <p className="text-xl font-bold text-red-900 dark:text-red-100">{catalogReadiness.youtubeCoverage}%</p>
                        </div>
                        <Video className="h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 dark:border-sky-900/60 dark:bg-sky-950/35">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sky-800 dark:text-sky-300">{tx("Base completa", "Complete base")}</p>
                          <p className="text-xl font-bold text-sky-900 dark:text-sky-100">{catalogReadiness.completeCoverage}%</p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleShowCriticalPendings}>
                    {tx("Ver pendientes de imagen", "View image pending")} ({summary.pendientesCloudinary})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage(1);
                      setMediaStatus("pendiente_youtube");
                    }}
                  >
                    {tx("Ver pendientes de video", "View video pending")} ({summary.pendientesYoutube})
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShowYoutubeReview}>
                    {tx("Revisar YouTube", "Review YouTube")} ({summary.youtubePendientesRevision ?? 0})
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearCatalogFilters}>
                    {tx("Limpiar auditoría", "Clear audit")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {(error || success) && (
              <div
                className={`rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"}`}
              >
                <div className="flex items-center gap-2">
                  {error ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{error ?? success}</span>
                </div>
              </div>
            )}

            <Card className="border-indigo-100 bg-white dark:border-neutral-800 dark:bg-neutral-950/80">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {tx("Descubrimiento automático YouTube", "Automatic YouTube discovery")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      {tx(
                        "Busca candidatos por nombre del ejercicio usando YouTube Data API. No pisa videos existentes y guarda como sugerido/en revisión.",
                        "Find candidates by exercise name using the YouTube Data API. Existing videos are not overwritten and matches are saved as suggested/in review."
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-neutral-400">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={youtubeAutoIncludeEs}
                        onChange={(event) =>
                          setYoutubeAutoIncludeEs(event.target.checked)
                        }
                      />
                      ES
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={youtubeAutoIncludeEn}
                        onChange={(event) =>
                          setYoutubeAutoIncludeEn(event.target.checked)
                        }
                      />
                      EN
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={youtubeAutoApply}
                        onChange={(event) =>
                          setYoutubeAutoApply(event.target.checked)
                        }
                      />
                      {tx("Aplicar cambios", "Apply changes")}
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-end">
                  <div>
                    <Label htmlFor="youtube-auto-limit">
                      {tx("Ejercicios por corrida", "Exercises per run")}
                    </Label>
                    <Input
                      id="youtube-auto-limit"
                      type="number"
                      min={1}
                      max={50}
                      value={youtubeAutoLimit}
                      onChange={(event) =>
                        setYoutubeAutoLimit(Number(event.target.value))
                      }
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      {tx("Recomendado: 25. Máximo: 50.", "Recommended: 25. Maximum: 50.")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleYoutubeAutoDiscovery}
                      disabled={youtubeAutoRunning}
                    >
                      {youtubeAutoRunning ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Video className="w-4 h-4 mr-2" />
                      )}
                      {youtubeAutoApply
                        ? tx("Buscar y guardar sugeridos", "Find and save suggestions")
                        : tx("Previsualizar candidatos", "Preview candidates")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setYoutubeAutoReport(null);
                        setYoutubeAutoSelectedKeys(new Set());
                      }}
                      disabled={youtubeAutoRunning || !youtubeAutoReport}
                    >
                      {tx("Limpiar resultado", "Clear result")}
                    </Button>
                    {youtubeAutoReport?.dryRun && (
                      <Button
                        variant="secondary"
                        onClick={handleApplySelectedYoutubeAutoCandidates}
                        disabled={
                          youtubeAutoRunning ||
                          youtubeAutoSelectedKeys.size === 0
                        }
                      >
                        {tx("Aplicar seleccionados", "Apply selected")} ({youtubeAutoSelectedKeys.size})
                      </Button>
                    )}
                  </div>
                </div>
                {youtubeAutoReport && (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
                    <p className="font-semibold">
                      {tx("Resultado", "Result")}: {youtubeAutoReport.dryRun
                        ? tx("previsualización", "preview")
                        : tx("aplicado", "applied")}
                    </p>
                    <p>
                      {tx("Consultas YouTube", "YouTube queries")}: {youtubeAutoReport.total_consultas_youtube ?? 0} ·
                      {tx("Aplicados", "Applied")}: {youtubeAutoReport.applied ?? 0} · {tx("Saltados", "Skipped")}: {" "}
                      {youtubeAutoReport.skipped ?? 0} · {tx("Errores", "Errors")}: {" "}
                      {youtubeAutoReport.errors ?? 0}
                    </p>
                    {youtubeAutoReport.dryRun && (
                      <p className="mt-1 text-[11px] text-indigo-800 dark:text-indigo-300">
                        {tx(
                          "Desmarcá los videos que no coinciden con el ejercicio. Luego usá ‘Aplicar seleccionados’; los descartados no se guardan.",
                          "Uncheck videos that do not match the exercise. Then use ‘Apply selected’; discarded candidates will not be saved."
                        )}
                      </p>
                    )}
                    {youtubeAutoReport.candidates?.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-auto rounded border bg-white dark:border-neutral-800 dark:bg-black/40">
                        {youtubeAutoReport.candidates
                          .slice(0, 24)
                          .map((row: any, index: number) => {
                            const key = getYoutubeAutoCandidateKey(row);
                            const selectable =
                              Boolean(row.youtube_url) &&
                              row.action !== "error";
                            const selected = youtubeAutoSelectedKeys.has(key);

                            return (
                              <div
                                key={`${row.id_ejercicio}-${row.idioma}-${index}`}
                                className="border-b px-2 py-2"
                              >
                                <div className="flex items-start gap-2">
                                  {youtubeAutoReport.dryRun && selectable && (
                                    <input
                                      type="checkbox"
                                      className="mt-1"
                                      checked={selected}
                                      onChange={(event) =>
                                        handleToggleYoutubeAutoCandidate(
                                          key,
                                          event.target.checked,
                                        )
                                      }
                                      aria-label={tx("Aplicar candidato", "Apply candidate")}
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold">
                                      #{row.id_ejercicio} ·{" "}
                                      {row.nombre_ejercicio} ·{" "}
                                      {String(row.idioma).toUpperCase()} ·{" "}
                                      {selected ? tx("seleccionado", "selected") : row.action}
                                    </p>
                                    <p>{row.message}</p>
                                    {row.youtube_url && (
                                      <a
                                        href={row.youtube_url}
                                        target="_blank"
                                        className="text-sky-700 underline"
                                      >
                                        {row.title ?? row.youtube_url}{" "}
                                        {row.viewCount
                                          ? `${"·"} ${row.viewCount.toLocaleString()} ${tx("vistas", "views")}`
                                          : ""}
                                      </a>
                                    )}
                                    {youtubeAutoReport.dryRun &&
                                      selectable &&
                                      !selected && (
                                        <p className="text-[11px] font-semibold text-red-700">
                                          {tx(
                                            "Descartado: no se guardará al aplicar seleccionados.",
                                            "Discarded: it will not be saved when applying selected candidates."
                                          )}
                                        </p>
                                      )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-red-100 bg-white dark:border-red-900/60 dark:bg-neutral-950/80">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {tx("Importación masiva YouTube ES/EN", "Bulk YouTube import ES/EN")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      {tx(
                        "Pegá un CSV revisado. Primero previsualizá; luego activá ‘Aplicar cambios’.",
                        "Paste a reviewed CSV. Preview first, then enable ‘Apply changes’."
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-neutral-400">
                    <input
                      id="youtube-apply-import"
                      type="checkbox"
                      checked={youtubeImportApply}
                      onChange={(event) =>
                        setYoutubeImportApply(event.target.checked)
                      }
                    />
                    <Label htmlFor="youtube-apply-import">
                      {tx("Aplicar cambios", "Apply changes")}
                    </Label>
                  </div>
                </div>
                <textarea
                  value={youtubeCsvInput}
                  onChange={(event) => setYoutubeCsvInput(event.target.value)}
                  className="min-h-28 w-full rounded-md border px-3 py-2 text-xs font-mono"
                  placeholder={
                    "id_ejercicio,nombre_ejercicio,youtube_url_es,youtube_url_en,youtube_source,youtube_review_status,youtube_review_notes\n1,Press plano con barra,https://www.youtube.com/watch?v=...,https://www.youtube.com/watch?v=...,manual,validado,Video revisado"
                  }
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleYoutubeCsvImport}
                    disabled={youtubeImporting || !youtubeCsvInput.trim()}
                  >
                    {youtubeImporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Video className="w-4 h-4 mr-2" />
                    )}
                    {youtubeImportApply
                      ? tx("Importar YouTube", "Import YouTube")
                      : tx("Previsualizar YouTube", "Preview YouTube")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setYoutubeCsvInput(
                        "id_ejercicio,nombre_ejercicio,youtube_url_es,youtube_url_en,youtube_source,youtube_review_status,youtube_review_notes\n",
                      )
                    }
                  >
                    {tx("Cargar plantilla", "Load template")}
                  </Button>
                </div>
                {youtubeImportReport && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                    <p className="font-semibold">
                      {tx("Resultado", "Result")}: {youtubeImportReport.dryRun
                        ? tx("previsualización", "preview")
                        : tx("importación aplicada", "import applied")}
                    </p>
                    <p>
                      {tx("Total", "Total")}: {youtubeImportReport.total} · {tx("Encontrados", "Matched")}: {" "}
                      {youtubeImportReport.matched} · {tx("Aplicados", "Applied")}:{" "}
                      {youtubeImportReport.applied} · {tx("Errores", "Errors")}: {" "}
                      {youtubeImportReport.errors}
                    </p>
                    {youtubeImportReport.preview?.length > 0 && (
                      <div className="mt-2 max-h-36 overflow-auto rounded border bg-white dark:border-neutral-800 dark:bg-black/40">
                        {youtubeImportReport.preview
                          .slice(0, 12)
                          .map((row: any) => (
                            <div
                              key={`${row.row}-${row.id_ejercicio ?? row.nombre_ejercicio}`}
                              className="border-b px-2 py-1"
                            >
                              {tx("Fila", "Row")} {row.row}:{" "}
                              {row.nombre_ejercicio ?? row.id_ejercicio ?? "-"}{" "}
                              — {row.message}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {equivalenceSyncReport && (
              <Card className="border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/25">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-sky-900 dark:text-sky-200">
                        {tx("Sincronización de media equivalente", "Equivalent media sync")}
                      </p>
                      <p className="text-xs text-sky-700 dark:text-sky-300">
                        {equivalenceSyncReport.dryRun
                          ? tx("Previsualización sin modificar datos.", "Preview without changing data.")
                          : tx("Cambios aplicados sobre ejercicios con fallback o imagen vacía.", "Changes applied to exercises with fallback or empty image.")}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                      <span className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800 dark:border-sky-900/60 dark:bg-black/35 dark:text-sky-200">
                        {tx("Fuentes", "Sources")}: {equivalenceSyncReport.source_pool}
                      </span>
                      <span className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800 dark:border-sky-900/60 dark:bg-black/35 dark:text-sky-200">
                        {tx("Candidatos", "Candidates")}: {equivalenceSyncReport.total_candidates}
                      </span>
                      <span className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800 dark:border-sky-900/60 dark:bg-black/35 dark:text-sky-200">
                        {tx("Aplicados", "Applied")}: {equivalenceSyncReport.applied}
                      </span>
                      <span className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800 dark:border-sky-900/60 dark:bg-black/35 dark:text-sky-200">
                        {tx("Pendientes", "Pending")}: {equivalenceSyncReport.skipped}
                      </span>
                    </div>
                  </div>

                  {equivalenceSyncReport.candidates.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-sky-200 bg-white dark:border-sky-900/60 dark:bg-black/35">
                      <table className="w-full text-xs">
                        <thead className="text-left bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200">
                          <tr>
                            <th className="px-3 py-2">{tx("Origen", "Source")}</th>
                            <th className="px-3 py-2">{tx("Destino", "Target")}</th>
                            <th className="px-3 py-2">{tx("Nombre canónico", "Canonical name")}</th>
                            <th className="px-3 py-2">{tx("Media", "Media")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {equivalenceSyncReport.candidates
                            .slice(0, 8)
                            .map((candidate) => (
                              <tr
                                key={`${candidate.source_id_ejercicio}-${candidate.target_id_ejercicio}`}
                                className="border-t"
                              >
                                <td className="px-3 py-2">
                                  <p className="font-semibold">
                                    {candidate.source_nombre_ejercicio}
                                  </p>
                                  <p className="text-slate-500">
                                    {candidate.source_objetivo} ·{" "}
                                    {translateLevel(candidate.source_nivel)}
                                  </p>
                                </td>
                                <td className="px-3 py-2">
                                  <p className="font-semibold">
                                    {candidate.target_nombre_ejercicio}
                                  </p>
                                  <p className="text-slate-500">
                                    {candidate.target_objetivo} ·{" "}
                                    {translateLevel(candidate.target_nivel)}
                                  </p>
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {candidate.canonical_name}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {candidate.imagen_origen ?? "externa"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/80">
                <CardHeader className="p-4 border-b dark:border-neutral-800">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_220px]">
                    <div className="relative">
                      <Search className="absolute w-4 h-4 text-slate-400 left-3 top-3" />
                      <Input
                        value={searchTerm}
                        onChange={(event) => {
                          setPage(1);
                          setSearchTerm(event.target.value);
                        }}
                        placeholder={tx("Buscar ejercicio por nombre...", "Search exercise by name...")}
                        className="pl-9 dark:border-neutral-800 dark:bg-black/50 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                      />
                    </div>
                    <select
                      value={objetivoFilter}
                      onChange={(event) => {
                        setPage(1);
                        setObjetivoFilter(event.target.value);
                      }}
                      className="h-10 px-3 text-sm border rounded-md bg-white dark:border-neutral-800 dark:bg-black/50 dark:text-neutral-100"
                    >
                      <option value="todos">{tx("Todos los objetivos", "All goals")}</option>
                      {objetivos.map((objetivo) => (
                        <option
                          key={objetivo.id_objetivo}
                          value={objetivo.id_objetivo}
                        >
                          {objetivo.nombre_objetivo}
                        </option>
                      ))}
                    </select>
                    <select
                      value={nivelFilter}
                      onChange={(event) => {
                        setPage(1);
                        setNivelFilter(event.target.value);
                      }}
                      className="h-10 px-3 text-sm border rounded-md bg-white dark:border-neutral-800 dark:bg-black/50 dark:text-neutral-100"
                    >
                      <option value="todos">{tx("Todos los niveles", "All levels")}</option>
                      {niveles.map((nivel) => (
                        <option key={nivel.id_nivel} value={nivel.id_nivel}>
                          {translateLevel(nivel.nombre_nivel)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={mediaStatus}
                      onChange={(event) => {
                        setPage(1);
                        setMediaStatus(event.target.value);
                      }}
                      className="h-10 px-3 text-sm border rounded-md bg-white dark:border-neutral-800 dark:bg-black/50 dark:text-neutral-100"
                    >
                      <option value="todos">{tx("Todos los estados", "All statuses")}</option>
                      <option value="pendiente_cloudinary">
                        {tx("Pendiente Cloudinary", "Pending Cloudinary")}
                      </option>
                      <option value="cloudinary">{tx("Con Cloudinary", "With Cloudinary")}</option>
                      <option value="pendiente_youtube">
                        {tx("Pendiente YouTube", "Pending YouTube")}
                      </option>
                      <option value="youtube">{tx("Con YouTube", "With YouTube")}</option>
                      <option value="pendiente_youtube_es">
                        {tx("Pendiente YouTube ES", "Pending YouTube ES")}
                      </option>
                      <option value="youtube_es">{tx("Con YouTube ES", "With YouTube ES")}</option>
                      <option value="pendiente_youtube_en">
                        {tx("Pendiente YouTube EN", "Pending YouTube EN")}
                      </option>
                      <option value="youtube_en">{tx("Con YouTube EN", "With YouTube EN")}</option>
                      <option value="youtube_validado">{tx("YouTube validado", "Validated YouTube")}</option>
                      <option value="youtube_revision">
                        {tx("YouTube en revisión", "YouTube in review")}
                      </option>
                      <option value="fallback">{tx("Con fallback", "With fallback")}</option>
                    </select>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="space-y-3 p-3 md:hidden">
                    {items.map((item) => {
                      const active = selectedExercise?.id_ejercicio === item.id_ejercicio;
                      const hasYoutube = hasYoutubeMedia(item);
                      const hasCloudinary = hasCloudinaryMedia(item);
                      const youtubeEsUrl = getYoutubeEsUrl(item);
                      const youtubeEnUrl = getYoutubeEnUrl(item);
                      const quality = getMediaQuality(item, isEnglish);

                      return (
                        <button
                          key={item.id_ejercicio}
                          type="button"
                          onClick={() => setSelectedExercise(item)}
                          className={`w-full rounded-2xl border p-3 text-left shadow-sm ${active ? "border-sky-300 bg-sky-50 dark:border-sky-900/70 dark:bg-sky-950/30" : "border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950/70"}`}
                        >
                          <div className="flex gap-3">
                            <img
                              src={getImageSource(item)}
                              alt={item.nombre_ejercicio}
                              className="h-20 w-20 rounded-xl border bg-slate-100 object-cover dark:border-neutral-800 dark:bg-neutral-900"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white">{item.nombre_ejercicio}</p>
                              <p className="text-xs text-slate-500 dark:text-neutral-400">
                                {item.grupo_muscular_nombre ?? tx("Grupo sin dato", "No group data")} · {item.objetivo_nombre ?? `${tx("Objetivo", "Goal")} ${item.id_objetivo}`}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] ${quality.className}`}>
                                  {quality.label}
                                </span>
                                <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] ${hasCloudinary ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                                  {hasCloudinary ? tx("Imagen OK", "Image OK") : tx("Imagen pendiente", "Image pending")}
                                </span>
                                <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] ${hasYoutube ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300" : "border-slate-200 bg-slate-50 text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-400"}`}>
                                  {hasYoutube ? tx("Video OK", "Video OK") : tx("Video pendiente", "Video pending")}
                                </span>
                              </div>
                              <div className="mt-2 flex gap-2">
                                {youtubeEsUrl && (
                                  <a
                                    href={youtubeEsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                    className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700"
                                  >
                                    Video ES
                                  </a>
                                )}
                                {youtubeEnUrl && (
                                  <a
                                    href={youtubeEnUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                    className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700"
                                  >
                                    Video EN
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm">
                      <thead className="text-left bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-300">
                        <tr>
                          <th className="px-4 py-3">{tx("Ejercicio", "Exercise")}</th>
                          <th className="px-4 py-3">{tx("Objetivo / Nivel", "Goal / Level")}</th>
                          <th className="px-4 py-3">{tx("Imagen", "Image")}</th>
                          <th className="px-4 py-3">{tx("Video", "Video")}</th>
                          <th className="px-4 py-3">{tx("Calidad", "Quality")}</th>
                          <th className="px-4 py-3 text-center">{tx("Ver (ES)", "View (ES)")}</th>
                          <th className="px-4 py-3 text-center">{tx("Ver (EN)", "View (EN)")}</th>
                          <th className="px-4 py-3 text-right">{tx("Acción", "Action")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const active =
                            selectedExercise?.id_ejercicio ===
                            item.id_ejercicio;
                          const hasYoutube = hasYoutubeMedia(item);
                          const youtubeEsUrl = getYoutubeEsUrl(item);
                          const youtubeEnUrl = getYoutubeEnUrl(item);
                          const hasCloudinary = hasCloudinaryMedia(item);
                          const quality = getMediaQuality(item, isEnglish);

                          return (
                            <tr
                              key={item.id_ejercicio}
                              className={`border-t ${active ? "bg-sky-50 dark:bg-sky-950/25" : "bg-white dark:bg-neutral-950/70"}`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={getImageSource(item)}
                                    alt={item.nombre_ejercicio}
                                    className="object-cover w-12 h-12 border rounded-lg bg-slate-100 dark:border-neutral-800 dark:bg-neutral-900"
                                  />
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                      {item.nombre_ejercicio}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                                      {item.grupo_muscular_nombre ??
                                        tx("Grupo sin dato", "No group data")}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">
                                <p>
                                  {item.objetivo_nombre ??
                                    `${tx("Objetivo", "Goal")} ${item.id_objetivo}`}
                                </p>
                                <p className="text-xs">
                                  {item.nivel_nombre
                                    ? translateLevel(item.nivel_nombre)
                                    : `${tx("Nivel", "Level")} ${item.id_nivel}`}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${hasCloudinary ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"}`}
                                >
                                  {hasCloudinary ? (
                                    <Cloud className="w-3 h-3" />
                                  ) : (
                                    <AlertTriangle className="w-3 h-3" />
                                  )}
                                  {mediaStatusLabel(item.imagen_origen, isEnglish)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${hasYoutube ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300" : "border-slate-200 bg-slate-50 text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-400"}`}
                                >
                                  <Video className="w-3 h-3" />
                                  {hasYoutube
                                    ? item.youtube_review_status === "validado"
                                      ? tx("YouTube validado", "Validated YouTube")
                                      : "YouTube"
                                    : tx("Pendiente", "Pending")}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full border px-2 py-1 text-xs ${quality.className}`}
                                >
                                  {quality.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {youtubeEsUrl ? (
                                  <a
                                    href={youtubeEsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={tx("Ver video en español", "View video in Spanish")}
                                    className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">{tx("Ver video ES", "View ES video")}</span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {youtubeEnUrl ? (
                                  <a
                                    href={youtubeEnUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={tx("Ver video en inglés", "View video in English")}
                                    className="inline-flex items-center justify-center rounded-md border border-sky-200 bg-sky-50 p-2 text-sky-700 hover:bg-sky-100"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">{tx("Ver video EN", "View EN video")}</span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  size="sm"
                                  variant={active ? "default" : "outline"}
                                  onClick={() => setSelectedExercise(item)}
                                >
                                  {tx("Editar", "Edit")}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-3 px-4 py-3 border-t dark:border-neutral-800 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                      {tx("Mostrando", "Showing")} {items.length} {tx("de", "of")} {total} {tx("ejercicios", "exercises")} · {tx("Página", "Page")} {page} {tx("de", "of")} {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      >
                        {tx("Anterior", "Previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() =>
                          setPage((prev) => Math.min(totalPages, prev + 1))
                        }
                      >
                        {tx("Siguiente", "Next")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/80 xl:sticky xl:top-6 xl:self-start">
                <CardHeader className="p-4 border-b dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-[#0ea5e9]" />
                    <h2 className="text-lg font-bold">{tx("Detalle de media", "Media detail")}</h2>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-5">
                  {!selectedExercise ? (
                    <div className="py-12 text-center text-slate-500 dark:text-neutral-400">
                      {tx("Seleccioná un ejercicio para editar su media.", "Select an exercise to edit its media.")}
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {selectedExercise.nombre_ejercicio}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-neutral-400">
                          {selectedExercise.objetivo_nombre} ·{" "}
                          {translateLevel(selectedExercise.nivel_nombre)} ·{" "}
                          {selectedExercise.grupo_muscular_nombre}
                        </p>
                      </div>

                      <div className="overflow-hidden border rounded-xl bg-slate-100">
                        <img
                          src={selectedPreviewUrl}
                          alt={selectedExercise.nombre_ejercicio}
                          className="object-contain w-full h-56 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                        <div className="p-3 border rounded-lg bg-slate-50">
                          <p className="font-semibold text-slate-600">
                            {tx("Origen imagen", "Image source")}
                          </p>
                          <p className="text-slate-900">
                            {mediaStatusLabel(selectedExercise.imagen_origen, isEnglish)}
                          </p>
                        </div>
                        <div className="p-3 border rounded-lg bg-slate-50">
                          <p className="font-semibold text-slate-600">
                            Cloudinary public_id
                          </p>
                          <p className="break-all text-slate-900">
                            {selectedExercise.cloudinary_public_id ?? "-"}
                          </p>
                        </div>
                      </div>

                      <div className={`rounded-lg border p-3 text-xs ${getMediaQuality(selectedExercise, isEnglish).className}`}>
                        <p className="font-semibold">
                          {tx("Estado para socio/RAG", "Status for member/RAG")}: {getMediaQuality(selectedExercise, isEnglish).label}
                        </p>
                        <p>
                          {hasCloudinaryMedia(selectedExercise)
                            ? tx("Imagen principal segura para web, mobile y PDF.", "Safe main image for web, mobile, and PDF.")
                            : tx("Prioridad: subir o importar imagen/GIF a Cloudinary.", "Priority: upload or import an image/GIF to Cloudinary.")}{" "}
                          {hasYoutubeMedia(selectedExercise)
                            ? tx("Video asociado para explicar técnica.", "Video associated to explain technique.")
                            : tx("Pendiente asociar video de técnica ES/EN.", "Pending ES/EN technique video association.")}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <Label>{tx("Subir imagen/GIF a Cloudinary", "Upload image/GIF to Cloudinary")}</Label>
                            <p className="text-xs text-slate-500 dark:text-neutral-400">
                              {tx("Recomendado para evitar URLs rotas.", "Recommended to avoid broken URLs.")}
                            </p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          <Button
                            onClick={handleSelectFile}
                            disabled={uploading || saving || importing}
                          >
                            {uploading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <UploadCloud className="w-4 h-4 mr-2" />
                            )}
                            {tx("Subir", "Upload")}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="external-image-url">
                          {tx("URL de imagen actual / externa", "Current / external image URL")}
                        </Label>
                        <Input
                          id="external-image-url"
                          value={externalImageUrl}
                          onChange={(event) =>
                            setExternalImageUrl(event.target.value)
                          }
                          placeholder="https://..."
                        />
                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleSaveExternalImage}
                            disabled={saving || uploading || importing}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {tx("Guardar URL de imagen", "Save image URL")}
                          </Button>
                          <Button
                            className="w-full"
                            onClick={handleImportExternalImage}
                            disabled={
                              saving ||
                              uploading ||
                              importing ||
                              !externalImageUrl.trim()
                            }
                          >
                            {importing ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Cloud className="w-4 h-4 mr-2" />
                            )}
                            {tx("Importar URL a Cloudinary", "Import URL to Cloudinary")}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-neutral-400">
                          {tx(
                            "Usá este botón para tomar una URL externa existente, importarla a Cloudinary y reemplazar la imagen del ejercicio por la URL segura nueva.",
                            "Use this button to take an existing external URL, import it to Cloudinary, and replace the exercise image with the new safe URL."
                          )}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="youtube-url-es">
                            {tx("Video de YouTube recomendado ES", "Recommended YouTube video ES")}
                          </Label>
                          <Input
                            id="youtube-url-es"
                            value={youtubeUrl}
                            onChange={(event) =>
                              setYoutubeUrl(event.target.value)
                            }
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtube-url-en">
                            {tx("Video de YouTube recomendado EN", "Recommended YouTube video EN")}
                          </Label>
                          <Input
                            id="youtube-url-en"
                            value={youtubeUrlEn}
                            onChange={(event) =>
                              setYoutubeUrlEn(event.target.value)
                            }
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="youtube-source">{tx("Fuente", "Source")}</Label>
                            <Input
                              id="youtube-source"
                              value={youtubeSource}
                              onChange={(event) =>
                                setYoutubeSource(event.target.value)
                              }
                              placeholder="manual / csv_import / youtube_api"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="youtube-review-status">
                              {tx("Estado revisión", "Review status")}
                            </Label>
                            <select
                              id="youtube-review-status"
                              value={youtubeReviewStatus}
                              onChange={(event) =>
                                setYoutubeReviewStatus(event.target.value)
                              }
                              className="h-10 w-full rounded-md border bg-white px-3 text-sm dark:border-neutral-800 dark:bg-black/50 dark:text-neutral-100"
                            >
                              <option value="pendiente">{tx("Pendiente", "Pending")}</option>
                              <option value="sugerido">{tx("Sugerido", "Suggested")}</option>
                              <option value="validado">{tx("Validado", "Validated")}</option>
                              <option value="rechazado">{tx("Rechazado", "Rejected")}</option>
                              <option value="requiere_revision">
                                {tx("Requiere revisión", "Requires review")}
                              </option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtube-review-notes">
                            {tx("Notas de revisión", "Review notes")}
                          </Label>
                          <Input
                            id="youtube-review-notes"
                            value={youtubeReviewNotes}
                            onChange={(event) =>
                              setYoutubeReviewNotes(event.target.value)
                            }
                            placeholder={tx("Ej: video revisado por técnica y seguridad", "Example: video reviewed for technique and safety")}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={handleSaveYoutube}
                            disabled={saving || uploading || importing}
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Video className="w-4 h-4 mr-2" />
                            )}
                            {tx("Guardar videos", "Save videos")}
                          </Button>
                          {getYoutubePreviewUrl(
                            selectedExercise.youtube_video_id_es ||
                              selectedExercise.youtube_video_id,
                          ) && (
                            <Button asChild variant="outline">
                              <a
                                href={
                                  getYoutubePreviewUrl(
                                    selectedExercise.youtube_video_id_es ||
                                      selectedExercise.youtube_video_id,
                                  ) ?? "#"
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="p-3 text-xs border rounded-lg bg-blue-50 text-blue-700 border-blue-200 dark:border-sky-900/60 dark:bg-sky-950/35 dark:text-sky-300">
                        {tx(
                          "Cloudinary debe ser la fuente principal para imágenes/GIFs. Podés subir archivos locales o importar URLs externas para evitar descargas manuales. YouTube queda como apoyo didáctico para que el socio vea la técnica del ejercicio.",
                          "Cloudinary should be the main source for images/GIFs. You can upload local files or import external URLs to avoid manual downloads. YouTube remains as didactic support so the member can see the exercise technique."
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
