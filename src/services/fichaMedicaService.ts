import { CreateFichaMedicaDto } from '@/interfaces/fichaMedica.interface';
import { FileUploadDTO } from '@/interfaces/fileUpload.interface';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';
import { uploadFile } from './fileUploadService';
import { FichaMedica } from './../interfaces/fichaMedica.interface';

//TODO SE DEBE RETORNAR LA FICHA CREADA
// SE DEBE VINCULAR QUE SI TIENE LA FICHA MEDICA EN FOTO, SE DEBE SUBIR A CLOUDINARY
// PREGUNTAR. EL ARRAY DE LINKS ARCHIVOS ADJUNTOS
export const createFichaMedicaSocio = async (
  user: JwtUser,
  id_socio: string,
  createFichaMedicaDto: CreateFichaMedicaDto,
  file: FileUploadDTO
) => {
  const supabase = conexionBD(user.dbName);
  const {
    altura,
    peso,
    grupo_sanguineo,
    presion_arterial,
    frecuencia_cardiaca,
    problemas_cardiacos,
    problemas_respiratorios,
    aprobacion_medica,
    alergias,
    medicacion,
    lesiones_previas,
    enfermedades_cronicas,
    cirugias_previas,
    archivo_aprobacion,
    fecha_ultimo_control,
    observaciones_entrenador,
    observaciones_medico,
    archivos_adjuntos,
    proxima_revision,
  } = createFichaMedicaDto;

  const urlFicha = await uploadFile(file, `${user.dbName}/${user.rol}/fichas`);

  const urlArchivosAdjuntos = await FindAllUrlFotoFichaMedica(user, id_socio);

  const payload = {
    p_alergias: alergias ?? null,
    p_aprobacion_medica: aprobacion_medica ?? null,
    p_archivo_aprobacion: null, // subir archivo aparte si corresponde
    p_archivos_adjuntos: urlArchivosAdjuntos,
    p_cirugias_previas: cirugias_previas ?? null,
    p_enfermedades_cronicas: enfermedades_cronicas ?? null,
    p_fecha_ultimo_control: fecha_ultimo_control ?? null,
    p_frecuencia_cardiaca: frecuencia_cardiaca ?? null,
    p_grupo_sanguineo: grupo_sanguineo ?? null,
    p_id_socio: id_socio,
    p_lesiones_previas: lesiones_previas ?? null,
    p_medicacion: medicacion ?? null,
    p_observaciones_entrenador: observaciones_entrenador ?? null,
    p_observaciones_medico: observaciones_medico ?? null,
    p_peso: peso ?? null,
    p_presion_arterial: presion_arterial ?? null,
    p_problemas_cardiacos: problemas_cardiacos ?? null,
    p_problemas_respiratorios: problemas_respiratorios ?? null,
    p_proxima_revision: proxima_revision ?? null,
    p_altura: altura ?? null,
  };
  const { data, error } = await supabase.rpc('insert_ficha_medica', payload);

  if (error) {
    console.log(error);
    throw new Error('Error al crear la ficha médica');
  }

  return data[0];
};

export const FindFichaMedicaSocio = async (user: JwtUser, id_socio: string) => {
  const supabase = conexionBD(user.dbName);

  const { data, error } = await supabase.rpc('get_ficha_medica_actual', {
    p_id_socio: id_socio,
  });

  if (error) {
    console.log(error);
    throw new Error('Error al buscar la ficha médica');
  }

  return data;
};

export const FindAllFichaMedicaSocio = async (
  user: JwtUser,
  id_socio: string
) => {
  const supabase = conexionBD(user.dbName);

  const { data, error } = await supabase.rpc('list_fichas_medicas', {
    p_id_socio: id_socio,
  });

  if (error) {
    console.log(error);
    throw new Error('Error al buscar la ficha médica');
  }

  return data;
};

export const FindOneFichaMedicaSocio = async (
  user: JwtUser,
  id: string,
  id_ficha: string
) => {
  const supabase = conexionBD(user.dbName);

  const { data, error } = await supabase
    .from('ficha_medica')
    .select('*')
    .eq('id', id_ficha)
    .eq('id_socio', id)
    .single();

  if (error) {
    console.log(error);
    throw new Error('Error al buscar la ficha médica');
  }

  return data;
};

export const FindAllUrlFotoFichaMedica = async (
  user: JwtUser,
  id_socio: string
) => {
  const supabase = conexionBD(user.dbName);
  const { data: fichas, error } = await supabase
    .from('ficha_medica')
    .select('archivo_aprobacion')
    .eq('id_socio', id_socio);

  if (error) {
    console.log(error);
    throw new Error('Error al buscar las fotos de la ficha médica');
  }

  return fichas.map((ficha) => ficha.archivo_aprobacion);
};
