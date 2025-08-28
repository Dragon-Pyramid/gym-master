import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { registrarAsistenciaDesdeQR } from '@/services/asistenciaService';

export async function GET(req: NextRequest) {
  try {
    //VERIFICO QUE ESTEEL USUARIO LOGUEADO
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'El usuario no esta logueado' },
        { status: 400 }
      );
    }
    //AGARRO LA QUERY DE LA URL
    const { searchParams } = new URL(req.url);
    const tokenAsistencia = searchParams.get('tokenAsistencia');
    //SI NO ESTA, LANZO ERROR
    if (!tokenAsistencia) {
      return NextResponse.json(
        { error: 'Falta el tokenAsistencia' },
        { status: 400 }
      );
    }

    //LE MANDO EL TOKEN DE LA ASISTENCIA Y EL USUARIO LOGUEADO
    const registro = await registrarAsistenciaDesdeQR(tokenAsistencia, user);

    //SI NO ES VALIDO, ES PORQUE YA HABIA IDO AL GYM Y NO CREO LA ASISTENCIA NUEVA
    if (!registro.valido) {
      return NextResponse.json({ error: registro.error }, { status: 400 });
    }

    // Retornar la respuesta si fue valida o no y la asistencia creada
    return NextResponse.json(registro, { status: 200 });
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
    //VERIFICO QUE ESTEEL USUARIO LOGUEADO
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'El usuario no esta logueado' },
        { status: 400 }
      );
    }
    //AGARRO EL TOKEN DEL BODY (viene como { qr: tokenAsistencia })
    const body = await req.json();
    const tokenAsistencia = body.qr;
    //SI NO ESTA, LANZO ERROR
    if (!tokenAsistencia) {
      return NextResponse.json(
        { error: 'Falta el tokenAsistencia' },
        { status: 400 }
      );
    }

    //LE MANDO EL TOKEN DE LA ASISTENCIA Y EL USUARIO LOGUEADO
    const registro = await registrarAsistenciaDesdeQR(tokenAsistencia, user);

    //SI NO ES VALIDO, ES PORQUE YA HABIA IDO AL GYM Y NO CREO LA ASISTENCIA NUEVA
    if (!registro.valido) {
      return NextResponse.json({ error: registro.error }, { status: 400 });
    }

    // Retornar la respuesta si fue valida o no y la asistencia creada
    return NextResponse.json(registro, { status: 200 });
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
