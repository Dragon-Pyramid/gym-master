'use client';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { uploadFile } from '@/services/apiClient';

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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = (file: File | null) => {
    if (!file) return 'No se seleccionó archivo';
    if (file.size > 5 * 1024 * 1024) return 'El archivo debe ser menor a 5MB';
    const validTypes = /^image\/(png|jpe?g|webp|gif|svg\+xml)$/;
    if (!validTypes.test(file.type)) return 'Tipo de archivo no válido';
    return null;
  };

  const handleFile = async (f: File | null) => {
    setMessage(null);
    if (!f) return;
    const validationError = validateFile(f);
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }
    setLoading(true);
    try {
      const res = await uploadFile(f, 'file', '/api/file-upload');
      if (res.ok) {
        const url = res.data?.url || res.data?.path || res.data?.key || null;
        if (url) {
          setCurrentSrc(url);
        }
        setMessage({ type: 'success', text: 'Imagen subida correctamente' });
        if (onUpload) onUpload(res.data);
      } else {
        setMessage({
          type: 'error',
          text: res.data?.message || 'Error al subir archivo',
        });
      }
    } catch (error: unknown) {
      const errObj =
        error && typeof error === 'object'
          ? (error as Record<string, unknown>)
          : null;
      const text =
        (errObj && typeof errObj.message === 'string' && errObj.message) ||
        'Error al subir archivo';
      setMessage({
        type: 'error',
        text,
      });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const imageSrc = currentSrc;
  const isExternal =
    typeof imageSrc === 'string' && /^https?:\/\//i.test(imageSrc ?? '');

  const getInitial = () => {
    const name = alt || '';
    const trimmed = name.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase();
  };

  return (
    <div className='flex flex-col items-center gap-2' onClick={onClick}>
      <div
        className='relative flex items-center justify-center flex-shrink-0 overflow-hidden rounded-full ring-1 ring-border/60 dark:ring-border/40'
        style={{ width: size, height: size }}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={alt ?? 'Avatar'}
            width={size}
            height={size}
            className='object-cover w-full h-full rounded-full bg-muted'
            unoptimized={isExternal}
          />
        ) : (
          <div className='flex items-center justify-center w-full h-full text-xl font-semibold text-white bg-indigo-600 rounded-full'>
            {getInitial()}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {showButton && (
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          className='px-3 py-1 text-sm border rounded-md border-border bg-background/80 hover:bg-background/90 disabled:opacity-60'
          aria-label='Cambiar imagen'
          disabled={loading}
        >
          {loading ? '...' : 'Cambiar imagen'}
        </button>
      )}
      {message && (
        <div
          className={`text-xs ${
            message.type === 'error' ? 'text-red-500' : 'text-green-500'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
