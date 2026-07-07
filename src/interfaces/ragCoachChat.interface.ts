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

export interface RagCoachChatRequest {
  message: string;
  socio_id?: string;
  conversationContext?: Record<string, unknown>;
}

export interface RagCoachChatSource {
  title: string;
  domain?: string;
  sourceTable?: string;
  similarity?: number;
  contentPreview?: string;
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
}

export interface RagCoachChatApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
  data?: RagCoachChatResponseData;
}
