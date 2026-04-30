
import { VentaDetalle, CreateVentaDetalleDto, UpdateVentaDetalleDto } from "../interfaces/venta_detalle.interface";
import { verificoStock } from "./productoService";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";

export const getAllVentaDetalles = async (user:JwtUser): Promise<VentaDetalle[]> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase.from("venta_detalle").select();
  if (error) throw new Error(error.message);
  return data as VentaDetalle[];
};

export const createVentaDetalle = async (user: JwtUser, payload: CreateVentaDetalleDto, venta_id : string): Promise<VentaDetalle|false> => {
  const supabase = conexionBD(user.dbName); 
  //valido stock y traigo precio 
  const { precio_unitario, tieneStock } = await verificoStock(payload.producto_id, payload.cantidad);
  
  if (!tieneStock) {
    console.log("Stock insuficiente del producto");
    return false;
  }
  //calcular subtotal
 // const subtotal = precio_unitario * payload.cantidad;
  //console.log(subtotal);
  
  //guardo detalle de venta
  const { data, error } = await supabase
    .from("venta_detalle")
    .insert({ ...payload, precio_unitario, venta_id })
    .select()
    .single();
  if (error) {
   console.log(error.message);
   //devuelvo las productos al stock
   await updateVentaDetalle(user,payload.producto_id, { cantidad: payload.cantidad });
    return false;
  }
  return data as VentaDetalle;
};

export const updateVentaDetalle = async (user: JwtUser, id: string, updateData: UpdateVentaDetalleDto): Promise<VentaDetalle> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase.from("venta_detalle").update(updateData).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró detalle de venta con ese id");
  return data as VentaDetalle;
};

export const deleteVentaDetalle = async (user: JwtUser, id: string): Promise<VentaDetalle[]> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase.from("venta_detalle").delete().eq("id", id).select();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró detalle de venta con ese id");
  return data as VentaDetalle[];
};
