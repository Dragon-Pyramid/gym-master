import { supabase } from "./supabaseClient";
import { OtrosGastos, CreateOtrosGastosDto, UpdateOtrosGastosDto } from "../interfaces/otros_gastos.interface";

export const getAllOtrosGastos = async (): Promise<OtrosGastos[]> => {
  const { data, error } = await supabase.from("otros_gastos").select();
  if (error) throw new Error(error.message);
  return data as OtrosGastos[];
};

export const createOtrosGastos = async (payload: CreateOtrosGastosDto): Promise<OtrosGastos> => {
  const { data, error } = await supabase.from("otros_gastos").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data as OtrosGastos;
};

export const updateOtrosGastos = async (id: string, updateData: UpdateOtrosGastosDto): Promise<OtrosGastos> => {
  const { data, error } = await supabase.from("otros_gastos").update(updateData).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró gasto con ese id");
  return data as OtrosGastos;
};

export const deleteOtrosGastos = async (id: string): Promise<OtrosGastos> => {
  const { data, error } = await supabase.from("otros_gastos").update({ activo: false }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró gasto con ese id");
  return data as OtrosGastos;
};
