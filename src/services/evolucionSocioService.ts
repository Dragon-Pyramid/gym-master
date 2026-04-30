import { CreateEvolucionSocioDto } from "@/interfaces/evolucionSocio.interface";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";

export const createEvolucionSocio = async (
  createEvolucionSocio: CreateEvolucionSocioDto,
  user: JwtUser
) => {
  const supabase = conexionBD(user.dbName);

  const imc =
    createEvolucionSocio.peso /
    ((createEvolucionSocio.altura / 100) * (createEvolucionSocio.altura / 100)); // dividido 100 xq paso de cm a m
  const imcFinal = Number(imc.toFixed(2));
  const fecha = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD
  const { data, error } = await supabase
    .from("evolucion_socio")
    .insert({
      ...createEvolucionSocio,
      imc: imcFinal,
      fecha: fecha,
    })
    .select()
    .single();

  if (error) {
    console.log("Error al crear evolución:", error.message);
    throw new Error("Error al registrar la evolución");
  }

  return data;
};

export const findAllEvolucionesSocioByIdSocio = async (
  user: JwtUser,
  socio_id: string
) => {
  const supabase = conexionBD(user.dbName);

  const { data, error } = await supabase
    .from("evolucion_socio")
    .select("*")
    .eq("socio_id", socio_id)
    .order("fecha", { ascending: false });

  if (error) {
    throw new Error(
      `Error al obtener las evoluciones de los socios: ${error.message}`
    );
  }

  return data;
};
