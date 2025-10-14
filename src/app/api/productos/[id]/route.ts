import { getProductoById } from '@/services/productoService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const producto = await getProductoById(id);
    return NextResponse.json({ data: producto }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
