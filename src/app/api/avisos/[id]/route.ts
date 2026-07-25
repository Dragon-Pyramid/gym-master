import { NextRequest, NextResponse } from 'next/server';
import {
  getAvisoById,
  updateAviso,
  deleteAviso,
} from '@/services/avisoService';


import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(_req, '/dashboard/avisos', ['admin', 'usuario']);
    const { id } = await params;
    const aviso = await getAvisoById(id);
    if (!aviso)
      return NextResponse.json(
        { error: 'Aviso no encontrado' },
        { status: 404 }
      );
    return NextResponse.json(aviso);
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/avisos', ['admin', 'usuario']);
    const { id } = await params;
    const body = await req.json();
    const aviso = await updateAviso(id, body);
    return NextResponse.json(aviso);
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(_req, '/dashboard/avisos', ['admin', 'usuario']);
    const { id } = await params;
    const aviso = await deleteAviso(id);
    return NextResponse.json(aviso);
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
