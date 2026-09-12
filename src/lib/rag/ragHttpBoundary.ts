import { NextResponse } from 'next/server';
import { HttpRuntimeError } from '@/lib/security/httpRuntimeSecurity';

export type RagKnownHttpError = Readonly<{
  message: string;
  status: number;
}>;

export function ragHttpErrorResponse(
  error: unknown,
  fallbackMessage: string,
  knownErrors: readonly RagKnownHttpError[] = [],
) {
  if (error instanceof HttpRuntimeError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: error.status },
    );
  }

  const message =
    error instanceof Error
      ? error.message
      : '';

  const knownError =
    knownErrors.find(
      (item) =>
        item.message === message,
    );

  if (knownError) {
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: knownError.status },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: fallbackMessage,
    },
    { status: 500 },
  );
}
