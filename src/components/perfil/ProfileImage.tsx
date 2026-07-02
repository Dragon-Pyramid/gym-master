'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RotateCcw, Save, X } from 'lucide-react';
import { uploadFile } from '@/services/apiClient';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const DEFAULT_PROFILE_IMAGE = '/gm_logo.svg';

export default function ProfileImage({
  foto,
  src,
  alt,
  size = 96,
  onUpload,
  showButton = true,
  onClick,
  tone = 'default',
}: {
  foto?: string | null;
  src?: string | null;
  alt?: string;
  size?: number;
  onUpload?: (data: any) => void;
  showButton?: boolean;
  onClick?: () => void;
  tone?: 'default' | 'onDark';
}) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(
    foto ?? src ?? null
  );
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setCurrentSrc(foto ?? src ?? null);
    setImageLoadError(false);
  }, [foto, src]);

  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return;

    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => {
      setCameraError('No se pudo iniciar la vista previa de la cámara.');
    });
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    setCameraLoading(false);
    setCameraError(null);
  };

  const startCamera = async () => {
    setMessage(null);
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMessage({
        type: 'error',
        text: 'Tu navegador no permite abrir la cámara desde la web. Se abrirá el selector de cámara/galería del dispositivo.',
      });
      cameraInputRef.current?.click();
      return;
    }

    setCameraLoading(true);

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch (error) {
      const browserMessage =
        error instanceof Error && error.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Revisá los permisos del navegador.'
          : 'No se pudo abrir la cámara. Se abrirá el selector del dispositivo como alternativa.';

      setCameraError(browserMessage);
      setMessage({ type: 'error', text: browserMessage });
      cameraInputRef.current?.click();
    } finally {
      setCameraLoading(false);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setCameraError('La cámara todavía no está lista para capturar.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('No se pudo preparar la captura de imagen.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    );

    if (!blob) {
      setCameraError('No se pudo generar la foto capturada.');
      return;
    }

    const file = new File([blob], `perfil-camara-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    stopCamera();
    handleSelectedFile(file);
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

  const imageSrc = imageLoadError
    ? DEFAULT_PROFILE_IMAGE
    : previewSrc || currentSrc || DEFAULT_PROFILE_IMAGE;

  const helperTextClass =
    tone === 'onDark' ? 'text-slate-200/85' : 'text-muted-foreground';

  const successTextClass =
    tone === 'onDark' ? 'text-emerald-300' : 'text-green-600';

  const errorTextClass = tone === 'onDark' ? 'text-rose-300' : 'text-red-500';

  return (
    <div className='flex flex-col items-center gap-3' onClick={onClick}>
      <div
        className='relative flex items-center justify-center flex-shrink-0 overflow-hidden rounded-full ring-1 ring-border/60 dark:ring-border/40 bg-muted'
        style={{ width: size, height: size }}
      >
        {/* Se usa img para soportar previews locales tipo blob: en móviles. */}
        <img
          src={imageSrc}
          alt={alt ?? 'Avatar'}
          width={size}
          height={size}
          className='object-cover w-full h-full rounded-full bg-white p-1 dark:bg-white'
          onError={() => setImageLoadError(true)}
        />

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
                disabled={loading || cameraLoading}
              >
                <ImagePlus className='w-4 h-4' />
                Subir foto
              </button>

              <button
                type='button'
                onClick={startCamera}
                className='inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-60'
                aria-label='Sacar foto con la cámara'
                disabled={loading || cameraLoading}
              >
                <Camera className='w-4 h-4' />
                {cameraLoading ? 'Abriendo cámara...' : 'Sacar foto'}
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

          <p className={`max-w-xs text-center text-xs ${helperTextClass}`}>
            Desde el celular podés subir una imagen desde la galería o abrir la cámara para sacar una foto nueva.
            Revisá la vista previa antes de guardar.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`max-w-xs text-center text-xs ${
            message.type === 'error' ? errorTextClass : successTextClass
          }`}
        >
          {message.text}
        </div>
      )}

      {cameraOpen && (
        <div className='fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6'>
          <div className='w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl'>
            <div className='flex items-center justify-between border-b border-border px-4 py-3'>
              <div>
                <h3 className='text-base font-semibold'>Sacar foto de perfil</h3>
                <p className='text-xs text-muted-foreground'>
                  Ubicá tu rostro dentro del recuadro y capturá la imagen.
                </p>
              </div>
              <button
                type='button'
                onClick={stopCamera}
                className='rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground'
                aria-label='Cerrar cámara'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='bg-black'>
              <video
                ref={videoRef}
                className='aspect-square w-full object-cover'
                playsInline
                muted
                autoPlay
              />
              <canvas ref={canvasRef} className='hidden' />
            </div>

            {cameraError && (
              <div className='px-4 pt-3 text-sm text-red-500'>{cameraError}</div>
            )}

            <div className='flex flex-wrap items-center justify-end gap-2 px-4 py-4'>
              <button
                type='button'
                onClick={stopCamera}
                className='rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={capturePhoto}
                className='inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700'
              >
                <Camera className='h-4 w-4' />
                Capturar foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
