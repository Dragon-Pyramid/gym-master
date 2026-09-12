import { NextResponse } from 'next/server';
import { FileUploadDTO } from '@/interfaces/fileUpload.interface';
import { uploadFileCloudinaryWithResult } from '@/lib/cloudinary';
import {
  hasSafeUploadSignature,
  isSafeUploadMimeType,
} from '@/lib/security/uploadValidation';
import { requestBodyTooLargeResponse } from '@/lib/security/httpRuntimeSecurity';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';
import {
  ejercicioMediaHttpErrorResponse,
} from '@/lib/rutinas/ejercicioMediaHttpBoundary';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BODY_BYTES = MAX_FILE_SIZE_BYTES + 512 * 1024;

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? '';
}

export async function POST(request: Request) {
  try {
    const user = await authorizeDashboardRequest(request, '/dashboard/rutinas/media', ['admin', 'usuario']);
    const role = normalizeRole(user.rol);

    if (role !== 'admin' && role !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado para subir media de ejercicios.' },
        { status: 403 }
      );
    }

    const oversizedRequest = requestBodyTooLargeResponse(request, MAX_REQUEST_BODY_BYTES);
    if (oversizedRequest) return oversizedRequest;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const idEjercicio = formData.get('id_ejercicio')?.toString();

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ninguna imagen o GIF.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'La imagen/GIF debe ser menor a 10MB.' },
        { status: 400 }
      );
    }

    if (!isSafeUploadMimeType(file.type) || file.type === 'application/pdf') {
      return NextResponse.json(
        { error: 'Formato no válido. Usá PNG, JPG, WEBP, GIF, HEIC o HEIF.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!hasSafeUploadSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: 'El contenido del archivo no coincide con una imagen permitida.' },
        { status: 400 }
      );
    }

    const fileDto: FileUploadDTO = {
      fieldName: file.name,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      buffer,
    };

    const folder = idEjercicio
      ? `gym-master/exercises/${idEjercicio}`
      : 'gym-master/exercises';

    const result = await uploadFileCloudinaryWithResult(
      fileDto.buffer,
      fileDto.originalName,
      folder
    );

    return NextResponse.json(
      {
        message: 'Media subida correctamente a Cloudinary.',
        url: result.secure_url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    const response =
      ejercicioMediaHttpErrorResponse(
        error,
        'No se pudo subir la media del ejercicio.',
      );

    if (response.status >= 500) {
      console.error(
        'Error al subir media de ejercicio:',
        {
          name:
            error instanceof Error
              ? error.name
              : 'UnknownError',
        },
      );
    }

    return response;
  }
}
