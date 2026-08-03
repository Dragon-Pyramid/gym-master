import 'server-only';

import { Objetivo } from "@/interfaces/objetivo.interface";
import { getSupabaseServerClient } from "./supabaseServerClient";

export const getAllObjetivos = async (user: any) : Promise<Objetivo[]> => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from('objetivo')
        .select('*')

    if (error) {
        console.error("Error al obtener los objetivos:", error.message);
        throw new Error("No se pudieron obtener los objetivos");
    }

    return data;
}