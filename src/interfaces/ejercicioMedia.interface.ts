export type EjercicioMediaTipo = 'imagen' | 'gif' | 'video' | 'youtube' | 'thumbnail';
export type EjercicioMediaOrigen = 'cloudinary' | 'youtube' | 'externa' | 'local' | 'fallback';

export interface EjercicioMediaItem {
  id: string;
  id_ejercicio: number;
  tipo_media: EjercicioMediaTipo;
  origen: EjercicioMediaOrigen;
  url: string;
  cloudinary_public_id?: string | null;
  youtube_url?: string | null;
  youtube_video_id?: string | null;
  titulo?: string | null;
  descripcion?: string | null;
  es_principal: boolean;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface EjercicioMediaCatalogItem {
  id_ejercicio: number;
  nombre_ejercicio: string;
  nombre_en?: string | null;
  descripcion?: string | null;
  id_objetivo: number;
  id_nivel: number;
  id_gm: number;
  objetivo_nombre?: string | null;
  nivel_nombre?: string | null;
  grupo_muscular_nombre?: string | null;
  imagen?: string | null;
  imagen_origen?: EjercicioMediaOrigen | string | null;
  cloudinary_public_id?: string | null;
  video_youtube_url?: string | null;
  youtube_video_id?: string | null;
  media_actualizada_en?: string | null;
  activo: boolean;
  media: EjercicioMediaItem[];
  media_principal?: EjercicioMediaItem | null;
  youtube_principal?: EjercicioMediaItem | null;
}

export interface EjercicioMediaCatalogResponse {
  data: EjercicioMediaCatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  resumen: {
    total: number;
    conCloudinary: number;
    conYoutube: number;
    conFallback: number;
    pendientesCloudinary: number;
    pendientesYoutube: number;
  };
}

export interface EjercicioMediaUpdatePayload {
  id_ejercicio: number;
  imagen?: string | null;
  imagen_origen?: EjercicioMediaOrigen | string | null;
  cloudinary_public_id?: string | null;
  video_youtube_url?: string | null;
  youtube_video_id?: string | null;
  titulo?: string | null;
  descripcion_media?: string | null;
}
