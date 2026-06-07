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

function mediaStatusLabel(status?: string | null) {
  if (status === "cloudinary") return "Cloudinary";
  if (status === "youtube") return "YouTube";
  if (status === "externa") return "URL externa";
  if (status === "local") return "Local";
  if (status === "fallback") return "Fallback";
  return "Sin origen";
}

function getImageSource(item?: EjercicioMediaCatalogItem | null) {
  return (
    item?.media_principal?.url ||
    item?.imagen ||
    "/images/exercises/gym-master-exercise-fallback.svg"
  );
}

function isAdminRole(role?: string | null) {
  const normalizedRole = role?.trim().toLowerCase();
  return normalizedRole === "admin" || normalizedRole === "administrador";
}

function getYoutubeAutoCandidateKey(row: any) {
  return `${row.id_ejercicio}-${row.idioma}-${row.youtube_video_id ?? row.youtube_url ?? "sin-video"}`;
}

function buildYoutubeAutoReviewNotes(row: any) {
  return `Candidato automático ${String(row.idioma).toUpperCase()} por YouTube Data API. Título: ${row.title ?? "sin título"} · Canal: ${row.channelTitle ?? "sin canal"} · Vistas: ${row.viewCount ?? 0}. Requiere revisión administrativa.`;
}

export default function RutinasExerciseMediaCatalogPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isAuthenticated, initializeAuth, isInitialized, user } =
    useAuthStore();

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
          response.error || "No se pudo cargar el catálogo de media.",
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
      setError(loadError?.message ?? "No se pudo cargar el catálogo de media.");
      setItems([]);
      setSelectedExercise(null);
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    isInitialized,
    mediaStatus,
    nivelFilter,
    objetivoFilter,
    page,
    searchTerm,
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
          uploadResponse.error || "No se pudo subir la media a Cloudinary.",
        );
      }

      const updateResponse = await updateEjercicioMediaCatalog({
        id_ejercicio: selectedExercise.id_ejercicio,
        imagen: uploadResponse.url,
        imagen_origen: "cloudinary",
        cloudinary_public_id: uploadResponse.public_id,
        titulo: selectedExercise.nombre_ejercicio,
        descripcion_media:
          "Media principal subida a Cloudinary desde el catálogo administrativo.",
      });

      if (!updateResponse.ok) {
        throw new Error(
          updateResponse.error ||
            "La imagen se subió, pero no se pudo asociar al ejercicio.",
        );
      }

      setSuccess("Imagen/GIF subida a Cloudinary y asociada al ejercicio.");
      await loadCatalog();
    } catch (uploadError: any) {
      setError(
        uploadError?.message ?? "No se pudo subir la media del ejercicio.",
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
        descripcion_media: "Media principal actualizada manualmente desde URL.",
      });

      if (!response.ok) {
        throw new Error(
          response.error || "No se pudo guardar la URL de imagen.",
        );
      }

      setSuccess("URL de imagen actualizada correctamente.");
      await loadCatalog();
    } catch (saveError: any) {
      setError(saveError?.message ?? "No se pudo guardar la URL de imagen.");
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
        "Debe indicar una URL externa o usar la imagen actual del ejercicio.",
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
        descripcion_media:
          "Media principal importada automáticamente a Cloudinary desde el catálogo administrativo.",
      });

      if (!response.ok) {
        throw new Error(
          response.error || "No se pudo importar la imagen/GIF a Cloudinary.",
        );
      }

      setSuccess("Imagen/GIF importada a Cloudinary y asociada al ejercicio.");
      await loadCatalog();
    } catch (importError: any) {
      setError(importError?.message ?? "No se pudo importar la media remota.");
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
        descripcion_media:
          "Video recomendado para explicar la técnica del ejercicio.",
      });

      if (!response.ok) {
        throw new Error(
          response.error || "No se pudo guardar el video de YouTube.",
        );
      }

      setSuccess(
        youtubeUrl.trim() || youtubeUrlEn.trim()
          ? "Videos de YouTube asociados al ejercicio."
          : "Videos de YouTube quitados del ejercicio.",
      );
      await loadCatalog();
    } catch (saveError: any) {
      setError(saveError?.message ?? "No se pudo guardar el video de YouTube.");
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
        "Pegá un CSV con encabezado para previsualizar o importar videos de YouTube.",
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
          response.error ||
            "No se pudo procesar la importación masiva de YouTube.",
        );
      }

      setYoutubeImportReport(response);
      setSuccess(
        youtubeImportApply
          ? `Importación aplicada: ${response.applied ?? 0} ejercicios actualizados.`
          : `Previsualización lista: ${response.matched ?? 0} ejercicios encontrados.`,
      );

      if (youtubeImportApply) {
        await loadCatalog();
      }
    } catch (importError: any) {
      setError(
        importError?.message ??
          "No se pudo procesar la importación masiva de YouTube.",
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
      setError("Seleccioná al menos un idioma para buscar videos en YouTube.");
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
          response.error ||
            "No se pudo ejecutar el descubrimiento automático de YouTube.",
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
          ? `Descubrimiento aplicado: ${response.applied ?? 0} videos sugeridos guardados sin pisar URLs existentes.`
          : `Previsualización lista: ${response.candidates?.length ?? 0} resultados/candidatos. Desmarcá candidatos incorrectos antes de aplicar.`,
      );

      if (youtubeAutoApply) {
        await loadCatalog();
      }
    } catch (autoError: any) {
      setError(
        autoError?.message ??
          "No se pudo ejecutar el descubrimiento automático de YouTube.",
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
        "No hay candidatos seleccionados para aplicar. Marcá al menos un video correcto.",
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
          youtube_review_notes: buildYoutubeAutoReviewNotes(row),
        };

        if (row.idioma === "en") {
          current.youtube_url_en = row.youtube_url;
        } else {
          current.youtube_url_es = row.youtube_url;
        }

        current.youtube_review_notes = buildYoutubeAutoReviewNotes(row);
        itemsByExercise.set(id, current);
      }

      const response = await importEjerciciosYoutubeVideos({
        apply: true,
        items: Array.from(itemsByExercise.values()),
      });

      if (!response.ok) {
        throw new Error(
          response.error ||
            "No se pudieron aplicar los candidatos seleccionados.",
        );
      }

      setSuccess(
        `Candidatos seleccionados aplicados: ${response.applied ?? 0}. Los descartados no se guardaron.`,
      );
      setYoutubeAutoReport(null);
      setYoutubeAutoSelectedKeys(new Set());
      await loadCatalog();
    } catch (applyError: any) {
      setError(
        applyError?.message ??
          "No se pudieron aplicar los candidatos seleccionados.",
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
          response.error || "No se pudieron detectar equivalencias de media.",
        );
      }

      setEquivalenceSyncReport(
        response as EjercicioMediaEquivalenceSyncResponse,
      );
      setSuccess(
        `Se detectaron ${response.total_candidates ?? 0} equivalencias seguras para revisar.`,
      );
    } catch (syncError: any) {
      setError(
        syncError?.message ?? "No se pudieron detectar equivalencias de media.",
      );
    } finally {
      setSyncingEquivalences(false);
    }
  };

  const handleApplyEquivalenceSync = async () => {
    const confirmed = window.confirm(
      "Se copiará media desde ejercicios equivalentes hacia ejercicios con fallback o imagen vacía. ¿Querés continuar?",
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
          response.error ||
            "No se pudo aplicar la sincronización de media equivalente.",
        );
      }

      setEquivalenceSyncReport(
        response as EjercicioMediaEquivalenceSyncResponse,
      );
      setSuccess(
        `Se sincronizaron ${response.applied ?? 0} ejercicios equivalentes.`,
      );
      await loadCatalog();
    } catch (syncError: any) {
      setError(
        syncError?.message ??
          "No se pudo aplicar la sincronización de media equivalente.",
      );
    } finally {
      setApplyingEquivalences(false);
    }
  };

  if (loading && !items.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando catálogo de media...
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
          <AppHeader title="Media de Ejercicios" />
          <main className="flex-1 p-6 space-y-6 bg-slate-50">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-wide text-[#0ea5e9] uppercase">
                  Rutinas / Banco de media
                </p>
                <h1 className="text-2xl font-bold text-slate-900">
                  Catálogo visual de ejercicios
                </h1>
                <p className="max-w-3xl text-sm text-slate-600">
                  Homogeneizá imágenes/GIFs en Cloudinary y asociá videos de
                  YouTube por ejercicio para web, mobile, PDF y futuro RAG.
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
                  Actualizar
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
                  Detectar equivalencias
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
                  Aplicar equivalencias
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/gestor-rutinas">Volver a Gestor</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <Card className="border-emerald-100 bg-white">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Total ejercicios
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {summary.total}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-sky-100 bg-white">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-500">
                    En Cloudinary
                  </p>
                  <p className="text-2xl font-bold text-sky-700">
                    {summary.conCloudinary}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-amber-100 bg-white">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Pendientes Cloudinary
                  </p>
                  <p className="text-2xl font-bold text-amber-700">
                    {summary.pendientesCloudinary}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-red-100 bg-white">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Pendientes YouTube
                  </p>
                  <p className="text-2xl font-bold text-red-700">
                    {summary.pendientesYoutube}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-purple-100 bg-white">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Con fallback
                  </p>
                  <p className="text-2xl font-bold text-purple-700">
                    {summary.conFallback}
                  </p>
                </CardContent>
              </Card>
            </div>

            {(error || success) && (
              <div
                className={`rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
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

            <Card className="border-indigo-100 bg-white">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Descubrimiento automático YouTube
                    </p>
                    <p className="text-xs text-slate-500">
                      Busca candidatos por nombre del ejercicio usando YouTube
                      Data API. No pisa videos existentes y guarda como
                      sugerido/en revisión.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
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
                      Aplicar cambios
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-end">
                  <div>
                    <Label htmlFor="youtube-auto-limit">
                      Ejercicios por corrida
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
                      Recomendado: 25. Máximo: 50.
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
                        ? "Buscar y guardar sugeridos"
                        : "Previsualizar candidatos"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setYoutubeAutoReport(null);
                        setYoutubeAutoSelectedKeys(new Set());
                      }}
                      disabled={youtubeAutoRunning || !youtubeAutoReport}
                    >
                      Limpiar resultado
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
                        Aplicar seleccionados ({youtubeAutoSelectedKeys.size})
                      </Button>
                    )}
                  </div>
                </div>
                {youtubeAutoReport && (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-950">
                    <p className="font-semibold">
                      Resultado:{" "}
                      {youtubeAutoReport.dryRun
                        ? "previsualización"
                        : "aplicado"}
                    </p>
                    <p>
                      Consultas YouTube:{" "}
                      {youtubeAutoReport.total_consultas_youtube ?? 0} ·
                      Aplicados: {youtubeAutoReport.applied ?? 0} · Saltados:{" "}
                      {youtubeAutoReport.skipped ?? 0} · Errores:{" "}
                      {youtubeAutoReport.errors ?? 0}
                    </p>
                    {youtubeAutoReport.dryRun && (
                      <p className="mt-1 text-[11px] text-indigo-800">
                        Desmarcá los videos que no coinciden con el ejercicio.
                        Luego usá “Aplicar seleccionados”; los descartados no se
                        guardan.
                      </p>
                    )}
                    {youtubeAutoReport.candidates?.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-auto rounded border bg-white">
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
                                      aria-label="Aplicar candidato"
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold">
                                      #{row.id_ejercicio} ·{" "}
                                      {row.nombre_ejercicio} ·{" "}
                                      {String(row.idioma).toUpperCase()} ·{" "}
                                      {selected ? "seleccionado" : row.action}
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
                                          ? `· ${row.viewCount.toLocaleString()} vistas`
                                          : ""}
                                      </a>
                                    )}
                                    {youtubeAutoReport.dryRun &&
                                      selectable &&
                                      !selected && (
                                        <p className="text-[11px] font-semibold text-red-700">
                                          Descartado: no se guardará al aplicar
                                          seleccionados.
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

            <Card className="border-red-100 bg-white">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Importación masiva YouTube ES/EN
                    </p>
                    <p className="text-xs text-slate-500">
                      Pegá un CSV revisado. Primero previsualizá; luego activá
                      “Aplicar cambios”.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      id="youtube-apply-import"
                      type="checkbox"
                      checked={youtubeImportApply}
                      onChange={(event) =>
                        setYoutubeImportApply(event.target.checked)
                      }
                    />
                    <Label htmlFor="youtube-apply-import">
                      Aplicar cambios
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
                      ? "Importar YouTube"
                      : "Previsualizar YouTube"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setYoutubeCsvInput(
                        "id_ejercicio,nombre_ejercicio,youtube_url_es,youtube_url_en,youtube_source,youtube_review_status,youtube_review_notes\n",
                      )
                    }
                  >
                    Cargar plantilla
                  </Button>
                </div>
                {youtubeImportReport && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-900">
                    <p className="font-semibold">
                      Resultado:{" "}
                      {youtubeImportReport.dryRun
                        ? "previsualización"
                        : "importación aplicada"}
                    </p>
                    <p>
                      Total: {youtubeImportReport.total} · Encontrados:{" "}
                      {youtubeImportReport.matched} · Aplicados:{" "}
                      {youtubeImportReport.applied} · Errores:{" "}
                      {youtubeImportReport.errors}
                    </p>
                    {youtubeImportReport.preview?.length > 0 && (
                      <div className="mt-2 max-h-36 overflow-auto rounded border bg-white">
                        {youtubeImportReport.preview
                          .slice(0, 12)
                          .map((row: any) => (
                            <div
                              key={`${row.row}-${row.id_ejercicio ?? row.nombre_ejercicio}`}
                              className="border-b px-2 py-1"
                            >
                              Fila {row.row}:{" "}
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
              <Card className="border-sky-200 bg-sky-50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-sky-900">
                        Sincronización de media equivalente
                      </p>
                      <p className="text-xs text-sky-700">
                        {equivalenceSyncReport.dryRun
                          ? "Previsualización sin modificar datos."
                          : "Cambios aplicados sobre ejercicios con fallback o imagen vacía."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                      <span className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800">
                        Fuentes: {equivalenceSyncReport.source_pool}
                      </span>
                      <span className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800">
                        Candidatos: {equivalenceSyncReport.total_candidates}
                      </span>
                      <span className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800">
                        Aplicados: {equivalenceSyncReport.applied}
                      </span>
                      <span className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800">
                        Pendientes: {equivalenceSyncReport.skipped}
                      </span>
                    </div>
                  </div>

                  {equivalenceSyncReport.candidates.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-sky-200 bg-white">
                      <table className="w-full text-xs">
                        <thead className="text-left bg-sky-100 text-sky-900">
                          <tr>
                            <th className="px-3 py-2">Origen</th>
                            <th className="px-3 py-2">Destino</th>
                            <th className="px-3 py-2">Nombre canónico</th>
                            <th className="px-3 py-2">Media</th>
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
                                    {candidate.source_nivel}
                                  </p>
                                </td>
                                <td className="px-3 py-2">
                                  <p className="font-semibold">
                                    {candidate.target_nombre_ejercicio}
                                  </p>
                                  <p className="text-slate-500">
                                    {candidate.target_objetivo} ·{" "}
                                    {candidate.target_nivel}
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
              <Card className="bg-white">
                <CardHeader className="p-4 border-b">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_220px]">
                    <div className="relative">
                      <Search className="absolute w-4 h-4 text-slate-400 left-3 top-3" />
                      <Input
                        value={searchTerm}
                        onChange={(event) => {
                          setPage(1);
                          setSearchTerm(event.target.value);
                        }}
                        placeholder="Buscar ejercicio por nombre..."
                        className="pl-9"
                      />
                    </div>
                    <select
                      value={objetivoFilter}
                      onChange={(event) => {
                        setPage(1);
                        setObjetivoFilter(event.target.value);
                      }}
                      className="h-10 px-3 text-sm border rounded-md bg-white"
                    >
                      <option value="todos">Todos los objetivos</option>
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
                      className="h-10 px-3 text-sm border rounded-md bg-white"
                    >
                      <option value="todos">Todos los niveles</option>
                      {niveles.map((nivel) => (
                        <option key={nivel.id_nivel} value={nivel.id_nivel}>
                          {nivel.nombre_nivel}
                        </option>
                      ))}
                    </select>
                    <select
                      value={mediaStatus}
                      onChange={(event) => {
                        setPage(1);
                        setMediaStatus(event.target.value);
                      }}
                      className="h-10 px-3 text-sm border rounded-md bg-white"
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="pendiente_cloudinary">
                        Pendiente Cloudinary
                      </option>
                      <option value="cloudinary">Con Cloudinary</option>
                      <option value="pendiente_youtube">
                        Pendiente YouTube
                      </option>
                      <option value="youtube">Con YouTube</option>
                      <option value="pendiente_youtube_es">
                        Pendiente YouTube ES
                      </option>
                      <option value="youtube_es">Con YouTube ES</option>
                      <option value="pendiente_youtube_en">
                        Pendiente YouTube EN
                      </option>
                      <option value="youtube_en">Con YouTube EN</option>
                      <option value="youtube_validado">YouTube validado</option>
                      <option value="youtube_revision">
                        YouTube en revisión
                      </option>
                      <option value="fallback">Con fallback</option>
                    </select>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left bg-slate-100 text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Ejercicio</th>
                          <th className="px-4 py-3">Objetivo / Nivel</th>
                          <th className="px-4 py-3">Imagen</th>
                          <th className="px-4 py-3">Video</th>
                          <th className="px-4 py-3 text-center">Ver (ES)</th>
                          <th className="px-4 py-3 text-center">Ver (EN)</th>
                          <th className="px-4 py-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const active =
                            selectedExercise?.id_ejercicio ===
                            item.id_ejercicio;
                          const hasYoutube =
                            !!item.video_youtube_url ||
                            !!item.youtube_url_es ||
                            !!item.youtube_url_en ||
                            !!item.youtube_principal;
                          const youtubeEsUrl = getYoutubeEsUrl(item);
                          const youtubeEnUrl = getYoutubeEnUrl(item);
                          const hasCloudinary =
                            item.imagen_origen === "cloudinary" ||
                            !!item.cloudinary_public_id;

                          return (
                            <tr
                              key={item.id_ejercicio}
                              className={`border-t ${active ? "bg-sky-50" : "bg-white"}`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={getImageSource(item)}
                                    alt={item.nombre_ejercicio}
                                    className="object-cover w-12 h-12 border rounded-lg bg-slate-100"
                                  />
                                  <div>
                                    <p className="font-semibold text-slate-900">
                                      {item.nombre_ejercicio}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {item.grupo_muscular_nombre ??
                                        "Grupo sin dato"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                <p>
                                  {item.objetivo_nombre ??
                                    `Objetivo ${item.id_objetivo}`}
                                </p>
                                <p className="text-xs">
                                  {item.nivel_nombre ??
                                    `Nivel ${item.id_nivel}`}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${hasCloudinary ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                                >
                                  {hasCloudinary ? (
                                    <Cloud className="w-3 h-3" />
                                  ) : (
                                    <AlertTriangle className="w-3 h-3" />
                                  )}
                                  {mediaStatusLabel(item.imagen_origen)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${hasYoutube ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}
                                >
                                  <Video className="w-3 h-3" />
                                  {hasYoutube
                                    ? item.youtube_review_status === "validado"
                                      ? "YouTube validado"
                                      : "YouTube"
                                    : "Pendiente"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {youtubeEsUrl ? (
                                  <a
                                    href={youtubeEsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Ver video en español"
                                    className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Ver video ES</span>
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
                                    title="Ver video en inglés"
                                    className="inline-flex items-center justify-center rounded-md border border-sky-200 bg-sky-50 p-2 text-sky-700 hover:bg-sky-100"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Ver video EN</span>
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
                                  Editar
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-3 px-4 py-3 border-t md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-500">
                      Mostrando {items.length} de {total} ejercicios · Página{" "}
                      {page} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() =>
                          setPage((prev) => Math.min(totalPages, prev + 1))
                        }
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white xl:sticky xl:top-6 xl:self-start">
                <CardHeader className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-[#0ea5e9]" />
                    <h2 className="text-lg font-bold">Detalle de media</h2>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-5">
                  {!selectedExercise ? (
                    <div className="py-12 text-center text-slate-500">
                      Seleccioná un ejercicio para editar su media.
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {selectedExercise.nombre_ejercicio}
                        </p>
                        <p className="text-sm text-slate-500">
                          {selectedExercise.objetivo_nombre} ·{" "}
                          {selectedExercise.nivel_nombre} ·{" "}
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
                            Origen imagen
                          </p>
                          <p className="text-slate-900">
                            {mediaStatusLabel(selectedExercise.imagen_origen)}
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

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <Label>Subir imagen/GIF a Cloudinary</Label>
                            <p className="text-xs text-slate-500">
                              Recomendado para evitar URLs rotas.
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
                            Subir
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="external-image-url">
                          URL de imagen actual / externa
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
                            Guardar URL de imagen
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
                            Importar URL a Cloudinary
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Usa este botón para tomar una URL externa existente,
                          importarla a Cloudinary y reemplazar la imagen del
                          ejercicio por la URL segura nueva.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="youtube-url-es">
                            Video de YouTube recomendado ES
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
                            Video de YouTube recomendado EN
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
                            <Label htmlFor="youtube-source">Fuente</Label>
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
                              Estado revisión
                            </Label>
                            <select
                              id="youtube-review-status"
                              value={youtubeReviewStatus}
                              onChange={(event) =>
                                setYoutubeReviewStatus(event.target.value)
                              }
                              className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="sugerido">Sugerido</option>
                              <option value="validado">Validado</option>
                              <option value="rechazado">Rechazado</option>
                              <option value="requiere_revision">
                                Requiere revisión
                              </option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtube-review-notes">
                            Notas de revisión
                          </Label>
                          <Input
                            id="youtube-review-notes"
                            value={youtubeReviewNotes}
                            onChange={(event) =>
                              setYoutubeReviewNotes(event.target.value)
                            }
                            placeholder="Ej: video revisado por técnica y seguridad"
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
                            Guardar videos
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

                      <div className="p-3 text-xs border rounded-lg bg-blue-50 text-blue-700 border-blue-200">
                        Cloudinary debe ser la fuente principal para
                        imágenes/GIFs. Podés subir archivos locales o importar
                        URLs externas para evitar descargas manuales. YouTube
                        queda como apoyo didáctico para que el socio vea la
                        técnica del ejercicio.
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
