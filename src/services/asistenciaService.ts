
import { existeSocioActivo } from "./socioService";
import { Asistencia, CreateAsistenciaDto, UpdateAsistenciaDto } from "../interfaces/asistencia.interface"; 
import dayjs from "dayjs";
import  jwt  from 'jsonwebtoken';
import  QRCode  from 'qrcode';
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";

export const getAllAsistencias = async (user: JwtUser): Promise<Asistencia[]>=> {
  const supabase = conexionBD(user.dbName)
  const { data, error } = await supabase
    .from("asistencia")
    .select(`*,
      socio: socio_id (id_socio, nombre_completo)`);
  if (error) {
   console.log(error.message);
    throw new Error("hubo un error al traer las asistencias");
  }
 return data;
};

export const createAsistencia = async (user:JwtUser,payload: CreateAsistenciaDto): Promise<Asistencia> => {
  const supabase = conexionBD(user.dbName)
  // Verificar si el socio existe antes de crear la asistencia
  const socioActivo = await existeSocioActivo(user,payload.socio_id);
  if (!socioActivo) {
    throw new Error("El socio no existe o está inactivo");
  }

  const { data, error } = await supabase
    .from("asistencia")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Asistencia;
};



//TODO: Agregar validacion que el id del socio sea el id que se encuentra en la sesion
// o que el id de la sesion tenga rol de administradors
export const updateAsistencia = async (user: JwtUser, id: string, updateData: UpdateAsistenciaDto): Promise<Asistencia> => {
    const supabase = conexionBD(user.dbName)
    const { data, error } = await supabase
    .from("asistencia")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró asistencia con ese id");
  return data as Asistencia;
};

//TODO: Agregar validacion que el id del socio sea el id que se encuentra en la sesion
// o que el id de la sesion tenga rol de administradors
export const deleteAsistencia = async (user: JwtUser,id: string): Promise<Asistencia[]> => {
  const supabase = conexionBD(user.dbName)
  const { data, error } = await supabase
    .from("asistencia")
    .delete()
    .eq("id", id)
    .select();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró asistencia con ese id");
  return data as Asistencia[];
};

export const createQRDiario = async()=>{
    const hoy = dayjs().format('YYYY-MM-DD')
    const expiracion = dayjs().endOf('day').unix()

    //guardo la fecha de hoy
    const payload = { fecha: hoy }

  if(!process.env.JWT_SECRET){
    throw new Error("No existe la variable de entorno JWT_SECRET");
  }

    //guardo el token, lo firmo y le pongo la fecha de expiracion que sea hasta las 23:59
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: expiracion - dayjs().unix(),
    })

    if(!process.env.NEXTAUTH_URL){
      throw new Error("No existe la variable de entorno NEXTAUTH_URL");
    }
    const url = `${process.env.NEXTAUTH_URL}/api/asistencias/registro-qr?tokenAsistencia=${token}`
    //genero el QR y pongo que guarde la url del endpoint donde se hace la solicitud con los token asi registramos la asistencia
    const qrCode = await QRCode.toDataURL(url)

    if(!qrCode){
      throw new Error("No se pudo generar el QR");
    }

    return { qrCode, url, token }
}

export const registrarAsistenciaDesdeQR = async (tokenAsistencia: string,user:JwtUser) => {
  
  if(!process.env.JWT_SECRET){
    throw new Error("No existe la variable de entorno JWT_SECRET");
  }

    //VERIFICO QUE EL TOKEN DE ASISTENCIA ESTE FIRMADO Y VIGENTE
    const decoded = jwt.verify(tokenAsistencia, process.env.JWT_SECRET)
    
    // Registrar la asistencia del usuario logueado en su gimnasio
    const supabase = conexionBD(user.dbName)

    //TRAIGO EL SOCIO QUE  ESTA RELACIONADO A ESE USUARIO
  const socio = user.id_socio


  // verifico si el socio ya registro su asistencia en el dia de hoy
    const {data:dataSocioAsistencia} = await supabase
      .from("asistencia")
      .select("*")
      .eq("socio_id", socio)
      .eq("fecha", decoded.fecha)
      .single();

    if (dataSocioAsistencia) {
      //si ya existe una asistencia para ese socio, no se puede crear otra 
      return { valido: false, error: `Ya existe una asistencia para este socio en esta fecha ${dataSocioAsistencia.fecha} a las ${dataSocioAsistencia.hora_ingreso}` };
    }

    
    const horaIngreso = dayjs().format('HH:mm:ss');
    const horaEgreso = dayjs().add(2, 'hour').format('HH:mm:ss');

    const createAsistenciaResult = await createAsistencia(user,{
      socio_id: socio,
      fecha: decoded.fecha,
      hora_ingreso: horaIngreso,
      hora_egreso: horaEgreso
    });

    return { valido: true, asistencia: createAsistenciaResult };

}

export const dataConcurrenciaSemanal = async (user: JwtUser) => {
    const supabase = conexionBD(user.dbName);
    const { data, error } = await supabase
        .rpc('sp_concurrencia_semanal');
    if (error) throw new Error(error.message);
    return data;
}

export const dataConcurrenciaMensual = async (user: JwtUser) => {
    const supabase = conexionBD(user.dbName);
    const { data, error } = await supabase
        .rpc('sp_concurrencia_mensual');
    if (error) throw new Error(error.message);
    return data;
}

export const dataConcurrenciaAnual = async (user: JwtUser) => {
    const supabase = conexionBD(user.dbName);
    const { data, error } = await supabase
        .rpc('sp_concurrencia_anual');
    if (error) throw new Error(error.message);
    return data;
}

export const dataPrediccionAbandono = async (user: JwtUser) => {
    const supabase = conexionBD(user.dbName)
    const { data, error } = await supabase
        .rpc('sp_prediccion_abandono');
    if (error) throw new Error(error.message);
    return data;
} 

export const dataTopInactivos = async (user: JwtUser) => {
    const supabase = conexionBD(user.dbName);
    const { data, error } = await supabase
        .rpc('sp_top_inactivos');
    if (error) throw new Error(error.message);
    return data;
}
