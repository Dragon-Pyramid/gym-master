import { NextResponse } from 'next/server';
import { FileUploadDTO } from '@/interfaces/fileUpload.interface';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { uploadFileCloudinaryWithResult } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const VALID_MEDIA_TYPES = /^image\/(png|jpe?g|webp|gif|svg\+xml|heic|heif)$/i;

function getStatusFromError(error: any) {
  const message = error?.message ?? '';

  if (message.includes('Token no proporcionado') || message.includes('Token inválido')) {
    return 401;
  }

  return 500;
}

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? '';
}

export async function POST(request: Request) {
  try {
    const { user } = await authMiddleware(request);
    const role = normalizeRole(user.rol);

    if (role !== 'admin' && role !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado para subir media de ejercicios.' },
        { status: 403 }
      );
    }

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

    if (!VALID_MEDIA_TYPES.test(file.type)) {
      return NextResponse.json(
        { error: 'Formato no válido. Usá PNG, JPG, WEBP, GIF, SVG, HEIC o HEIF.' },
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
  } catch (error: any) {
    const status = getStatusFromError(error);

    if (status === 500) {
      console.error('Error al subir media de ejercicio:', error);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Error al subir media de ejercicio.' },
      { status }
    );
  }
}
