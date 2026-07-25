import { NextResponse } from 'next/server';
import {
  createPagoManualServer,
  deactivatePagoServer,
  fetchPagoFormOptionsServer,
  fetchPagosServer,
  updatePagoServer,
} from '@/services/server/pagoServerService';
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

const PAGOS_PATH = '/dashboard/pagos';
const MANAGER_ROLES = ['admin', 'usuario'] as const;

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, PAGOS_PATH, [...MANAGER_ROLES]);
    const url = new URL(req.url);
    if (url.searchParams.get('options') === 'true') {
      const options = await fetchPagoFormOptionsServer(user);
      return NextResponse.json({ data: options }, { status: 200 });
    }
    const pagos = await fetchPagosServer(user);
    return NextResponse.json({ data: pagos }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al obtener pagos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, PAGOS_PATH, [...MANAGER_ROLES]);
    const pago = await createPagoManualServer(user, await req.json());
    return NextResponse.json({ message: 'Pago registrado con éxito', data: pago }, { status: 201 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al registrar el pago';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, PAGOS_PATH, [...MANAGER_ROLES]);
    const { id, updateData } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID inválido para actualizar' }, { status: 400 });
    }
    const pago = await updatePagoServer(user, id, updateData);
    return NextResponse.json({ message: 'Pago actualizado con éxito', data: pago }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al actualizar pago';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, PAGOS_PATH, [...MANAGER_ROLES]);
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID inválido para eliminar' }, { status: 400 });
    }
    const pago = await deactivatePagoServer(user, id);
    return NextResponse.json({ message: 'Pago eliminado con éxito', data: pago }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al eliminar pago';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
