import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import type {
  RagEvolucionFisicaAssistantRequest,
  RagEvolucionFisicaIdioma,
} from '@/interfaces/ragEvolucionFisicaAssistant.interface';
import { analyzeEvolucionFisicaWithRag } from '@/services/server/ragEvolucionFisicaCoachService';
import { aiGeneratedContentTx, normalizeAiGeneratedContentLocale, translateAiGeneratedTechnicalText } from '@/utils/aiGeneratedContentI18n';

export const dynamic = 'force-dynamic';

const MAX_TEXT_LENGTH = 1200;

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH);
}

function normalizeIdioma(value: unknown): RagEvolucionFisicaIdioma {
  return normalizeAiGeneratedContentLocale(value) as RagEvolucionFisicaIdioma;
}

function validatePayload(body: Partial<RagEvolucionFisicaAssistantRequest>) {
  return {
    socio_id: cleanText(body.socio_id),
    idioma: normalizeIdioma(body.idioma),
    mensajeSocio: cleanText(body.mensajeSocio),
    objetivo: cleanText(body.objetivo),
    restricciones: cleanText(body.restricciones),
  } satisfies RagEvolucionFisicaAssistantRequest;
}

function getStatusFromError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('token') || normalized.includes('unauthorized')) return 401;
  if (normalized.includes('no autorizado')) return 403;
  if (normalized.includes('debe indicar') || normalized.includes('must provide') || normalized.includes('socio')) return 400;
  return 500;
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<RagEvolucionFisicaAssistantRequest>;
    const payload = validatePayload(body);
    const data = await analyzeEvolucionFisicaWithRag(user, payload);

    return NextResponse.json(
      {
        ok: true,
        message: aiGeneratedContentTx(payload.idioma, 'Análisis de evolución física generado correctamente desde RAG Coach.', 'Physical evolution analysis generated successfully from RAG Coach.'),
        data: {
          ...data,
          parametros: {
            idioma: payload.idioma ?? 'es',
            objetivo: payload.objetivo,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : translateAiGeneratedTechnicalText('Error inesperado', 'es');

    console.error('Error en RAG Coach evolución física:', error);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: getStatusFromError(message) },
    );
  }
}
