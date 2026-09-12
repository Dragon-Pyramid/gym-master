import { NextRequest, NextResponse } from "next/server";
import { getAllAvisos, createAviso } from "@/services/avisoService";


import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/avisos', ['admin', 'usuario']);
    const avisos = await getAllAvisos();
    return NextResponse.json(avisos);
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al obtener avisos:', error);
    return NextResponse.json(
      { error: 'Error al obtener avisos' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/avisos', ['admin', 'usuario']);
    const body = await req.json();
    const aviso = await createAviso(body);
    return NextResponse.json(aviso, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al crear aviso:', error);
    return NextResponse.json(
      { error: 'Error al crear aviso' },
      { status: 500 },
    );
  }
}
