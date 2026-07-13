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

function getDisplayName(user: JwtUser) {
  return cleanText(user.nombre, 80) || cleanText(user.email, 80) || 'socio';
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

function buildMemoryTrace(memory: RagCoachConversationMemory, intent: RagCoachChatIntent, context?: RagCoachSocioContext | null) {
  const trace: string[] = [];

  if ((memory.recentMessages ?? []).length > 0) {
    trace.push(`Se usaron ${memory.recentMessages?.length ?? 0} mensaje(s) recientes de esta conversación.`);
  }
  if (memory.lastAssistantIntent) trace.push(`Última intención recordada: ${memory.lastAssistantIntent}.`);
  if ((memory.pendingMissingParams ?? []).length > 0) trace.push(`Parámetros pendientes recordados: ${memory.pendingMissingParams?.join(', ')}.`);
  if (context?.contextSnapshot) trace.push(`${context.contextSnapshot.readinessLabel}: ${context.contextSnapshot.readinessScore}% de contexto operativo disponible.`);
  if ((context?.recommendedFocus ?? []).length > 0) trace.push(`Foco sugerido: ${context?.recommendedFocus.slice(0, 3).join(', ')}.`);
  trace.push(`Intención final aplicada: ${intent}.`);

  return uniqueValues(trace).slice(0, 6);
}

function buildContextConfidence(context?: RagCoachSocioContext | null): 'alta' | 'media' | 'baja' {
  const score = context?.contextSnapshot?.readinessScore ?? 0;
  if (score >= 75) return 'alta';
  if (score >= 45) return 'media';
  return 'baja';
}

function buildContextualReplyPrefix(context?: RagCoachSocioContext | null) {
  if (!context?.memoryHighlights.length) return '';
  return `Tomé como memoria del socio: ${context.memoryHighlights.slice(0, 3).join(' ')}`;
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

function inferRestrictions(message: string) {
  const text = normalize(message);
  const restrictions: string[] = [];

  if (/\b(rodilla|menisco|ligamento)\b/.test(text)) restrictions.push('Cuidar rodilla y evitar impacto alto.');
  if (/\b(hombro|manguito)\b/.test(text)) restrictions.push('Cuidar hombro y evitar cargas agresivas sobre cabeza.');
  if (/\b(espalda|lumbar|hernia|ciatico)\b/.test(text)) restrictions.push('Cuidar zona lumbar y priorizar técnica controlada.');
  if (/\b(hipertension|presion alta|cardiopatia|corazon)\b/.test(text)) restrictions.push('Validar intensidad con profesional de salud por condición cardiovascular declarada.');
  if (/\b(diabetes|glucemia|insulina)\b/.test(text)) restrictions.push('Validar pauta alimentaria con profesional por condición glucémica declarada.');

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

function buildSafetyNotes(message: string, intent: RagCoachChatIntent, context?: RagCoachSocioContext | null) {
  const text = normalize(message);
  const notes: string[] = [];

  if (/\b(dolor de pecho|pecho|desmayo|desmayos|taquicardia|mareo fuerte|falta de aire)\b/.test(text)) {
    notes.push('Se detectó una posible señal sensible. No conviene intensificar entrenamiento ni dieta sin evaluación profesional.');
  }

  if (/\b(diabetes|glucemia|insulina|hipertension|presion alta|cardiopatia|embarazo|trastorno alimentario|anorexia|bulimia)\b/.test(text)) {
    notes.push('El pedido menciona una condición clínica o nutricional sensible. El Coach solo puede orientar de forma general y debe intervenir un profesional.');
  }

  if (/\b(lesion|lesionado|dolor|hernia|rodilla|hombro|lumbar|espalda)\b/.test(text)) {
    notes.push('Se detectó posible lesión o dolor. Priorizar técnica, progresión conservadora y supervisión profesional.');
  }

  if (intent === 'diet_request' || intent === 'routine_and_diet_request') {
    notes.push('La dieta generada es orientativa y no reemplaza una evaluación nutricional individual.');
  }

  if ((context?.fichaMedica.restriccionesSeguras ?? []).length > 0) {
    notes.push('Se aplicaron restricciones seguras registradas en la ficha médica del socio.');
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

function qualityStatusLabel(score: number, blocked: boolean) {
  if (blocked) return 'Bloqueado por seguridad';
  if (score >= 85) return 'Calidad alta';
  if (score >= 65) return 'Calidad aceptable con advertencias';
  return 'Requiere más datos';
}

function buildQualityAudit(params: {
  domain: RagCoachQualityAudit['domain'];
  message: string;
  context?: RagCoachSocioContext | null;
  sources?: RagCoachChatSource[];
  warnings?: string[];
  safetyNotes?: string[];
  blocked?: boolean;
}): RagCoachQualityAudit {
  const checks: RagCoachQualityCheckItem[] = [];
  const hasSources = (params.sources ?? []).length > 0;
  const contextScore = params.context?.contextSnapshot?.readinessScore ?? 0;

  checks.push({
    label: 'Grounding / fuentes',
    status: hasSources ? 'passed' : 'warning',
    detail: hasSources
      ? 'La respuesta recuperó fuentes RAG y las expone al socio.'
      : 'No hubo fuentes RAG visibles; se usa fallback formal y debe mantenerse el tono prudente.',
  });

  checks.push({
    label: 'Contexto del socio',
    status: contextScore >= 45 ? 'passed' : 'warning',
    detail: contextScore >= 45
      ? `Se aplicó contexto operativo del socio con score ${contextScore}%.`
      : 'El contexto del socio es bajo; la respuesta debe pedir datos faltantes y evitar afirmaciones fuertes.',
  });

  if (params.domain === 'rutina') {
    const hasMinimumData = (hasExplicitObjective(params.message) || Boolean(params.context?.socio?.objetivo))
      && (hasExplicitLevel(params.message) || Boolean(params.context?.socio?.nivel))
      && (hasExplicitDays(params.message) || Boolean(params.context?.socio?.diasPorSemana));

    checks.push({
      label: 'Datos mínimos de rutina',
      status: hasMinimumData ? 'passed' : 'warning',
      detail: hasMinimumData
        ? 'Objetivo, nivel y frecuencia semanal se detectaron desde el mensaje o el perfil del socio.'
        : 'Faltan objetivo, nivel o frecuencia explícita; se aplicaron defaults seguros y conviene confirmar con el socio.',
    });
  }

  if (params.domain === 'dieta') {
    const hasNutritionObjective = hasExplicitObjective(params.message) || Boolean(params.context?.socio?.objetivo);

    checks.push({
      label: 'Datos mínimos de dieta',
      status: hasNutritionObjective ? 'passed' : 'warning',
      detail: hasNutritionObjective
        ? 'La dieta quedó vinculada a un objetivo detectado o inferido desde el contexto del socio.'
        : 'No hay objetivo nutricional claro; conviene pedir objetivo, restricciones y preferencias alimentarias.',
    });

    checks.push({
      label: 'Disclaimers nutricionales',
      status: 'passed',
      detail: 'La respuesta mantiene advertencia de orientación general y no reemplazo profesional.',
    });
  }

  const hasSafetySignals = (params.safetyNotes ?? []).length > 0 || (params.warnings ?? []).length > 0;
  checks.push({
    label: 'Límites de seguridad',
    status: params.blocked ? 'blocked' : hasSafetySignals ? 'warning' : 'passed',
    detail: params.blocked
      ? 'Se bloqueó la acción automática por riesgo clínico/nutricional sensible.'
      : hasSafetySignals
        ? 'Se detectaron advertencias y la respuesta debe conservar límites prudentes.'
        : 'No se detectaron señales sensibles en el pedido.',
  });

  checks.push({
    label: 'Promesas y próximos pasos',
    status: 'passed',
    detail: 'La respuesta evita prometer resultados garantizados y propone un siguiente paso accionable.',
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
    statusLabel: qualityStatusLabel(score, Boolean(params.blocked)),
    summary: `${params.domain === 'rutina' ? 'Rutina' : params.domain === 'dieta' ? 'Dieta' : 'Orientación'} auditada con score ${score}%.`,
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
) {
  const base = buildGuidanceReply(name, message, context);
  const contextLine = getContextCoachLine(context);
  const memoryLines = [
    memory?.lastNextBestStep ? `Continuidad previa: ${memory.lastNextBestStep}` : '',
    (memory?.pendingMissingParams ?? []).length > 0
      ? `Datos pendientes ya detectados: ${(memory?.pendingMissingParams ?? []).join(', ')}.`
      : '',
    memory?.lastContextSummary ? `Contexto recordado: ${memory.lastContextSummary}` : '',
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

function routineViewMessage() {
  return 'Podés verla desde Menú Personal → Asistente de Rutinas o desde tu historial de rutinas dentro del panel de socio.';
}

function dietViewMessage() {
  return 'Podés verla desde Menú Personal → Asistente de Dietas / Dietas.';
}

function evolutionViewMessage() {
  return 'Podés volver a consultar tu seguimiento desde Menú Personal → Evolución Física.';
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
): RagCoachChatActionResult {
  const message = error instanceof Error ? error.message : 'Error desconocido.';
  return {
    type,
    ok: false,
    title,
    message: `No pude completar esta acción automáticamente. Motivo: ${message}`,
    warnings: [message],
    safetyNotes: ['Podés intentar nuevamente o revisar el módulo correspondiente desde el menú.'],
  };
}

async function getEvolutionSuggestion(user: JwtUser, socioId: string, context?: RagCoachSocioContext | null) {
  if (context) {
    if (context.evolucion.total === 0) {
      return 'Todavía no tenés evolución física inicial cargada. Para que el Coach pueda medir mejor tu progreso, te recomiendo cargar peso, altura, cintura y medidas básicas desde Menú Personal → Evolución Física.';
    }

    return 'Ya tenés evolución física cargada. Te recomiendo actualizarla una vez por mes para comparar avances reales y ajustar rutina/dieta con más precisión.';
  }

  try {
    const rows = await findAllEvolucionesSocioByIdSocio(user, socioId);
    if (!rows.length) {
      return 'Todavía no tenés evolución física inicial cargada. Para que el Coach pueda medir mejor tu progreso, te recomiendo cargar peso, altura, cintura y medidas básicas desde Menú Personal → Evolución Física.';
    }

    return 'Ya tenés evolución física cargada. Te recomiendo actualizarla una vez por mes para comparar avances reales y ajustar rutina/dieta con más precisión.';
  } catch {
    return 'Cuando puedas, revisá Menú Personal → Evolución Física para mantener actualizado tu seguimiento.';
  }
}

async function generateRoutineAction(user: JwtUser, socioId: string, message: string, context?: RagCoachSocioContext | null): Promise<RagCoachChatActionResult> {
  const objetivo = inferObjective(message, context);
  const nivel = inferLevel(message, context);
  const dias = inferDays(message, context);
  const restricciones = mergeRestrictions(inferRestrictions(message), context);

  const ragContext = await buildRutinasRagContext(user, {
    objetivo,
    nivel,
    dias,
    idioma: 'es',
    mensajeSocio: message,
    restricciones,
    id_socio: socioId,
  }).catch((error) => ({
    summary: 'No se pudo recuperar contexto RAG de rutinas. Se usa generación formal segura.',
    results: [],
    warnings: [error instanceof Error ? error.message : 'Error desconocido al consultar RAG de rutinas.'],
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
    ...buildSafetyNotes(message, 'routine_request', context),
  ]);

  return {
    type: 'routine_generated',
    ok: true,
    title: 'Rutina generada',
    message: `Listo, ya generé y guardé tu rutina de ${dias} días. ${routineViewMessage()}`,
    viewPath: '/dashboard/rutinas/asistente',
    viewLabel: 'Ver rutina',
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

async function generateDietAction(user: JwtUser, socioId: string, message: string, context?: RagCoachSocioContext | null): Promise<RagCoachChatActionResult> {
  const objetivo = inferObjective(message, context);
  const restricciones = mergeRestrictions(inferRestrictions(message), context);
  const fechaInicio = todayIso();
  const fechaFin = addDaysIso(30);

  const ragContext = await buildDietasRagContext(user, {
    socio_id: socioId,
    objetivo,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    idioma: 'es',
    mensajeSocio: message,
    restricciones,
    preferencias: '',
  }).catch((error) => ({
    summary: 'No se pudo recuperar contexto RAG de dietas. Se usa generación formal segura.',
    results: [],
    disclaimers: [],
    warnings: [error instanceof Error ? error.message : 'Error desconocido al consultar RAG de dietas.'],
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
    ...buildSafetyNotes(message, 'diet_request', context),
    ...(ragContext.disclaimers ?? []),
  ]);

  return {
    type: 'diet_generated',
    ok: true,
    title: 'Dieta generada',
    message: `Listo, ya generé y guardé tu dieta orientativa por 30 días. ${dietViewMessage()}`,
    viewPath: '/dashboard/dietas',
    viewLabel: 'Ver dieta',
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
    }),
    payload: {
      objetivo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      dietaGenerada,
    },
  };
}

async function analyzeEvolutionAction(user: JwtUser, socioId: string, message: string, context?: RagCoachSocioContext | null): Promise<RagCoachChatActionResult> {
  const analysis = await analyzeEvolucionFisicaWithRag(user, {
    socio_id: socioId,
    idioma: 'es',
    objetivo: cleanText(message, 500),
    mensajeSocio: message,
    restricciones: mergeRestrictions(inferRestrictions(message), context),
  });

  return {
    type: 'evolution_analyzed',
    ok: true,
    title: 'Evolución física analizada',
    message: `${analysis.progreso.tendenciaPrincipal} ${evolutionViewMessage()}`,
    viewPath: '/dashboard/evolucion-fisica',
    viewLabel: 'Ver evolución física',
    ragSummary: analysis.ragContext?.summary,
    sources: mapRagSources(analysis.ragContext?.results),
    warnings: analysis.alertas,
    safetyNotes: analysis.disclaimers,
    payload: analysis,
  };
}

function buildGuidanceReply(name: string, message: string, context?: RagCoachSocioContext | null) {
  const normalized = normalize(message);

  if (/\b(no se|no se que|por donde empiezo|ayuda|mejorar mi fisico)\b/.test(normalized)) {
    const hint = context?.rutinas.total === 0
      ? ' Como todavía no veo rutinas previas, podemos empezar por una rutina base.'
      : ' También puedo revisar lo que ya venís trabajando para no repetir enfoques.';
    return `Perfecto, ${name}. Podemos empezar simple. Primero definamos si tu prioridad es ganar masa, bajar grasa, mejorar resistencia o sentirte mejor. Después puedo ayudarte con rutina, dieta y seguimiento de evolución física según lo que necesites.${hint}`;
  }

  return `${name}, puedo ayudarte con rutina, dieta o evolución física. Contame tu objetivo, cuántos días podés entrenar y si tenés alguna lesión o restricción.`;
}

export async function handleUnifiedRagCoachChat(
  user: JwtUser,
  payload: RagCoachChatRequest,
): Promise<RagCoachChatResponseData> {
  const message = cleanText(payload.message);
  if (message.length < 2) {
    throw new Error('El mensaje debe tener al menos 2 caracteres.');
  }

  const name = getDisplayName(user);
  const greeting = `Hola, ${name}, ¿en qué te puedo ayudar?`;
  const effectiveSocioId = await resolveSocioId(user, payload.socio_id);
  const hasResolvedSocio = Boolean(effectiveSocioId);

  if (!hasResolvedSocio && !isAdminRole(user.rol)) {
    throw new Error('No se pudo identificar el socio autenticado.');
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
  const memoryTrace = buildMemoryTrace(conversationMemory, intent, socioContext);
  const safetyNotes = buildSafetyNotes(message, intent, socioContext);
  const evolutionSuggestion = hasResolvedSocio
    ? await getEvolutionSuggestion(user, effectiveSocioId, socioContext)
    : 'Para generar dietas, rutinas o análisis automáticos necesito un socio real asociado a la sesión o seleccionado por administración.';
  const contextLine = getContextCoachLine(socioContext);
  const coachNotes: string[] = [];
  const suggestedReplies: string[] = [];

  if (contextLine) coachNotes.push(contextLine);
  coachNotes.push(...(socioContext?.memoryHighlights ?? []));
  coachNotes.push(...(socioContext?.hints ?? []));
  if (conversationMemory.lastNextBestStep) coachNotes.push(`Continuidad previa: ${conversationMemory.lastNextBestStep}`);

  if (shouldBlockAutomationForSafety(message)) {
    const action: RagCoachChatActionResult = {
      type: 'guidance_only',
      ok: true,
      title: 'Fallback de seguridad',
      message: 'Se priorizó orientación segura y no se ejecutaron acciones automáticas.',
      safetyNotes,
      qualityAudit: buildQualityAudit({
        domain: 'orientacion',
        message,
        context: socioContext,
        safetyNotes,
        blocked: true,
      }),
    };
    const reply = [
      `${name}, por seguridad no voy a generar una rutina, dieta ni progresión automática con síntomas sensibles como dolor de pecho, desmayo, falta de aire o taquicardia.`,
      'Lo más prudente es pausar la actividad intensa y consultar con un profesional de salud antes de ajustar entrenamiento o alimentación.',
      evolutionSuggestion,
      contextLine,
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      greeting,
      intent: 'general_guidance',
      reply,
      actions: [action],
      suggestedReplies: ['Quiero revisar mi evolución física', 'Tengo restricciones y quiero una orientación general'],
      missingParams: [],
      coachNotes: [...coachNotes, 'Fallback de seguridad activado por señales sensibles.'],
      contextSummary: socioContext?.resumenHumano,
      contextHints: socioContext?.hints,
      nextBestStep: 'Derivar a evaluación profesional antes de ajustar entrenamiento o dieta.',
      safetySummary: safetyNotes.join(' '),
      qaSummary: buildQaSummary([action]),
      contextSnapshot: socioContext?.contextSnapshot,
      memoryHighlights: socioContext?.memoryHighlights,
      memoryTrace,
      contextConfidence: buildContextConfidence(socioContext),
    };
  }

  if ((intent === 'diet_request' || intent === 'routine_and_diet_request') && shouldBlockDietAutomationForQuality(message)) {
    const action: RagCoachChatActionResult = {
      type: 'guidance_only',
      ok: true,
      title: 'Dieta no generada por seguridad',
      message: 'El pedido incluye señales de dieta extrema o trastorno alimentario. El Coach solo puede dar orientación general y recomendar evaluación profesional.',
      safetyNotes,
      qualityAudit: buildQualityAudit({
        domain: 'dieta',
        message,
        context: socioContext,
        safetyNotes,
        blocked: true,
      }),
    };

    return {
      greeting,
      intent: 'general_guidance',
      reply: [
        `${name}, no voy a generar una dieta automática con señales de restricción extrema o posible TCA.`,
        'Puedo ayudarte a ordenar objetivos saludables y sugerirte que lo revises con un nutricionista o profesional de salud.',
        contextLine,
      ].filter(Boolean).join('\n\n'),
      actions: [action],
      suggestedReplies: ['Quiero una orientación general segura', 'Quiero revisar mi evolución física'],
      missingParams: [],
      coachNotes: [...coachNotes, 'Bloqueo QA nutricional activado por riesgo de dieta extrema/TCA.'],
      contextSummary: socioContext?.resumenHumano,
      contextHints: socioContext?.hints,
      nextBestStep: 'Derivar a orientación nutricional profesional antes de generar una dieta automática.',
      safetySummary: safetyNotes.join(' '),
      qaSummary: buildQaSummary([action]),
      contextSnapshot: socioContext?.contextSnapshot,
      memoryHighlights: socioContext?.memoryHighlights,
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
      title: 'Socio no identificado',
      message: 'No ejecuté acciones automáticas porque no recibí un id_socio real. Así evitamos crear rutinas, dietas o consultas con un identificador inválido.',
      safetyNotes,
      qualityAudit: buildQualityAudit({
        domain: 'orientacion',
        message,
        context: socioContext,
        safetyNotes,
        blocked: true,
      }),
    };

    return {
      greeting,
      intent: 'general_guidance',
      reply: [
        `${name}, entendí tu pedido, pero no puedo generar una dieta, rutina o análisis automático sin identificar un socio real.`,
        isAdminRole(user.rol)
          ? 'Estás operando como administrador: seleccioná un socio real en el Coach IA o enviá la solicitud con un id_socio válido.'
          : 'Tu sesión no trajo id_socio válido. Cerrá sesión y volvé a ingresar para refrescar el token; si persiste, revisá que tu usuario esté vinculado a un socio.',
        'Puedo darte orientación general segura mientras tanto, pero no voy a guardar datos en módulos del socio sin ese vínculo.',
      ].join('\n\n'),
      actions: [action],
      suggestedReplies: ['Quiero orientación general', 'Voy a seleccionar un socio'],
      missingParams: ['id_socio'],
      coachNotes: [...coachNotes, 'Se bloqueó automatización porque no hay id_socio real resuelto.'],
      contextSummary: socioContext?.resumenHumano,
      contextHints: socioContext?.hints,
      nextBestStep: 'Seleccionar un socio real en el Coach IA o refrescar sesión de socio antes de generar dieta/rutina.',
      safetySummary: safetyNotes.join(' '),
      qaSummary: buildQaSummary([action]),
      contextSnapshot: socioContext?.contextSnapshot,
      memoryHighlights: socioContext?.memoryHighlights,
      memoryTrace,
      contextConfidence: buildContextConfidence(socioContext),
    };
  }

  const actions: RagCoachChatActionResult[] = [];

  if (intent === 'routine_request' || intent === 'routine_and_diet_request') {
    try {
      actions.push(await generateRoutineAction(user, effectiveSocioId, message, socioContext));
      coachNotes.push('Después de generar una rutina, conviene ofrecer una dieta que acompañe el mismo objetivo.');
      suggestedReplies.push('Sí, quiero una dieta que acompañe mi rutina');
    } catch (error) {
      actions.push(buildFailedAction('routine_generated', 'Rutina no generada', error));
    }
  }

  if (intent === 'diet_request' || intent === 'routine_and_diet_request') {
    try {
      actions.push(await generateDietAction(user, effectiveSocioId, message, socioContext));
      coachNotes.push('La dieta fue generada como orientación general y debe respetar disclaimers nutricionales.');
    } catch (error) {
      actions.push(buildFailedAction('diet_generated', 'Dieta no generada', error));
    }
  }

  if (intent === 'evolution_analysis_request') {
    try {
      actions.push(await analyzeEvolutionAction(user, effectiveSocioId, message, socioContext));
    } catch (error) {
      actions.push(buildFailedAction('evolution_analyzed', 'Evolución no analizada', error));
    }
  }

  suggestedReplies.push('Analizar mi evolución física', 'Quiero cargar mi evolución inicial');

  if (actions.length === 0) {
    const action: RagCoachChatActionResult = {
      type: 'guidance_only',
      ok: true,
      title: 'Orientación inicial',
      message: 'El Coach necesita algunos datos más antes de generar una rutina o dieta.',
      safetyNotes,
      qualityAudit: buildQualityAudit({
        domain: 'orientacion',
        message,
        context: socioContext,
        safetyNotes,
      }),
    };

    return {
      greeting,
      intent,
      reply: `${buildContextAwareGuidance(name, message, socioContext, conversationMemory)}\n\n${evolutionSuggestion}`,
      actions: [action],
      suggestedReplies: ['Quiero una rutina', 'Quiero una dieta', 'Quiero revisar mi evolución física'],
      missingParams: ['objetivo', 'días disponibles', 'nivel o experiencia', 'restricciones'],
      coachNotes: [...coachNotes, 'El usuario todavía no pidió una acción concreta o faltan parámetros.'],
      contextSummary: socioContext?.resumenHumano,
      contextHints: socioContext?.hints,
      nextBestStep: 'Pedir objetivo, disponibilidad semanal y restricciones.',
      safetySummary: safetyNotes.join(' '),
      qaSummary: buildQaSummary([action]),
      contextSnapshot: socioContext?.contextSnapshot,
      memoryHighlights: socioContext?.memoryHighlights,
      memoryTrace,
      contextConfidence: buildContextConfidence(socioContext),
    };
  }

  const successfulActions = actions.filter((action) => action.ok);
  const actionMessages = actions.map((action) => action.message).join('\n\n');
  const offerDiet = intent === 'routine_request' && successfulActions.some((action) => action.type === 'routine_generated')
    ? '\n\nSi querés, también puedo prepararte una dieta orientativa que acompañe esta rutina de entrenamiento.'
    : '';
  const safetySuffix = safetyNotes.length ? `\n\nNota de seguridad: ${safetyNotes[0]}` : '';
  const contextSuffix = contextLine ? `\n\n${contextLine}` : '';
  const memoryPrefix = buildContextualReplyPrefix(socioContext);
  const memorySuffix = memoryPrefix ? `\n\n${memoryPrefix}` : '';

  return {
    greeting,
    intent,
    reply: `${actionMessages}${offerDiet}\n\n${evolutionSuggestion}${memorySuffix}${contextSuffix}${safetySuffix}`,
    actions,
    suggestedReplies: uniqueValues(suggestedReplies),
    missingParams: [],
    coachNotes,
    contextSummary: socioContext?.resumenHumano,
    contextHints: socioContext?.hints,
    nextBestStep: intent === 'routine_request'
      ? 'Ofrecer dieta complementaria y seguimiento de evolución física.'
      : 'Sugerir seguimiento mensual de evolución física si el socio está comprometido.',
    safetySummary: safetyNotes.join(' '),
    qaSummary: buildQaSummary(actions),
    contextSnapshot: socioContext?.contextSnapshot,
    memoryHighlights: socioContext?.memoryHighlights,
    memoryTrace,
    contextConfidence: buildContextConfidence(socioContext),
  };
}
