import { CreateEquipamentoDTO, Equipamento, UpdateEquipamentoDTO } from "@/interfaces/equipamiento.interface";
import { AlertasMantenimientoEquipamientoResponse } from "@/interfaces/equipamientoAlertas.interface";
import { TipoEquipamiento } from "@/enums/tipoEquipamiento.enum";
import { getSupabaseClient, supabase } from "./supabaseClient";
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

// Si se pasa tipo como string, normalizar valores legacy y permitir catálogos parametrizables.
const tipoNormalizado = String(payload.tipo ?? "").trim();
let tipo = tipoNormalizado;

if (!tipoNormalizado) {
  throw new Error("El tipo de equipamiento debe ser una cadena de texto");
}

const tipoLower = tipoNormalizado.toLowerCase();
if (tipoLower === "cardio") {
  tipo = TipoEquipamiento.CARDIO;
} else if (tipoLower === "fuerza") {
  tipo = TipoEquipamiento.FUERZA;
} else if (tipoLower === "accesorio") {
  tipo = TipoEquipamiento.ACCESORIO;
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

// Funciones para métricas de equipamiento
export const dataEstadoEquipamientoSemaforo = async (user: any) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .rpc('sp_estado_equipamiento_semaforo');
    if (error) throw new Error(error.message);
    return data;
}

export const dataRankingFallosEquipamiento = async (user: any) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .rpc('sp_ranking_fallos_equipamiento');
    if (error) throw new Error(error.message);
    return data;
}

export const dataAnalisisCostoBeneficio = async (user: any) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .rpc('sp_analisis_costo_beneficio');
    if (error) throw new Error(error.message);
    return data;
}

export const dataPrediccionFallo = async (user: any) => {
    //TODO IMPLEMENTAR LÓGICA DE PREDICCIÓN DE FALLOS DE EQUIPAMIENTO
    throw new Error("Funcionalidad no implementada");
}

export const getAlertasMantenimientoEquipamientos = async (
  umbralDias = 5
): Promise<AlertasMantenimientoEquipamientoResponse> => {
  const response = await fetch(
    `/api/equipamientos/alertas-mantenimiento?umbralDias=${umbralDias}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Error al obtener alertas de mantenimiento");
  }

  return payload as AlertasMantenimientoEquipamientoResponse;
};
