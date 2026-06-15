import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { createDietaSocio } from '@/services/dietaService';
import { buildDietasRagContext } from '@/services/server/ragDietasCoachService';
import type {
  RagDietasAssistantRequest,
  RagDietasContextSummary,
  RagDietasIdioma,
} from '@/interfaces/ragDietasAssistant.interface';

export const dynamic = 'force-dynamic';

const MAX_TEXT_LENGTH = 1200;

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, MAX_TEXT_LENGTH);
}

function normalizeIdioma(value: unknown): RagDietasIdioma {
  return value === 'en' ? 'en' : 'es';
}

function validateDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function validatePayload(body: Partial<RagDietasAssistantRequest>, fallbackSocioId?: string | null) {
  const socioId = cleanText(body.socio_id) || cleanText(fallbackSocioId);
  const objetivo = body.objetivo;
  const fechaInicio = validateDate(body.fecha_inicio);
  const fechaFin = validateDate(body.fecha_fin);

  if (!socioId || !objetivo || !fechaInicio || !fechaFin) {
    throw new Error('Debe enviar socio_id, objetivo, fecha_inicio y fecha_fin.');
  }

  return {
    socio_id: socioId,
    objetivo,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    idioma: normalizeIdioma(body.idioma),
    mensajeSocio: cleanText(body.mensajeSocio),
    restricciones: cleanText(body.restricciones),
    preferencias: cleanText(body.preferencias),
  } satisfies RagDietasAssistantRequest;
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<RagDietasAssistantRequest>;
    const payload = validatePayload(body, user.id_socio);

    let ragContext: RagDietasContextSummary | undefined;
    let ragError: string | undefined;

    try {
      ragContext = await buildDietasRagContext(user, payload);
    } catch (error) {
      ragError = error instanceof Error ? error.message : 'Error desconocido al consultar RAG de dietas';
      console.warn('RAG interno de dietas no disponible. Se usa fallback local:', ragError);
    }

    const dietaGenerada = await createDietaSocio(
      {
        socio_id: payload.socio_id,
        objetivo: String(payload.objetivo),
        fecha_inicio: payload.fecha_inicio,
        fecha_fin: payload.fecha_fin,
      },
      user,
    );

    const ragContextUsed = Boolean(ragContext?.used);
    const warnings = [
      ...(ragContext?.warnings ?? []),
      ...(ragError ? [ragError] : []),
    ];
    const disclaimers = ragContext?.disclaimers ?? [
      'La dieta generada es orientativa y no reemplaza la evaluación de un nutricionista matriculado.',
    ];

    return NextResponse.json(
      {
        ok: true,
        message: 'Dieta generada correctamente desde el asistente RAG.',
        data: {
          modo: ragContextUsed ? 'internal_rag' : 'local_fallback',
          ragConfigurado: Boolean(ragContext?.enabled),
          dietaGenerada,
          parametros: {
            socio_id: payload.socio_id,
            objetivo: payload.objetivo,
            fecha_inicio: payload.fecha_inicio,
            fecha_fin: payload.fecha_fin,
            idioma: payload.idioma,
          },
          mensajeFinal: ragContextUsed
            ? 'La dieta se generó con el generador formal de Gym Master y referencias nutricionales recuperadas por el RAG Coach.'
            : 'La dieta se generó con el generador formal de Gym Master y fallback seguro.',
          resumen: ragContext?.summary ?? 'Se utilizó el generador formal de Gym Master con los parámetros indicados.',
          advertencias: warnings,
          disclaimers,
          ragContext,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = message.toLowerCase().includes('token') ? 401 : message.includes('Debe enviar') ? 400 : 500;

    console.error('Error en asistente RAG de dietas:', error);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status },
    );
  }
}
