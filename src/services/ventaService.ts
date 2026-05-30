import {
  CreateVentaConDetalleDto,
  ResponseVenta,
  UpdateVentaDto,
  Venta,
  VentaClienteTipo,
} from '../interfaces/venta.interface';
import { VentaDetalle } from '../interfaces/venta_detalle.interface';
import {
  createVentaDetalle,
  deleteVentaDetalle,
  getVentaDetalleTotal,
} from './ventaDetalleService';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

function isBrowserRuntime() {
  return typeof window !== 'undefined';
}

function getBrowserAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  const cookieToken = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('token='))
    ?.split('=')[1];

  if (cookieToken) return decodeURIComponent(cookieToken);

  try {
    const rawAuthStorage = window.localStorage.getItem('auth-storage');
    if (!rawAuthStorage) return null;

    const parsed = JSON.parse(rawAuthStorage);
    const token = parsed?.state?.token;
    return typeof token === 'string' && token.trim().length > 0 ? token : null;
  } catch {
    return null;
  }
}

async function requestVentasApi<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
  id?: string
): Promise<T> {
  const token = getBrowserAuthToken();
  const url = id ? `/api/ventas/${id}` : '/api/ventas';
  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || 'Error al operar ventas');
  }

  return payload?.data as T;
}

const normalizeDate = (fecha?: string | null) => {
  if (fecha && fecha.trim().length > 0) return fecha;
  return new Date().toISOString().slice(0, 10);
};

const normalizeClienteTipo = (clienteTipo?: string | null): VentaClienteTipo => {
  if (clienteTipo === 'socio' || clienteTipo === 'visitante') return clienteTipo;
  return 'consumidor_final';
};

const normalizeVentaPayload = (payload: CreateVentaConDetalleDto) => {
  const detalles = payload.detalles ?? (payload.venta_detalle ? [payload.venta_detalle] : []);
  const clienteTipo = normalizeClienteTipo(payload.venta.cliente_tipo);
  const socioId = clienteTipo === 'socio' ? payload.venta.socio_id ?? null : null;

  if (clienteTipo === 'socio' && !socioId) {
    throw new Error('Debe seleccionar un socio para registrar una venta a socio');
  }

  if (!detalles.length) {
    throw new Error('La venta debe tener al menos un producto o servicio');
  }

  return {
    venta: {
      socio_id: socioId,
      cliente_tipo: clienteTipo,
      cliente_nombre:
        clienteTipo === 'socio'
          ? null
          : payload.venta.cliente_nombre?.trim() || 'Consumidor Final',
      cliente_documento:
        clienteTipo === 'socio'
          ? null
          : payload.venta.cliente_documento?.trim() || null,
      fecha: normalizeDate(payload.venta.fecha),
      metodo_pago: payload.venta.metodo_pago ?? 'efectivo',
      observaciones: payload.venta.observaciones?.trim() || null,
    },
    detalles,
  };
};

function mapVentaResponse(
  venta: any,
  detalles: VentaDetalle[] = []
): ResponseVenta {
  const socio = venta.socio
    ? {
        socio_id: venta.socio.id_socio ?? venta.socio.socio_id,
        id_socio: venta.socio.id_socio ?? venta.socio.socio_id,
        nombre_completo: venta.socio.nombre_completo,
      }
    : null;

  return {
    id: venta.id,
    socio_id: venta.socio_id ?? null,
    cliente_tipo: venta.cliente_tipo ?? (venta.socio_id ? 'socio' : 'consumidor_final'),
    cliente_nombre: venta.cliente_nombre ?? null,
    cliente_documento: venta.cliente_documento ?? null,
    metodo_pago: venta.metodo_pago ?? 'efectivo',
    estado: venta.estado ?? 'pagada',
    total: Number(venta.total ?? 0),
    fecha: venta.fecha,
    activo: venta.activo !== false,
    observaciones: venta.observaciones ?? null,
    comprobante_codigo: venta.comprobante_codigo ?? null,
    id_venta_detalle: venta.id_venta_detalle ?? null,
    venta_detalle: detalles,
    detalles,
    socio,
  };
}


