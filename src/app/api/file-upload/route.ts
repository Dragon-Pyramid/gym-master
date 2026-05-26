import { FileUploadDTO } from '@/interfaces/fileUpload.interface';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { uploadFile } from '@/services/fileUploadService';
import { updateFotoUsuarioById } from '@/services/usuarioService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const VALID_IMAGE_TYPES = /^image\/(png|jpe?g|webp|gif|svg\+xml|heic|heif)$/i;

export async function POST(request: Request) {
  try {
    const { user } = await authMiddleware(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    if (!VALID_IMAGE_TYPES.test(file.type)) {
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
    console.error('error file:', error);
    const message = error?.message || 'Error al subir la imagen.';
    const status =
      message.includes('Token no proporcionado') || message.includes('Token inválido')
        ? 401
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
