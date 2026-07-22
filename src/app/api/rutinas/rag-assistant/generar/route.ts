import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { dataGeneracionRutina } from '@/services/rutinaService';
import { buildRutinasRagContext } from '@/services/server/ragRutinasCoachService';
import type {
  RagRutinasAssistantRequest,
  RagRutinasContextSummary,
  RagRutinasIdioma,
} from '@/interfaces/ragRutinasAssistant.interface';
import {
  aiGeneratedContentTx,
  normalizeAiGeneratedContentLocale,
  translateAiGeneratedTechnicalList,
  translateAiGeneratedTechnicalText,
} from '@/utils/aiGeneratedContentI18n';

export const dynamic = 'force-dynamic';

type RagCoachPayload = {
  source: 'gym-master';
  contractVersion: 'v0.1';
  user: {
    id: string;
    id_socio?: string;
    email?: string;
    rol?: string;
  };
  request: Required<Pick<RagRutinasAssistantRequest, 'objetivo' | 'nivel' | 'dias'>> & {
    idioma: RagRutinasIdioma;
    mensajeSocio: string;
    restricciones: string;
  };
  expectedOutput: {
    structuredJson: true;
    saveRoutineInGymMaster: false;
    returnSuggestedParameters: true;
  };
};

type RagCoachResponse = {
  objetivo?: number;
  nivel?: number;
  dias?: number;
  idioma?: RagRutinasIdioma;
  resumen?: string;
  mensajeFinal?: string;
  advertencias?: string[];
  rutinaJson?: unknown;
  [key: string]: unknown;
};

const MAX_TEXT_LENGTH = 1200;
const DEFAULT_RAG_GENERATE_PATH = '/api/v1/routines/generate';

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, MAX_TEXT_LENGTH);
}

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeDias(value: unknown): number {
  const parsed = toPositiveInteger(value, 3);
  return Math.min(Math.max(parsed, 1), 6);
}

function normalizeIdioma(value: unknown): RagRutinasIdioma {
  return normalizeAiGeneratedContentLocale(value) as RagRutinasIdioma;
}

function getRagCoachEndpoint(): string | null {
  const rawBaseUrl = process.env.GYM_MASTER_RAG_COACH_URL?.trim();

  if (!rawBaseUrl) return null;

  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  const path = (
    process.env.GYM_MASTER_RAG_COACH_GENERATE_PATH || DEFAULT_RAG_GENERATE_PATH
  ).startsWith('/')
    ? process.env.GYM_MASTER_RAG_COACH_GENERATE_PATH || DEFAULT_RAG_GENERATE_PATH
    : `/${process.env.GYM_MASTER_RAG_COACH_GENERATE_PATH}`;

  return `${baseUrl}${path}`;
}

