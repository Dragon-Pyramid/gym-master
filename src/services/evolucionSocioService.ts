import {
  CreateEvolucionSocioDto,
  EvolucionSocio,
} from "@/interfaces/evolucionSocio.interface";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";

const round2 = (value: number) => Number(value.toFixed(2));

const promedio = (values: Array<number | null | undefined>) => {
  const valid = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value)
  );

  if (!valid.length) return null;

  return round2(valid.reduce((acc, value) => acc + value, 0) / valid.length);
};

const calcularImc = (peso: number, alturaCm: number) => {
  if (!peso || !alturaCm || alturaCm <= 0) return null;

  const alturaM = alturaCm / 100;
  return round2(peso / (alturaM * alturaM));
};

const removeUndefined = <T extends Record<string, unknown>>(obj: T) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;

const normalizarNumero = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizarFecha = (fecha?: string | null) => {
  if (!fecha) return new Date().toISOString().split("T")[0];

  return fecha.split("T")[0];
};

const isSocioRole = (rol?: string) => (rol || "").toLowerCase().includes("socio");

export const createEvolucionSocio = async (
  createEvolucionSocio: CreateEvolucionSocioDto,
  user: JwtUser
) => {
  const supabase = conexionBD();

  const socioId = createEvolucionSocio.socio_id || user.id_socio;

  if (!socioId) {
    throw new Error("El usuario no tiene un socio asociado");
  }

  if (
    createEvolucionSocio.socio_id &&
    isSocioRole(user.rol) &&
    user.id_socio &&
    createEvolucionSocio.socio_id !== user.id_socio
  ) {
    throw new Error("No autorizado para registrar evolución de otro socio");
  }

  const peso = normalizarNumero(createEvolucionSocio.peso);
  const altura = normalizarNumero(createEvolucionSocio.altura);

  if (!peso || peso <= 0) {
    throw new Error("El peso es obligatorio y debe ser mayor a cero");
  }

  if (!altura || altura <= 0) {
    throw new Error("La altura es obligatoria y debe ser mayor a cero");
  }

  const bicepsIzquierdo = normalizarNumero(createEvolucionSocio.biceps_izquierdo);
  const bicepsDerecho = normalizarNumero(createEvolucionSocio.biceps_derecho);
  const tricepsIzquierdo = normalizarNumero(createEvolucionSocio.triceps_izquierdo);
  const tricepsDerecho = normalizarNumero(createEvolucionSocio.triceps_derecho);
  const musloIzquierdo = normalizarNumero(createEvolucionSocio.muslo_izquierdo);
  const musloDerecho = normalizarNumero(createEvolucionSocio.muslo_derecho);
  const pantorrillaIzquierda = normalizarNumero(
    createEvolucionSocio.pantorrilla_izquierda
  );
  const pantorrillaDerecha = normalizarNumero(
    createEvolucionSocio.pantorrilla_derecha
  );

  const bicepLegacy =
    normalizarNumero(createEvolucionSocio.bicep) ??
    promedio([bicepsIzquierdo, bicepsDerecho]) ??
    0;

  const tricepLegacy =
    normalizarNumero(createEvolucionSocio.tricep) ??
    promedio([tricepsIzquierdo, tricepsDerecho]) ??
    0;

  const piernaLegacy =
    normalizarNumero(createEvolucionSocio.pierna) ??
    promedio([musloIzquierdo, musloDerecho]) ??
    0;

  const pantorrillaLegacy =
    normalizarNumero(createEvolucionSocio.pantorrilla) ??
    promedio([pantorrillaIzquierda, pantorrillaDerecha]) ??
    0;

  const gluteosLegacy =
    normalizarNumero(createEvolucionSocio.gluteos) ??
    normalizarNumero(createEvolucionSocio.cadera) ??
    0;

  const fecha = normalizarFecha(createEvolucionSocio.fecha);
  const imc = calcularImc(peso, altura);

  let esRegistroInicial = createEvolucionSocio.es_registro_inicial;

  if (typeof esRegistroInicial !== "boolean") {
    const { count } = await supabase
      .from("evolucion_socio")
      .select("*", { count: "exact", head: true })
      .eq("socio_id", socioId);

    esRegistroInicial = (count || 0) === 0;
  }

  const insertPayload = removeUndefined({
    socio_id: socioId,
    fecha,
    peso,
    altura,
    imc,
    cintura: normalizarNumero(createEvolucionSocio.cintura),
    pecho: normalizarNumero(createEvolucionSocio.pecho),
    cadera: normalizarNumero(createEvolucionSocio.cadera),
    abdomen: normalizarNumero(createEvolucionSocio.abdomen),
    cuello: normalizarNumero(createEvolucionSocio.cuello),
    hombros: normalizarNumero(createEvolucionSocio.hombros),
    antebrazo_izquierdo: normalizarNumero(createEvolucionSocio.antebrazo_izquierdo),
    antebrazo_derecho: normalizarNumero(createEvolucionSocio.antebrazo_derecho),
    biceps_izquierdo: bicepsIzquierdo,
    biceps_derecho: bicepsDerecho,
    triceps_izquierdo: tricepsIzquierdo,
    triceps_derecho: tricepsDerecho,
    muslo_izquierdo: musloIzquierdo,
    muslo_derecho: musloDerecho,
    pantorrilla_izquierda: pantorrillaIzquierda,
    pantorrilla_derecha: pantorrillaDerecha,
    porcentaje_grasa: normalizarNumero(createEvolucionSocio.porcentaje_grasa),
    masa_muscular: normalizarNumero(createEvolucionSocio.masa_muscular),
    tipo_corporal: createEvolucionSocio.tipo_corporal || null,
    sexo_referencia: createEvolucionSocio.sexo_referencia || null,
    foto_frontal_url: createEvolucionSocio.foto_frontal_url || null,
    foto_lateral_url: createEvolucionSocio.foto_lateral_url || null,
    foto_espalda_url: createEvolucionSocio.foto_espalda_url || null,
    origen_registro:
      createEvolucionSocio.origen_registro ||
      (isSocioRole(user.rol) ? "socio" : "admin"),
    es_registro_inicial: esRegistroInicial,
    observaciones: createEvolucionSocio.observaciones || null,
    actualizado_en: new Date().toISOString(),

    /**
     * Compatibilidad con columnas heredadas del modelo anterior.
     * Si en una futura migración se eliminan, este bloque deberá retirarse.
     */
    bicep: bicepLegacy,
    tricep: tricepLegacy,
    pierna: piernaLegacy,
    gluteos: gluteosLegacy,
    pantorrilla: pantorrillaLegacy,
  });

  const { data, error } = await supabase
    .from("evolucion_socio")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("Error al crear evolución:", error.message, error.details);
    throw new Error(`Error al registrar la evolución: ${error.message}`);
  }

  return data as EvolucionSocio;
};

export const findAllEvolucionesSocioByIdSocio = async (
  user: JwtUser,
  socio_id: string
) => {
  const supabase = conexionBD();

  if (!socio_id) {
    throw new Error("Debe indicar un socio");
  }

  if (
    isSocioRole(user.rol) &&
    user.id_socio &&
    socio_id !== user.id_socio
  ) {
    throw new Error("No autorizado para consultar evolución de otro socio");
  }

  const { data, error } = await supabase
    .from("evolucion_socio")
    .select("*")
    .eq("socio_id", socio_id)
    .order("fecha", { ascending: false });

  if (error) {
    throw new Error(
      `Error al obtener las evoluciones del socio: ${error.message}`
    );
  }

  return (data || []) as EvolucionSocio[];
};
