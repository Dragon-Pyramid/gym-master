import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { uploadFileCloudinaryWithResult } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const VALID_IMAGE_TYPES = /^image\/(png|jpe?g|webp|gif|svg\+xml)$/i;

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
    const { user } = await authMiddleware(request);
    const role = normalizeRole(user.rol);

    if (role !== 'admin' && role !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado para subir logos del gimnasio.' },
        { status: 403 }
      );
    }

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

    if (!VALID_IMAGE_TYPES.test(file.type)) {
      return NextResponse.json(
        { error: 'Formato no válido. Usá PNG, JPG, WEBP, GIF o SVG.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
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
    const status = getStatusFromError(error);

    if (status === 500) {
      console.error('Error al subir logo del gimnasio a Cloudinary:', error);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir logo del gimnasio.' },
      { status }
    );
  }
}
