import { CreateMantenimientoDTO, Mantenimiento, UpdateMantenimientoDTO } from "@/interfaces/mantenimiento.interface";
import { supabase } from "./supabaseClient"
import { getOneEquipamientoById, updateEquipamiento } from "./equipamientoService";
import dayjs from "dayjs";
import { EstadoMantenimiento } from "@/enums/estadoMantenimiento.enum";
import { EstadoEquipamiento } from "@/enums/estadoEquipamiento.enum";

export const getMantenimientoByIdEquipamiento = async (id: string) : Promise<Mantenimiento[]>=> {
    const equipamiento = await getOneEquipamientoById(id);
    if (!equipamiento) {
        throw new Error(`No se encontró el equipamiento con ID: ${id}`);
    }

    const { data, error } = await supabase
        .from('mantenimiento')
        .select()
        .eq('id_equipamiento', id)

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export const createMantenimiento = async (payload: CreateMantenimientoDTO) : Promise<Mantenimiento>=> {
    const observaciones = payload.observaciones || 'Sin observaciones';
    const fecha_mantenimiento = payload.fecha_mantenimiento || dayjs().format("YYYY-MM-DD");
    const { data, error } = await supabase
        .from('mantenimiento')
        .insert({...payload,observaciones, fecha_mantenimiento})
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export const updateMantenimiento = async (id: string, updateData: UpdateMantenimientoDTO) : Promise<Mantenimiento> => {
    const { data, error } = await supabase
        .from('mantenimiento')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    if (error) {
        throw new Error(error.message);
    }

    return data;
}
export const getAllMantenimientos = async () : Promise<Mantenimiento[]> => {
    const { data, error } = await supabase
        .from('mantenimiento')
        .select();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export const mantenimientoCompletado = async (id: string) : Promise<Mantenimiento> => {
    const { data, error } = await supabase
        .from('mantenimiento')
        .update({ estado: EstadoMantenimiento.COMPLETADO })
        .eq('id', id)
        .select()
        .single();

    if (error) {
    console.log("Error al completar el mantenimiento:", error.message);
        throw new Error("Hubo un error al completar el mantenimiento. Por favor, inténtalo de nuevo más tarde.");
    }

    const idEquipamiento = data.id_equipamiento;    
    const ultima_revision = dayjs().format("YYYY-MM-DD");
    const proxima_revision = dayjs().add(3, 'month').format("YYYY-MM-DD");
    const observaciones = 'Sin observaciones';
   const equipamientoActualizado = await updateEquipamiento(idEquipamiento, { estado: EstadoEquipamiento.OPERATIVO, ultima_revision, proxima_revision, observaciones});
    console.log("Equipamiento actualizado:", equipamientoActualizado );
    return data;
}