async function revertirStockDetalles(detalles: VentaDetalle[], ventaId: string, user?: JwtUser) {
  const supabase = conexionBD();

  for (const detalle of detalles) {
    if (detalle.item_tipo !== 'producto' || !detalle.producto_id) continue;

    const { data: producto } = await supabase
      .from('producto')
      .select('id, stock')
      .eq('id', detalle.producto_id)
      .single();

    if (!producto) continue;

    const stockAnterior = Number(producto.stock ?? 0);
    const stockNuevo = stockAnterior + Number(detalle.cantidad ?? 0);

    await supabase
      .from('producto')
      .update({ stock: stockNuevo })
      .eq('id', detalle.producto_id);

    await supabase.from('producto_stock_movimiento').insert({
      producto_id: detalle.producto_id,
      venta_id: ventaId,
      venta_detalle_id: detalle.id,
      tipo: 'reversion_venta',
      cantidad: Math.abs(Number(detalle.cantidad ?? 0)),
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      motivo: 'Reversión automática por error al registrar venta',
      creado_por: user?.id ?? null,
    });
  }
}

async function getDetallesByVentaIds(ventaIds: string[]) {
  if (!ventaIds.length) return new Map<string, VentaDetalle[]>();

  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('venta_detalle')
    .select(
      `
      *,
      producto:producto_id(id, nombre),
      servicio:servicio_id(id, nombre)
    `
    )
    .in('venta_id', ventaIds)
    .order('creado_en', { ascending: true });

  if (error) throw new Error(error.message);

  return (data as VentaDetalle[]).reduce((map, detalle) => {
    const current = map.get(detalle.venta_id) ?? [];
    current.push(detalle);
    map.set(detalle.venta_id, current);
    return map;
  }, new Map<string, VentaDetalle[]>());
}

export const getAllVentas = async (user: JwtUser): Promise<ResponseVenta[]> => {
  if (isBrowserRuntime()) {
    return requestVentasApi<ResponseVenta[]>('GET');
  }

  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('venta')
    .select(
      `
      *,
      socio:socio_id(id_socio, nombre_completo)
    `
    )
    .order('fecha', { ascending: false })
    .order('creado_en', { ascending: false });

  if (error) throw new Error(error.message);

  const ventas = data ?? [];
  const detallesByVentaId = await getDetallesByVentaIds(ventas.map((venta: any) => venta.id));

  return ventas.map((venta: any) =>
    mapVentaResponse(venta, detallesByVentaId.get(venta.id) ?? [])
  );
};

export const createVenta = async (
  user: JwtUser,
  payload: CreateVentaConDetalleDto
): Promise<ResponseVenta> => {
  if (isBrowserRuntime()) {
    return requestVentasApi<ResponseVenta>('POST', payload);
  }

  const supabase = conexionBD();
  const normalized = normalizeVentaPayload(payload);
  const comprobanteCodigo = `GM-${Date.now().toString(36).toUpperCase()}`;

  const { data: venta, error } = await supabase
    .from('venta')
    .insert({
      ...normalized.venta,
      total: 0,
      estado: 'pagada',
      activo: true,
      comprobante_codigo: comprobanteCodigo,
    })
    .select(
      `
      *,
      socio:socio_id(id_socio, nombre_completo)
    `
    )
    .single();

  if (error) throw new Error(error.message);

  const detallesCreados: VentaDetalle[] = [];

  try {
    for (const detalle of normalized.detalles) {
      const detalleCreado = await createVentaDetalle(user, detalle, venta.id);
      if (!detalleCreado) {
        throw new Error('Error al crear el detalle de venta');
      }
      detallesCreados.push(detalleCreado);
    }

    const total = detallesCreados.reduce(
      (acc, detalle) => acc + getVentaDetalleTotal(detalle),
      0
    );

    const { data: ventaActualizada, error: updateError } = await supabase
      .from('venta')
      .update({
        total,
        id_venta_detalle: detallesCreados[0]?.id ?? null,
      })
      .eq('id', venta.id)
      .select(
        `
        *,
        socio:socio_id(id_socio, nombre_completo)
      `
      )
      .single();

    if (updateError) throw new Error(updateError.message);

    return mapVentaResponse(ventaActualizada, detallesCreados);
  } catch (error: any) {
    await revertirStockDetalles(detallesCreados, venta.id, user);
    await Promise.all(
      detallesCreados.map((detalle) => deleteVentaDetalle(user, detalle.id).catch(() => null))
    );
    await supabase.from('venta').delete().eq('id', venta.id);
    throw new Error(error.message || 'Error al registrar la venta');
  }
};

