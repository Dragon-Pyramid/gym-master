import { CreateFichaMedicaDto } from "@/interfaces/fichaMedica.interface";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";


//TODO SE DEBE RETORNAR LA FICHA CREADA
// SE DEBE VINCULAR QUE SI TIENE LA FICHA MEDICA EN FOTO, SE DEBE SUBIR A CLOUDINARY
// PREGUNTAR. EL ARRAY DE LINKS ARCHIVOS ADJUNTOS
export const createFichaMedicaSocio= async (user : JwtUser, id_socio: string, createFichaMedicaDto: CreateFichaMedicaDto)=> {
const supabase = conexionBD(user.dbName);
const{altura, peso, grupo_sanguineo, presion_arterial, frecuencia_cardiaca, problemas_cardiacos, problemas_respiratorios, aprobacion_medica, alergias, medicacion, lesiones_previas, enfermedades_cronicas, cirugias_previas, archivo_aprobacion, fecha_ultimo_control, observaciones_entrenador, observaciones_medico, archivos_adjuntos, proxima_revision} = createFichaMedicaDto;

const{data,error} = await supabase
.rpc("insert_ficha_medica",{
   p_id_socio: id_socio,
   p_altura: altura,
   p_peso: peso,
   p_grupo_sanguineo: grupo_sanguineo,
   p_presion_arterial: presion_arterial,
   p_frecuencia_cardiaca: frecuencia_cardiaca,
   p_problemas_cardiacos: problemas_cardiacos,
   p_problemas_respiratorios: problemas_respiratorios,
   p_aprobacion_medica: aprobacion_medica,
   p_alergias: alergias,
   p_medicacion: medicacion,
   p_lesiones_previas: lesiones_previas,
   p_enfermedades_cronicas: enfermedades_cronicas,
   p_cirugias_previas: cirugias_previas,
   p_archivo_aprobacion: archivo_aprobacion,
   p_fecha_ultimo_control: fecha_ultimo_control,
   p_observaciones_entrenador: observaciones_entrenador,
   p_observaciones_medico: observaciones_medico,
   p_archivos_adjuntos: archivos_adjuntos,
   p_proxima_revision: proxima_revision
});

if(error){
    console.log(error);
    throw new Error("Error al crear la ficha médica");
}


return data[0];

}

export const FindFichaMedicaSocio = async (user: JwtUser, id_socio: string) => {
    const supabase = conexionBD(user.dbName);

    const { data, error } = await supabase

        .rpc("get_ficha_medica_actual", {
            p_id_socio: id_socio
        });

    if (error) {
        console.log(error);
        throw new Error("Error al buscar la ficha médica");
    }

    return data;
}

export const FindAllFichaMedicaSocio = async (user: JwtUser, id_socio: string) => {
    const supabase = conexionBD(user.dbName);

    const { data, error } = await supabase
        .rpc("list_fichas_medicas", {
            p_id_socio: id_socio
        });

    if (error) {
        console.log(error);
        throw new Error("Error al buscar la ficha médica");
    }

    return data;
}

export const FindOneFichaMedicaSocio = async (user: JwtUser, id: string, id_ficha: string) => {
    const supabase = conexionBD(user.dbName);

    const { data, error } = await supabase
    .from("ficha_medica")
    .select("*")
    .eq("id", id_ficha)
    .eq("id_socio", id)
    .single();

    if (error) {
        console.log(error);
        throw new Error("Error al buscar la ficha médica");
    }

    return data;
}

