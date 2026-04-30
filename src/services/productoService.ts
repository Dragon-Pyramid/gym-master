import { supabase } from "./supabaseClient";
import { Producto, CreateProductoDto, UpdateProductoDto } from "../interfaces/producto.interface";
import { existeProveedor } from "./proveedorService";

export const getAllProductos = async (): Promise<Producto[]> => {
  const { data, error } = await supabase.from("producto").select();
  if (error) throw new Error(error.message);
  return data as Producto[];
};

export const createProducto = async (payload: CreateProductoDto): Promise<Producto> => {
    const {proveedor_id} = payload;
    const proveedor = await existeProveedor(proveedor_id);
    if(!proveedor) throw new Error("El proveedor ingresado no existe");

  const { data, error } = await supabase.from("producto").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data as Producto;
};

export const updateProducto = async (id: string, updateData: UpdateProductoDto): Promise<Producto> => {
  const { data, error } = await supabase.from("producto").update(updateData).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró producto con ese id");
  return data as Producto;
};

export const deleteProducto = async (id: string): Promise<Producto> => {
  const { data, error } = await supabase.from("producto").update({ activo: false }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró producto con ese id");
  return data as Producto;
};

export const verificoStock = async (producto_id: string, cantidad: number): Promise<{ precio_unitario: number; tieneStock: boolean }> => {
  // Obtener el producto
  const { data, error } = await supabase
    .from('producto')
    .select('id, nombre, stock, precio')
    .eq('id', producto_id)
    .single();
  if (error || !data) {
    throw new Error('Producto no encontrado');
  }
  if (data.stock < cantidad) {
    return { precio_unitario: data.precio, tieneStock: false };
  }
  // Descontar stock
  const { error: updateError } = await supabase
    .from('producto')
    .update({ stock: data.stock - cantidad })
    .eq('id', producto_id);
  if (updateError) {
    throw new Error('Error al actualizar el stock del producto');
  }
  return { precio_unitario: data.precio, tieneStock: true };
};

export const getProductoById = async (id: string): Promise<Producto> => {
  const { data, error } = await supabase
    .from("producto")
    .select()
    .eq("id", id)
    .single();
  if (error) {
   console.log(error.message);
    throw new Error("No se encontró el producto con ese id");
  }
    return data as Producto;
};
