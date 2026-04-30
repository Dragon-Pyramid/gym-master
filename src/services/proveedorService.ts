import { supabase } from "./supabaseClient";

import { Proveedor, CreateProveedorDto, UpdateProveedorDto } from "../interfaces/proveedor.interface";

export const getAllProveedores = async (): Promise<Proveedor[]> => {
  const { data, error } = await supabase
    .from("proveedor")
    .select();
  if (error) throw new Error(error.message);
  return data as Proveedor[];
};

export const createProveedor = async (payload: CreateProveedorDto): Promise<Proveedor> => {
  const { data, error } = await supabase
    .from("proveedor")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Proveedor;
};

export const updateProveedor = async (id: string, updateData: UpdateProveedorDto): Promise<Proveedor> => {
  const { data, error } = await supabase
    .from("proveedor")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró proveedor con ese id");
  return data as Proveedor;
};

export const deleteProveedor = async (id: string): Promise<Proveedor[]> => {
  const { data, error } = await supabase
    .from("proveedor")
    .delete()
    .eq("id", id)
    .select();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró proveedor con ese id");
  return data as Proveedor[];
};

export const existeProveedor = async (id: string) => {
  const { data, error } = await supabase
    .from('proveedor')
    .select('id')
    .eq('id', id)
    .single();
    
  if (error || !data) return false;
  return true;
};

export const getProveedorById = async (id: string): Promise<Proveedor> => {
  const { data, error } = await supabase
    .from("proveedor")
    .select()
    .eq("id", id)
    .single();
  if (error) {
    console.log(error.message);
    throw new Error("No se encontró el proveedor con ese id");
  }
  return data as Proveedor;
};