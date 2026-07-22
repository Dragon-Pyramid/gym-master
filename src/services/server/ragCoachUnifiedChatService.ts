import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type {
  RagCoachChatActionResult,
  RagCoachChatIntent,
  RagCoachConversationMemory,
  RagCoachChatRequest,
  RagCoachChatResponseData,
  RagCoachChatSource,
  RagCoachQualityAudit,
  RagCoachQualityCheckItem,
} from '@/interfaces/ragCoachChat.interface';
import { dataGeneracionRutina } from '@/services/rutinaService';
import { createDietaSocio } from '@/services/dietaService';
import { findAllEvolucionesSocioByIdSocio } from '@/services/evolucionSocioService';
import { buildRutinasRagContext } from './ragRutinasCoachService';
import { buildDietasRagContext } from './ragDietasCoachService';
import { analyzeEvolucionFisicaWithRag } from './ragEvolucionFisicaCoachService';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { buildRagCoachSocioContext, type RagCoachSocioContext } from './ragCoachSocioContextService';
import {
  aiGeneratedContentTx,
  normalizeAiGeneratedContentLocale,
  translateAiGeneratedTechnicalList,
  translateAiGeneratedTechnicalText,
  type AiGeneratedContentLocale,
} from '@/utils/aiGeneratedContentI18n';

const MAX_MESSAGE_LENGTH = 1600;
const MAX_SOURCES_PER_ACTION = 4;
const MAX_MEMORY_MESSAGES = 8;

const AFFIRMATIVE_FOLLOW_UP_RE = /^(si|sí|dale|ok|perfecto|hacelo|hazlo|quiero eso|generala|generalo|armala|armalo|preparala|preparalo|tambien|también)$/;


function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(value: unknown, maxLength = MAX_MESSAGE_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function isAdminRole(role?: string | null) {
  const normalized = role?.trim().toLowerCase();
  return normalized === 'admin' || normalized === 'administrador';
}

function isValidUuid(value?: string | null): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

async function resolveSocioId(user: JwtUser, requested?: string | null) {
  const cleanRequested = cleanText(requested);

  if (isValidUuid(cleanRequested)) {
    return cleanRequested.trim();
  }

  if (isValidUuid(user.id_socio)) {
    return user.id_socio.trim();
  }

  if (!isAdminRole(user.rol) && isValidUuid(user.id)) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('socio')
      .select('id_socio')
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('No se pudo resolver id_socio para Coach IA:', error.message);
    }

    if (isValidUuid(data?.id_socio)) {
      return data.id_socio.trim();
    }
  }

  return '';
}

function getDisplayName(user: JwtUser, locale: AiGeneratedContentLocale = 'es') {
  return cleanText(user.nombre, 80) || cleanText(user.email, 80) || aiGeneratedContentTx(locale, 'socio', 'member');
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function sanitizeMemoryText(value: unknown, maxLength = 280) {
  return cleanText(value, maxLength);
}

function sanitizeConversationMemory(value: unknown): RagCoachConversationMemory {
  if (!value || typeof value !== 'object') return {};
  const raw = value as Record<string, unknown>;
  const recentMessages = safeArray<Record<string, unknown>>(raw.recentMessages)
    .slice(-MAX_MEMORY_MESSAGES)
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: sanitizeMemoryText(item.content),
      intent: typeof item.intent === 'string' ? item.intent as RagCoachChatIntent : undefined,
    }))
    .filter((item) => item.content.length > 0);

  return {
    recentMessages,
    lastAssistantIntent: typeof raw.lastAssistantIntent === 'string' ? raw.lastAssistantIntent as RagCoachChatIntent : undefined,
    lastActionTypes: safeArray<string>(raw.lastActionTypes)
      .filter((item): item is RagCoachChatActionResult['type'] => ['routine_generated', 'diet_generated', 'evolution_analyzed', 'guidance_only'].includes(item)),
    lastSuggestedReplies: safeArray<string>(raw.lastSuggestedReplies).map((item) => sanitizeMemoryText(item, 120)).filter(Boolean).slice(0, 4),
    pendingMissingParams: safeArray<string>(raw.pendingMissingParams).map((item) => sanitizeMemoryText(item, 60)).filter(Boolean).slice(0, 6),
    lastNextBestStep: sanitizeMemoryText(raw.lastNextBestStep, 180) || undefined,
    lastContextSummary: sanitizeMemoryText(raw.lastContextSummary, 220) || undefined,
  };
}

function hasPriorAction(memory: RagCoachConversationMemory, actionType: RagCoachChatActionResult['type']) {
  return (memory.lastActionTypes ?? []).includes(actionType);
}

function resolveIntentWithMemory(message: string, detectedIntent: RagCoachChatIntent, memory: RagCoachConversationMemory): RagCoachChatIntent {
  const text = normalize(message);

  if (detectedIntent !== 'general_guidance' && detectedIntent !== 'unknown') return detectedIntent;

  if (/\b(que hago hoy|hoy que hago|que me toca hoy|plan de hoy|seguimos|continuemos)\b/.test(text)) {
    if (hasPriorAction(memory, 'routine_generated')) return 'routine_request';
    if (memory.lastAssistantIntent === 'routine_request') return 'routine_request';
  }

  if (AFFIRMATIVE_FOLLOW_UP_RE.test(text)) {
    if (memory.lastSuggestedReplies?.some((reply) => normalize(reply).includes('dieta'))) return 'diet_request';
    if (hasPriorAction(memory, 'routine_generated') && !hasPriorAction(memory, 'diet_generated')) return 'diet_request';
    if (memory.lastAssistantIntent === 'general_guidance' || memory.lastAssistantIntent === 'unknown') return 'routine_request';
  }

  if (/\b(esa dieta|la dieta|alimentacion complementaria|acompañar la rutina|acompanar la rutina)\b/.test(text)) return 'diet_request';
  if (/\b(esa rutina|mi rutina|la rutina|entrenamiento de hoy)\b/.test(text)) return 'routine_request';
  if (/\b(mi progreso|como voy|sigo igual|estoy igual|avance)\b/.test(text)) return 'evolution_analysis_request';

  return detectedIntent;
}

