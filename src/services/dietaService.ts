import { CreateDietaDto, Dieta } from "@/interfaces/dieta.interface";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";

export const createDietaSocio= async( createDieta: CreateDietaDto, user: JwtUser )  =>{
const supabase = conexionBD(user.dbName);
   /* const {data,error} = await supabase
    .from("dieta")
    .insert({...createDieta, creado_por: user.id })
    .select("*")
    .single();

    if(error) {
        throw new Error("Error al crear la dieta: " + error.message);
    }

    return data;
*/
const { error } = await supabase
.rpc("genera_dieta_socio",{
    p_socio_id: createDieta.socio_id,
    p_objetivo_id: createDieta.objetivo,
    p_fecha_inicio: createDieta.fecha_inicio,
    p_fecha_fin: createDieta.fecha_fin,
    p_usuario: user.id
})

if (error) {
    console.log("Error al generar la dieta:", error.message);
    throw new Error("Error al generar la dieta: " + error.message);
}

// como el procedimiento almacenado genera la dieta, no retorna la nueva dieta
const ultimaDieta = await getUltimaDietaSocio(createDieta.socio_id, user);

return ultimaDieta;

    }

export const getAllDietasSocio = async (id: string, user: JwtUser): Promise<Dieta[]> => {
    const supabase = conexionBD(user.dbName);
    const { data, error } = await supabase
        .from("dieta")
        .select("*")
        .eq("socio_id", id);

    if (error) {
        console.log("Error al obtener las dietas:", error.message);
        throw new Error("Error al obtener las dietas: " + error.message);
    }

    return data;
}

export const getAllDietas = async (user: JwtUser): Promise<Dieta[]> => {
    const supabase = conexionBD(user.dbName);
    const { data, error } = await supabase
        .from("dieta")
        .select("*");

    if (error) {
        console.log("Error al obtener las dietas:", error.message);
        throw new Error("Error al obtener las dietas: " + error.message);
    }

    return data;
}

export const getUltimaDietaSocio = async (id: string, user: JwtUser): Promise<Dieta> => {
    const supabase = conexionBD(user.dbName);
    const {data:ultimaDietaData,error:ultimaDietaError} = await supabase
    .from("dieta")
    .select("*")
    .eq("socio_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

    if(ultimaDietaError) {
        throw new Error("Error al crear la dieta: " + ultimaDietaError.message);
    }

    return ultimaDietaData;

}