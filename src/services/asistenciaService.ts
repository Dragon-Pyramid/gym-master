import { existeSocioActivo, getSocioById, updateSocio } from './socioService';
import {
  Asistencia,
  CreateAsistenciaDto,
  UpdateAsistenciaDto,
} from '../interfaces/asistencia.interface';
import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';
import { getSocioByIdUsuario } from './socioService';

export const getAllAsistencias = async (
  user: JwtUser
): Promise<Asistencia[]> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase.from('asistencia').select(`*,
      socio: socio_id (id_socio, nombre_completo)`);
  if (error) {
    console.log(error.message);
    throw new Error('hubo un error al traer las asistencias');
  }
  return data;
};

export const createAsistencia = async (
  user: JwtUser,
  payload: CreateAsistenciaDto
): Promise<Asistencia> => {
  const supabase = conexionBD(user.dbName);
  // Verificar si el socio existe antes de crear la asistencia
  const socioActivo = await existeSocioActivo(user, payload.socio_id);
  if (!socioActivo) {
    throw new Error('El socio no existe o está inactivo');
  }

  const { data, error } = await supabase
    .from('asistencia')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Asistencia;
};

//TODO: Agregar validacion que el id del socio sea el id que se encuentra en la sesion
// o que el id de la sesion tenga rol de administradors
export const updateAsistencia = async (
  user: JwtUser,
  id: string,
  updateData: UpdateAsistenciaDto
): Promise<Asistencia> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase
    .from('asistencia')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0)
    throw new Error('No se encontró asistencia con ese id');
  return data as Asistencia;
};

//TODO: Agregar validacion que el id del socio sea el id que se encuentra en la sesion
// o que el id de la sesion tenga rol de administradors
export const deleteAsistencia = async (
  user: JwtUser,
  id: string
): Promise<Asistencia[]> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase
    .from('asistencia')
    .delete()
    .eq('id', id)
    .select();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0)
    throw new Error('No se encontró asistencia con ese id');
  return data as Asistencia[];
};

export const createQRDiario = async () => {
  const hoy = dayjs().format('YYYY-MM-DD');
  const expiracion = dayjs().endOf('day').unix();

  //guardo la fecha de hoy
  const payload = { fecha: hoy };

  if (!process.env.JWT_SECRET) {
    throw new Error('No existe la variable de entorno JWT_SECRET');
  }

  //guardo el token, lo firmo y le pongo la fecha de expiracion que sea hasta las 23:59
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiracion - dayjs().unix(),
  });

  if (!process.env.NEXTAUTH_URL) {
    throw new Error('No existe la variable de entorno NEXTAUTH_URL');
  }
  const url = `${process.env.NEXTAUTH_URL}/api/asistencias/registro-qr?tokenAsistencia=${token}`;
  //genero el QR y pongo que guarde la url del endpoint donde se hace la solicitud con los token asi registramos la asistencia
  const qrCode = await QRCode.toDataURL(url);

  if (!qrCode) {
    throw new Error('No se pudo generar el QR');
  }

  return { qrCode, url, token };
};

