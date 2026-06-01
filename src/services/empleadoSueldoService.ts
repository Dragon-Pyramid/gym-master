import {
  CreateEmpleadoSueldoDto,
  EmpleadoSueldo,
  UpdateEmpleadoSueldoDto,
} from "@/interfaces/empleado_sueldo.interface";
import { Empleado } from "@/interfaces/empleado.interface";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { conexionBD } from "@/middlewares/conexionBd.middleware";

type SueldoPayload = Record<string, string | number | null>;

const sueldoSelect = "*";

const nullableString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizePeriod = (value: unknown): string | null => {
  const raw = nullableString(value);
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-01`;

  const ddMmYyyyMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddMmYyyyMatch) return `${ddMmYyyyMatch[3]}-${ddMmYyyyMatch[2]}-01`;

  return raw;
};

const normalizeDate = (value: unknown): string | null => {
  const raw = nullableString(value);
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const ddMmYyyyMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddMmYyyyMatch) return `${ddMmYyyyMatch[3]}-${ddMmYyyyMatch[2]}-${ddMmYyyyMatch[1]}`;

  return raw;
};

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePayload = (payload: CreateEmpleadoSueldoDto | UpdateEmpleadoSueldoDto): SueldoPayload => {
  const normalized: SueldoPayload = {};

  if (payload.empleado_id !== undefined) normalized.empleado_id = nullableString(payload.empleado_id);
  if (payload.periodo !== undefined) normalized.periodo = normalizePeriod(payload.periodo);
  if (payload.concepto !== undefined) normalized.concepto = nullableString(payload.concepto) ?? "Sueldo mensual";
  if (payload.sueldo_base !== undefined) normalized.sueldo_base = toNumber(payload.sueldo_base);
  if (payload.bonos !== undefined) normalized.bonos = toNumber(payload.bonos);
  if (payload.descuentos !== undefined) normalized.descuentos = toNumber(payload.descuentos);
  if (payload.monto_neto !== undefined) normalized.monto_neto = toNumber(payload.monto_neto);
  if (payload.estado !== undefined) normalized.estado = nullableString(payload.estado) ?? "pendiente";
  if (payload.medio_pago !== undefined) normalized.medio_pago = nullableString(payload.medio_pago);
  if (payload.fecha_pago !== undefined) normalized.fecha_pago = normalizeDate(payload.fecha_pago);
  if (payload.comprobante_url !== undefined) normalized.comprobante_url = nullableString(payload.comprobante_url);
  if (payload.observaciones !== undefined) normalized.observaciones = nullableString(payload.observaciones);

  return normalized;
};

const hydrateSueldosEmpleados = async (sueldos: EmpleadoSueldo[]): Promise<EmpleadoSueldo[]> => {
  const empleadoIds = Array.from(
    new Set(
      sueldos
        .map((sueldo) => sueldo.empleado_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  if (empleadoIds.length === 0) return sueldos;

  const supabase = conexionBD();
  const { data, error } = await supabase
    .from("empleados")
    .select("*")
    .in("id", empleadoIds);

  if (error) return sueldos;

  const empleadosById = new Map(
    ((data ?? []) as Empleado[]).map((empleado) => [empleado.id, empleado])
  );

  return sueldos.map((sueldo) => ({
    ...sueldo,
    empleado: empleadosById.get(sueldo.empleado_id) ?? null,
  }));
};

export const getEmpleadoSueldos = async (_user: JwtUser): Promise<EmpleadoSueldo[]> => {
  const supabase = conexionBD();

  const { data, error } = await supabase
    .from("empleados_sueldos")
    .select(sueldoSelect)
    .order("periodo", { ascending: false })
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return hydrateSueldosEmpleados((data ?? []) as EmpleadoSueldo[]);
};

export const getEmpleadoSueldoById = async (id: string, _user: JwtUser): Promise<EmpleadoSueldo> => {
  const supabase = conexionBD();

  const { data, error } = await supabase
    .from("empleados_sueldos")
    .select(sueldoSelect)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  const [sueldo] = await hydrateSueldosEmpleados([data as EmpleadoSueldo]);
  return sueldo;
};

export const createEmpleadoSueldo = async (
  payload: CreateEmpleadoSueldoDto,
  user: JwtUser
): Promise<EmpleadoSueldo> => {
  const supabase = conexionBD();
  const normalized = normalizePayload(payload);

  if (!normalized.empleado_id) throw new Error("Empleado requerido");
  if (!normalized.periodo) throw new Error("Período requerido");

  const sueldoBase = Number(normalized.sueldo_base ?? 0);
  const bonos = Number(normalized.bonos ?? 0);
  const descuentos = Number(normalized.descuentos ?? 0);
  const montoNeto = Number(normalized.monto_neto ?? sueldoBase + bonos - descuentos);

  if (sueldoBase < 0 || bonos < 0 || descuentos < 0 || montoNeto < 0) {
    throw new Error("Los importes no pueden ser negativos");
  }

  normalized.concepto = normalized.concepto ?? "Sueldo mensual";
  normalized.estado = normalized.estado ?? "pendiente";
  normalized.monto_neto = montoNeto;
  normalized.registrado_por = user.id ?? null;

  const { data, error } = await supabase
    .from("empleados_sueldos")
    .insert(normalized)
    .select(sueldoSelect)
    .single();

  if (error) throw new Error(error.message);
  const [sueldo] = await hydrateSueldosEmpleados([data as EmpleadoSueldo]);
  return sueldo;
};

export const updateEmpleadoSueldo = async (
  id: string,
  payload: UpdateEmpleadoSueldoDto,
  user: JwtUser
): Promise<EmpleadoSueldo> => {
  const supabase = conexionBD();
  const current = await getEmpleadoSueldoById(id, user);
  const normalized = normalizePayload(payload);

  const sueldoBase = Object.prototype.hasOwnProperty.call(normalized, "sueldo_base")
    ? Number(normalized.sueldo_base ?? 0)
    : Number(current.sueldo_base ?? 0);
  const bonos = Object.prototype.hasOwnProperty.call(normalized, "bonos")
    ? Number(normalized.bonos ?? 0)
    : Number(current.bonos ?? 0);
  const descuentos = Object.prototype.hasOwnProperty.call(normalized, "descuentos")
    ? Number(normalized.descuentos ?? 0)
    : Number(current.descuentos ?? 0);

  if (!Object.prototype.hasOwnProperty.call(normalized, "monto_neto")) {
    normalized.monto_neto = sueldoBase + bonos - descuentos;
  }

  if (sueldoBase < 0 || bonos < 0 || descuentos < 0 || Number(normalized.monto_neto) < 0) {
    throw new Error("Los importes no pueden ser negativos");
  }

  const { data, error } = await supabase
    .from("empleados_sueldos")
    .update({ ...normalized, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .select(sueldoSelect)
    .single();

  if (error) throw new Error(error.message);
  const [sueldo] = await hydrateSueldosEmpleados([data as EmpleadoSueldo]);
  return sueldo;
};

export const anularEmpleadoSueldo = async (id: string, user: JwtUser): Promise<EmpleadoSueldo> => {
  return updateEmpleadoSueldo(id, { estado: "anulado" }, user);
};
