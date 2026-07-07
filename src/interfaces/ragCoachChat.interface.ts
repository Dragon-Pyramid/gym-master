export type RagCoachChatIntent =
  | 'routine_request'
  | 'diet_request'
  | 'routine_and_diet_request'
  | 'evolution_analysis_request'
  | 'general_guidance'
  | 'unknown';

export type RagCoachChatActionType =
  | 'routine_generated'
  | 'diet_generated'
  | 'evolution_analyzed'
  | 'guidance_only';

export interface RagCoachConversationMemoryMessage {
  role: 'assistant' | 'user';
  content: string;
  intent?: RagCoachChatIntent;
}

export interface RagCoachConversationMemory {
  recentMessages?: RagCoachConversationMemoryMessage[];
  lastAssistantIntent?: RagCoachChatIntent;
  lastActionTypes?: RagCoachChatActionType[];
  lastSuggestedReplies?: string[];
  pendingMissingParams?: string[];
  lastNextBestStep?: string;
  lastContextSummary?: string;
}

export interface RagCoachChatRequest {
  message: string;
  socio_id?: string;
  conversationContext?: RagCoachConversationMemory;
}

export interface RagCoachChatSource {
  title: string;
  domain?: string;
  sourceTable?: string;
  similarity?: number;
  contentPreview?: string;
}

export interface RagCoachContextSnapshot {
  socioName?: string | null;
  nivelLabel?: string;
  objetivoLabel?: string;
  diasPorSemana?: number | null;
  rutinasTotal: number;
  ultimaRutina?: string | null;
  dietasTotal: number;
  ultimaDietaObjetivo?: string | null;
  evolucionTotal: number;
  ultimaEvolucionFecha?: string | null;
  ultimoPeso?: number | null;
  ultimaCintura?: number | null;
  asistencia7Dias: number;
  asistencia30Dias: number;
  fichaMedicaExiste: boolean;
  restriccionesMedicas: number;
  aprobacionMedica?: boolean | null;
  readinessScore: number;
  readinessLabel: string;
}

export interface RagCoachChatActionResult {
  type: RagCoachChatActionType;
  ok: boolean;
  title: string;
  message: string;
  viewPath?: string;
  viewLabel?: string;
  payload?: unknown;
  ragSummary?: string;
  sources?: RagCoachChatSource[];
  warnings?: string[];
  safetyNotes?: string[];
}

export interface RagCoachChatResponseData {
  greeting: string;
  intent: RagCoachChatIntent;
  reply: string;
  actions: RagCoachChatActionResult[];
  suggestedReplies: string[];
  missingParams: string[];
  coachNotes: string[];
  contextSummary?: string;
  contextHints?: string[];
  nextBestStep?: string;
  safetySummary?: string;
  contextSnapshot?: RagCoachContextSnapshot;
  memoryHighlights?: string[];
  memoryTrace?: string[];
  contextConfidence?: 'alta' | 'media' | 'baja';
}

export interface RagCoachChatApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
  data?: RagCoachChatResponseData;
}
