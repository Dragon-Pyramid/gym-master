'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Dumbbell,
  ExternalLink,
  ImageIcon,
  Loader2,
  RefreshCcw,
  Search,
  UploadCloud,
  Video,
  XCircle,
} from 'lucide-react';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { EjercicioMediaCatalogItem, EjercicioMediaEquivalenceSyncResponse } from '@/interfaces/ejercicioMedia.interface';
import { Nivel } from '@/interfaces/niveles.interface';
import { Objetivo } from '@/interfaces/objetivo.interface';
import {
  getEjerciciosMediaCatalog,
  importEjercicioMediaFromUrl,
  syncEjercicioMediaEquivalences,
  getNiveles,
  getObjetivos,
  updateEjercicioMediaCatalog,
  uploadEjercicioMedia,
} from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

type CatalogSummary = {
  total: number;
  conCloudinary: number;
  conYoutube: number;
  conFallback: number;
  pendientesCloudinary: number;
  pendientesYoutube: number;
};

const DEFAULT_SUMMARY: CatalogSummary = {
  total: 0,
  conCloudinary: 0,
  conYoutube: 0,
  conFallback: 0,
  pendientesCloudinary: 0,
  pendientesYoutube: 0,
};

function getYoutubePreviewUrl(videoId?: string | null) {
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function mediaStatusLabel(status?: string | null) {
  if (status === 'cloudinary') return 'Cloudinary';
  if (status === 'youtube') return 'YouTube';
  if (status === 'externa') return 'URL externa';
  if (status === 'local') return 'Local';
  if (status === 'fallback') return 'Fallback';
  return 'Sin origen';
}

function getImageSource(item?: EjercicioMediaCatalogItem | null) {
  return item?.media_principal?.url || item?.imagen || '/images/exercises/gym-master-exercise-fallback.svg';
}

function isAdminRole(role?: string | null) {
  const normalizedRole = role?.trim().toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'administrador';
}

export default function RutinasExerciseMediaCatalogPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isAuthenticated, initializeAuth, isInitialized, user } = useAuthStore();

  const [items, setItems] = useState<EjercicioMediaCatalogItem[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<EjercicioMediaCatalogItem | null>(null);
  const [summary, setSummary] = useState<CatalogSummary>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncingEquivalences, setSyncingEquivalences] = useState(false);
  const [applyingEquivalences, setApplyingEquivalences] = useState(false);
  const [equivalenceSyncReport, setEquivalenceSyncReport] = useState<EjercicioMediaEquivalenceSyncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [objetivoFilter, setObjetivoFilter] = useState('todos');
  const [nivelFilter, setNivelFilter] = useState('todos');
  const [mediaStatus, setMediaStatus] = useState('todos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [externalImageUrl, setExternalImageUrl] = useState('');

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && !isAdminRole(user?.rol)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isInitialized, router, user?.rol]);

  const selectedPreviewUrl = useMemo(() => getImageSource(selectedExercise), [selectedExercise]);
  const selectedYoutubeUrl = useMemo(
    () => selectedExercise?.video_youtube_url || selectedExercise?.youtube_principal?.youtube_url || selectedExercise?.youtube_principal?.url || '',
    [selectedExercise]
  );

  const loadFilters = useCallback(async () => {
    const [objetivosResponse, nivelesResponse] = await Promise.all([getObjetivos(), getNiveles()]);

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
        throw new Error(response.error || 'No se pudo cargar el catálogo de media.');
      }

      setItems(response.data ?? []);
      setSummary(response.resumen ?? DEFAULT_SUMMARY);
      setTotal(response.total ?? 0);
      setTotalPages(response.totalPages ?? 1);

      setSelectedExercise((prev) => {
        if (!prev) return response.data?.[0] ?? null;
        return response.data?.find((item: EjercicioMediaCatalogItem) => item.id_ejercicio === prev.id_ejercicio) ?? response.data?.[0] ?? null;
      });
    } catch (loadError: any) {
      setError(loadError?.message ?? 'No se pudo cargar el catálogo de media.');
      setItems([]);
      setSelectedExercise(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isInitialized, mediaStatus, nivelFilter, objetivoFilter, page, searchTerm, user?.rol]);

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
    setExternalImageUrl(selectedExercise?.imagen ?? '');
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
      const uploadResponse = await uploadEjercicioMedia(file, selectedExercise.id_ejercicio);

      if (!uploadResponse.ok || !uploadResponse.url) {
        throw new Error(uploadResponse.error || 'No se pudo subir la media a Cloudinary.');
      }

      const updateResponse = await updateEjercicioMediaCatalog({
        id_ejercicio: selectedExercise.id_ejercicio,
        imagen: uploadResponse.url,
        imagen_origen: 'cloudinary',
        cloudinary_public_id: uploadResponse.public_id,
        titulo: selectedExercise.nombre_ejercicio,
        descripcion_media: 'Media principal subida a Cloudinary desde el catálogo administrativo.',
      });

      if (!updateResponse.ok) {
        throw new Error(updateResponse.error || 'La imagen se subió, pero no se pudo asociar al ejercicio.');
      }

      setSuccess('Imagen/GIF subida a Cloudinary y asociada al ejercicio.');
      await loadCatalog();
    } catch (uploadError: any) {
      setError(uploadError?.message ?? 'No se pudo subir la media del ejercicio.');
    } finally {
      setUploading(false);
      event.target.value = '';
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
        imagen_origen: externalImageUrl.trim().includes('cloudinary.com') ? 'cloudinary' : 'externa',
        cloudinary_public_id: selectedExercise.cloudinary_public_id ?? null,
        titulo: selectedExercise.nombre_ejercicio,
        descripcion_media: 'Media principal actualizada manualmente desde URL.',
      });

      if (!response.ok) {
        throw new Error(response.error || 'No se pudo guardar la URL de imagen.');
      }

      setSuccess('URL de imagen actualizada correctamente.');
      await loadCatalog();
    } catch (saveError: any) {
      setError(saveError?.message ?? 'No se pudo guardar la URL de imagen.');
    } finally {
      setSaving(false);
    }
  };


  const handleImportExternalImage = async () => {
    if (!selectedExercise) return;

    const sourceUrl = externalImageUrl.trim() || selectedExercise.imagen?.trim();

    if (!sourceUrl) {
      setError('Debe indicar una URL externa o usar la imagen actual del ejercicio.');
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
        descripcion_media: 'Media principal importada automáticamente a Cloudinary desde el catálogo administrativo.',
      });

      if (!response.ok) {
        throw new Error(response.error || 'No se pudo importar la imagen/GIF a Cloudinary.');
      }

      setSuccess('Imagen/GIF importada a Cloudinary y asociada al ejercicio.');
      await loadCatalog();
    } catch (importError: any) {
      setError(importError?.message ?? 'No se pudo importar la media remota.');
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
        titulo: selectedExercise.nombre_ejercicio,
        descripcion_media: 'Video recomendado para explicar la técnica del ejercicio.',
      });

      if (!response.ok) {
        throw new Error(response.error || 'No se pudo guardar el video de YouTube.');
      }

      setSuccess(youtubeUrl.trim() ? 'Video de YouTube asociado al ejercicio.' : 'Video de YouTube quitado del ejercicio.');
      await loadCatalog();
    } catch (saveError: any) {
      setError(saveError?.message ?? 'No se pudo guardar el video de YouTube.');
    } finally {
      setSaving(false);
    }
  };



  const handlePreviewEquivalenceSync = async () => {
    setSyncingEquivalences(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await syncEjercicioMediaEquivalences({ apply: false, limit: 500 });

      if (!response.ok) {
        throw new Error(response.error || 'No se pudieron detectar equivalencias de media.');
      }

      setEquivalenceSyncReport(response as EjercicioMediaEquivalenceSyncResponse);
      setSuccess(`Se detectaron ${response.total_candidates ?? 0} equivalencias seguras para revisar.`);
    } catch (syncError: any) {
      setError(syncError?.message ?? 'No se pudieron detectar equivalencias de media.');
    } finally {
      setSyncingEquivalences(false);
    }
  };

  const handleApplyEquivalenceSync = async () => {
    const confirmed = window.confirm(
      'Se copiará media desde ejercicios equivalentes hacia ejercicios con fallback o imagen vacía. ¿Querés continuar?'
    );

    if (!confirmed) return;

    setApplyingEquivalences(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await syncEjercicioMediaEquivalences({ apply: true, limit: 500 });

      if (!response.ok) {
        throw new Error(response.error || 'No se pudo aplicar la sincronización de media equivalente.');
      }

      setEquivalenceSyncReport(response as EjercicioMediaEquivalenceSyncResponse);
      setSuccess(`Se sincronizaron ${response.applied ?? 0} ejercicios equivalentes.`);
      await loadCatalog();
    } catch (syncError: any) {
      setError(syncError?.message ?? 'No se pudo aplicar la sincronización de media equivalente.');
    } finally {
      setApplyingEquivalences(false);
    }
  };

  if (loading && !items.length) {
    return <div className='flex items-center justify-center min-h-screen'>Cargando catálogo de media...</div>;
  }

  if (!isAuthenticated || !isAdminRole(user?.rol)) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='flex w-full min-h-screen'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Media de Ejercicios' />
          <main className='flex-1 p-6 space-y-6 bg-slate-50'>
            <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
              <div>
                <p className='text-sm font-semibold tracking-wide text-[#0ea5e9] uppercase'>Rutinas / Banco de media</p>
                <h1 className='text-2xl font-bold text-slate-900'>Catálogo visual de ejercicios</h1>
                <p className='max-w-3xl text-sm text-slate-600'>
                  Homogeneizá imágenes/GIFs en Cloudinary y asociá videos de YouTube por ejercicio para web, mobile, PDF y futuro RAG.
                </p>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button variant='outline' onClick={loadCatalog} disabled={loading}>
                  {loading ? <Loader2 className='w-4 h-4 mr-2 animate-spin' /> : <RefreshCcw className='w-4 h-4 mr-2' />}
                  Actualizar
                </Button>
                <Button variant='outline' onClick={handlePreviewEquivalenceSync} disabled={syncingEquivalences || applyingEquivalences}>
                  {syncingEquivalences ? <Loader2 className='w-4 h-4 mr-2 animate-spin' /> : <RefreshCcw className='w-4 h-4 mr-2' />}
                  Detectar equivalencias
                </Button>
                <Button onClick={handleApplyEquivalenceSync} disabled={syncingEquivalences || applyingEquivalences}>
                  {applyingEquivalences ? <Loader2 className='w-4 h-4 mr-2 animate-spin' /> : <Cloud className='w-4 h-4 mr-2' />}
                  Aplicar equivalencias
                </Button>
                <Button asChild variant='outline'>
                  <Link href='/dashboard/gestor-rutinas'>Volver a Gestor</Link>
                </Button>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-5'>
              <Card className='border-emerald-100 bg-white'>
                <CardContent className='p-4'>
                  <p className='text-xs font-medium text-slate-500'>Total ejercicios</p>
                  <p className='text-2xl font-bold text-slate-900'>{summary.total}</p>
                </CardContent>
              </Card>
              <Card className='border-sky-100 bg-white'>
                <CardContent className='p-4'>
                  <p className='text-xs font-medium text-slate-500'>En Cloudinary</p>
                  <p className='text-2xl font-bold text-sky-700'>{summary.conCloudinary}</p>
                </CardContent>
              </Card>
              <Card className='border-amber-100 bg-white'>
                <CardContent className='p-4'>
                  <p className='text-xs font-medium text-slate-500'>Pendientes Cloudinary</p>
                  <p className='text-2xl font-bold text-amber-700'>{summary.pendientesCloudinary}</p>
                </CardContent>
              </Card>
              <Card className='border-red-100 bg-white'>
                <CardContent className='p-4'>
                  <p className='text-xs font-medium text-slate-500'>Pendientes YouTube</p>
                  <p className='text-2xl font-bold text-red-700'>{summary.pendientesYoutube}</p>
                </CardContent>
              </Card>
              <Card className='border-purple-100 bg-white'>
                <CardContent className='p-4'>
                  <p className='text-xs font-medium text-slate-500'>Con fallback</p>
                  <p className='text-2xl font-bold text-purple-700'>{summary.conFallback}</p>
                </CardContent>
              </Card>
            </div>

            {(error || success) && (
              <div className={`rounded-xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                <div className='flex items-center gap-2'>
                  {error ? <XCircle className='w-4 h-4' /> : <CheckCircle2 className='w-4 h-4' />}
                  <span>{error ?? success}</span>
                </div>
              </div>
            )}



            {equivalenceSyncReport && (
              <Card className='border-sky-200 bg-sky-50'>
                <CardContent className='p-4 space-y-3'>
                  <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
                    <div>
                      <p className='text-sm font-bold text-sky-900'>Sincronización de media equivalente</p>
                      <p className='text-xs text-sky-700'>
                        {equivalenceSyncReport.dryRun ? 'Previsualización sin modificar datos.' : 'Cambios aplicados sobre ejercicios con fallback o imagen vacía.'}
                      </p>
                    </div>
                    <div className='grid grid-cols-2 gap-2 text-xs md:grid-cols-4'>
                      <span className='rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800'>Fuentes: {equivalenceSyncReport.source_pool}</span>
                      <span className='rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800'>Candidatos: {equivalenceSyncReport.total_candidates}</span>
                      <span className='rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800'>Aplicados: {equivalenceSyncReport.applied}</span>
                      <span className='rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-800'>Pendientes: {equivalenceSyncReport.skipped}</span>
                    </div>
                  </div>

                  {equivalenceSyncReport.candidates.length > 0 && (
                    <div className='overflow-x-auto rounded-lg border border-sky-200 bg-white'>
                      <table className='w-full text-xs'>
                        <thead className='text-left bg-sky-100 text-sky-900'>
                          <tr>
                            <th className='px-3 py-2'>Origen</th>
                            <th className='px-3 py-2'>Destino</th>
                            <th className='px-3 py-2'>Nombre canónico</th>
                            <th className='px-3 py-2'>Media</th>
                          </tr>
                        </thead>
                        <tbody>
                          {equivalenceSyncReport.candidates.slice(0, 8).map((candidate) => (
                            <tr key={`${candidate.source_id_ejercicio}-${candidate.target_id_ejercicio}`} className='border-t'>
                              <td className='px-3 py-2'>
                                <p className='font-semibold'>{candidate.source_nombre_ejercicio}</p>
                                <p className='text-slate-500'>{candidate.source_objetivo} · {candidate.source_nivel}</p>
                              </td>
                              <td className='px-3 py-2'>
                                <p className='font-semibold'>{candidate.target_nombre_ejercicio}</p>
                                <p className='text-slate-500'>{candidate.target_objetivo} · {candidate.target_nivel}</p>
                              </td>
                              <td className='px-3 py-2 text-slate-600'>{candidate.canonical_name}</td>
                              <td className='px-3 py-2 text-slate-600'>{candidate.imagen_origen ?? 'externa'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]'>
              <Card className='bg-white'>
                <CardHeader className='p-4 border-b'>
                  <div className='grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_220px]'>
                    <div className='relative'>
                      <Search className='absolute w-4 h-4 text-slate-400 left-3 top-3' />
                      <Input
                        value={searchTerm}
                        onChange={(event) => {
                          setPage(1);
                          setSearchTerm(event.target.value);
                        }}
                        placeholder='Buscar ejercicio por nombre...'
                        className='pl-9'
                      />
                    </div>
                    <select
                      value={objetivoFilter}
                      onChange={(event) => {
                        setPage(1);
                        setObjetivoFilter(event.target.value);
                      }}
                      className='h-10 px-3 text-sm border rounded-md bg-white'
                    >
                      <option value='todos'>Todos los objetivos</option>
                      {objetivos.map((objetivo) => (
                        <option key={objetivo.id_objetivo} value={objetivo.id_objetivo}>
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
                      className='h-10 px-3 text-sm border rounded-md bg-white'
                    >
                      <option value='todos'>Todos los niveles</option>
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
                      className='h-10 px-3 text-sm border rounded-md bg-white'
                    >
                      <option value='todos'>Todos los estados</option>
                      <option value='pendiente_cloudinary'>Pendiente Cloudinary</option>
                      <option value='cloudinary'>Con Cloudinary</option>
                      <option value='pendiente_youtube'>Pendiente YouTube</option>
                      <option value='youtube'>Con YouTube</option>
                      <option value='fallback'>Con fallback</option>
                    </select>
                  </div>
                </CardHeader>

                <CardContent className='p-0'>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                      <thead className='text-left bg-slate-100 text-slate-600'>
                        <tr>
                          <th className='px-4 py-3'>Ejercicio</th>
                          <th className='px-4 py-3'>Objetivo / Nivel</th>
                          <th className='px-4 py-3'>Imagen</th>
                          <th className='px-4 py-3'>Video</th>
                          <th className='px-4 py-3 text-right'>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const active = selectedExercise?.id_ejercicio === item.id_ejercicio;
                          const hasYoutube = !!item.video_youtube_url || !!item.youtube_principal;
                          const hasCloudinary = item.imagen_origen === 'cloudinary' || !!item.cloudinary_public_id;

                          return (
                            <tr key={item.id_ejercicio} className={`border-t ${active ? 'bg-sky-50' : 'bg-white'}`}>
                              <td className='px-4 py-3'>
                                <div className='flex items-center gap-3'>
                                  <img
                                    src={getImageSource(item)}
                                    alt={item.nombre_ejercicio}
                                    className='object-cover w-12 h-12 border rounded-lg bg-slate-100'
                                  />
                                  <div>
                                    <p className='font-semibold text-slate-900'>{item.nombre_ejercicio}</p>
                                    <p className='text-xs text-slate-500'>{item.grupo_muscular_nombre ?? 'Grupo sin dato'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className='px-4 py-3 text-slate-600'>
                                <p>{item.objetivo_nombre ?? `Objetivo ${item.id_objetivo}`}</p>
                                <p className='text-xs'>{item.nivel_nombre ?? `Nivel ${item.id_nivel}`}</p>
                              </td>
                              <td className='px-4 py-3'>
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${hasCloudinary ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                  {hasCloudinary ? <Cloud className='w-3 h-3' /> : <AlertTriangle className='w-3 h-3' />}
                                  {mediaStatusLabel(item.imagen_origen)}
                                </span>
                              </td>
                              <td className='px-4 py-3'>
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${hasYoutube ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                                  <Video className='w-3 h-3' />
                                  {hasYoutube ? 'YouTube' : 'Pendiente'}
                                </span>
                              </td>
                              <td className='px-4 py-3 text-right'>
                                <Button size='sm' variant={active ? 'default' : 'outline'} onClick={() => setSelectedExercise(item)}>
                                  Editar
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className='flex flex-col gap-3 px-4 py-3 border-t md:flex-row md:items-center md:justify-between'>
                    <p className='text-sm text-slate-500'>
                      Mostrando {items.length} de {total} ejercicios · Página {page} de {totalPages}
                    </p>
                    <div className='flex gap-2'>
                      <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                        Anterior
                      </Button>
                      <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-white xl:sticky xl:top-6 xl:self-start'>
                <CardHeader className='p-4 border-b'>
                  <div className='flex items-center gap-2'>
                    <Dumbbell className='w-5 h-5 text-[#0ea5e9]' />
                    <h2 className='text-lg font-bold'>Detalle de media</h2>
                  </div>
                </CardHeader>
                <CardContent className='p-4 space-y-5'>
                  {!selectedExercise ? (
                    <div className='py-12 text-center text-slate-500'>Seleccioná un ejercicio para editar su media.</div>
                  ) : (
                    <>
                      <div>
                        <p className='text-lg font-bold text-slate-900'>{selectedExercise.nombre_ejercicio}</p>
                        <p className='text-sm text-slate-500'>
                          {selectedExercise.objetivo_nombre} · {selectedExercise.nivel_nombre} · {selectedExercise.grupo_muscular_nombre}
                        </p>
                      </div>

                      <div className='overflow-hidden border rounded-xl bg-slate-100'>
                        <img src={selectedPreviewUrl} alt={selectedExercise.nombre_ejercicio} className='object-contain w-full h-56 bg-white' />
                      </div>

                      <div className='grid grid-cols-1 gap-2 text-xs sm:grid-cols-2'>
                        <div className='p-3 border rounded-lg bg-slate-50'>
                          <p className='font-semibold text-slate-600'>Origen imagen</p>
                          <p className='text-slate-900'>{mediaStatusLabel(selectedExercise.imagen_origen)}</p>
                        </div>
                        <div className='p-3 border rounded-lg bg-slate-50'>
                          <p className='font-semibold text-slate-600'>Cloudinary public_id</p>
                          <p className='break-all text-slate-900'>{selectedExercise.cloudinary_public_id ?? '-'}</p>
                        </div>
                      </div>

                      <div className='space-y-3'>
                        <div className='flex items-center justify-between gap-3'>
                          <div>
                            <Label>Subir imagen/GIF a Cloudinary</Label>
                            <p className='text-xs text-slate-500'>Recomendado para evitar URLs rotas.</p>
                          </div>
                          <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleFileChange} />
                          <Button onClick={handleSelectFile} disabled={uploading || saving || importing}>
                            {uploading ? <Loader2 className='w-4 h-4 mr-2 animate-spin' /> : <UploadCloud className='w-4 h-4 mr-2' />}
                            Subir
                          </Button>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='external-image-url'>URL de imagen actual / externa</Label>
                        <Input
                          id='external-image-url'
                          value={externalImageUrl}
                          onChange={(event) => setExternalImageUrl(event.target.value)}
                          placeholder='https://...'
                        />
                        <div className='grid grid-cols-1 gap-2'>
                          <Button variant='outline' className='w-full' onClick={handleSaveExternalImage} disabled={saving || uploading || importing}>
                            <ImageIcon className='w-4 h-4 mr-2' />
                            Guardar URL de imagen
                          </Button>
                          <Button className='w-full' onClick={handleImportExternalImage} disabled={saving || uploading || importing || !externalImageUrl.trim()}>
                            {importing ? <Loader2 className='w-4 h-4 mr-2 animate-spin' /> : <Cloud className='w-4 h-4 mr-2' />}
                            Importar URL a Cloudinary
                          </Button>
                        </div>
                        <p className='text-xs text-slate-500'>
                          Usa este botón para tomar una URL externa existente, importarla a Cloudinary y reemplazar la imagen del ejercicio por la URL segura nueva.
                        </p>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='youtube-url'>Video de YouTube recomendado</Label>
                        <Input
                          id='youtube-url'
                          value={youtubeUrl}
                          onChange={(event) => setYoutubeUrl(event.target.value)}
                          placeholder='https://www.youtube.com/watch?v=...'
                        />
                        <div className='flex gap-2'>
                          <Button className='flex-1' onClick={handleSaveYoutube} disabled={saving || uploading || importing}>
                            {saving ? <Loader2 className='w-4 h-4 mr-2 animate-spin' /> : <Video className='w-4 h-4 mr-2' />}
                            Guardar video
                          </Button>
                          {getYoutubePreviewUrl(selectedExercise.youtube_video_id) && (
                            <Button asChild variant='outline'>
                              <a href={getYoutubePreviewUrl(selectedExercise.youtube_video_id) ?? '#'} target='_blank' rel='noreferrer'>
                                <ExternalLink className='w-4 h-4' />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className='p-3 text-xs border rounded-lg bg-blue-50 text-blue-700 border-blue-200'>
                        Cloudinary debe ser la fuente principal para imágenes/GIFs. Podés subir archivos locales o importar URLs externas para evitar descargas manuales. YouTube queda como apoyo didáctico para que el socio vea la técnica del ejercicio.
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
