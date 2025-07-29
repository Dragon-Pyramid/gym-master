import { Nivel } from "@/interfaces/niveles.interface";
import { getSupabaseClient } from "./supabaseClient";

export const getAllNiveles = async (user: any) : Promise<Nivel[]> => {
    const supabase = getSupabaseClient(user.dbName);
    const { data, error } = await supabase
        .from('nivel')
        .select('*')

    if (error) {
        console.error("Error al obtener los niveles:", error.message);
        throw new Error("No se pudieron obtener los niveles");
    }

    return data;
}   