function buildMemoryTrace(memory: RagCoachConversationMemory, intent: RagCoachChatIntent, context?: RagCoachSocioContext | null, locale: AiGeneratedContentLocale = 'es') {
  const trace: string[] = [];

  if ((memory.recentMessages ?? []).length > 0) {
    trace.push(aiGeneratedContentTx(locale, `Se usaron ${memory.recentMessages?.length ?? 0} mensaje(s) recientes de esta conversación.`, `${memory.recentMessages?.length ?? 0} recent message(s) from this conversation were used.`));
  }
  if (memory.lastAssistantIntent) trace.push(aiGeneratedContentTx(locale, `Última intención recordada: ${memory.lastAssistantIntent}.`, `Last remembered intent: ${memory.lastAssistantIntent}.`));
  if ((memory.pendingMissingParams ?? []).length > 0) trace.push(aiGeneratedContentTx(locale, `Parámetros pendientes recordados: ${memory.pendingMissingParams?.join(', ')}.`, `Remembered pending parameters: ${memory.pendingMissingParams?.join(', ')}.`));
  if (context?.contextSnapshot) trace.push(aiGeneratedContentTx(locale, `${context.contextSnapshot.readinessLabel}: ${context.contextSnapshot.readinessScore}% de contexto operativo disponible.`, `${context.contextSnapshot.readinessLabel}: ${context.contextSnapshot.readinessScore}% operational context available.`));
  if ((context?.recommendedFocus ?? []).length > 0) trace.push(aiGeneratedContentTx(locale, `Foco sugerido: ${context?.recommendedFocus.slice(0, 3).join(', ')}.`, `Suggested focus: ${context?.recommendedFocus.slice(0, 3).join(', ')}.`));
  trace.push(aiGeneratedContentTx(locale, `Intención final aplicada: ${intent}.`, `Final intent applied: ${intent}.`));

  return uniqueValues(trace).slice(0, 6);
}

function buildContextConfidence(context?: RagCoachSocioContext | null): 'alta' | 'media' | 'baja' {
  const score = context?.contextSnapshot?.readinessScore ?? 0;
  if (score >= 75) return 'alta';
  if (score >= 45) return 'media';
  return 'baja';
}

function buildContextualReplyPrefix(context?: RagCoachSocioContext | null, locale: AiGeneratedContentLocale = 'es') {
  if (!context?.memoryHighlights.length) return '';
  return aiGeneratedContentTx(
    locale,
    `Tomé como memoria del socio: ${context.memoryHighlights.slice(0, 3).join(' ')}`,
    `I used this as member memory: ${context.memoryHighlights.slice(0, 3).join(' ')}`,
  );
}

function detectIntent(message: string): RagCoachChatIntent {
  const text = normalize(message);
  const wantsRoutine = /\b(rutina|entrenar|entrenamiento|ejercicios?|gimnasio|fuerza|masa muscular|hipertrofia|volumen)\b/.test(text);
  const wantsDiet = /\b(dieta|comer|comida|alimentacion|alimentarme|nutricion|bajar grasa|adelgazar|definicion|sin lactosa|proteina)\b/.test(text);
  const wantsEvolution = /\b(evolucion|progreso|medidas?|peso|cintura|grasa|masa muscular|estancado|avance|seguimiento)\b/.test(text);

  if (wantsRoutine && wantsDiet) return 'routine_and_diet_request';
  if (wantsEvolution && !wantsRoutine && !wantsDiet) return 'evolution_analysis_request';
  if (wantsRoutine) return 'routine_request';
  if (wantsDiet) return 'diet_request';
  if (text.length >= 3) return 'general_guidance';
  return 'unknown';
}

function inferObjective(message: string, context?: RagCoachSocioContext | null) {
  const text = normalize(message);
  if (/\b(definicion|definir|marcar|bajar grasa|quemar grasa)\b/.test(text)) return 2;
  if (/\b(bajar de peso|adelgazar|perder peso)\b/.test(text)) return 3;
  if (/\b(fuerza|mas fuerte|levantar mas)\b/.test(text)) return 4;
  if (/\b(resistencia|cardio|aguante)\b/.test(text)) return 5;
  if (/\b(rehabilitacion|recuperacion|lesion)\b/.test(text)) return 6;
  if (/\b(salud|sentirme mejor|bienestar)\b/.test(text)) return 7;
  if (/\b(estres|antiestr[eé]s|estresado)\b/.test(text)) return 10;
  return context?.socio?.objetivo ?? 1;
}

function inferLevel(message: string, context?: RagCoachSocioContext | null) {
  const text = normalize(message);
  if (/\b(avanzado|experto|mucho tiempo|anos entrenando|años entrenando)\b/.test(text)) return 3;
  if (/\b(intermedio|algo de experiencia|hace meses)\b/.test(text)) return 2;
  return context?.socio?.nivel ?? 1;
}

function inferDays(message: string, context?: RagCoachSocioContext | null) {
  const text = normalize(message);
  const direct = text.match(/(?:^|\D)([1-6])\s*(?:dias?|veces|entrenamientos?)(?:\s+por\s+semana)?(?:\D|$)/);
  if (direct?.[1]) return Number(direct[1]);

  const wordMap: Record<string, number> = {
    un: 1,
    una: 1,
    uno: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
  };

  for (const [word, value] of Object.entries(wordMap)) {
    if (new RegExp(`\\b${word}\\s+(dias?|veces|entrenamientos?)\\b`).test(text)) return value;
  }

  return context?.socio?.diasPorSemana ?? 3;
}

function inferRestrictions(message: string, locale: AiGeneratedContentLocale = 'es') {
  const text = normalize(message);
  const restrictions: string[] = [];

  if (/\b(rodilla|menisco|ligamento)\b/.test(text)) restrictions.push(aiGeneratedContentTx(locale, 'Cuidar rodilla y evitar impacto alto.', 'Protect the knee and avoid high-impact work.'));
  if (/\b(hombro|manguito)\b/.test(text)) restrictions.push(aiGeneratedContentTx(locale, 'Cuidar hombro y evitar cargas agresivas sobre cabeza.', 'Protect the shoulder and avoid aggressive overhead loading.'));
  if (/\b(espalda|lumbar|hernia|ciatico)\b/.test(text)) restrictions.push(aiGeneratedContentTx(locale, 'Cuidar zona lumbar y priorizar técnica controlada.', 'Protect the lower back and prioritize controlled technique.'));
  if (/\b(hipertension|presion alta|cardiopatia|corazon)\b/.test(text)) restrictions.push(aiGeneratedContentTx(locale, 'Validar intensidad con profesional de salud por condición cardiovascular declarada.', 'Validate intensity with a healthcare professional due to the declared cardiovascular condition.'));
  if (/\b(diabetes|glucemia|insulina)\b/.test(text)) restrictions.push(aiGeneratedContentTx(locale, 'Validar pauta alimentaria con profesional por condición glucémica declarada.', 'Validate nutrition guidelines with a professional due to the declared glucose-related condition.'));

  return restrictions.join(' | ');
}

function mergeRestrictions(messageRestrictions: string, context?: RagCoachSocioContext | null) {
  const values = [
    messageRestrictions,
    ...(context?.fichaMedica.restriccionesSeguras ?? []),
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(values)).join(' | ');
}

function getContextCoachLine(context?: RagCoachSocioContext | null) {
  if (!context) return '';
  return context.resumenHumano;
}

