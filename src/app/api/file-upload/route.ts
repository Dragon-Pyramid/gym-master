import { FileUploadDTO } from '@/interfaces/fileUpload.interface';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { authorizationErrorResponse } from '@/lib/auth/serverAuthorization';
import { uploadFile } from '@/services/fileUploadService';
import { updateFotoUsuarioById } from '@/services/usuarioService';
import {
  hasSafeUploadSignature,
  isSafeUploadMimeType,
} from '@/lib/security/uploadValidation';
import { requestBodyTooLargeResponse } from '@/lib/security/httpRuntimeSecurity';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BODY_BYTES = MAX_FILE_SIZE_BYTES + 512 * 1024;

export async function POST(request: Request) {
  try {
    const { user } = await authMiddleware(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oversizedRequest = requestBodyTooLargeResponse(request, MAX_REQUEST_BODY_BYTES);
    if (oversizedRequest) return oversizedRequest;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ninguna imagen.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'La imagen debe ser menor a 5MB.' },
        { status: 400 }
      );
    }

    if (!isSafeUploadMimeType(file.type) || file.type === 'application/pdf') {
      return NextResponse.json(
        {
          error:
            'Formato no válido. Usá PNG, JPG, WEBP, GIF, HEIC o HEIF.',
        },
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

    const folder = `${user.rol}/profile`;
    const uploadedUrl = await uploadFile(fileDto, folder);

    if (!uploadedUrl) {
      return NextResponse.json(
        { error: 'Error al subir la imagen.' },
        { status: 500 }
      );
    }

    await updateFotoUsuarioById(user, uploadedUrl);

    return NextResponse.json(
      {
        message: 'Foto de perfil actualizada.',
        url: uploadedUrl,
        foto: uploadedUrl,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error al subir foto de perfil:', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { error: 'No se pudo subir la imagen.' },
      { status: 500 }
    );
  }
}
