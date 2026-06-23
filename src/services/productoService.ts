import { supabase } from "./supabaseClient";
import {
  Producto,
  CreateProductoDto,
  UpdateProductoDto,
  ProductoPrecioCostoHistorial,
} from "../interfaces/producto.interface";
import { existeProveedor } from "./proveedorService";

type HistorialInput = {
  motivo_cambio_precio?: string | null;
  moneda_historial?: "ARS" | "USD";
  cotizacion_usada?: number | null;
  fecha_vigencia?: string | null;
};

function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roundMoney(value: unknown): number {
  return Math.round(toNumber(value) * 100) / 100;
}

function calculateMargin(price: unknown, cost: unknown): {
  margen: number;
  porcentaje: number | null;
} {
  const precio = roundMoney(price);
  const costo = roundMoney(cost);
  const margen = roundMoney(precio - costo);
  const porcentaje = precio > 0 ? roundMoney((margen / precio) * 100) : null;
  return { margen, porcentaje };
}


function normalizeCommercialCode(value: unknown, mode: "sku" | "barcode") {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (mode === "barcode") {
    return text.replace(/\s+/g, '').toUpperCase().slice(0, 80);
  }
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function sanitizeProductPayload<T extends Record<string, any>>(payload: T) {
  const {
    motivo_cambio_precio,
    moneda_historial,
    cotizacion_usada,
    fecha_vigencia,
    ...productoPayload
  } = payload;

  const normalizedProductoPayload: Record<string, any> = { ...productoPayload };
  if (Object.prototype.hasOwnProperty.call(productoPayload, "sku")) {
    normalizedProductoPayload.sku = normalizeCommercialCode(productoPayload.sku, "sku");
  }
  if (Object.prototype.hasOwnProperty.call(productoPayload, "codigo_barras")) {
    normalizedProductoPayload.codigo_barras = normalizeCommercialCode(productoPayload.codigo_barras, "barcode");
  }

  return {
    productoPayload: normalizedProductoPayload,
    historialInput: {
      motivo_cambio_precio,
      moneda_historial,
      cotizacion_usada,
      fecha_vigencia,
    } as HistorialInput,
  };
}

async function insertPrecioCostoHistorial(params: {
  productoId: string;
  precioAnterior: number | null;
  precioNuevo: number;
  costoAnterior: number | null;
  costoNuevo: number;
  input?: HistorialInput;
  origen?: "manual" | "sistema" | "importado";
}) {
  const margenAnterior =
    params.precioAnterior == null || params.costoAnterior == null
      ? { margen: null, porcentaje: null }
      : calculateMargin(params.precioAnterior, params.costoAnterior);
  const margenNuevo = calculateMargin(params.precioNuevo, params.costoNuevo);

  const { error } = await supabase.from("producto_precio_costo_historial").insert({
    producto_id: params.productoId,
    precio_anterior: params.precioAnterior,
    precio_nuevo: params.precioNuevo,
    costo_anterior: params.costoAnterior,
    costo_nuevo: params.costoNuevo,
    moneda: params.input?.moneda_historial || "ARS",
    cotizacion_usada:
      params.input?.cotizacion_usada === undefined || params.input?.cotizacion_usada === null
        ? null
        : Number(params.input.cotizacion_usada),
    margen_anterior: margenAnterior.margen,
    margen_nuevo: margenNuevo.margen,
    margen_porcentaje_nuevo: margenNuevo.porcentaje,
    motivo:
      params.input?.motivo_cambio_precio?.trim() ||
      (params.origen === "sistema"
        ? "Registro inicial de precio/costo"
        : "Actualización de precio/costo"),
    fecha_vigencia: params.input?.fecha_vigencia || new Date().toISOString().slice(0, 10),
    origen: params.origen || "manual",
  });

  if (error) {
    throw new Error(`Error al registrar historial de precio/costo: ${error.message}`);
  }
}

export const getAllProductos = async (): Promise<Producto[]> => {
  const { data, error } = await supabase.from("producto").select();
  if (error) throw new Error(error.message);
  return data as Producto[];
};

export const getProductoHistorialPreciosCostos = async (
  productoId: string
): Promise<ProductoPrecioCostoHistorial[]> => {
  const { data, error } = await supabase
    .from("producto_precio_costo_historial")
    .select("*")
    .eq("producto_id", productoId)
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductoPrecioCostoHistorial[];
};

export const createProducto = async (payload: CreateProductoDto): Promise<Producto> => {
  const { productoPayload, historialInput } = sanitizeProductPayload(payload as any);
  const { proveedor_id } = productoPayload;
  const proveedor = await existeProveedor(proveedor_id);
  if (!proveedor) throw new Error("El proveedor ingresado no existe");

  const productoToInsert = {
    ...productoPayload,
    costo: productoPayload.costo ?? 0,
    stock_minimo: productoPayload.stock_minimo ?? 5,
  };

  const { data, error } = await supabase
    .from("producto")
    .insert(productoToInsert)
    .select()
    .single();
  if (error) {
    if (error.message?.includes('producto_sku_unique') || error.message?.includes('producto_codigo_barras_unique')) {
      throw new Error('El SKU o código de barras ya está asociado a otro producto.');
    }
    throw new Error(error.message);
  }

  const producto = data as Producto;
  await insertPrecioCostoHistorial({
    productoId: producto.id,
    precioAnterior: null,
    precioNuevo: roundMoney(producto.precio),
    costoAnterior: null,
    costoNuevo: roundMoney(producto.costo ?? 0),
    input: historialInput,
    origen: "sistema",
  });

  return producto;
};

export const updateProducto = async (id: string, updateData: UpdateProductoDto): Promise<Producto> => {
  const { productoPayload, historialInput } = sanitizeProductPayload(updateData as any);

  const { data: currentProducto, error: currentError } = await supabase
    .from("producto")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentProducto) {
    throw new Error("No se encontró producto con ese id");
  }

  const { data, error } = await supabase
    .from("producto")
    .update({
      ...productoPayload,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.message?.includes('producto_sku_unique') || error.message?.includes('producto_codigo_barras_unique')) {
      throw new Error('El SKU o código de barras ya está asociado a otro producto.');
    }
    throw new Error(error.message);
  }
  if (!data) throw new Error("No se encontró producto con ese id");

  const producto = data as Producto;
  const precioAnterior = roundMoney(currentProducto.precio);
  const precioNuevo = roundMoney(producto.precio);
  const costoAnterior = roundMoney(currentProducto.costo ?? 0);
  const costoNuevo = roundMoney(producto.costo ?? 0);
  const changedPriceOrCost = precioAnterior !== precioNuevo || costoAnterior !== costoNuevo;

  if (changedPriceOrCost) {
    await insertPrecioCostoHistorial({
      productoId: producto.id,
      precioAnterior,
      precioNuevo,
      costoAnterior,
      costoNuevo,
      input: historialInput,
      origen: "manual",
    });
  }

  return producto;
};

export const deleteProducto = async (id: string): Promise<Producto> => {
  const { data, error } = await supabase
    .from("producto")
    .update({ activo: false, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró producto con ese id");
  return data as Producto;
};

export const verificoStock = async (
  producto_id: string,
  cantidad: number
): Promise<{ precio_unitario: number; tieneStock: boolean }> => {
  const { data, error } = await supabase
    .from("producto")
    .select("id, nombre, stock, precio")
    .eq("id", producto_id)
    .single();
  if (error || !data) {
    throw new Error("Producto no encontrado");
  }
  if (data.stock < cantidad) {
    return { precio_unitario: data.precio, tieneStock: false };
  }
  const { error: updateError } = await supabase
    .from("producto")
    .update({ stock: data.stock - cantidad, actualizado_en: new Date().toISOString() })
    .eq("id", producto_id);
  if (updateError) {
    throw new Error("Error al actualizar el stock del producto");
  }
  return { precio_unitario: data.precio, tieneStock: true };
};

export const getProductoById = async (id: string): Promise<Producto> => {
  const { data, error } = await supabase.from("producto").select().eq("id", id).single();
  if (error) {
    console.log(error.message);
    throw new Error("No se encontró el producto con ese id");
  }
  return data as Producto;
};
