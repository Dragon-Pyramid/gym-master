

import { CreateEntrenadorHorarioDTO } from "@/interfaces/entrenadorHorario.interface";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";


const validarEInsertarBloque = async (dia_semana: string, bloque: { hora_desde: string; hora_hasta: string }, dbName: string, entrenador_id: string) => {
    const supabase = conexionBD(dbName);   
    
    if (!bloque.hora_desde || !bloque.hora_hasta) {
            throw new Error("Cada bloque debe tener hora_desde y hora_hasta.");
        }

        // Validar si el horario ya existe
        const { data: horarioExistente, error: errorVerificacion } = await supabase
            .from("entrenador_horarios")
            .select("*")
            .eq("dia_semana", dia_semana)
            .eq("hora_desde", bloque.hora_desde)
            .eq("hora_hasta", bloque.hora_hasta)
            //.eq("activo", true)
            .single();

        if (errorVerificacion && errorVerificacion.code !== "PGRST116") {
            // Ignorar error "No rows found" (código PGRST116)
            console.error("Error al verificar horarios existentes:", errorVerificacion);
            throw new Error(errorVerificacion.message);
        }

        if (horarioExistente) {
            console.log(`El horario ya existe para el día ${dia_semana}, desde ${bloque.hora_desde} hasta ${bloque.hora_hasta}.`);
            return; // Ignorar este bloque y continuar con los demás
        }

        // Insertar el horario
        const { error: errorInsercion } = await supabase
            .from("entrenador_horarios")
            .insert({
                dia_semana,
                hora_desde: bloque.hora_desde,
                hora_hasta: bloque.hora_hasta,
                entrenador_id,
            });

        if (errorInsercion) {
            console.error("Error al crear el horario del entrenador:", errorInsercion);
            throw new Error(errorInsercion.message);
        }
    };

export const createEntrenadorHorario = async (
    entrenador_id: string,
    entrenadorHorarios: CreateEntrenadorHorarioDTO[],
    user: JwtUser
): Promise<void> => {
    
    // Validar que entrenadorHorarios sea un array válido
    if (!Array.isArray(entrenadorHorarios) || entrenadorHorarios.length === 0) {
        throw new Error("El array de horarios es inválido o está vacío.");
    }

    // Procesar cada horario
    for (const horario of entrenadorHorarios) {
        const { dia_semana, bloques } = horario;

        // Validar que bloques sea un array válido
        if (!Array.isArray(bloques)) {
            throw new Error(`El día ${dia_semana} no tiene bloques válidos.`);
        }

        // Procesar cada bloque
        for (const bloque of bloques) {
            await validarEInsertarBloque(dia_semana, bloque, user.dbName, entrenador_id);
        }
    }
};

export const getHorariosByEntrenadorId = async (id: string, user: JwtUser) => {
    const supabase = conexionBD(user.dbName);
    const { data, error } = await supabase
        .from('entrenador_horarios')
        .select('*')
        .eq('entrenador_id', id)
        //.eq('activo', true);

    if (error) {
        console.error("Error al obtener los horarios del entrenador:", error);
        throw new Error(error.message);
    }

    return data ;
};


export const updateEntrenadorHorario = async (
    entrenador_id: string,
    entrenadorHorarios: CreateEntrenadorHorarioDTO[],
    user: JwtUser
): Promise<void> => {
    const supabase = conexionBD(user.dbName);

    // 1. Desactivar todos los horarios actuales del entrenador
    const { error: errorSoftDelete } = await supabase
        .from("entrenador_horarios")
       // .update({ activo: false })
       .delete()
       .eq("entrenador_id", entrenador_id)
        //.eq("activo", true);  // solo los activos

    if (errorSoftDelete) {
        console.error("Error al desactivar horarios anteriores:", errorSoftDelete);
        throw new Error("No se pudieron desactivar los horarios anteriores.");
    }

    // 2. Insertar los nuevos horarios
    for (const horario of entrenadorHorarios) {
        const { dia_semana, bloques } = horario;

        if (!Array.isArray(bloques)) {
            throw new Error(`El día ${dia_semana} no tiene bloques válidos.`);
        }

        for (const bloque of bloques) {
            await validarEInsertarBloque(dia_semana, bloque, user.dbName, entrenador_id);
        }
    }
};

