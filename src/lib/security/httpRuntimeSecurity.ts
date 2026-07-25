import { NextResponse } from 'next/server';

const JSON_CONTENT_TYPES = new Set([
  'application/json',
  'application/ld+json',
  'application/problem+json',
]);

export class HttpRuntimeError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'HttpRuntimeError';
    this.code = code;
    this.status = status;
  }
}

function getContentType(request: Request) {
  return request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? '';
}

function getDeclaredContentLength(request: Request) {
  const raw = request.headers.get('content-length');
  if (!raw) return null;

  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export function noStoreJson<T>(
  payload: T,
  status = 200,
  headers?: HeadersInit,
) {
  return NextResponse.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

export function requestBodyTooLargeResponse(
  request: Request,
  maxBytes: number,
) {
  const declaredLength = getDeclaredContentLength(request);

  if (declaredLength !== null && declaredLength > maxBytes) {
    return noStoreJson(
      {
        error: 'El cuerpo de la solicitud supera el tamaño permitido',
        error_code: 'REQUEST_BODY_TOO_LARGE',
      },
      413,
    );
  }

  return null;
}

export async function readJsonBody<T = Record<string, unknown>>(
  request: Request,
  maxBytes = 32 * 1024,
): Promise<T> {
  const oversized = requestBodyTooLargeResponse(request, maxBytes);
  if (oversized) {
    throw new HttpRuntimeError(
      'El cuerpo de la solicitud supera el tamaño permitido',
      'REQUEST_BODY_TOO_LARGE',
      413,
    );
  }

  const contentType = getContentType(request);
  if (contentType && !JSON_CONTENT_TYPES.has(contentType) && !contentType.endsWith('+json')) {
    throw new HttpRuntimeError(
      'Content-Type no permitido; se esperaba application/json',
      'UNSUPPORTED_MEDIA_TYPE',
      415,
    );
  }

  const rawBody = await request.text();
  if (getUtf8ByteLength(rawBody) > maxBytes) {
    throw new HttpRuntimeError(
      'El cuerpo de la solicitud supera el tamaño permitido',
      'REQUEST_BODY_TOO_LARGE',
      413,
    );
  }

  if (!rawBody.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new HttpRuntimeError(
      'El cuerpo JSON de la solicitud es inválido',
      'INVALID_JSON_BODY',
      400,
    );
  }
}

export async function readTextBody(
  request: Request,
  maxBytes: number,
) {
  const oversized = requestBodyTooLargeResponse(request, maxBytes);
  if (oversized) {
    throw new HttpRuntimeError(
      'El cuerpo de la solicitud supera el tamaño permitido',
      'REQUEST_BODY_TOO_LARGE',
      413,
    );
  }

  const rawBody = await request.text();
  if (getUtf8ByteLength(rawBody) > maxBytes) {
    throw new HttpRuntimeError(
      'El cuerpo de la solicitud supera el tamaño permitido',
      'REQUEST_BODY_TOO_LARGE',
      413,
    );
  }

  return rawBody;
}

export function runtimeErrorResponse(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 500,
) {
  if (error instanceof HttpRuntimeError) {
    return noStoreJson(
      { error: error.message, error_code: error.code },
      error.status,
    );
  }

  return noStoreJson(
    { error: fallbackMessage, error_code: 'INTERNAL_SERVER_ERROR' },
    fallbackStatus,
  );
}
