import { NextResponse } from 'next/server';
import { uploadFileCloudinary } from '@/lib/cloudinary';
import {
  hasSafeUploadSignature,
  isSafeUploadMimeType,
} from '@/lib/security/uploadValidation';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await authorizeDashboardRequest(request, '/dashboard/otros-gastos', ['admin', 'usuario']);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ningún comprobante.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'El comprobante debe ser menor a 10MB.' },
        { status: 400 }
      );
    }

    if (!isSafeUploadMimeType(file.type)) {
      return NextResponse.json(
        { error: 'Formato no válido. Usá PDF, PNG, JPG, WEBP, GIF, HEIC o HEIF.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!hasSafeUploadSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: 'El contenido del archivo no coincide con el formato declarado.' },
        { status: 400 }
      );
    }

    const folder = `gastos/comprobantes/${user.id}`;
    const url = await uploadFileCloudinary(buffer, file.name, folder);

    if (!url) {
      return NextResponse.json(
        { error: 'Error al subir el comprobante.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          url,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error?.message || 'Error al subir comprobante.';
    const status =
      message.includes('Token no proporcionado') || message.includes('Token inválido')
        ? 401
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
