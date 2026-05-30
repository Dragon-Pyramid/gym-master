import {
  CreateVentaDetalleDto,
  UpdateVentaDetalleDto,
  VentaDetalle,
  VentaDetalleItemTipo,
} from '../interfaces/venta_detalle.interface';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

const normalizeCantidad = (cantidad: number) => {
  const parsed = Number(cantidad);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('La cantidad debe ser un número entero mayor a 0');
  }
  return parsed;
};

const normalizeMoney = (value: number | undefined | null) => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('El importe informado es inválido');
  }
  return Math.round(parsed);
};

export const getVentaDetalleTotal = (detalle: Partial<VentaDetalle>): number => {
  const totalLinea = Number(detalle.total_linea ?? NaN);
  if (Number.isFinite(totalLinea)) return totalLinea;

  const subtotal = Number(detalle.subtotal ?? 0);
  const descuento = Number(detalle.descuento ?? 0);
  return Math.max(subtotal - descuento, 0);
};

async function registrarMovimientoStock(params: {
  productoId: string;
  ventaId: string;
  ventaDetalleId?: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  user?: JwtUser;
}) {
  const supabase = conexionBD();

  // La tabla se crea en la migración privada de esta feature.
  // Si en algún entorno todavía no existe, no se bloquea la venta.
  await supabase.from('producto_stock_movimiento').insert({
    producto_id: params.productoId,
    venta_id: params.ventaId,
    venta_detalle_id: params.ventaDetalleId ?? null,
    tipo: 'venta',
    cantidad: Math.abs(params.cantidad),
    stock_anterior: params.stockAnterior,
    stock_nuevo: params.stockNuevo,
    motivo: 'Venta de kiosco/comercial',
    creado_por: params.user?.id ?? null,
  });
}

async function obtenerProductoParaVenta(productoId: string) {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('producto')
    .select('id, nombre, precio, stock, activo')
    .eq('id', productoId)
    .single();

  if (error || !data) {
    throw new Error('Producto no encontrado');
  }

  if (data.activo === false) {
    throw new Error(`El producto ${data.nombre} está inactivo o discontinuado`);
  }

  return data as {
    id: string;
    nombre: string;
    precio: number;
    stock: number;
    activo?: boolean;
  };
}

async function obtenerServicioParaVenta(servicioId: string) {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('servicio')
    .select('id, nombre, precio, activo')
    .eq('id', servicioId)
    .single();

  if (error || !data) {
    throw new Error('Servicio no encontrado');
  }

  if (data.activo === false) {
    throw new Error(`El servicio ${data.nombre} está inactivo`);
  }

  return data as {
    id: string;
    nombre: string;
    precio: number;
    activo?: boolean;
  };
}

export const getAllVentaDetalles = async (
  user: JwtUser
): Promise<VentaDetalle[]> => {
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
    .order('creado_en', { ascending: false });

  if (error) throw new Error(error.message);
  return data as VentaDetalle[];
};

export const createVentaDetalle = async (
  user: JwtUser,
  payload: CreateVentaDetalleDto,
  venta_id: string
): Promise<VentaDetalle | false> => {
  const supabase = conexionBD();
  const itemTipo: VentaDetalleItemTipo = payload.item_tipo ?? 'producto';
  const cantidad = normalizeCantidad(payload.cantidad);
  const descuento = normalizeMoney(payload.descuento);

  if (itemTipo === 'producto') {
    if (!payload.producto_id) {
      throw new Error('Debe seleccionar un producto para el detalle de venta');
    }

    const producto = await obtenerProductoParaVenta(payload.producto_id);
    const stockAnterior = Number(producto.stock ?? 0);

    if (stockAnterior < cantidad) {
      throw new Error(
        `Stock insuficiente para ${producto.nombre}. Disponible: ${stockAnterior}`
      );
    }

    const precioUnitario = normalizeMoney(payload.precio_unitario ?? producto.precio);
    const stockNuevo = stockAnterior - cantidad;

    const { error: stockError } = await supabase
      .from('producto')
      .update({ stock: stockNuevo })
      .eq('id', producto.id);

    if (stockError) {
      throw new Error('Error al actualizar el stock del producto');
    }

    const { data, error } = await supabase
      .from('venta_detalle')
      .insert({
        venta_id,
        item_tipo: 'producto',
        producto_id: producto.id,
        servicio_id: null,
        cantidad,
        precio_unitario: precioUnitario,
        descuento,
      })
      .select(
        `
        *,
        producto:producto_id(id, nombre),
        servicio:servicio_id(id, nombre)
      `
      )
      .single();

    if (error) {
      await supabase
        .from('producto')
        .update({ stock: stockAnterior })
        .eq('id', producto.id);
      throw new Error(error.message);
    }

    await registrarMovimientoStock({
      productoId: producto.id,
      ventaId: venta_id,
      ventaDetalleId: data.id,
      cantidad,
      stockAnterior,
      stockNuevo,
      user,
    });

    return data as VentaDetalle;
  }

  if (!payload.servicio_id) {
    throw new Error('Debe seleccionar un servicio para el detalle de venta');
  }

  const servicio = await obtenerServicioParaVenta(payload.servicio_id);
  const precioUnitario = normalizeMoney(payload.precio_unitario ?? servicio.precio);

  const { data, error } = await supabase
    .from('venta_detalle')
    .insert({
      venta_id,
      item_tipo: 'servicio',
      producto_id: null,
      servicio_id: servicio.id,
      cantidad,
      precio_unitario: precioUnitario,
      descuento,
    })
    .select(
      `
      *,
      producto:producto_id(id, nombre),
      servicio:servicio_id(id, nombre)
    `
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as VentaDetalle;
};

export const updateVentaDetalle = async (
  user: JwtUser,
  id: string,
  updateData: UpdateVentaDetalleDto
): Promise<VentaDetalle> => {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('venta_detalle')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró detalle de venta con ese id');
  return data as VentaDetalle;
};

export const deleteVentaDetalle = async (
  user: JwtUser,
  id: string
): Promise<VentaDetalle[]> => {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('venta_detalle')
    .delete()
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error('No se encontró detalle de venta con ese id');
  }
  return data as VentaDetalle[];
};
