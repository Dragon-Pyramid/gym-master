import { NextResponse } from 'next/server';
import { authorizationErrorResponse } from '@/lib/auth/serverAuthorization';

// Only trusted domain code may construct this error. Technical errors remain Error.
export class ComercialValidationError extends Error {
  readonly publicMessage: string;

  constructor(publicMessage: string, internalMessage: string = publicMessage) {
    super(internalMessage);
    this.name = 'ComercialValidationError';
    this.publicMessage = publicMessage;
  }
}

export function comercialErrorResponse(error: unknown, fallback: string) {
  const authResponse = authorizationErrorResponse(error);
  if (authResponse) return authResponse;

  if (error instanceof ComercialValidationError) {
    return NextResponse.json({ error: error.publicMessage }, { status: 400 });
  }

  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function readComercialJson<T = any>(request: Request): Promise<T> {
  try {
    return await request.json() as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ComercialValidationError('Solicitud JSON inválida.');
    }
    throw error;
  }
}
