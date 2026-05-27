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

export interface RagRutinasAssistantResponseData {
  modo: 'rag_bridge' | 'local_fallback';
  ragConfigurado: boolean;
  rutinaGenerada: unknown;
  parametros: RagRutinasParametrosFinales;
  mensajeFinal: string;
  resumen: string;
  advertencias: string[];
  ragRespuesta?: unknown;
  ragError?: string;
}

export interface RagRutinasAssistantApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
  data?: RagRutinasAssistantResponseData;
}
