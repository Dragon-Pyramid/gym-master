import { CreateEmpleadoDto, Empleado, UpdateEmpleadoDto } from "@/interfaces/empleado.interface";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";

type EmpleadoPayload = Record<string, string | number | boolean | null>;

const nullableString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const nullableDate = (value: unknown): string | null => {
  const normalized = nullableString(value);
  return normalized || null;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizePayload = (payload: CreateEmpleadoDto | UpdateEmpleadoDto): EmpleadoPayload => {
  const normalized: EmpleadoPayload = {};

  if (payload.nombre_completo !== undefined) normalized.nombre_completo = nullableString(payload.nombre_completo) ?? "";
  if (payload.dni !== undefined) normalized.dni = nullableString(payload.dni) ?? "";
  if (payload.email !== undefined) normalized.email = nullableString(payload.email);
  if (payload.telefono !== undefined) normalized.telefono = nullableString(payload.telefono);
  if (payload.direccion !== undefined) normalized.direccion = nullableString(payload.direccion);
  if (payload.fecha_nacimiento !== undefined) normalized.fecha_nacimiento = nullableDate(payload.fecha_nacimiento);
  if (payload.fecha_alta !== undefined) normalized.fecha_alta = nullableDate(payload.fecha_alta);
  if (payload.id_tipo_empleado !== undefined) normalized.id_tipo_empleado = nullableString(payload.id_tipo_empleado);
  if (payload.puesto !== undefined) normalized.puesto = nullableString(payload.puesto);
  if (payload.area !== undefined) normalized.area = nullableString(payload.area);
  if (payload.tipo_contratacion !== undefined) normalized.tipo_contratacion = nullableString(payload.tipo_contratacion);
  if (payload.turno !== undefined) normalized.turno = nullableString(payload.turno);
  if (payload.sueldo_base !== undefined) normalized.sueldo_base = toNumberOrNull(payload.sueldo_base) ?? 0;
  if (payload.fecha_inicio !== undefined) normalized.fecha_inicio = nullableDate(payload.fecha_inicio);
  if (payload.fecha_fin !== undefined) normalized.fecha_fin = nullableDate(payload.fecha_fin);
  if (payload.horarios_texto !== undefined) normalized.horarios_texto = nullableString(payload.horarios_texto);
  if (payload.observaciones !== undefined) normalized.observaciones = nullableString(payload.observaciones);
  if (payload.usuario_id !== undefined) normalized.usuario_id = nullableString(payload.usuario_id);
  if (payload.activo !== undefined) normalized.activo = Boolean(payload.activo);

  return normalized;
};

const empleadoSelect = "*";

type TipoEmpleadoRow = {
  id: string;
  codigo: string;
  nombre: string;
};

const hydrateEmpleadoTipos = async (empleados: Empleado[]): Promise<Empleado[]> => {
  const tipoIds = Array.from(
    new Set(
      empleados
        .map((empleado) => empleado.id_tipo_empleado)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  if (tipoIds.length === 0) {
    return empleados;
  }

  const supabase = conexionBD();
  const { data, error } = await supabase
    .from("tipo_empleado")
    .select("id,codigo,nombre")
    .in("id", tipoIds);

  if (error) {
    return empleados;
  }

  const tiposById = new Map(
    ((data ?? []) as TipoEmpleadoRow[]).map((tipo) => [tipo.id, tipo])
  );

  return empleados.map((empleado) => ({
    ...empleado,
    tipo_empleado:
      empleado.tipo_empleado ??
      (empleado.id_tipo_empleado
        ? tiposById.get(empleado.id_tipo_empleado) ?? null
        : null),
  }));
};

export const getEmpleados = async (_user: JwtUser): Promise<Empleado[]> => {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from("empleados")
    .select(empleadoSelect)
    .order("activo", { ascending: false })
    .order("nombre_completo", { ascending: true });

  if (error) throw new Error(error.message);
  return hydrateEmpleadoTipos((data ?? []) as Empleado[]);
};

export const getEmpleadoById = async (id: string, _user: JwtUser): Promise<Empleado> => {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from("empleados")
    .select(empleadoSelect)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  const [empleado] = await hydrateEmpleadoTipos([data as Empleado]);
  return empleado;
};

export const createEmpleado = async (payload: CreateEmpleadoDto, _user: JwtUser): Promise<Empleado> => {
  const supabase = conexionBD();
  const normalized = normalizePayload(payload);

  if (!normalized.nombre_completo || !normalized.dni) {
    throw new Error("Nombre completo y DNI son obligatorios");
  }

  if (!normalized.fecha_alta) {
    normalized.fecha_alta = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("empleados")
    .insert(normalized)
    .select(empleadoSelect)
    .single();

  if (error) throw new Error(error.message);
  const [empleado] = await hydrateEmpleadoTipos([data as Empleado]);
  return empleado;
};

export const updateEmpleado = async (id: string, payload: UpdateEmpleadoDto, _user: JwtUser): Promise<Empleado> => {
  const supabase = conexionBD();
  const normalized = normalizePayload(payload);

  if (Object.prototype.hasOwnProperty.call(normalized, "nombre_completo") && !normalized.nombre_completo) {
    throw new Error("El nombre completo es obligatorio");
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "dni") && !normalized.dni) {
    throw new Error("El DNI es obligatorio");
  }

  const { data, error } = await supabase
    .from("empleados")
    .update({ ...normalized, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .select(empleadoSelect)
    .single();

  if (error) throw new Error(error.message);
  const [empleado] = await hydrateEmpleadoTipos([data as Empleado]);
  return empleado;
};

export const deactivateEmpleado = async (id: string, user: JwtUser): Promise<Empleado> => {
  return updateEmpleado(id, { activo: false }, user);
};
