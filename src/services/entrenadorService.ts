import { CreateEntrenadorDTO, Entrenador } from "@/interfaces/entrenador.interface";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";
import { createEntrenadorHorario } from "./entrenadorHorarioService";

export const createEntrenador = async (createEntrenador: CreateEntrenadorDTO, user: JwtUser): Promise<Entrenador> => {
    const supabase = conexionBD(user.dbName);
    const { nombre_completo, dni, horarios } = createEntrenador;

    const { data:entrenadorData, error:entrenadorError } = await supabase
        .from('entrenadores')
        .insert({
            nombre_completo,
            dni,
            fecha_alta: new Date().toISOString(),
            activo: true,
            horarios_texto: ''
        })
        .select()
        .single();
    if (entrenadorError) {
        console.error("Error al crear el entrenador:", entrenadorError);
        throw new Error(entrenadorError.message);
    }
    // una vez creado el entrenador, creo los horarios

    //le paso el id del entrenador, el array de horarios que se pasa de front y el user logueado
     await createEntrenadorHorario(
       entrenadorData.id,
       horarios,
        user
    );

    //unsa vez q tenga la fila creada, llamo a la funcion que carga los horarios y desp guardo 
    // el dato en el entrenador 
    const{data,error} = await supabase
    .rpc("generar_horarios_texto", { p_entrenador_id: entrenadorData.id });
    if (error) {
        console.error("Error al generar horarios texto:", error);
        throw new Error(error.message);
    }
    
    // actualizo el campo horarios_texto del entrenador con el resultado de la función
    entrenadorData.horarios_texto = data;

    //Actualizo el entrenador con los horarios_texto generados en supabase
    const { error: updateError } = await supabase
        .from('entrenadores')
        .update({ horarios_texto: entrenadorData.horarios_texto })
        .eq('id', entrenadorData.id);

    if( updateError ) {
        console.error("Error al actualizar el entrenador con horarios_texto:", updateError);
    }

    // Devuelvo el entrenador con los horarios_texto actualizados
    return entrenadorData;
}   