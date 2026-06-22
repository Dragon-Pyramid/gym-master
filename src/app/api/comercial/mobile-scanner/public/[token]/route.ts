import { NextRequest, NextResponse } from 'next/server';
import {
  createPublicComercialScannerEvent,
  getPublicComercialScannerSession,
} from '@/services/server/comercialMobileScannerServerService';

export const dynamic = 'force-dynamic';

type Params = {
  params: {
    token: string;
  };
};

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getPublicComercialScannerSession(params.token);
    return NextResponse.json({ data: session }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error al obtener sesión pública de scanner' }, { status: 404 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await createPublicComercialScannerEvent(params.token, body?.codigo);
    return NextResponse.json({ data: result, message: result.message }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error al enviar código escaneado' }, { status: 400 });
  }
}
