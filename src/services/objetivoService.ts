import { Objetivo } from "@/interfaces/objetivo.interface";
import { getSupabaseClient } from "./supabaseClient";

export const getAllObjetivos = async (user: any) : Promise<Objetivo[]> => {
    const supabase = getSupabaseClient(user.dbName);
    const { data, error } = await supabase
        .from('objetivo')
        .select('*')

    if (error) {
        console.error("Error al obtener los objetivos:", error.message);
        throw new Error("No se pudieron obtener los objetivos");
    }

    return data;
}