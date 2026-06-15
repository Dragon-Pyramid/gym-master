import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type {
  RagCoachChatActionResult,
  RagCoachChatIntent,
  RagCoachChatRequest,
  RagCoachChatResponseData,
} from '@/interfaces/ragCoachChat.interface';
import { dataGeneracionRutina } from '@/services/rutinaService';
import { createDietaSocio } from '@/services/dietaService';
import { findAllEvolucionesSocioByIdSocio } from '@/services/evolucionSocioService';
import { buildRutinasRagContext } from './ragRutinasCoachService';
import { buildDietasRagContext } from './ragDietasCoachService';
import { analyzeEvolucionFisicaWithRag } from './ragEvolucionFisicaCoachService';
import { buildRagCoachSocioContext, type RagCoachSocioContext } from './ragCoachSocioContextService';

const MAX_MESSAGE_LENGTH = 1600;

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

function resolveSocioId(user: JwtUser, requested?: string | null) {
  const cleanRequested = cleanText(requested);
  if (cleanRequested && cleanRequested !== 'me') return cleanRequested;
  return user.id_socio || '';
}

function getDisplayName(user: JwtUser) {
  return cleanText(user.nombre, 80) || cleanText(user.email, 80) || 'socio';
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

function buildContextAwareGuidance(name: string, message: string, context?: RagCoachSocioContext | null) {
  const base = buildGuidanceReply(name, message, context);
  const contextLine = getContextCoachLine(context);
  if (!contextLine) return base;
  return `${base}\n\n${contextLine}`;
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

  await buildRutinasRagContext(user, {
    objetivo,
    nivel,
    dias,
    idioma: 'es',
    mensajeSocio: message,
    restricciones,
    id_socio: socioId,
  }).catch(() => undefined);

  const rutinaGenerada = await dataGeneracionRutina(user, {
    objetivo,
    nivel,
    dias,
    id_socio: socioId,
  });

  return {
    type: 'routine_generated',
    ok: true,
    title: 'Rutina generada',
    message: `Listo, ya generé y guardé tu rutina de ${dias} días. ${routineViewMessage()}`,
    viewPath: '/dashboard/rutinas/asistente',
    viewLabel: 'Ver rutina',
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

  await buildDietasRagContext(user, {
    socio_id: socioId,
    objetivo,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    idioma: 'es',
    mensajeSocio: message,
    restricciones,
    preferencias: '',
  }).catch(() => undefined);

  const dietaGenerada = await createDietaSocio(
    {
      socio_id: socioId,
      objetivo: String(objetivo),
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    },
    user,
  );

  return {
    type: 'diet_generated',
    ok: true,
    title: 'Dieta generada',
    message: `Listo, ya generé y guardé tu dieta orientativa por 30 días. ${dietViewMessage()}`,
    viewPath: '/dashboard/dietas',
    viewLabel: 'Ver dieta',
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
  const socioId = resolveSocioId(user, payload.socio_id);

  if (!socioId && !isAdminRole(user.rol)) {
    throw new Error('No se pudo identificar el socio autenticado.');
  }

  const effectiveSocioId = socioId || cleanText(payload.socio_id);
  if (!effectiveSocioId) {
    throw new Error('Debe indicar un socio para usar el Coach IA.');
  }

  const socioContext = await buildRagCoachSocioContext(user, effectiveSocioId).catch((error) => {
    console.warn('No se pudo construir contexto del socio para el Coach IA:', error);
    return null;
  });

  const intent = detectIntent(message);
  const actions: RagCoachChatActionResult[] = [];
  const coachNotes: string[] = [];
  const missingParams: string[] = [];
  const suggestedReplies: string[] = [];

  if (intent === 'routine_request' || intent === 'routine_and_diet_request') {
    actions.push(await generateRoutineAction(user, effectiveSocioId, message, socioContext));
    coachNotes.push('Después de generar una rutina, conviene ofrecer una dieta que acompañe el mismo objetivo.');
    suggestedReplies.push('Sí, quiero una dieta que acompañe mi rutina');
  }

  if (intent === 'diet_request' || intent === 'routine_and_diet_request') {
    actions.push(await generateDietAction(user, effectiveSocioId, message, socioContext));
    coachNotes.push('La dieta fue generada como orientación general y debe respetar disclaimers nutricionales.');
  }

  if (intent === 'evolution_analysis_request') {
    actions.push(await analyzeEvolutionAction(user, effectiveSocioId, message, socioContext));
  }

  const evolutionSuggestion = await getEvolutionSuggestion(user, effectiveSocioId, socioContext);
  const contextLine = getContextCoachLine(socioContext);
  if (contextLine) coachNotes.push(contextLine);
  coachNotes.push(...(socioContext?.hints ?? []));
  suggestedReplies.push('Analizar mi evolución física', 'Quiero cargar mi evolución inicial');

  if (actions.length === 0) {
    return {
      greeting,
      intent,
      reply: `${buildContextAwareGuidance(name, message, socioContext)}\n\n${evolutionSuggestion}`,
      actions: [
        {
          type: 'guidance_only',
          ok: true,
          title: 'Orientación inicial',
          message: 'El Coach necesita algunos datos más antes de generar una rutina o dieta.',
        },
      ],
      suggestedReplies: ['Quiero una rutina', 'Quiero una dieta', 'Quiero revisar mi evolución física'],
      missingParams: ['objetivo', 'días disponibles', 'nivel o experiencia', 'restricciones'],
      coachNotes: [...coachNotes, 'El usuario todavía no pidió una acción concreta o faltan parámetros.'],
      contextSummary: socioContext?.resumenHumano,
      contextHints: socioContext?.hints,
      nextBestStep: 'Pedir objetivo, disponibilidad semanal y restricciones.',
    };
  }

  const actionMessages = actions.map((action) => action.message).join('\n\n');
  const offerDiet = intent === 'routine_request'
    ? '\n\nSi querés, también puedo prepararte una dieta orientativa que acompañe esta rutina de entrenamiento.'
    : '';

  const contextSuffix = contextLine ? `\n\n${contextLine}` : '';

  return {
    greeting,
    intent,
    reply: `${actionMessages}${offerDiet}\n\n${evolutionSuggestion}${contextSuffix}`,
    actions,
    suggestedReplies,
    missingParams,
    coachNotes,
    contextSummary: socioContext?.resumenHumano,
    contextHints: socioContext?.hints,
    nextBestStep: intent === 'routine_request'
      ? 'Ofrecer dieta complementaria y seguimiento de evolución física.'
      : 'Sugerir seguimiento mensual de evolución física si el socio está comprometido.',
  };
}
