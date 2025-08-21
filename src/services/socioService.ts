import {
  CreateSocioDto,
  Socio,
  UpdateSocioDto,
} from "@/interfaces/socio.interface";
import { supabase } from "./supabaseClient";
import { conexionBD } from "@/middlewares/conexionBd.middleware";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { Jwt } from "jsonwebtoken";

export const fetchSocios = async (user:JwtUser): Promise<Socio[]> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase
    .from("socio")
    .select("*") // sin filtros
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export const createSocio = async (user:JwtUser,payload: CreateSocioDto): Promise<Socio> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase
    .from("socio")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updateSocio = async (
  user:JwtUser,
  id_socio: string,
  updateData: UpdateSocioDto
): Promise<Socio> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase
    .from("socio")
    .update(updateData)
    .eq("id_socio", id_socio)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data || data.length === 0)
    throw new Error("No se encontró el socio con ese ID");
  return data;
};

export const deleteSocio = async (user:JwtUser,id: string): Promise<Socio> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase
    .from("socio")
    .update({ activo: false })
    .eq("id_socio", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data || data.length === 0)
    throw new Error("No se encontró el socio con ese ID");
  return data;
};

export const existeSocioActivo = async (user:JwtUser,id: string): Promise<boolean> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase
    .from("socio")
    .select("id_socio")
    .eq("id_socio", id)
    .eq("activo", true)
    .single();
  console.log(data, error);

  if (error || !data) return false;
  return true;
};

export const toggleSocioActivo = async (user:JwtUser,socio: {
  id_socio: string;
  activo: boolean;
}) => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase
    .from("socio")
    .update({ activo: !socio.activo })
    .eq("id_socio", socio.id_socio)
    .select();

  if (error) throw new Error(error.message);
  return data;
};

export const getSocioById = async (
  id: string,
  dbName: string
): Promise<Socio> => {
  const supabase = conexionBD(dbName);
  const { data, error } = await supabase
    .from("socio")
    .select()
    .eq("id_socio", id)
    .single();
  if (error) {
    console.log(error.message);
    throw new Error("No se encontró el socio con ese id");
  }
  return data as Socio;
};

export const getAllSociosActivos = async (user:JwtUser): Promise<Socio[]> => {
  const supabase = conexionBD(user.dbName);
  const { data, error } = await supabase
    .from("socio")
    .select()
    .eq("activo", true);

  if (error) {
    console.log(error.message);
    throw new Error("No se encontraron socios activos");
  }
  if (!data || data.length === 0) {
    console.log("No se encontraron socios activos");
    return [];
  }

  return data;
};

export const getSocioByIdUsuario = async (
  usuario_id: string,
  dbName: string
): Promise<Socio> => {
  const supabase = conexionBD(dbName);


  const { data: dataSocio, error: errorSocio } = await supabase
    .from("socio")
    .select("*")
    .eq("usuario_id", usuario_id)
    .single();

  if (errorSocio) {
    console.log(errorSocio);
    throw new Error(`Error al obtener el socio`);
  }

  if (!dataSocio) {
    throw new Error("No se encontró el socio");
  }
  console.log(dataSocio);
  return dataSocio;
};

export const updateFotoSocioById = async (id_socio: string, dbName:string , url: string): Promise<Socio> => {
  const supabase = conexionBD(dbName);
  const { data, error } = await supabase
    .from("socio")
    .update({ foto: url })
    .eq("id_socio", id_socio)
    .select()
    .single();

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new Error("No se encontró el socio con ese ID");
  }

  console.log("profile_photo_updated: Foto de socio actualizada:");

  return data;
};