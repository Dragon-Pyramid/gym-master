export type RagRutinasIdioma = 'es' | 'en';

export interface RagRutinasAssistantRequest {
  objetivo: number;
  nivel: number;
  dias: number;
  idioma?: RagRutinasIdioma;
  mensajeSocio?: string;
  restricciones?: string;
  id_socio?: string;
}

export interface RagRutinasParametrosFinales {
  objetivo: number;
  nivel: number;
  dias: number;
  idioma: RagRutinasIdioma;
}

export interface RagRutinasContextResult {
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

export interface RagRutinasContextSummary {
  enabled: boolean;
  used: boolean;
  query: string;
  provider?: string;
  model?: string;
  matchThreshold?: number;
  matchCount?: number;
  results: RagRutinasContextResult[];
  summary: string;
  warnings: string[];
}

export interface RagRutinasAssistantResponseData {
  modo: 'external_rag_bridge' | 'internal_rag' | 'local_fallback';
  ragConfigurado: boolean;
  rutinaGenerada: unknown;
  parametros: RagRutinasParametrosFinales;
  mensajeFinal: string;
  resumen: string;
  advertencias: string[];
  ragContext?: RagRutinasContextSummary;
  ragRespuesta?: unknown;
  ragError?: string;
}

export interface RagRutinasAssistantApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
  data?: RagRutinasAssistantResponseData;
}
