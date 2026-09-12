import { NextResponse } from 'next/server';
import { HttpRuntimeError } from '@/lib/security/httpRuntimeSecurity';

const MEDIA_ADMIN_ERROR =
  'No autorizado para administrar media de ejercicios.';

const IMPORT_VALIDATION_ERRORS = new Set([
  'Debe indicar una URL de imagen o GIF para importar.',
  'La URL de imagen no es válida.',
  'La URL debe usar protocolo http o https.',
  'No se permiten URLs locales, privadas o internas.',
  'La imagen ya pertenece a Cloudinary. No es necesario importarla nuevamente.',
  'La URL externa no parece ser una imagen/GIF válido.',
  'La imagen/GIF remoto supera el máximo permitido de 10MB.',
  'La URL externa tardó demasiado en responder.',
  'Debe indicar un id_ejercicio válido.',
]);

type EjercicioMediaHttpOptions = Readonly<{
  allowImportValidation?: boolean;
}>;

export function ejercicioMediaHttpErrorResponse(
  error: unknown,
  fallbackMessage: string,
  options: EjercicioMediaHttpOptions = {},
) {
  if (error instanceof HttpRuntimeError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const message =
    error instanceof Error
      ? error.message
      : '';

  if (message === MEDIA_ADMIN_ERROR) {
    return NextResponse.json(
      { error: MEDIA_ADMIN_ERROR },
      { status: 403 },
    );
  }

  if (
    options.allowImportValidation &&
    IMPORT_VALIDATION_ERRORS.has(message)
  ) {
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }

  if (
    options.allowImportValidation &&
    message.startsWith(
      'La URL externa respondió con estado ',
    )
  ) {
    return NextResponse.json(
      {
        error:
          'La URL externa no pudo descargarse correctamente.',
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { error: fallbackMessage },
    { status: 500 },
  );
}
