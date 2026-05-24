import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { registrarAsistenciaDesdeQR } from '@/services/asistenciaService';


export const dynamic = 'force-dynamic';

function getInvalidRegistroStatus(registro: any) {
  if (registro?.access_status === 'desactivado') return 403;
  if (registro?.access_status === 'qr_expirado') return 400;
  return 400;
}

async function handleRegistroQR(req: NextRequest, tokenAsistencia: string | null) {
  const { user } = await authMiddleware(req);

  if (!user) {
    return NextResponse.json(
      { valido: false, error: 'El usuario no esta logueado' },
      { status: 400 }
    );
  }

  if (!tokenAsistencia) {
    return NextResponse.json(
      { valido: false, error: 'Falta el tokenAsistencia' },
      { status: 400 }
    );
  }

  const registro = await registrarAsistenciaDesdeQR(tokenAsistencia, user);

  if (!registro.valido) {
    return NextResponse.json(registro, {
      status: getInvalidRegistroStatus(registro),
    });
  }

  return NextResponse.json(registro, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenAsistencia = searchParams.get('tokenAsistencia');

    return handleRegistroQR(req, tokenAsistencia);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { valido: false, error: err.message },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tokenAsistencia = body.qr;

    return handleRegistroQR(req, tokenAsistencia);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { valido: false, error: err.message },
      { status: 401 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
