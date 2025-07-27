import { SignInDto } from "@/interfaces/credentials.interface";
import { getSupabaseClient } from "./supabaseClient";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { getSocioByIdUsuario } from "./socioService";

export const signIn = async (login: SignInDto) => {
  const { email, password, rol, dbName } = login;
  if (!dbName) {
    throw new Error(
      "No se encontró el nombre de la base de datos en el usuario"
    );
  }
  //ME CONECTO A LA BD DINAMICAMENTE, CON SU NOMBRE
  const supabase = getSupabaseClient(dbName);
  if (!supabase) {
    throw new Error(
      `No se pudo obtener el cliente de Supabase para la base de datos: ${dbName}`
    );
  }

  //BUSCO EN ESA BD, EL USUARIO
  const { data, error } = await supabase
    .from("usuario")
    .select()
    .eq("email", email)
    .single();

  if (error) {
    console.log("Error al obtener el usuario:", error.message);
    throw new Error("Error al obtener el usuario");
  }

  if (!data) {
    console.log("Email no encontrado");
    throw new Error("Usuario no encontrado o contraseña incorrecta");
  }

  const validatePassword = bcrypt.compareSync(password, data.password_hash);

  if (!validatePassword) {
    console.log("Contraseña incorrecta");
    throw new Error("Usuario no encontrado o contraseña incorrecta");
  }

  if (data.rol !== rol) {
    console.log("Rol no autorizado");
    throw new Error("Usuario no encontrado o contraseña incorrecta");
  }
  if (data.activo === false) {
    console.log("Usuario inactivo");
    throw new Error("Usuario inactivo");
  }

  const socio = await getSocioByIdUsuario(data.id);
  if (!socio) {
    console.log("No se encontró el socio asociado al usuario");
    throw new Error("No se encontró el socio asociado al usuario");
  }

  const payload = {
    sub: data.id,
    id: data.id,
    id_socio: socio.id_socio,
    email: data.email,
    rol: data.rol,
    dbName,
    nombre: data.nombre,
  };
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no está definido en las variables de entorno");
  }
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "3h" });
  return token;
};