function buildSafetyNotes(message: string, intent: RagCoachChatIntent, context?: RagCoachSocioContext | null, locale: AiGeneratedContentLocale = 'es') {
  const text = normalize(message);
  const notes: string[] = [];

  if (/\b(dolor de pecho|pecho|desmayo|desmayos|taquicardia|mareo fuerte|falta de aire)\b/.test(text)) {
    notes.push(aiGeneratedContentTx(locale, 'Se detectó una posible señal sensible. No conviene intensificar entrenamiento ni dieta sin evaluación profesional.', 'A possible sensitive signal was detected. Training or diet should not be intensified without professional evaluation.'));
  }

  if (/\b(diabetes|glucemia|insulina|hipertension|presion alta|cardiopatia|embarazo|trastorno alimentario|anorexia|bulimia)\b/.test(text)) {
    notes.push(aiGeneratedContentTx(locale, 'El pedido menciona una condición clínica o nutricional sensible. El Coach solo puede orientar de forma general y debe intervenir un profesional.', 'The request mentions a sensitive clinical or nutritional condition. The Coach can only provide general guidance and a professional should be involved.'));
  }

  if (/\b(lesion|lesionado|dolor|hernia|rodilla|hombro|lumbar|espalda)\b/.test(text)) {
    notes.push(aiGeneratedContentTx(locale, 'Se detectó posible lesión o dolor. Priorizar técnica, progresión conservadora y supervisión profesional.', 'Possible injury or pain detected. Prioritize technique, conservative progression, and professional supervision.'));
  }

  if (intent === 'diet_request' || intent === 'routine_and_diet_request') {
    notes.push(aiGeneratedContentTx(locale, 'La dieta generada es orientativa y no reemplaza una evaluación nutricional individual.', 'The generated diet is for guidance only and does not replace an individual nutrition assessment.'));
  }

  if ((context?.fichaMedica.restriccionesSeguras ?? []).length > 0) {
    notes.push(aiGeneratedContentTx(locale, 'Se aplicaron restricciones seguras registradas en la ficha médica del socio.', "Safe restrictions recorded in the member\'s medical record were applied."));
  }

  return uniqueValues(notes);
}

function hasExplicitObjective(message: string) {
  const text = normalize(message);
  return /\b(ganar masa|masa muscular|hipertrofia|bajar grasa|definicion|definir|bajar de peso|adelgazar|fuerza|resistencia|rehabilitacion|salud|bienestar|estres)\b/.test(text);
}

function hasExplicitLevel(message: string) {
  const text = normalize(message);
  return /\b(inicial|principiante|intermedio|avanzado|experto|hace meses|anos entrenando|años entrenando)\b/.test(text);
}

function hasExplicitDays(message: string) {
  const text = normalize(message);
  return /(?:^|\D)([1-6])\s*(?:dias?|veces|entrenamientos?)(?:\s+por\s+semana)?(?:\D|$)/.test(text)
    || /\b(un|una|uno|dos|tres|cuatro|cinco|seis)\s+(dias?|veces|entrenamientos?)\b/.test(text);
}

function shouldBlockDietAutomationForQuality(message: string) {
  const text = normalize(message);
  return /\b(anorexia|bulimia|trastorno alimentario|tca|dejar de comer|no quiero comer|ayuno extremo|dieta extrema|800 calorias|800 kcal|1000 calorias|1000 kcal|bajar 10 kilos en una semana)\b/.test(text);
}

function qualityStatusLabel(score: number, blocked: boolean, locale: AiGeneratedContentLocale = 'es') {
  if (blocked) return aiGeneratedContentTx(locale, 'Bloqueado por seguridad', 'Blocked for safety');
  if (score >= 85) return aiGeneratedContentTx(locale, 'Calidad alta', 'High quality');
  if (score >= 65) return aiGeneratedContentTx(locale, 'Calidad aceptable con advertencias', 'Acceptable quality with warnings');
  return aiGeneratedContentTx(locale, 'Requiere más datos', 'More data required');
}

function buildQualityAudit(params: {
  domain: RagCoachQualityAudit['domain'];
  message: string;
  context?: RagCoachSocioContext | null;
  sources?: RagCoachChatSource[];
  warnings?: string[];
  safetyNotes?: string[];
  blocked?: boolean;
  locale?: AiGeneratedContentLocale;
}): RagCoachQualityAudit {
  const locale = params.locale ?? 'es';
  const checks: RagCoachQualityCheckItem[] = [];
  const hasSources = (params.sources ?? []).length > 0;
  const contextScore = params.context?.contextSnapshot?.readinessScore ?? 0;

  checks.push({
    label: aiGeneratedContentTx(locale, 'Grounding / fuentes', 'Grounding / sources'),
    status: hasSources ? 'passed' : 'warning',
    detail: hasSources
      ? aiGeneratedContentTx(locale, 'La respuesta recuperó fuentes RAG y las expone al socio.', 'The response retrieved RAG sources and exposes them to the member.')
      : aiGeneratedContentTx(locale, 'No hubo fuentes RAG visibles; se usa fallback formal y debe mantenerse el tono prudente.', 'There were no visible RAG sources; formal fallback is used and a cautious tone must be kept.'),
  });

  checks.push({
    label: aiGeneratedContentTx(locale, 'Contexto del socio', 'Member context'),
    status: contextScore >= 45 ? 'passed' : 'warning',
    detail: contextScore >= 45
      ? aiGeneratedContentTx(locale, `Se aplicó contexto operativo del socio con score ${contextScore}%.`, `Operational member context was applied with score ${contextScore}%.`)
      : aiGeneratedContentTx(locale, 'El contexto del socio es bajo; la respuesta debe pedir datos faltantes y evitar afirmaciones fuertes.', 'Member context is low; the response should ask for missing data and avoid strong claims.'),
  });

  if (params.domain === 'rutina') {
    const hasMinimumData = (hasExplicitObjective(params.message) || Boolean(params.context?.socio?.objetivo))
      && (hasExplicitLevel(params.message) || Boolean(params.context?.socio?.nivel))
      && (hasExplicitDays(params.message) || Boolean(params.context?.socio?.diasPorSemana));

    checks.push({
      label: aiGeneratedContentTx(locale, 'Datos mínimos de rutina', 'Minimum routine data'),
      status: hasMinimumData ? 'passed' : 'warning',
      detail: hasMinimumData
        ? aiGeneratedContentTx(locale, 'Objetivo, nivel y frecuencia semanal se detectaron desde el mensaje o el perfil del socio.', 'Goal, level, and weekly frequency were detected from the message or the member profile.')
        : aiGeneratedContentTx(locale, 'Faltan objetivo, nivel o frecuencia explícita; se aplicaron defaults seguros y conviene confirmar con el socio.', 'Goal, level, or explicit frequency are missing; safe defaults were applied and should be confirmed with the member.'),
    });
  }

  if (params.domain === 'dieta') {
    const hasNutritionObjective = hasExplicitObjective(params.message) || Boolean(params.context?.socio?.objetivo);

    checks.push({
      label: aiGeneratedContentTx(locale, 'Datos mínimos de dieta', 'Minimum diet data'),
      status: hasNutritionObjective ? 'passed' : 'warning',
      detail: hasNutritionObjective
        ? aiGeneratedContentTx(locale, 'La dieta quedó vinculada a un objetivo detectado o inferido desde el contexto del socio.', 'The diet was linked to a goal detected or inferred from the member context.')
        : aiGeneratedContentTx(locale, 'No hay objetivo nutricional claro; conviene pedir objetivo, restricciones y preferencias alimentarias.', 'There is no clear nutritional goal; ask for goal, restrictions, and food preferences.'),
    });

    checks.push({
      label: aiGeneratedContentTx(locale, 'Disclaimers nutricionales', 'Nutrition disclaimers'),
      status: 'passed',
      detail: aiGeneratedContentTx(locale, 'La respuesta mantiene advertencia de orientación general y no reemplazo profesional.', 'The response keeps the general guidance and non-replacement professional warning.'),
    });
  }

  const hasSafetySignals = (params.safetyNotes ?? []).length > 0 || (params.warnings ?? []).length > 0;
  checks.push({
    label: aiGeneratedContentTx(locale, 'Límites de seguridad', 'Safety limits'),
    status: params.blocked ? 'blocked' : hasSafetySignals ? 'warning' : 'passed',
    detail: params.blocked
      ? aiGeneratedContentTx(locale, 'Se bloqueó la acción automática por riesgo clínico/nutricional sensible.', 'The automatic action was blocked due to sensitive clinical/nutritional risk.')
      : hasSafetySignals
        ? aiGeneratedContentTx(locale, 'Se detectaron advertencias y la respuesta debe conservar límites prudentes.', 'Warnings were detected and the response must keep cautious limits.')
        : aiGeneratedContentTx(locale, 'No se detectaron señales sensibles en el pedido.', 'No sensitive signals were detected in the request.'),
  });

  checks.push({
    label: aiGeneratedContentTx(locale, 'Promesas y próximos pasos', 'Promises and next steps'),
    status: 'passed',
    detail: aiGeneratedContentTx(locale, 'La respuesta evita prometer resultados garantizados y propone un siguiente paso accionable.', 'The response avoids promising guaranteed results and proposes an actionable next step.'),
  });

  const score = Math.round(
    checks.reduce((total, check) => {
      if (check.status === 'passed') return total + 100;
      if (check.status === 'warning') return total + 65;
      return total;
    }, 0) / checks.length,
  );

  return {
    domain: params.domain,
    score,
    statusLabel: qualityStatusLabel(score, Boolean(params.blocked), locale),
    summary: aiGeneratedContentTx(
      locale,
      `${params.domain === 'rutina' ? 'Rutina' : params.domain === 'dieta' ? 'Dieta' : 'Orientación'} auditada con score ${score}%.`,
      `${params.domain === 'rutina' ? 'Routine' : params.domain === 'dieta' ? 'Diet' : 'Guidance'} audited with score ${score}%.`,
    ),
    checks,
  };
}

