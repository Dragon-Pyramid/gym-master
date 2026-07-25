import { NextResponse } from 'next/server';
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

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BODY_BYTES = MAX_FILE_SIZE_BYTES + 512 * 1024;

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? '';
}

function getStatusFromError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (message.includes('Token no proporcionado') || message.includes('Token inválido')) return 401;
  return 500;
}

export async function POST(request: Request) {
  try {
    const user = await authorizeDashboardRequest(request, '/dashboard/gimnasio-parametrizacion', ['admin']);
    const role = normalizeRole(user.rol);

    if (role !== 'admin' && role !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado para subir logos del gimnasio.' },
        { status: 403 }
      );
    }

    const oversizedRequest = requestBodyTooLargeResponse(request, MAX_REQUEST_BODY_BYTES);
    if (oversizedRequest) return oversizedRequest;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún logo.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'El logo debe ser menor a 5MB.' },
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

    const folder = 'gym-master/gimnasio/branding';

    const result = await uploadFileCloudinaryWithResult(buffer, file.name, folder);

    return NextResponse.json(
      {
        data: {
          url: result.secure_url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const status = getStatusFromError(error);

    if (status === 500) {
      console.error('Error al subir logo del gimnasio a Cloudinary:', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
    }

    return NextResponse.json(
      { error: status >= 500 ? 'No se pudo subir el logo del gimnasio.' : 'Solicitud no autorizada.' },
      { status }
    );
  }
}
