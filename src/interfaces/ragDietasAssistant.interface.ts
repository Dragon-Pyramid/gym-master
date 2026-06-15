import type { Dieta } from './dieta.interface';

export type RagDietasIdioma = 'es' | 'en';

export interface RagDietasAssistantRequest {
  socio_id: string;
  objetivo: string | number;
  fecha_inicio: string;
  fecha_fin: string;
  idioma?: RagDietasIdioma;
  mensajeSocio?: string;
  restricciones?: string;
  preferencias?: string;
}

export interface RagDietasContextResult {
  chunkId: string;
  documentId: string;
  title: string;
  sourceId: string;
  sourceTable: string;
  domain: string;
  content: string;
  metadata: Record<string, unknown>;
  documentMetadata: Record<string, unknown>;
  similarity: number;
}

export interface RagDietasContextSummary {
  enabled: boolean;
  used: boolean;
  query: string;
  provider?: string;
  model?: string;
  matchThreshold?: number;
  matchCount?: number;
  results: RagDietasContextResult[];
  summary: string;
  disclaimers: string[];
  warnings: string[];
}

export interface RagDietasAssistantResponseData {
  modo: 'internal_rag' | 'local_fallback';
  ragConfigurado: boolean;
  dietaGenerada: Dieta;
  parametros: {
    socio_id: string;
    objetivo: string | number;
    fecha_inicio: string;
    fecha_fin: string;
    idioma: RagDietasIdioma;
  };
  mensajeFinal: string;
  resumen: string;
  advertencias: string[];
  disclaimers: string[];
  ragContext?: RagDietasContextSummary;
}

export interface RagDietasAssistantApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
  data?: RagDietasAssistantResponseData;
}