function buildQaSummary(actions: RagCoachChatActionResult[]) {
  const audits = actions.map((action) => action.qualityAudit).filter((item): item is RagCoachQualityAudit => Boolean(item));
  if (audits.length === 0) return undefined;
  return audits.map((audit) => `${audit.domain}: ${audit.score}% (${audit.statusLabel})`).join(' · ');
}

function shouldBlockAutomationForSafety(message: string) {
  const text = normalize(message);
  return /\b(dolor de pecho|desmayo|desmayos|falta de aire|mareo fuerte|taquicardia)\b/.test(text);
}

function buildContextAwareGuidance(
  name: string,
  message: string,
  context?: RagCoachSocioContext | null,
  memory?: RagCoachConversationMemory,
  locale: AiGeneratedContentLocale = 'es',
) {
  const base = buildGuidanceReply(name, message, context, locale);
  const contextLine = getContextCoachLine(context);
  const memoryLines = [
    memory?.lastNextBestStep ? aiGeneratedContentTx(locale, `Continuidad previa: ${memory.lastNextBestStep}`, `Previous continuity: ${memory.lastNextBestStep}`) : '',
    (memory?.pendingMissingParams ?? []).length > 0
      ? aiGeneratedContentTx(locale, `Datos pendientes ya detectados: ${(memory?.pendingMissingParams ?? []).join(', ')}.`, `Pending data already detected: ${(memory?.pendingMissingParams ?? []).join(', ')}.`)
      : '',
    memory?.lastContextSummary ? aiGeneratedContentTx(locale, `Contexto recordado: ${memory.lastContextSummary}`, `Remembered context: ${memory.lastContextSummary}`) : '',
  ].filter(Boolean);

  return [base, contextLine, ...memoryLines].filter(Boolean).join('\n\n');
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function routineViewMessage(locale: AiGeneratedContentLocale = 'es') {
  return aiGeneratedContentTx(locale, 'Podés verla desde Menú Personal → Asistente de Rutinas o desde tu historial de rutinas dentro del panel de socio.', 'You can view it from Personal Menu → Routine Assistant or from your routine history in the member panel.');
}

function dietViewMessage(locale: AiGeneratedContentLocale = 'es') {
  return aiGeneratedContentTx(locale, 'Podés verla desde Menú Personal → Asistente de Dietas / Dietas.', 'You can view it from Personal Menu → Diet Assistant / Diets.');
}

function evolutionViewMessage(locale: AiGeneratedContentLocale = 'es') {
  return aiGeneratedContentTx(locale, 'Podés volver a consultar tu seguimiento desde Menú Personal → Evolución Física.', 'You can check your follow-up again from Personal Menu → Physical Evolution.');
}

type RagContextResultLike = {
  title?: string;
  domain?: string;
  sourceTable?: string;
  similarity?: number;
  content?: string;
};

function mapRagSources(results?: RagContextResultLike[] | null): RagCoachChatSource[] {
  return (results ?? [])
    .slice(0, MAX_SOURCES_PER_ACTION)
    .map((result) => ({
      title: cleanText(result.title, 120) || 'Referencia RAG',
      domain: cleanText(result.domain, 60) || undefined,
      sourceTable: cleanText(result.sourceTable, 60) || undefined,
      similarity: typeof result.similarity === 'number' ? result.similarity : undefined,
      contentPreview: cleanText(result.content, 180) || undefined,
    }));
}

function buildFailedAction(
  type: RagCoachChatActionResult['type'],
  title: string,
  error: unknown,
  locale: AiGeneratedContentLocale = 'es',
): RagCoachChatActionResult {
  const message = error instanceof Error ? translateAiGeneratedTechnicalText(error.message, locale) : translateAiGeneratedTechnicalText('Error desconocido.', locale);
  return {
    type,
    ok: false,
    title,
    message: aiGeneratedContentTx(locale, `No pude completar esta acción automáticamente. Motivo: ${message}`, `I could not complete this action automatically. Reason: ${message}`),
    warnings: [message],
    safetyNotes: [aiGeneratedContentTx(locale, 'Podés intentar nuevamente o revisar el módulo correspondiente desde el menú.', 'You can try again or review the corresponding module from the menu.')],
  };
}

async function getEvolutionSuggestion(user: JwtUser, socioId: string, context?: RagCoachSocioContext | null, locale: AiGeneratedContentLocale = 'es') {
  if (context) {
    if (context.evolucion.total === 0) {
      return aiGeneratedContentTx(locale, 'Todavía no tenés evolución física inicial cargada. Para que el Coach pueda medir mejor tu progreso, te recomiendo cargar peso, altura, cintura y medidas básicas desde Menú Personal → Evolución Física.', 'You do not have an initial physical evolution record yet. So the Coach can better measure your progress, I recommend entering weight, height, waist, and basic measurements from Personal Menu → Physical Evolution.');
    }

    return aiGeneratedContentTx(locale, 'Ya tenés evolución física cargada. Te recomiendo actualizarla una vez por mes para comparar avances reales y ajustar rutina/dieta con más precisión.', 'You already have physical evolution records. I recommend updating them once a month to compare real progress and adjust routine/diet more precisely.');
  }

  try {
    const rows = await findAllEvolucionesSocioByIdSocio(user, socioId);
    if (!rows.length) {
      return aiGeneratedContentTx(locale, 'Todavía no tenés evolución física inicial cargada. Para que el Coach pueda medir mejor tu progreso, te recomiendo cargar peso, altura, cintura y medidas básicas desde Menú Personal → Evolución Física.', 'You do not have an initial physical evolution record yet. So the Coach can better measure your progress, I recommend entering weight, height, waist, and basic measurements from Personal Menu → Physical Evolution.');
    }

    return aiGeneratedContentTx(locale, 'Ya tenés evolución física cargada. Te recomiendo actualizarla una vez por mes para comparar avances reales y ajustar rutina/dieta con más precisión.', 'You already have physical evolution records. I recommend updating them once a month to compare real progress and adjust routine/diet more precisely.');
  } catch {
    return aiGeneratedContentTx(locale, 'Cuando puedas, revisá Menú Personal → Evolución Física para mantener actualizado tu seguimiento.', 'When you can, review Personal Menu → Physical Evolution to keep your follow-up updated.');
  }
}

async function generateRoutineAction(user: JwtUser, socioId: string, message: string, context?: RagCoachSocioContext | null, locale: AiGeneratedContentLocale = 'es'): Promise<RagCoachChatActionResult> {
  const objetivo = inferObjective(message, context);
  const nivel = inferLevel(message, context);
  const dias = inferDays(message, context);
  const restricciones = mergeRestrictions(inferRestrictions(message, locale), context);

  const ragContext = await buildRutinasRagContext(user, {
    objetivo,
    nivel,
    dias,
    idioma: locale,
    mensajeSocio: message,
    restricciones,
    id_socio: socioId,
  }).catch((error) => ({
    summary: aiGeneratedContentTx(locale, 'No se pudo recuperar contexto RAG de rutinas. Se usa generación formal segura.', 'Routine RAG context could not be retrieved. Safe formal generation is used.'),
    results: [],
    warnings: [error instanceof Error ? translateAiGeneratedTechnicalText(error.message, locale) : translateAiGeneratedTechnicalText('Error desconocido al consultar RAG de rutinas.', locale)],
  }));

  const rutinaGenerada = await dataGeneracionRutina(user, {
    objetivo,
    nivel,
    dias,
    id_socio: socioId,
  });

  const sources = mapRagSources(ragContext.results);
  const safetyNotes = uniqueValues([
    restricciones,
    ...buildSafetyNotes(message, 'routine_request', context, locale),
  ]);

  return {
    type: 'routine_generated',
    ok: true,
    title: aiGeneratedContentTx(locale, 'Rutina generada', 'Routine generated'),
    message: aiGeneratedContentTx(locale, `Listo, ya generé y guardé tu rutina de ${dias} días. ${routineViewMessage(locale)}`, `Done, I generated and saved your ${dias}-day routine. ${routineViewMessage(locale)}`),
    viewPath: '/dashboard/rutinas/asistente',
    viewLabel: aiGeneratedContentTx(locale, 'Ver rutina', 'View routine'),
    ragSummary: ragContext.summary,
    sources,
    warnings: ragContext.warnings,
    safetyNotes,
    qualityAudit: buildQualityAudit({
      domain: 'rutina',
      message,
      context,
      sources,
      warnings: ragContext.warnings,
      safetyNotes,
      locale,
    }),
    payload: {
      objetivo,
      nivel,
      dias,
      restricciones,
      rutinaGenerada,
    },
  };
}

async function generateDietAction(user: JwtUser, socioId: string, message: string, context?: RagCoachSocioContext | null, locale: AiGeneratedContentLocale = 'es'): Promise<RagCoachChatActionResult> {
  const objetivo = inferObjective(message, context);
  const restricciones = mergeRestrictions(inferRestrictions(message, locale), context);
  const fechaInicio = todayIso();
  const fechaFin = addDaysIso(30);

  const ragContext = await buildDietasRagContext(user, {
    socio_id: socioId,
    objetivo,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    idioma: locale,
    mensajeSocio: message,
    restricciones,
    preferencias: '',
  }).catch((error) => ({
    summary: aiGeneratedContentTx(locale, 'No se pudo recuperar contexto RAG de dietas. Se usa generación formal segura.', 'Diet RAG context could not be retrieved. Safe formal generation is used.'),
    results: [],
    disclaimers: [],
    warnings: [error instanceof Error ? translateAiGeneratedTechnicalText(error.message, locale) : translateAiGeneratedTechnicalText('Error desconocido al consultar RAG de dietas.', locale)],
  }));

  const dietaGenerada = await createDietaSocio(
    {
      socio_id: socioId,
      objetivo: String(objetivo),
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    },
    user,
  );

  const sources = mapRagSources(ragContext.results);
  const safetyNotes = uniqueValues([
    restricciones,
    ...buildSafetyNotes(message, 'diet_request', context, locale),
    ...(ragContext.disclaimers ?? []),
  ]);

  return {
    type: 'diet_generated',
    ok: true,
    title: aiGeneratedContentTx(locale, 'Dieta generada', 'Diet generated'),
    message: aiGeneratedContentTx(locale, `Listo, ya generé y guardé tu dieta orientativa por 30 días. ${dietViewMessage(locale)}`, `Done, I generated and saved your 30-day guidance diet. ${dietViewMessage(locale)}`),
    viewPath: '/dashboard/dietas',
    viewLabel: aiGeneratedContentTx(locale, 'Ver dieta', 'View diet'),
    ragSummary: ragContext.summary,
    sources,
    warnings: ragContext.warnings,
    safetyNotes,
    qualityAudit: buildQualityAudit({
      domain: 'dieta',
      message,
      context,
      sources,
      warnings: ragContext.warnings,
      safetyNotes,
      locale,
    }),
    payload: {
      objetivo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      dietaGenerada,
    },
  };
}

async function analyzeEvolutionAction(user: JwtUser, socioId: string, message: string, context?: RagCoachSocioContext | null, locale: AiGeneratedContentLocale = 'es'): Promise<RagCoachChatActionResult> {
  const analysis = await analyzeEvolucionFisicaWithRag(user, {
    socio_id: socioId,
    idioma: locale,
    objetivo: cleanText(message, 500),
    mensajeSocio: message,
    restricciones: mergeRestrictions(inferRestrictions(message, locale), context),
  });

  return {
    type: 'evolution_analyzed',
    ok: true,
    title: aiGeneratedContentTx(locale, 'Evolución física analizada', 'Physical evolution analyzed'),
    message: `${analysis.progreso.tendenciaPrincipal} ${evolutionViewMessage(locale)}`, 
    viewPath: '/dashboard/evolucion-fisica',
    viewLabel: aiGeneratedContentTx(locale, 'Ver evolución física', 'View physical evolution'),
    ragSummary: analysis.ragContext?.summary,
    sources: mapRagSources(analysis.ragContext?.results),
    warnings: analysis.alertas,
    safetyNotes: analysis.disclaimers,
    payload: analysis,
  };
}

function buildGuidanceReply(name: string, message: string, context?: RagCoachSocioContext | null, locale: AiGeneratedContentLocale = 'es') {
  const normalized = normalize(message);

  if (/\b(no se|no se que|por donde empiezo|ayuda|mejorar mi fisico)\b/.test(normalized)) {
    const hint = context?.rutinas.total === 0
      ? aiGeneratedContentTx(locale, ' Como todavía no veo rutinas previas, podemos empezar por una rutina base.', ' Since I do not see previous routines yet, we can start with a base routine.')
      : aiGeneratedContentTx(locale, ' También puedo revisar lo que ya venís trabajando para no repetir enfoques.', ' I can also review what you have been working on so we do not repeat approaches.');
    return aiGeneratedContentTx(
      locale,
      `Perfecto, ${name}. Podemos empezar simple. Primero definamos si tu prioridad es ganar masa, bajar grasa, mejorar resistencia o sentirte mejor. Después puedo ayudarte con rutina, dieta y seguimiento de evolución física según lo que necesites.${hint}`,
      `Perfect, ${name}. We can start simple. First, let us define whether your priority is gaining muscle, losing fat, improving endurance, or feeling better. Then I can help you with routine, diet, and physical evolution tracking according to what you need.${hint}`,
    );
  }

  return aiGeneratedContentTx(
    locale,
    `${name}, puedo ayudarte con rutina, dieta o evolución física. Contame tu objetivo, cuántos días podés entrenar y si tenés alguna lesión o restricción.`,
    `${name}, I can help you with routine, diet, or physical evolution. Tell me your goal, how many days you can train, and whether you have any injury or restriction.`,
  );
}

export async function handleUnifiedRagCoachChat(
  user: JwtUser,
  payload: RagCoachChatRequest,
): Promise<RagCoachChatResponseData> {
  const locale = normalizeAiGeneratedContentLocale(payload.locale);
  const message = cleanText(payload.message);
  if (message.length < 2) {
    throw new Error(aiGeneratedContentTx(locale, 'El mensaje debe tener al menos 2 caracteres.', 'The message must be at least 2 characters long.'));
  }

  const name = getDisplayName(user, locale);
  const greeting = aiGeneratedContentTx(locale, `Hola, ${name}, ¿en qué te puedo ayudar?`, `Hi, ${name}, how can I help you?`);
  const effectiveSocioId = await resolveSocioId(user, payload.socio_id);
  const hasResolvedSocio = Boolean(effectiveSocioId);

  if (!hasResolvedSocio && !isAdminRole(user.rol)) {
    throw new Error(aiGeneratedContentTx(locale, 'No se pudo identificar el socio autenticado.', 'The authenticated member could not be identified.'));
  }

  const socioContext = hasResolvedSocio
    ? await buildRagCoachSocioContext(user, effectiveSocioId).catch((error) => {
        console.warn('No se pudo construir contexto del socio para el Coach IA:', error);
        return null;
      })
    : null;

  const conversationMemory = sanitizeConversationMemory(payload.conversationContext);
  const detectedIntent = detectIntent(message);
  const intent = resolveIntentWithMemory(message, detectedIntent, conversationMemory);
  const memoryTrace = buildMemoryTrace(conversationMemory, intent, socioContext, locale);
  const safetyNotes = buildSafetyNotes(message, intent, socioContext, locale);
  const evolutionSuggestion = hasResolvedSocio
    ? await getEvolutionSuggestion(user, effectiveSocioId, socioContext, locale)
    : aiGeneratedContentTx(locale, 'Para generar dietas, rutinas o análisis automáticos necesito un socio real asociado a la sesión o seleccionado por administración.', 'To generate automatic diets, routines, or analyses, I need a real member associated with the session or selected by administration.');
  const contextLine = getContextCoachLine(socioContext);
  const coachNotes: string[] = [];
  const suggestedReplies: string[] = [];

  if (contextLine) coachNotes.push(translateAiGeneratedTechnicalText(contextLine, locale));
  coachNotes.push(...translateAiGeneratedTechnicalList(socioContext?.memoryHighlights ?? [], locale));
  coachNotes.push(...translateAiGeneratedTechnicalList(socioContext?.hints ?? [], locale));
  if (conversationMemory.lastNextBestStep) {
    coachNotes.push(aiGeneratedContentTx(locale, `Continuidad previa: ${conversationMemory.lastNextBestStep}`, `Previous continuity: ${conversationMemory.lastNextBestStep}`));
  }

  if (shouldBlockAutomationForSafety(message)) {
    const action: RagCoachChatActionResult = {
      type: 'guidance_only',
      ok: true,
      title: aiGeneratedContentTx(locale, 'Fallback de seguridad', 'Safety fallback'),
      message: aiGeneratedContentTx(locale, 'Se priorizó orientación segura y no se ejecutaron acciones automáticas.', 'Safe guidance was prioritized and no automatic actions were executed.'),
      safetyNotes,
      qualityAudit: buildQualityAudit({
        domain: 'orientacion',
        message,
        context: socioContext,
        safetyNotes,
        blocked: true,
        locale,
      }),
    };
    const reply = [
      aiGeneratedContentTx(locale, `${name}, por seguridad no voy a generar una rutina, dieta ni progresión automática con síntomas sensibles como dolor de pecho, desmayo, falta de aire o taquicardia.`, `${name}, for safety, I will not generate an automatic routine, diet, or progression when sensitive symptoms such as chest pain, fainting, shortness of breath, or tachycardia are mentioned.`),
      aiGeneratedContentTx(locale, 'Lo más prudente es pausar la actividad intensa y consultar con un profesional de salud antes de ajustar entrenamiento o alimentación.', 'The safest path is to pause intense activity and consult a healthcare professional before changing training or nutrition.'),
      evolutionSuggestion,
      contextLine ? translateAiGeneratedTechnicalText(contextLine, locale) : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      greeting,
      intent: 'general_guidance',
      reply,
      actions: [action],
      suggestedReplies: [
        aiGeneratedContentTx(locale, 'Quiero revisar mi evolución física', 'I want to review my physical evolution'),
        aiGeneratedContentTx(locale, 'Tengo restricciones y quiero una orientación general', 'I have restrictions and want general guidance'),
      ],
      missingParams: [],
      coachNotes: [...coachNotes, aiGeneratedContentTx(locale, 'Fallback de seguridad activado por señales sensibles.', 'Safety fallback activated by sensitive signals.')],
      contextSummary: socioContext?.resumenHumano ? translateAiGeneratedTechnicalText(socioContext.resumenHumano, locale) : undefined,
      contextHints: translateAiGeneratedTechnicalList(socioContext?.hints, locale),
      nextBestStep: aiGeneratedContentTx(locale, 'Derivar a evaluación profesional antes de ajustar entrenamiento o dieta.', 'Refer to professional evaluation before adjusting training or diet.'),
      safetySummary: safetyNotes.join(' '),
      qaSummary: buildQaSummary([action]),
      contextSnapshot: socioContext?.contextSnapshot,
      memoryHighlights: translateAiGeneratedTechnicalList(socioContext?.memoryHighlights, locale),
      memoryTrace,
      contextConfidence: buildContextConfidence(socioContext),
    };
  }

  if ((intent === 'diet_request' || intent === 'routine_and_diet_request') && shouldBlockDietAutomationForQuality(message)) {
    const action: RagCoachChatActionResult = {
      type: 'guidance_only',
      ok: true,
      title: aiGeneratedContentTx(locale, 'Dieta no generada por seguridad', 'Diet not generated for safety'),
      message: aiGeneratedContentTx(locale, 'El pedido incluye señales de dieta extrema o trastorno alimentario. El Coach solo puede dar orientación general y recomendar evaluación profesional.', 'The request includes signs of extreme dieting or a possible eating disorder. The Coach can only provide general guidance and recommend professional evaluation.'),
      safetyNotes,
      qualityAudit: buildQualityAudit({
        domain: 'dieta',
        message,
        context: socioContext,
        safetyNotes,
        blocked: true,
        locale,
      }),
    };

    return {
      greeting,
      intent: 'general_guidance',
      reply: [
        aiGeneratedContentTx(locale, `${name}, no voy a generar una dieta automática con señales de restricción extrema o posible TCA.`, `${name}, I will not generate an automatic diet when there are signs of extreme restriction or a possible eating disorder.`),
        aiGeneratedContentTx(locale, 'Puedo ayudarte a ordenar objetivos saludables y sugerirte que lo revises con un nutricionista o profesional de salud.', 'I can help you organize healthy goals and suggest reviewing them with a nutritionist or healthcare professional.'),
        contextLine ? translateAiGeneratedTechnicalText(contextLine, locale) : '',
      ].filter(Boolean).join('\n\n'),
      actions: [action],
      suggestedReplies: [
        aiGeneratedContentTx(locale, 'Quiero una orientación general segura', 'I want safe general guidance'),
        aiGeneratedContentTx(locale, 'Quiero revisar mi evolución física', 'I want to review my physical evolution'),
      ],
      missingParams: [],
      coachNotes: [...coachNotes, aiGeneratedContentTx(locale, 'Bloqueo QA nutricional activado por riesgo de dieta extrema/TCA.', 'Nutrition QA block activated due to extreme diet/eating-disorder risk.')],
      contextSummary: socioContext?.resumenHumano ? translateAiGeneratedTechnicalText(socioContext.resumenHumano, locale) : undefined,
      contextHints: translateAiGeneratedTechnicalList(socioContext?.hints, locale),
      nextBestStep: aiGeneratedContentTx(locale, 'Derivar a orientación nutricional profesional antes de generar una dieta automática.', 'Refer to professional nutrition guidance before generating an automatic diet.'),
      safetySummary: safetyNotes.join(' '),
      qaSummary: buildQaSummary([action]),
      contextSnapshot: socioContext?.contextSnapshot,
      memoryHighlights: translateAiGeneratedTechnicalList(socioContext?.memoryHighlights, locale),
      memoryTrace,
      contextConfidence: buildContextConfidence(socioContext),
    };
  }

  if (!hasResolvedSocio && (
    intent === 'routine_request' ||
    intent === 'diet_request' ||
    intent === 'routine_and_diet_request' ||
    intent === 'evolution_analysis_request'
  )) {
    const action: RagCoachChatActionResult = {
      type: 'guidance_only',
      ok: true,
      title: aiGeneratedContentTx(locale, 'Socio no identificado', 'Member not identified'),
      message: aiGeneratedContentTx(locale, 'No ejecuté acciones automáticas porque no recibí un id_socio real. Así evitamos crear rutinas, dietas o consultas con un identificador inválido.', 'I did not execute automatic actions because I did not receive a real id_socio. This avoids creating routines, diets, or queries with an invalid identifier.'),
      safetyNotes,
      qualityAudit: buildQualityAudit({
        domain: 'orientacion',
        message,
        context: socioContext,
        safetyNotes,
        blocked: true,
        locale,
      }),
    };

    return {
      greeting,
      intent: 'general_guidance',
      reply: [
        aiGeneratedContentTx(locale, `${name}, entendí tu pedido, pero no puedo generar una dieta, rutina o análisis automático sin identificar un socio real.`, `${name}, I understood your request, but I cannot generate a diet, routine, or automatic analysis without identifying a real member.`),
        isAdminRole(user.rol)
          ? aiGeneratedContentTx(locale, 'Estás operando como administrador: seleccioná un socio real en el Coach IA o enviá la solicitud con un id_socio válido.', 'You are operating as an administrator: select a real member in the AI Coach or send the request with a valid id_socio.')
          : aiGeneratedContentTx(locale, 'Tu sesión no trajo id_socio válido. Cerrá sesión y volvé a ingresar para refrescar el token; si persiste, revisá que tu usuario esté vinculado a un socio.', 'Your session did not include a valid id_socio. Sign out and sign back in to refresh the token; if it persists, verify that your user is linked to a member.'),
        aiGeneratedContentTx(locale, 'Puedo darte orientación general segura mientras tanto, pero no voy a guardar datos en módulos del socio sin ese vínculo.', 'I can provide safe general guidance meanwhile, but I will not save data in member modules without that link.'),
      ].join('\n\n'),
      actions: [action],
      suggestedReplies: [
        aiGeneratedContentTx(locale, 'Quiero orientación general', 'I want general guidance'),
        aiGeneratedContentTx(locale, 'Voy a seleccionar un socio', 'I will select a member'),
      ],
      missingParams: ['id_socio'],
      coachNotes: [...coachNotes, aiGeneratedContentTx(locale, 'Se bloqueó automatización porque no hay id_socio real resuelto.', 'Automation was blocked because no real id_socio was resolved.')],
      contextSummary: socioContext?.resumenHumano ? translateAiGeneratedTechnicalText(socioContext.resumenHumano, locale) : undefined,
      contextHints: translateAiGeneratedTechnicalList(socioContext?.hints, locale),
      nextBestStep: aiGeneratedContentTx(locale, 'Seleccionar un socio real en el Coach IA o refrescar sesión de socio antes de generar dieta/rutina.', 'Select a real member in the AI Coach or refresh the member session before generating a diet/routine.'),
      safetySummary: safetyNotes.join(' '),
      qaSummary: buildQaSummary([action]),
      contextSnapshot: socioContext?.contextSnapshot,
      memoryHighlights: translateAiGeneratedTechnicalList(socioContext?.memoryHighlights, locale),
      memoryTrace,
      contextConfidence: buildContextConfidence(socioContext),
    };
  }

  const actions: RagCoachChatActionResult[] = [];

  if (intent === 'routine_request' || intent === 'routine_and_diet_request') {
    try {
      actions.push(await generateRoutineAction(user, effectiveSocioId, message, socioContext, locale));
      coachNotes.push(aiGeneratedContentTx(locale, 'Después de generar una rutina, conviene ofrecer una dieta que acompañe el mismo objetivo.', 'After generating a routine, it is useful to offer a diet aligned with the same goal.'));
      suggestedReplies.push(aiGeneratedContentTx(locale, 'Sí, quiero una dieta que acompañe mi rutina', 'Yes, I want a diet to support my routine'));
    } catch (error) {
      actions.push(buildFailedAction('routine_generated', aiGeneratedContentTx(locale, 'Rutina no generada', 'Routine not generated'), error, locale));
    }
  }

  if (intent === 'diet_request' || intent === 'routine_and_diet_request') {
    try {
      actions.push(await generateDietAction(user, effectiveSocioId, message, socioContext, locale));
      coachNotes.push(aiGeneratedContentTx(locale, 'La dieta fue generada como orientación general y debe respetar disclaimers nutricionales.', 'The diet was generated as general guidance and must respect nutrition disclaimers.'));
    } catch (error) {
      actions.push(buildFailedAction('diet_generated', aiGeneratedContentTx(locale, 'Dieta no generada', 'Diet not generated'), error, locale));
    }
  }

  if (intent === 'evolution_analysis_request') {
    try {
      actions.push(await analyzeEvolutionAction(user, effectiveSocioId, message, socioContext, locale));
    } catch (error) {
      actions.push(buildFailedAction('evolution_analyzed', aiGeneratedContentTx(locale, 'Evolución no analizada', 'Evolution not analyzed'), error, locale));
    }
  }

  suggestedReplies.push(
    aiGeneratedContentTx(locale, 'Analizar mi evolución física', 'Analyze my physical evolution'),
    aiGeneratedContentTx(locale, 'Quiero cargar mi evolución inicial', 'I want to enter my initial evolution'),
  );

  if (actions.length === 0) {
    const action: RagCoachChatActionResult = {
      type: 'guidance_only',
      ok: true,
      title: aiGeneratedContentTx(locale, 'Orientación inicial', 'Initial guidance'),
      message: aiGeneratedContentTx(locale, 'El Coach necesita algunos datos más antes de generar una rutina o dieta.', 'The Coach needs a few more details before generating a routine or diet.'),
      safetyNotes,
      qualityAudit: buildQualityAudit({
        domain: 'orientacion',
        message,
        context: socioContext,
        safetyNotes,
        locale,
      }),
    };

    return {
      greeting,
      intent,
      reply: `${buildContextAwareGuidance(name, message, socioContext, conversationMemory, locale)}\n\n${evolutionSuggestion}`,
      actions: [action],
      suggestedReplies: [
        aiGeneratedContentTx(locale, 'Quiero una rutina', 'I want a routine'),
        aiGeneratedContentTx(locale, 'Quiero una dieta', 'I want a diet'),
        aiGeneratedContentTx(locale, 'Quiero revisar mi evolución física', 'I want to review my physical evolution'),
      ],
      missingParams: [
        aiGeneratedContentTx(locale, 'objetivo', 'goal'),
        aiGeneratedContentTx(locale, 'días disponibles', 'available days'),
        aiGeneratedContentTx(locale, 'nivel o experiencia', 'level or experience'),
        aiGeneratedContentTx(locale, 'restricciones', 'restrictions'),
      ],
      coachNotes: [...coachNotes, aiGeneratedContentTx(locale, 'El usuario todavía no pidió una acción concreta o faltan parámetros.', 'The user has not requested a concrete action yet or parameters are missing.')],
      contextSummary: socioContext?.resumenHumano ? translateAiGeneratedTechnicalText(socioContext.resumenHumano, locale) : undefined,
      contextHints: translateAiGeneratedTechnicalList(socioContext?.hints, locale),
      nextBestStep: aiGeneratedContentTx(locale, 'Pedir objetivo, disponibilidad semanal y restricciones.', 'Ask for goal, weekly availability, and restrictions.'),
      safetySummary: safetyNotes.join(' '),
      qaSummary: buildQaSummary([action]),
      contextSnapshot: socioContext?.contextSnapshot,
      memoryHighlights: translateAiGeneratedTechnicalList(socioContext?.memoryHighlights, locale),
      memoryTrace,
      contextConfidence: buildContextConfidence(socioContext),
    };
  }

  const successfulActions = actions.filter((action) => action.ok);
  const actionMessages = actions.map((action) => action.message).join('\n\n');
  const offerDiet = intent === 'routine_request' && successfulActions.some((action) => action.type === 'routine_generated')
    ? aiGeneratedContentTx(locale, '\n\nSi querés, también puedo prepararte una dieta orientativa que acompañe esta rutina de entrenamiento.', '\n\nIf you want, I can also prepare a guidance diet to support this training routine.')
    : '';
  const safetySuffix = safetyNotes.length
    ? aiGeneratedContentTx(locale, `\n\nNota de seguridad: ${safetyNotes[0]}`, `\n\nSafety note: ${safetyNotes[0]}`)
    : '';
  const contextSuffix = contextLine ? `\n\n${translateAiGeneratedTechnicalText(contextLine, locale)}` : '';
  const memoryPrefix = buildContextualReplyPrefix(socioContext, locale);
  const memorySuffix = memoryPrefix ? `\n\n${memoryPrefix}` : '';

  return {
    greeting,
    intent,
    reply: `${actionMessages}${offerDiet}\n\n${evolutionSuggestion}${memorySuffix}${contextSuffix}${safetySuffix}`,
    actions,
    suggestedReplies: uniqueValues(suggestedReplies),
    missingParams: [],
    coachNotes,
    contextSummary: socioContext?.resumenHumano ? translateAiGeneratedTechnicalText(socioContext.resumenHumano, locale) : undefined,
    contextHints: translateAiGeneratedTechnicalList(socioContext?.hints, locale),
    nextBestStep: intent === 'routine_request'
      ? aiGeneratedContentTx(locale, 'Ofrecer dieta complementaria y seguimiento de evolución física.', 'Offer a complementary diet and physical evolution tracking.')
      : aiGeneratedContentTx(locale, 'Sugerir seguimiento mensual de evolución física si el socio está comprometido.', 'Suggest monthly physical evolution tracking if the member is committed.'),
    safetySummary: safetyNotes.join(' '),
    qaSummary: buildQaSummary(actions),
    contextSnapshot: socioContext?.contextSnapshot,
    memoryHighlights: translateAiGeneratedTechnicalList(socioContext?.memoryHighlights, locale),
    memoryTrace,
    contextConfidence: buildContextConfidence(socioContext),
  };
}
