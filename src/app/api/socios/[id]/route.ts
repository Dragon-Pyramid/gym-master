import { authMiddleware } from '@/middlewares/auth.middleware';
import { getSocioById } from '@/services/socioService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await authMiddleware(req);

    const { id } = await params;
    const socio = await getSocioById(id, user.dbName);
    return NextResponse.json({ data: socio }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
