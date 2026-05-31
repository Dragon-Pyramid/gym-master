import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { uploadFileCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const VALID_TYPES = /^(application\/pdf|image\/(png|jpe?g|webp|gif|heic|heif))$/i;

export async function POST(request: Request) {
  try {
    const { user } = await authMiddleware(request);
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

    if (!VALID_TYPES.test(file.type)) {
      return NextResponse.json(
        { error: 'Formato no válido. Usá PDF, PNG, JPG, WEBP, GIF, HEIC o HEIF.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const folder = `gastos/comprobantes/${user?.id ?? 'admin'}`;
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
    const message = error?.message || 'Error al subir comprobante.';
    const status =
      message.includes('Token no proporcionado') || message.includes('Token inválido')
        ? 401
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
