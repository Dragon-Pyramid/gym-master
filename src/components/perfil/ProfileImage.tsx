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
}: {
  foto?: string | null;
  src?: string | null;
  alt?: string;
  size?: number;
  onUpload?: (data: any) => void;
}) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(
    foto ?? src ?? '/default-avatar.png'
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
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Error al subir archivo',
      });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const imageSrc = currentSrc ?? '/default-avatar.png';
  const isExternal =
    typeof imageSrc === 'string' && /^https?:\/\//i.test(imageSrc);

  return (
    <div className='flex flex-col items-center gap-2'>
      <div
        className='relative flex-shrink-0 overflow-hidden rounded-full ring-1 ring-border/60 dark:ring-border/40'
        style={{ width: size, height: size }}
      >
        <Image
          src={imageSrc}
          alt={alt ?? 'Avatar'}
          width={size}
          height={size}
          className='object-cover w-full h-full rounded-full bg-muted'
          unoptimized={isExternal}
        />
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <button
        type='button'
        onClick={() => inputRef.current?.click()}
        className='px-3 py-1 text-sm border rounded-md border-border bg-background/80 hover:bg-background/90 disabled:opacity-60'
        aria-label='Cambiar imagen'
        disabled={loading}
      >
        {loading ? '...' : 'Cambiar imagen'}
      </button>
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
