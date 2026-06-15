import type { EvolucionSocio } from './evolucionSocio.interface';

export type RagEvolucionFisicaIdioma = 'es' | 'en';

export interface RagEvolucionFisicaAssistantRequest {
  socio_id?: string;
  idioma?: RagEvolucionFisicaIdioma;
  mensajeSocio?: string;
  objetivo?: string;
  restricciones?: string;
}

export interface RagEvolucionFisicaMetricDelta {
  inicial: number | null;
  actual: number | null;
  diferencia: number | null;
  porcentajeCambio: number | null;
}

export interface RagEvolucionFisicaProgressSummary {
  totalRegistros: number;
  fechaInicial: string | null;
  fechaActual: string | null;
  diasAnalizados: number | null;
  peso: RagEvolucionFisicaMetricDelta;
  cintura: RagEvolucionFisicaMetricDelta;
  imc: RagEvolucionFisicaMetricDelta;
  porcentajeGrasa: RagEvolucionFisicaMetricDelta;
  masaMuscular: RagEvolucionFisicaMetricDelta;
  tendenciaPrincipal: string;
}

export interface RagEvolucionFisicaContextResult {
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

export interface RagEvolucionFisicaContextSummary {
  enabled: boolean;
  used: boolean;
  query: string;
  provider?: string;
  model?: string;
  matchThreshold?: number;
  matchCount?: number;
  results: RagEvolucionFisicaContextResult[];
  summary: string;
  warnings: string[];
}

export interface RagEvolucionFisicaAssistantResponseData {
  modo: 'internal_rag' | 'local_fallback';
  ragConfigurado: boolean;
  socio_id: string;
  parametros: {
    idioma: RagEvolucionFisicaIdioma;
    objetivo?: string;
  };
  registrosAnalizados: EvolucionSocio[];
  progreso: RagEvolucionFisicaProgressSummary;
  resumen: string;
  recomendaciones: string[];
  alertas: string[];
  disclaimers: string[];
  ragContext?: RagEvolucionFisicaContextSummary;
}

export interface RagEvolucionFisicaAssistantApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
  data?: RagEvolucionFisicaAssistantResponseData;
}