export const registrarAsistenciaDesdeQR = async (
  tokenAsistencia: string,
  user: JwtUser
) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('No existe la variable de entorno JWT_SECRET');
  }

  //VERIFICO QUE EL TOKEN DE ASISTENCIA ESTE FIRMADO Y VIGENTE
  const decoded = jwt.verify(tokenAsistencia, process.env.JWT_SECRET);
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Token inválido');
  }
  const payload = decoded as { fecha: string };
  const fechaAsistencia = payload.fecha;

  //VERIFICO QUE LA FECHA DEL TOKEN SEA LA DE HOY
  const hoy = dayjs().format('YYYY-MM-DD');
  if (fechaAsistencia !== hoy) {
    return {
      valido: false,
      error: 'El código QR ha expirado. Solicita un nuevo código.',
    };
  }

  //VERIFICO QUE EL SOCIO EXISTA Y ESTE ACTIVO
  const socio = await getSocioByIdUsuario(user.id, user.dbName);
  if (!socio || !socio.activo) {
    return {
      valido: false,
      error: 'No se encontró un socio activo asociado a tu cuenta.',
    };
  }

  //VERIFICO SI YA EXISTE UNA ASISTENCIA PARA HOY
  const supabase = conexionBD(user.dbName);
  const { data: dataSocioAsistencia, error: errorSocioAsistencia } =
    await supabase
      .from('asistencia')
      .select(
        `
        *,
        socio: socio_id (
          id_socio, 
          nombre_completo,
          usuario_id (
            foto,
            nombre
          )
        )
      `
      )
      .eq('socio_id', socio.id_socio)
      .eq('fecha', hoy)
      .single();

  if (errorSocioAsistencia && errorSocioAsistencia.code !== 'PGRST116') {
    throw new Error('Error al verificar asistencia existente');
  }

  if (dataSocioAsistencia) {
    return {
      valido: true,
      message: `Asistencia ya registrada para hoy. ¡Bienvenido de nuevo!`,
      asistencia: dataSocioAsistencia,
    };
  }

  //CREO LA ASISTENCIA
  const { data: nuevaAsistencia, error: errorNuevaAsistencia } = await supabase
    .from('asistencia')
    .insert({
      socio_id: socio.id_socio,
      fecha: hoy,
      hora_ingreso: dayjs().format('HH:mm:ss'),
    })
    .select(
      `
        *,
        socio: socio_id (
          id_socio,
          nombre_completo,
          usuario_id (
            foto,
            nombre
          )
        )
      `
    )
    .single();

  if (errorNuevaAsistencia) {
    console.error('Error de Supabase al crear asistencia:', errorNuevaAsistencia);
    throw new Error(`Error al crear la asistencia: ${errorNuevaAsistencia.message}`);
  }

  return {
    valido: true,
    message: 'Asistencia registrada correctamente.',
    asistencia: nuevaAsistencia,
  };
};

export const dataConcurrenciaSemanal = async (user: JwtUser) => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase.rpc('sp_concurrencia_semanal');
  if (error) throw new Error(error.message);
  return data;
};

export const dataConcurrenciaMensual = async (user: JwtUser) => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase.rpc('sp_concurrencia_mensual');
  if (error) throw new Error(error.message);
  return data;
};

export const dataConcurrenciaAnual = async (user: JwtUser) => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase.rpc('sp_concurrencia_anual');
  if (error) throw new Error(error.message);
  return data;
};

export const dataPrediccionAbandono = async (user: JwtUser) => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase.rpc('sp_prediccion_abandono');
  if (error) throw new Error(error.message);
  return data;
};

export const dataTopInactivos = async (user: JwtUser) => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase.rpc('sp_top_inactivos');
  if (error) throw new Error(error.message);
  return data;
};



export const rankingMensualAsistencia = async ({mes, anio}: {mes: number, anio: number}, user: JwtUser) => {
  const inicioMes = `${anio}-${mes}-01`;
// Día final del mes (dayjs lo calcula con .endOf("month"))
const finMes = dayjs(inicioMes).endOf("month").format("YYYY-MM-DD");

const supabase = conexionBD(user.dbName);
const {data, error} = await supabase 
.from('asistencia')
.select("*")
 .gte('fecha', inicioMes)   // fecha >= inicioMes
  .lte('fecha', finMes);     // fecha <= finMes

if (error) throw new Error(error.message);

const asistenciasFiltradas = data.filter( asistencias =>  asistencias.socio_id  )



const setSocios = new Set(asistenciasFiltradas.map(asistencia => asistencia.socio_id));

let asistenciasPorSocio: {socio_id: string, cantidad: number, nombre_completo: string}[] = [];
for (let index = 0; index < [...setSocios].length; index++) {
  //cada socio
  //Ahora tengo que contar cuantas asistencias tiene cada socio en el mes y año indicado
  const idSocio = [...setSocios][index];
  const asistenciasDelSocio = asistenciasFiltradas.filter(asistencia => asistencia.socio_id === idSocio);
  const cantidadAsistencias = asistenciasDelSocio.length;

  //traigo los datos del socio para devolver el nombre completo en el ranking
  const socio = await getSocioById(idSocio, user.dbName);

  asistenciasPorSocio.push({ socio_id: idSocio, nombre_completo: socio.nombre_completo , cantidad: cantidadAsistencias });
}
asistenciasPorSocio.sort((a, b) => b.cantidad - a.cantidad);

//Ahora solo dejo los 10 primeros
asistenciasPorSocio = asistenciasPorSocio.slice(0, 10);

asistenciasPorSocio.map( async (a) =>  await updateSocio(user, a.socio_id, {descuento_activo: true}) ) //Si el socio esta en el ranking entonces se le activa el descuento)

return {asistenciasPorSocio};


}