async function callRagCoach(payload: RagCoachPayload): Promise<RagCoachResponse> {
  const endpoint = getRagCoachEndpoint();

  if (!endpoint) {
    throw new Error('RAG Coach no configurado');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.GYM_MASTER_RAG_COACH_API_KEY
          ? { Authorization: `Bearer ${process.env.GYM_MASTER_RAG_COACH_API_KEY}` }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        typeof data?.error === 'string'
          ? data.error
          : 'El servicio gym-master-rag-coach respondió con error'
      );
    }

    return data as RagCoachResponse;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as RagRutinasAssistantRequest;

    const baseObjetivo = toPositiveInteger(body.objetivo, 1);
    const baseNivel = toPositiveInteger(body.nivel, 1);
    const baseDias = normalizeDias(body.dias);
    const idioma = normalizeIdioma(body.idioma);
    const mensajeSocio = cleanText(body.mensajeSocio);
    const restricciones = cleanText(body.restricciones);

    const ragPayload: RagCoachPayload = {
      source: 'gym-master',
      contractVersion: 'v0.1',
      user: {
        id: user.id,
        id_socio: user.id_socio,
        email: user.email,
        rol: user.rol,
      },
      request: {
        objetivo: baseObjetivo,
        nivel: baseNivel,
        dias: baseDias,
        idioma,
        mensajeSocio,
        restricciones,
      },
      expectedOutput: {
        structuredJson: true,
        saveRoutineInGymMaster: false,
        returnSuggestedParameters: true,
      },
    };

    let internalRagContext: RagRutinasContextSummary | undefined;
    let internalRagError: string | undefined;

    try {
      internalRagContext = await buildRutinasRagContext(user, {
        objetivo: baseObjetivo,
        nivel: baseNivel,
        dias: baseDias,
        idioma,
        mensajeSocio,
        restricciones,
        id_socio: body.id_socio,
      });
    } catch (error) {
      internalRagError = error instanceof Error ? translateAiGeneratedTechnicalText(error.message, idioma) : translateAiGeneratedTechnicalText('Error desconocido al consultar RAG interno', idioma);
      console.warn('RAG interno de rutinas no disponible. Se usa fallback local:', internalRagError);
    }

    let ragRespuesta: RagCoachResponse | undefined;
    let ragError: string | undefined;
    const ragConfigurado = Boolean(getRagCoachEndpoint());

    if (ragConfigurado) {
      try {
        ragRespuesta = await callRagCoach(ragPayload);
      } catch (error) {
        ragError = error instanceof Error ? translateAiGeneratedTechnicalText(error.message, idioma) : translateAiGeneratedTechnicalText('Error desconocido del RAG Coach', idioma);
        console.warn('RAG Coach no disponible. Se usa fallback local:', ragError);
      }
    }

    const objetivoFinal = toPositiveInteger(ragRespuesta?.objetivo, baseObjetivo);
    const nivelFinal = toPositiveInteger(ragRespuesta?.nivel, baseNivel);
    const diasFinal = normalizeDias(ragRespuesta?.dias ?? baseDias);
    const idiomaFinal = normalizeIdioma(ragRespuesta?.idioma ?? idioma);

    const rutinaGenerada = await dataGeneracionRutina(user, {
      objetivo: objetivoFinal,
      nivel: nivelFinal,
      dias: diasFinal,
      id_socio: body.id_socio,
    });

    const ragContextUsed = Boolean(internalRagContext?.used);
    const modo: 'external_rag_bridge' | 'internal_rag' | 'local_fallback' = ragRespuesta ? 'external_rag_bridge' : ragContextUsed ? 'internal_rag' : 'local_fallback';
    const warnings = translateAiGeneratedTechnicalList([
      ...(Array.isArray(ragRespuesta?.advertencias) ? ragRespuesta.advertencias : []),
      ...(internalRagContext?.warnings ?? []),
      ...(internalRagError ? [internalRagError] : []),
      ...(ragError ? [ragError] : []),
    ], idiomaFinal);

    const mensajeFinal =
      ragRespuesta?.mensajeFinal ||
      (ragContextUsed
        ? aiGeneratedContentTx(idiomaFinal, 'Tu rutina se generó usando el generador formal de Gym Master y referencias reales recuperadas por el RAG Coach.', "Your routine was generated using Gym Master's formal generator and real references retrieved by the RAG Coach.")
        : aiGeneratedContentTx(idiomaFinal, 'Tu rutina se generó en base a los datos indicados. Dirigite al menú Rutinas y allí la encontrarás.', 'Your routine was generated based on the provided data. Go to the Routines menu to find it.'));

    const resumen =
      ragRespuesta?.resumen ||
      internalRagContext?.summary ||
      aiGeneratedContentTx(idiomaFinal, 'Se utilizó el generador formal de Gym Master con los parámetros seleccionados por el socio.', "Gym Master's formal generator was used with the parameters selected by the member.");

    return NextResponse.json(
      {
        ok: true,
        message: aiGeneratedContentTx(idiomaFinal, 'Rutina generada correctamente desde el asistente.', 'Routine generated successfully from the assistant.'),
        data: {
          modo,
          ragConfigurado: ragConfigurado || Boolean(internalRagContext?.enabled),
          rutinaGenerada,
          parametros: {
            objetivo: objetivoFinal,
            nivel: nivelFinal,
            dias: diasFinal,
            idioma: idiomaFinal,
          },
          mensajeFinal,
          resumen,
          advertencias: warnings,
          ragContext: internalRagContext,
          ragRespuesta,
          ragError,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : translateAiGeneratedTechnicalText('Error inesperado', 'es');
    const status = message.toLowerCase().includes('token') ? 401 : 500;

    console.error('Error en asistente RAG de rutinas:', error);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}
