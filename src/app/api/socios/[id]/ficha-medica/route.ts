import { NextResponse } from 'next/server';
import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import { createFichaMedicaSocio, resolveFichaMedicaSocioId } from '@/services/fichaMedicaService';
import { FileUploadDTO } from '@/interfaces/fileUpload.interface';
import {
  hasSafeUploadSignature,
} from '@/lib/security/uploadValidation';
import { requestBodyTooLargeResponse } from '@/lib/security/httpRuntimeSecurity';


function getFichaMedicaErrorStatus(message?: string) {
  if (message?.includes('No autorizado')) return 403;
  if (message?.includes('No se encontró')) return 404;
  if (message?.includes('no proporcionado')) return 400;
  return 500;
}

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BODY_BYTES = 30 * 1024 * 1024;
const VALID_MEDICAL_FILE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

async function toFileDto(file: File, fieldName: string): Promise<FileUploadDTO> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`El archivo ${file.name} supera el límite de 5MB.`);
  }

  if (!VALID_MEDICAL_FILE_TYPES.has(file.type)) {
    throw new Error(`Formato no válido para ${file.name}. Usá PDF, JPG o PNG.`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!hasSafeUploadSignature(buffer, file.type)) {
    throw new Error(`El contenido de ${file.name} no coincide con el formato declarado.`);
  }

  return {
    fieldName,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    buffer,
  };
}

function getFiles(formdata: FormData, key: string) {
  return formdata.getAll(key).filter((value): value is File => value instanceof File && value.size > 0);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      '/dashboard/ficha-medica',
      ['admin', 'usuario'],
      ['socio'],
    );

    const paramsResolved = await params;
    const id = paramsResolved?.id;

    if (!id) {
      return NextResponse.json(
        {
          error: 'ID de socio no proporcionado',
          code: 'missing_socio_id',
        },
        { status: 400 }
      );
    }

    const oversizedRequest = requestBodyTooLargeResponse(req, MAX_REQUEST_BODY_BYTES);
    if (oversizedRequest) return oversizedRequest;

    const formdata = await req.formData();
    const fichaRaw = formdata.get('ficha');

    if (!fichaRaw) {
      return NextResponse.json(
        { error: 'Campo "ficha" ausente en form-data', code: 'missing_ficha' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        {
          error: 'Ficha inválida: JSON malformado',
          code: 'invalid_ficha_json',
        },
        { status: 400 }
      );
    }

    const approvalFiles = getFiles(formdata, 'archivo_aprobacion');
    const attachedFiles = [
      ...getFiles(formdata, 'archivos_adjuntos'),
      ...getFiles(formdata, 'file'),
    ];

    const archivoAprobacion = approvalFiles[0]
      ? await toFileDto(approvalFiles[0], 'archivo_aprobacion')
      : null;

    if (ficha?.aprobacion_medica === true && !archivoAprobacion) {
      return NextResponse.json(
        {
          error: 'El archivo de aprobación médica es obligatorio cuando se marca apto médico.',
          code: 'missing_medical_approval_file',
        },
        { status: 400 }
      );
    }

    const archivosAdjuntos = await Promise.all(
      attachedFiles.map((file) => toFileDto(file, 'archivos_adjuntos'))
    );

    const resolvedSocioId = await resolveFichaMedicaSocioId(user, id);

    const fichaMedica = await createFichaMedicaSocio(user, resolvedSocioId, ficha, {
      archivo_aprobacion: archivoAprobacion,
      archivos_adjuntos: archivosAdjuntos,
    });

    return NextResponse.json(
      { message: 'Ficha médica cargada con éxito', data: fichaMedica },
      { status: 201 }
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const status = getFichaMedicaErrorStatus(error?.message);
    if (status >= 500) {
      console.error('Error al crear ficha médica:', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
    }
    return NextResponse.json(
      {
        error: status >= 500
          ? 'No se pudo crear la ficha médica'
          : error?.message || 'Solicitud inválida',
        code: status >= 500 ? 'server_error' : 'request_error',
      },
      { status }
    );
  }
}
