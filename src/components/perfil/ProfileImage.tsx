'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RotateCcw, Save, X } from 'lucide-react';
import { uploadFile } from '@/services/apiClient';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function ProfileImage({
  foto,
  src,
  alt,
  size = 96,
  onUpload,
  showButton = true,
  onClick,
}: {
  foto?: string | null;
  src?: string | null;
  alt?: string;
  size?: number;
  onUpload?: (data: any) => void;
  showButton?: boolean;
  onClick?: () => void;
}) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(
    foto ?? src ?? null
  );
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCurrentSrc(foto ?? src ?? null);
  }, [foto, src]);

  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const validateFile = (file: File | null) => {
    if (!file) return 'No se seleccionó archivo.';
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `La imagen debe ser menor a ${MAX_FILE_SIZE_MB}MB.`;
    }

    const validTypes = /^image\/(png|jpe?g|webp|gif|svg\+xml|heic|heif)$/i;
    if (!validTypes.test(file.type)) {
      return 'Formato no válido. Usá PNG, JPG, WEBP, GIF, HEIC o HEIF.';
    }

    return null;
  };

  const resetInputs = () => {
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const clearPreview = () => {
    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }
    setPreviewSrc(null);
    setSelectedFile(null);
    resetInputs();
  };

  const handleSelectedFile = (file: File | null) => {
    setMessage(null);

    const validationError = validateFile(file);
    if (validationError) {
      clearPreview();
      setMessage({ type: 'error', text: validationError });
      return;
    }

    if (!file) return;

    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }

    setSelectedFile(file);
    setPreviewSrc(URL.createObjectURL(file));
  };

  const uploadSelectedFile = async () => {
    setMessage(null);

    if (!selectedFile) {
      setMessage({
        type: 'error',
        text: 'Seleccioná o sacá una foto antes de guardar.',
      });
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setLoading(true);

    try {
      const res = await uploadFile(selectedFile, 'file', '/api/file-upload');

      if (res.ok) {
        const url = res.data?.url || res.data?.foto || res.data?.path || null;

        if (url) {
          setCurrentSrc(url);
        }

        clearPreview();
        setMessage({ type: 'success', text: 'Foto de perfil actualizada.' });
        onUpload?.(res.data);
      } else {
        setMessage({
          type: 'error',
          text: res.data?.message || res.data?.error || 'Error al subir la foto.',
        });
      }
    } catch (error: unknown) {
      const text =
        error instanceof Error ? error.message : 'Error al subir la foto.';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
      resetInputs();
    }
  };

  const imageSrc = previewSrc || currentSrc;

  const getInitial = () => {
    const name = alt || '';
    const trimmed = name.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase();
  };

  return (
    <div className='flex flex-col items-center gap-3' onClick={onClick}>
      <div
        className='relative flex items-center justify-center flex-shrink-0 overflow-hidden rounded-full ring-1 ring-border/60 dark:ring-border/40 bg-muted'
        style={{ width: size, height: size }}
      >
        {imageSrc ? (
          // Se usa img para soportar previews locales tipo blob: en móviles.
          <img
            src={imageSrc}
            alt={alt ?? 'Avatar'}
            width={size}
            height={size}
            className='object-cover w-full h-full rounded-full'
          />
        ) : (
          <div className='flex items-center justify-center w-full h-full text-xl font-semibold text-white bg-indigo-600 rounded-full'>
            {getInitial()}
          </div>
        )}

        {previewSrc && (
          <div className='absolute inset-x-0 bottom-0 px-2 py-1 text-[10px] font-semibold text-center text-white bg-black/65'>
            Vista previa
          </div>
        )}
      </div>

      <input
        ref={galleryInputRef}
        type='file'
        accept='image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/heic,image/heif'
        className='hidden'
        onChange={(e) => handleSelectedFile(e.target.files?.[0] ?? null)}
      />

      <input
        ref={cameraInputRef}
        type='file'
        accept='image/*'
        capture='user'
        className='hidden'
        onChange={(e) => handleSelectedFile(e.target.files?.[0] ?? null)}
      />

      {showButton && (
        <div className='flex flex-col items-center w-full gap-2'>
          {!selectedFile ? (
            <div className='flex flex-wrap items-center justify-center gap-2'>
              <button
                type='button'
                onClick={() => galleryInputRef.current?.click()}
                className='inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md border-border bg-background/80 hover:bg-background/90 disabled:opacity-60'
                aria-label='Subir foto desde el dispositivo'
                disabled={loading}
              >
                <ImagePlus className='w-4 h-4' />
                Subir foto
              </button>

              <button
                type='button'
                onClick={() => cameraInputRef.current?.click()}
                className='inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-60'
                aria-label='Sacar foto con la cámara'
                disabled={loading}
              >
                <Camera className='w-4 h-4' />
                Sacar foto
              </button>
            </div>
          ) : (
            <div className='flex flex-wrap items-center justify-center gap-2'>
              <button
                type='button'
                onClick={uploadSelectedFile}
                className='inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60'
                aria-label='Guardar foto de perfil'
                disabled={loading}
              >
                <Save className='w-4 h-4' />
                {loading ? 'Guardando...' : 'Guardar foto'}
              </button>

              <button
                type='button'
                onClick={() => galleryInputRef.current?.click()}
                className='inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md border-border bg-background/80 hover:bg-background/90 disabled:opacity-60'
                aria-label='Elegir otra foto'
                disabled={loading}
              >
                <RotateCcw className='w-4 h-4' />
                Cambiar
              </button>

              <button
                type='button'
                onClick={clearPreview}
                className='inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 border border-red-200 rounded-md bg-red-50 hover:bg-red-100 disabled:opacity-60 dark:text-red-200 dark:border-red-800 dark:bg-red-950/40'
                aria-label='Cancelar cambio de foto'
                disabled={loading}
              >
                <X className='w-4 h-4' />
                Cancelar
              </button>
            </div>
          )}

          <p className='max-w-xs text-xs text-center text-muted-foreground'>
            Desde el celular podés subir una imagen o sacar una foto con la cámara.
            Revisá la vista previa antes de guardar.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`max-w-xs text-xs text-center ${
            message.type === 'error' ? 'text-red-500' : 'text-green-600'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
