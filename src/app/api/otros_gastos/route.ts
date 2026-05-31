import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { conexionBD } from '@/middlewares/conexionBd.middleware';
import {
  OtrosGastosEstado,
  OtrosGastosMedioPago,
} from '@/interfaces/otros_gastos.interface';

export const dynamic = 'force-dynamic';

const estadosValidos: OtrosGastosEstado[] = ['pendiente', 'pagado', 'vencido', 'anulado'];
const mediosPagoValidos: OtrosGastosMedioPago[] = [
  'efectivo',
  'transferencia',
  'tarjeta_debito',
  'tarjeta_credito',
  'mercado_pago',
  'stripe',
  'otro',
];

function parseText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length ? text : null;
}

function parseDate(value: unknown): string | null {
  const text = parseText(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error('Formato de fecha inválido. Usá YYYY-MM-DD.');
  }
  return text;
}

function parseMoney(value: unknown, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} debe ser mayor a 0`);
  }
  return Math.round(parsed * 100) / 100;
}

function normalizeEstado(value: unknown): OtrosGastosEstado {
  return estadosValidos.includes(value as OtrosGastosEstado)
    ? (value as OtrosGastosEstado)
    : 'pagado';
}

function normalizeMedioPago(value: unknown): OtrosGastosMedioPago {
  return mediosPagoValidos.includes(value as OtrosGastosMedioPago)
    ? (value as OtrosGastosMedioPago)
    : 'efectivo';
}

function buildPayload(body: Record<string, unknown>, mode: 'create' | 'update') {
  const payload: Record<string, unknown> = {};

  const descripcion = parseText(body.descripcion);
  if (mode === 'create' && !descripcion) {
    throw new Error('La descripción es obligatoria');
  }
  if (descripcion || mode === 'create') payload.descripcion = descripcion;

  if ('monto' in body || mode === 'create') {
    payload.monto = parseMoney(body.monto, 'El monto');
  }

  if ('fecha' in body || mode === 'create') {
    const fecha = parseDate(body.fecha);
    if (!fecha) throw new Error('La fecha es obligatoria');
    payload.fecha = fecha;
  }

  if ('id_tipo_gasto' in body || mode === 'create') {
    payload.id_tipo_gasto = parseText(body.id_tipo_gasto);
  }

  if ('estado' in body || mode === 'create') {
    payload.estado = normalizeEstado(body.estado);
  }

  if ('medio_pago' in body || mode === 'create') {
    payload.medio_pago = normalizeMedioPago(body.medio_pago);
  }

  if ('proveedor_nombre' in body || mode === 'create') {
    payload.proveedor_nombre = parseText(body.proveedor_nombre);
  }

  if ('entidad' in body || mode === 'create') {
    payload.entidad = parseText(body.entidad);
  }

  if ('numero_comprobante' in body || mode === 'create') {
    payload.numero_comprobante = parseText(body.numero_comprobante);
  }

  if ('comprobante_url' in body || mode === 'create') {
    payload.comprobante_url = parseText(body.comprobante_url);
  }

  if ('comprobante_nombre' in body || mode === 'create') {
    payload.comprobante_nombre = parseText(body.comprobante_nombre);
  }

  if ('comprobante_mime_type' in body || mode === 'create') {
    payload.comprobante_mime_type = parseText(body.comprobante_mime_type);
  }

  if ('fecha_vencimiento' in body || mode === 'create') {
    payload.fecha_vencimiento = parseDate(body.fecha_vencimiento);
  }

  if ('fecha_pago' in body || mode === 'create') {
    payload.fecha_pago = parseDate(body.fecha_pago);
  }

  if ('periodo_desde' in body || mode === 'create') {
    payload.periodo_desde = parseDate(body.periodo_desde);
  }

  if ('periodo_hasta' in body || mode === 'create') {
    payload.periodo_hasta = parseDate(body.periodo_hasta);
  }

  if ('observaciones' in body || mode === 'create') {
    payload.observaciones = parseText(body.observaciones);
  }

  if ('activo' in body) {
    payload.activo = body.activo !== false;
  }

  payload.actualizado_en = new Date().toISOString();

  return payload;
}

async function fetchGastoById(supabase: ReturnType<typeof conexionBD>, id: string) {
  const { data, error } = await supabase
    .from('otros_gastos')
    .select(`
      *,
      tipo_gasto:id_tipo_gasto(id, codigo, nombre, descripcion, activo)
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function GET(req: NextRequest) {
  try {
    await authMiddleware(req);
    const supabase = conexionBD();
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const tipoGastoId = searchParams.get('id_tipo_gasto');

    let query = supabase
      .from('otros_gastos')
      .select(`
        *,
        tipo_gasto:id_tipo_gasto(id, codigo, nombre, descripcion, activo)
      `)
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false });

    query = query.neq('activo', false);

    if (estado && estadosValidos.includes(estado as OtrosGastosEstado)) {
      query = query.eq('estado', estado);
    }

    if (tipoGastoId) {
      query = query.eq('id_tipo_gasto', tipoGastoId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener los gastos' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
    const supabase = conexionBD();
    const body = await req.json();
    const payload = buildPayload(body, 'create');

    payload.activo = true;
    payload.registrado_por = user?.id ?? null;

    const { data, error } = await supabase
      .from('otros_gastos')
      .insert(payload)
      .select(`
        *,
        tipo_gasto:id_tipo_gasto(id, codigo, nombre, descripcion, activo)
      `)
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: 'Gasto creado con éxito', data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al crear el gasto' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await authMiddleware(req);
    const supabase = conexionBD();
    const { id, updateData } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID inválido para actualizar' }, { status: 400 });
    }

    const payload = buildPayload(updateData ?? {}, 'update');

    const { error } = await supabase
      .from('otros_gastos')
      .update(payload)
      .eq('id', id)
      .neq('activo', false);

    if (error) throw new Error(error.message);

    const gasto = await fetchGastoById(supabase, id);
    return NextResponse.json(
      { message: 'Gasto actualizado con éxito', data: gasto },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar gasto' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await authMiddleware(req);
    const supabase = conexionBD();
    const { id } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID inválido para eliminar' }, { status: 400 });
    }

    const { error } = await supabase
      .from('otros_gastos')
      .update({ activo: false, estado: 'anulado', actualizado_en: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);

    const gasto = await fetchGastoById(supabase, id);
    return NextResponse.json(
      { message: 'Gasto eliminado con éxito', data: gasto },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar gasto' },
      { status: 500 }
    );
  }
}
