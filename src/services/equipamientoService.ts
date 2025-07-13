import { CreateEquipamentoDTO, Equipamento, UpdateEquipamentoDTO } from "@/interfaces/equipamiento.interface";
import { TipoEquipamiento } from "@/enums/tipoEquipamiento.enum";
import { supabase } from "./supabaseClient";
import dayjs from "dayjs";

export const getAllEquipamientos = async () : Promise<Equipamento[]> => {
  const { data, error } = await supabase
    .from("equipamiento")
    .select()
  if (error) {
    console.error(error.message);
    throw new Error("Error al obtener los equipamientos");
  }

  return data;
};

export const createEquipamiento = async (payload : CreateEquipamentoDTO) :Promise <Equipamento> => {
const fecha_adquisicion = dayjs().format("YYYY-MM-DD");
const ultima_revision = dayjs().format("YYYY-MM-DD");
const observaciones = payload.observaciones || "Sin observaciones";
const proxima_revision = payload.proxima_revision || dayjs().add(3, 'month').format("YYYY-MM-DD");

// Si se pasa tipo como string, convertir a enum
let tipo = payload.tipo.toLowerCase();

if (typeof tipo === 'string') {
  if(tipo === "cardio"){
  tipo = TipoEquipamiento.CARDIO;
  } else if(tipo === "fuerza"){
  tipo = TipoEquipamiento.FUERZA;
  } else if(tipo === "accesorio"){
  tipo = TipoEquipamiento.ACCESORIO;
  } else {
    throw new Error("Tipo de equipamiento no válido");
  }
} else {
  throw new Error("El tipo de equipamiento debe ser una cadena de texto");
}

    const { data, error } = await supabase
        .from("equipamiento")
        .insert({
            ...payload,
            tipo,
            fecha_adquisicion,
            ultima_revision,
            proxima_revision,
            observaciones,
            activo: true // Por defecto, el equipamiento está activo al crearse
        })
        .select()
        .single();
    
    if (error) {
        console.error(error.message);
        throw new Error("Error al crear el equipamiento");
    }
    
    return data;
    }

export const updateEquipamiento = async (id: string, updateData:UpdateEquipamentoDTO): Promise<Equipamento> => {
    const { data, error } = await supabase
        .from("equipamiento")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
    
    if (error) {
        console.error(error.message);
        throw new Error("Error al actualizar el equipamiento");
    }
    return data;
}


export const deleteEquipamiento = async (id: string): Promise<Equipamento> => {
    const {data, error } = await supabase
        .from("equipamiento")
        .update({ activo: false }) // Marcar como inactivo
        .eq("id", id)
        .select()
        .single();


    if (error) {
        console.error(error.message);
        throw new Error("Error al eliminar el equipamiento");
    }
    return data;
};

export const getOneEquipamientoById = async (id:string) : Promise<Equipamento> => {
  const { data, error } = await supabase
    .from("equipamiento")
    .select()
    .eq("id", id)
    .single();
  if (error) {
    console.error(error.message);
    throw new Error("Error al obtener los equipamientos");
  }

  return data;
};