import 'server-only';

import { getSupabaseServerClient } from "./supabaseServerClient";
import { Cuota, CreateCuotaDto, UpdateCuotaDto } from "../interfaces/cuota.interface";

const isValidIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const assertValidCuotaDateRange = (
  fechaInicio: string,
  fechaFin: string,
): void => {
  if (!isValidIsoDate(fechaInicio) || !isValidIsoDate(fechaFin)) {
    throw new RangeError("Las fechas de la cuota no son válidas");
  }

  if (fechaFin < fechaInicio) {
    throw new RangeError(
      "La fecha de fin no puede ser anterior a la fecha de inicio",
    );
  }
};

export const getAllCuotas = async (): Promise<Cuota[]> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("cuota").select();
  if (error) throw new Error(error.message);
  return data as Cuota[];
};


export const createCuota = async (payload: CreateCuotaDto): Promise<Cuota> => {
  assertValidCuotaDateRange(payload.fecha_inicio, payload.fecha_fin);

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("cuota").insert({...payload, activo:true})
    .select().single();
  if (error) throw new Error(error.message);

  return data as Cuota;
};

export const updateCuota = async (id: string, updateData: UpdateCuotaDto): Promise<Cuota> => {
  const supabase = getSupabaseServerClient();

  if (updateData.fecha_inicio !== undefined || updateData.fecha_fin !== undefined) {
    const { data: cuotaActual, error: cuotaActualError } = await supabase
      .from("cuota")
      .select("fecha_inicio, fecha_fin")
      .eq("id", id)
      .single();

    if (cuotaActualError) throw new Error(cuotaActualError.message);

    assertValidCuotaDateRange(
      updateData.fecha_inicio ?? cuotaActual.fecha_inicio,
      updateData.fecha_fin ?? cuotaActual.fecha_fin,
    );
  }

  const { data, error } = await supabase.from("cuota").update(updateData).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró cuota con ese id");
  return data as Cuota;
};

export const deleteCuota = async (id: string): Promise<Cuota> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("cuota").update({ activo: false }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró cuota con ese id");
  return data as Cuota;
};

export const getCuotaById = async (id: string): Promise<Cuota> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cuota")
    .select()
    .eq("id", id)
    .single();
  if (error) {
    console.error(error.message);
    throw new Error("No se encontró la cuota con ese id");
  }
  return data as Cuota;
};