export const updateVenta = async (
  user: JwtUser,
  id: string,
  updateData: UpdateVentaDto
): Promise<Venta> => {
  if (isBrowserRuntime()) {
    return requestVentasApi<Venta>('PUT', { id, updateData });
  }

  const supabase = conexionBD();
  const updatePayload: UpdateVentaDto = {
    ...updateData,
  };

  if (updateData.cliente_tipo) {
    updatePayload.socio_id =
      updateData.cliente_tipo === 'socio' ? updateData.socio_id ?? null : null;
    updatePayload.cliente_nombre =
      updateData.cliente_tipo === 'socio' ? null : updateData.cliente_nombre ?? null;
    updatePayload.cliente_documento =
      updateData.cliente_tipo === 'socio' ? null : updateData.cliente_documento ?? null;
  }

  Object.keys(updatePayload).forEach((key) => {
    if (updatePayload[key as keyof UpdateVentaDto] === undefined) {
      delete updatePayload[key as keyof UpdateVentaDto];
    }
  });

  const { data, error } = await supabase
    .from('venta')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró venta con ese id');
  return data as Venta;
};

async function revertirStockPorAnulacion(
  detalles: VentaDetalle[],
  ventaId: string,
  user?: JwtUser
) {
  const supabase = conexionBD();

  for (const detalle of detalles) {
    if (detalle.item_tipo !== 'producto' || !detalle.producto_id) continue;

    // Evita devolver stock dos veces si el usuario reintenta la anulación
    // o si la operación anterior quedó a mitad de camino.
    const { data: movimientoExistente } = await supabase
      .from('producto_stock_movimiento')
      .select('id')
      .eq('venta_id', ventaId)
      .eq('venta_detalle_id', detalle.id)
      .eq('tipo', 'reversion_venta')
      .maybeSingle();

    if (movimientoExistente) continue;

    const { data: producto, error: productoError } = await supabase
      .from('producto')
      .select('id, stock')
      .eq('id', detalle.producto_id)
      .single();

    if (productoError || !producto) {
      throw new Error('No se pudo obtener el producto para revertir el stock');
    }

    const cantidad = Number(detalle.cantidad ?? 0);
    if (!Number.isInteger(cantidad) || cantidad <= 0) continue;

    const stockAnterior = Number(producto.stock ?? 0);
    const stockNuevo = stockAnterior + cantidad;

    const { error: stockError } = await supabase
      .from('producto')
      .update({ stock: stockNuevo })
      .eq('id', detalle.producto_id);

    if (stockError) {
      throw new Error('No se pudo devolver el stock del producto anulado');
    }

    await supabase.from('producto_stock_movimiento').insert({
      producto_id: detalle.producto_id,
      venta_id: ventaId,
      venta_detalle_id: detalle.id,
      tipo: 'reversion_venta',
      cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      motivo: 'Reversión automática por anulación de venta',
      creado_por: user?.id ?? null,
    });
  }
}

export const deleteVenta = async (user: JwtUser, id: string): Promise<Venta> => {
  if (isBrowserRuntime()) {
    return requestVentasApi<Venta>('DELETE', { id });
  }

  const supabase = conexionBD();

  const { data: ventaActual, error: ventaError } = await supabase
    .from('venta')
    .select('id, activo, estado')
    .eq('id', id)
    .single();

  if (ventaError || !ventaActual) {
    throw new Error('No se encontró venta con ese id');
  }

  if (ventaActual.activo === false || ventaActual.estado === 'anulada') {
    return ventaActual as Venta;
  }

  const detallesByVentaId = await getDetallesByVentaIds([id]);
  const detalles = detallesByVentaId.get(id) ?? [];

  await revertirStockPorAnulacion(detalles, id, user);

  const { data, error } = await supabase
    .from('venta')
    .update({ activo: false, estado: 'anulada' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró venta con ese id');
  return data as Venta;
};

export const getVentaById = async (
  user: JwtUser,
  id: string
): Promise<ResponseVenta> => {
  if (isBrowserRuntime()) {
    return requestVentasApi<ResponseVenta>('GET', undefined, id);
  }

  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('venta')
    .select(
      `
      *,
      socio:socio_id(id_socio, nombre_completo)
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('No se encontró la venta con ese id');
  }

  const detallesByVentaId = await getDetallesByVentaIds([id]);
  return mapVentaResponse(data, detallesByVentaId.get(id) ?? []);
};
