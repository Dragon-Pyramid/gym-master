import { CreateFichaMedicaDto } from '@/interfaces/fichaMedica.interface';
import { FileUploadDTO } from '@/interfaces/fileUpload.interface';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';
import { uploadFile } from './fileUploadService';
import { FichaMedica } from './../interfaces/fichaMedica.interface';

type FichaMedicaFiles = {
  archivo_aprobacion?: FileUploadDTO | null;
  archivos_adjuntos?: FileUploadDTO[];
};


function isPgrstNoRows(error: any) {
  return error?.code === 'PGRST116' || String(error?.message ?? '').includes('0 rows');
}

export async function resolveFichaMedicaSocioId(user: JwtUser, requestedId: string) {
  const supabase = conexionBD();

  if (!requestedId) {
    throw new Error('ID de socio no proporcionado');
  }

  const { data: socio, error } = await supabase
    .from('socio')
    .select('id_socio, usuario_id')
    .or(`id_socio.eq.${requestedId},usuario_id.eq.${requestedId}`)
    .maybeSingle();

  if (error && !isPgrstNoRows(error)) {
    console.log(error);
    throw new Error('Error al resolver el socio de la ficha médica');
  }

  if (!socio?.id_socio) {
    throw new Error('No se encontró el socio asociado para cargar la ficha médica');
  }

  if (user.rol === 'socio') {
    const belongsToCurrentUser =
      socio.id_socio === user.id_socio ||
      socio.usuario_id === user.id ||
      requestedId === user.id;

    if (!belongsToCurrentUser) {
      throw new Error('No autorizado para acceder a la ficha médica de otro socio');
    }
  }

  return socio.id_socio as string;
}

async function uploadMedicalFiles(user: JwtUser, files: FichaMedicaFiles) {
  const folder = `${user.rol}/fichas-medicas`;
  const archivoAprobacionUrl = files.archivo_aprobacion
    ? await uploadFile(files.archivo_aprobacion, `${folder}/aprobaciones`)
    : null;

  const archivosAdjuntosUrls = await Promise.all(
    (files.archivos_adjuntos ?? []).map((file) => uploadFile(file, `${folder}/adjuntos`))
  );

  return {
    archivoAprobacionUrl,
    archivosAdjuntosUrls,
  };
}

export const createFichaMedicaSocio = async (
  user: JwtUser,
  id_socio: string,
  createFichaMedicaDto: CreateFichaMedicaDto,
  files: FichaMedicaFiles = {}
) => {
  const supabase = conexionBD();
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
    fecha_ultimo_control,
    observaciones_entrenador,
    observaciones_medico,
    proxima_revision,
  } = createFichaMedicaDto;

  const { archivoAprobacionUrl, archivosAdjuntosUrls } = await uploadMedicalFiles(user, files);

  const payload = {
    p_alergias: alergias ?? null,
    p_aprobacion_medica: aprobacion_medica ?? null,
    p_archivo_aprobacion: archivoAprobacionUrl,
    p_archivos_adjuntos: archivosAdjuntosUrls.length ? archivosAdjuntosUrls : null,
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
  const supabase = conexionBD();

  const { data, error } = await supabase.rpc('get_ficha_medica_actual', {
    p_id_socio: id_socio,
  });

  if (error) {
    if (isPgrstNoRows(error)) return null;
    console.log(error);
    throw new Error('Error al buscar la ficha médica');
  }

  return data;
};

export const FindAllFichaMedicaSocio = async (
  user: JwtUser,
  id_socio: string
) => {
  const supabase = conexionBD();

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
  const supabase = conexionBD();

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
  const supabase = conexionBD();
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
