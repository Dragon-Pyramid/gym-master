import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { createFichaMedicaSocio } from '@/services/fichaMedicaService';
import { FileUploadDTO } from '@/interfaces/fileUpload.interface';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autorizado', code: 'unauthorized' },
        { status: 401 }
      );
    }

    console.log('Request URL:', req.url);
    console.log('Params recibidos:', params);

    const paramsResolved = await params;
    const id = paramsResolved?.id;

    if (!id) {
      return NextResponse.json(
        {
          error: 'ID de socio no proporcionado',
          code: 'missing_socio_id',
          params,
        },
        { status: 400 }
      );
    }

    const formdata = await req.formData();
    const fichaRaw = formdata.get('ficha');
    const file = formdata.get('file');

    if (!fichaRaw) {
      return NextResponse.json(
        { error: 'Campo "ficha" ausente en form-data', code: 'missing_ficha' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Campo "file" ausente en form-data', code: 'missing_file' },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: 'El campo "file" no es un archivo válido',
          code: 'invalid_file_type',
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
      buffer: buffer,
    };

    let ficha;
    try {
      if (typeof fichaRaw === 'string') {
        ficha = JSON.parse(fichaRaw);
      } else if (fichaRaw instanceof File) {
        const txt = await fichaRaw.text();
        ficha = JSON.parse(txt);
      } else {
        ficha = JSON.parse(String(fichaRaw));
      }
    } catch (err: any) {
      console.log('Error parseando ficha:', err);
      return NextResponse.json(
        {
          error: 'Ficha inválida: JSON malformado',
          code: 'invalid_ficha_json',
          details: err?.message,
        },
        { status: 400 }
      );
    }

    const fichaMedica = await createFichaMedicaSocio(user, id, ficha, fileDto);

    return NextResponse.json(
      { message: 'ficha cargada con exito', data: fichaMedica },
      { status: 201 }
    );
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { error: error.message || 'Error interno', code: 'server_error' },
      { status: 500 }
    );
  }
}
