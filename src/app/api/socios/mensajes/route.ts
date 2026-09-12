import { NextResponse } from 'next/server';
import { createMensajeSocio, getMensajesSocio } from '@/services/socioMensajeService';
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import {
  HttpRuntimeError,
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';

export const dynamic = 'force-dynamic';

type CreateSocioMensajeRequestBody =
  Parameters<typeof createMensajeSocio>[0];

function socioMensajeErrorResponse(
  error: unknown,
  fallback: string,
) {
  if (error instanceof HttpRuntimeError) {
    return runtimeErrorResponse(error, fallback);
  }

  const message =
    error instanceof Error ? error.message : '';

  if (
    message ===
      'Solo los socios pueden usar esta bandeja personal' ||
    message ===
      'No autorizado para administrar mensajes de socios'
  ) {
    return NextResponse.json(
      { error: message },
      { status: 403 },
    );
  }

  if (
    message === 'El asunto es obligatorio' ||
    message === 'El mensaje es obligatorio'
  ) {
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }

  console.error(fallback, {
    name: error instanceof Error
      ? error.name
      : 'UnknownError',
  });

  return NextResponse.json(
    { error: fallback },
    { status: 500 },
  );
}

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/mensajes', ['socio']);
    const mensajes = await getMensajesSocio(user);
    return NextResponse.json({ data: mensajes });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return socioMensajeErrorResponse(
      error,
      'No se pudieron obtener los mensajes',
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/mensajes', ['socio']);
    const body =
      await readJsonBody<CreateSocioMensajeRequestBody>(
        req,
        64 * 1024,
      );

    const mensaje =
      await createMensajeSocio(body, user);
    return NextResponse.json({ data: mensaje }, { status: 201 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return socioMensajeErrorResponse(
      error,
      'No se pudo enviar el mensaje',
    );
  }
}
