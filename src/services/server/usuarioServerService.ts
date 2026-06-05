import bcrypt from 'bcryptjs';

import {
  CreateUsuarioDto,
  ResponseUsuario,
  UpdateUsuarioDto,
  Usuario,
} from '@/interfaces/usuario.interface';
import { sanitizeMenuPermissionsForRole } from '@/lib/permissions/menuPermissions';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { buildInitialPasswordFromDni } from '@/utils/passwordPolicy';

const allowedManagerRoles = new Set(['admin', 'usuario']);
const allowedRoles = new Set(['admin', 'usuario', 'socio']);
const USUARIO_SELECT =
  'id,nombre,email,rol,activo,foto,dni,permisos_menu,must_change_password,password_actualizado_en,primer_login_en,ultimo_login_en';

type SupabaseServerClient = ReturnType<typeof getSupabaseServerClient>;

type UsuarioRole = 'admin' | 'usuario' | 'socio';

type SocioProfileInput = {
  id: string;
  nombre: string;
  email: string;
  dni?: string | null;
  foto?: string | null;
  activo?: boolean;
  telefono?: string | null;
  direccion?: string | null;
  sexo?: 'M' | 'F' | null;
  fecnac?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
  fecha_alta?: string | null;
};

type EmpleadoProfileInput = {
  id: string;
  nombre: string;
  email: string;
  dni?: string | null;
  activo?: boolean;
  telefono?: string | null;
  direccion?: string | null;
  fecnac?: string | null;
  fecha_alta?: string | null;
  puesto?: string | null;
  area?: string | null;
  tipo_contratacion?: string | null;
  turno?: string | null;
  sueldo_base?: number | string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  horarios_texto?: string | null;
  observaciones?: string | null;
};

function assertCanManageUsers(user: JwtUser) {
  if (!allowedManagerRoles.has(user.rol)) {
    throw new Error('No autorizado para administrar usuarios');
  }
}

function toResponseUsuario(usuario: Usuario): ResponseUsuario {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    foto: usuario.foto,
    dni: usuario.dni ?? null,
    permisos_menu: usuario.permisos_menu ?? null,
    must_change_password: Boolean(usuario.must_change_password),
    password_actualizado_en: usuario.password_actualizado_en ?? null,
    primer_login_en: usuario.primer_login_en ?? null,
    ultimo_login_en: usuario.ultimo_login_en ?? null,
  };
}

function sanitizeRole(rol?: string): UsuarioRole {
  const normalized = (rol || 'socio').trim().toLowerCase();
  if (!allowedRoles.has(normalized)) {
    throw new Error('Rol inválido');
  }
  return normalized as UsuarioRole;
}

function normalizeEmail(value?: string | null) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function cleanNullableText(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanOptionalDate(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNumberOrZero(value?: number | string | null) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return 0;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function setIfDefined(
  payload: Record<string, unknown>,
  key: string,
  value: unknown
) {
  if (value !== undefined) {
    payload[key] = value;
  }
}

function uniqueSocioMatches(matches: any[]) {
  const seen = new Set<string>();
  return matches.filter((match) => {
    if (!match?.id_socio || seen.has(match.id_socio)) return false;
    seen.add(match.id_socio);
    return true;
  });
}

function uniqueEmpleadoMatches(matches: any[]) {
  const seen = new Set<string>();
  return matches.filter((match) => {
    if (!match?.id || seen.has(match.id)) return false;
    seen.add(match.id);
    return true;
  });
}

async function findSociosByDniOrEmail(
  supabase: SupabaseServerClient,
  dni: string,
  email: string
) {
  const matches: any[] = [];

  if (dni) {
    const { data, error } = await supabase
      .from('socio')
      .select('id_socio,usuario_id,dni,email')
      .eq('dni', dni);

    if (error) throw new Error(error.message);
    matches.push(...(data ?? []));
  }

  if (email) {
    const { data, error } = await supabase
      .from('socio')
      .select('id_socio,usuario_id,dni,email')
      .ilike('email', email);

    if (error) throw new Error(error.message);
    matches.push(...(data ?? []));
  }

  return uniqueSocioMatches(matches);
}

async function findEmpleadosByDniOrEmail(
  supabase: SupabaseServerClient,
  dni: string,
  email: string
) {
  const matches: any[] = [];

  if (dni) {
    const { data, error } = await supabase
      .from('empleados')
      .select('id,usuario_id,dni,email')
      .eq('dni', dni);

    if (error) throw new Error(error.message);
    matches.push(...(data ?? []));
  }

  if (email) {
    const { data, error } = await supabase
      .from('empleados')
      .select('id,usuario_id,dni,email')
      .ilike('email', email);

    if (error) throw new Error(error.message);
    matches.push(...(data ?? []));
  }

  return uniqueEmpleadoMatches(matches);
}

function buildSocioPayloadForUsuario(
  usuario: SocioProfileInput,
  options: { forInsert: boolean }
) {
  const dni = usuario.dni?.trim() ?? '';
  const email = normalizeEmail(usuario.email);
  const activo = usuario.activo ?? true;

  const payload: Record<string, unknown> = {
    usuario_id: usuario.id,
    nombre_completo: usuario.nombre,
    dni,
    email,
    activo,
    fecha_baja: activo ? null : new Date().toISOString().slice(0, 10),
  };

  if (options.forInsert) {
    payload.fecha_alta = cleanOptionalDate(usuario.fecha_alta) ?? new Date().toISOString().slice(0, 10);
  } else {
    setIfDefined(payload, 'fecha_alta', cleanOptionalDate(usuario.fecha_alta));
  }

  setIfDefined(payload, 'telefono', cleanNullableText(usuario.telefono));
  setIfDefined(payload, 'direccion', cleanNullableText(usuario.direccion));
  setIfDefined(payload, 'sexo', usuario.sexo === 'M' || usuario.sexo === 'F' ? usuario.sexo : usuario.sexo === undefined ? undefined : null);
  setIfDefined(payload, 'fecnac', cleanOptionalDate(usuario.fecnac));
  setIfDefined(payload, 'ciudad', cleanNullableText(usuario.ciudad));
  setIfDefined(payload, 'provincia', cleanNullableText(usuario.provincia));
  setIfDefined(payload, 'pais', cleanNullableText(usuario.pais));
  setIfDefined(payload, 'contacto_emergencia_nombre', cleanNullableText(usuario.contacto_emergencia_nombre));
  setIfDefined(payload, 'contacto_emergencia_telefono', cleanNullableText(usuario.contacto_emergencia_telefono));

  if (usuario.foto !== undefined) {
    payload.foto = usuario.foto || null;
  }

  return payload;
}

function buildEmpleadoPayloadForUsuario(
  usuario: EmpleadoProfileInput,
  options: { forInsert: boolean }
) {
  const dni = usuario.dni?.trim() ?? '';
  const email = normalizeEmail(usuario.email);
  const activo = usuario.activo ?? true;

  const payload: Record<string, unknown> = {
    usuario_id: usuario.id,
    nombre_completo: usuario.nombre,
    dni,
    email,
    activo,
  };

  if (options.forInsert) {
    payload.fecha_alta = cleanOptionalDate(usuario.fecha_alta) ?? new Date().toISOString().slice(0, 10);
    payload.fecha_inicio = cleanOptionalDate(usuario.fecha_inicio) ?? payload.fecha_alta;
    payload.tipo_contratacion = cleanNullableText(usuario.tipo_contratacion) ?? 'mensual';
    payload.sueldo_base = toNumberOrZero(usuario.sueldo_base) ?? 0;
  } else {
    setIfDefined(payload, 'fecha_alta', cleanOptionalDate(usuario.fecha_alta));
    setIfDefined(payload, 'fecha_inicio', cleanOptionalDate(usuario.fecha_inicio));
    setIfDefined(payload, 'tipo_contratacion', cleanNullableText(usuario.tipo_contratacion));
    setIfDefined(payload, 'sueldo_base', toNumberOrZero(usuario.sueldo_base));
  }

  setIfDefined(payload, 'telefono', cleanNullableText(usuario.telefono));
  setIfDefined(payload, 'direccion', cleanNullableText(usuario.direccion));
  setIfDefined(payload, 'fecha_nacimiento', cleanOptionalDate(usuario.fecnac));
  setIfDefined(payload, 'puesto', cleanNullableText(usuario.puesto));
  setIfDefined(payload, 'area', cleanNullableText(usuario.area));
  setIfDefined(payload, 'turno', cleanNullableText(usuario.turno));
  setIfDefined(payload, 'fecha_fin', cleanOptionalDate(usuario.fecha_fin));
  setIfDefined(payload, 'horarios_texto', cleanNullableText(usuario.horarios_texto));
  setIfDefined(payload, 'observaciones', cleanNullableText(usuario.observaciones));

  return payload;
}

async function ensureSocioProfileForUsuario(
  supabase: SupabaseServerClient,
  usuario: SocioProfileInput
) {
  const dni = usuario.dni?.trim() ?? '';
  const email = normalizeEmail(usuario.email);

  if (!dni) {
    throw new Error('El DNI es obligatorio para crear o vincular el perfil de socio.');
  }

  const matches = await findSociosByDniOrEmail(supabase, dni, email);
  const linkedToAnotherUser = matches.find(
    (socio) => socio.usuario_id && socio.usuario_id !== usuario.id
  );

  if (linkedToAnotherUser) {
    throw new Error(
      'Ya existe un socio con el mismo DNI o email vinculado a otro usuario. Revisá Socios antes de continuar.'
    );
  }

  const alreadyLinked = matches.find((socio) => socio.usuario_id === usuario.id);
  const unlinked = matches.filter((socio) => !socio.usuario_id);

  if (unlinked.length > 1) {
    throw new Error(
      'Hay más de un socio sin usuario asociado que coincide con el DNI/email. Unificá esos registros antes de continuar.'
    );
  }

  if (alreadyLinked || unlinked.length === 1) {
    const socioId = (alreadyLinked ?? unlinked[0]).id_socio;
    const { error } = await supabase
      .from('socio')
      .update(buildSocioPayloadForUsuario(usuario, { forInsert: false }))
      .eq('id_socio', socioId);

    if (error) {
      throw new Error(`No se pudo vincular el perfil de socio: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase
    .from('socio')
    .insert([buildSocioPayloadForUsuario(usuario, { forInsert: true })]);

  if (error) {
    throw new Error(`No se pudo crear el perfil de socio: ${error.message}`);
  }
}

async function ensureEmpleadoProfileForUsuario(
  supabase: SupabaseServerClient,
  usuario: EmpleadoProfileInput
) {
  const dni = usuario.dni?.trim() ?? '';
  const email = normalizeEmail(usuario.email);

  if (!dni) {
    throw new Error('El DNI es obligatorio para crear o vincular el perfil de empleado.');
  }

  const matches = await findEmpleadosByDniOrEmail(supabase, dni, email);
  const linkedToAnotherUser = matches.find(
    (empleado) => empleado.usuario_id && empleado.usuario_id !== usuario.id
  );

  if (linkedToAnotherUser) {
    throw new Error(
      'Ya existe un empleado con el mismo DNI o email vinculado a otro usuario. Revisá Empleados antes de continuar.'
    );
  }

  const alreadyLinked = matches.find((empleado) => empleado.usuario_id === usuario.id);
  const unlinked = matches.filter((empleado) => !empleado.usuario_id);

  if (unlinked.length > 1) {
    throw new Error(
      'Hay más de un empleado sin usuario asociado que coincide con el DNI/email. Unificá esos registros antes de continuar.'
    );
  }

  if (alreadyLinked || unlinked.length === 1) {
    const empleadoId = (alreadyLinked ?? unlinked[0]).id;
    const { error } = await supabase
      .from('empleados')
      .update(buildEmpleadoPayloadForUsuario(usuario, { forInsert: false }))
      .eq('id', empleadoId);

    if (error) {
      throw new Error(`No se pudo vincular el perfil de empleado: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase
    .from('empleados')
    .insert([buildEmpleadoPayloadForUsuario(usuario, { forInsert: true })]);

  if (error) {
    throw new Error(`No se pudo crear el perfil de empleado: ${error.message}`);
  }
}

async function detachProfilesIncompatibles(
  supabase: SupabaseServerClient,
  usuarioId: string,
  rol: UsuarioRole
) {
  if (rol !== 'socio') {
    const { error } = await supabase
      .from('socio')
      .update({ usuario_id: null })
      .eq('usuario_id', usuarioId);

    if (error) throw new Error(`No se pudo desvincular socio incompatible: ${error.message}`);
  }

  if (rol !== 'usuario') {
    const { error } = await supabase
      .from('empleados')
      .update({ usuario_id: null })
      .eq('usuario_id', usuarioId);

    if (error) throw new Error(`No se pudo desvincular empleado incompatible: ${error.message}`);
  }
}

async function syncProfileForUsuario(
  supabase: SupabaseServerClient,
  usuario: Usuario,
  data: CreateUsuarioDto | UpdateUsuarioDto
) {
  const rol = sanitizeRole(usuario.rol);
  const common = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    dni: usuario.dni ?? data.dni ?? null,
    activo: usuario.activo,
    telefono: data.telefono,
    direccion: data.direccion,
    fecnac: data.fecnac,
    fecha_alta: data.fecha_alta,
  };

  await detachProfilesIncompatibles(supabase, usuario.id, rol);

  if (rol === 'socio') {
    await ensureSocioProfileForUsuario(supabase, {
      ...common,
      foto: usuario.foto ?? null,
      sexo: data.sexo ?? undefined,
      ciudad: data.ciudad,
      provincia: data.provincia,
      pais: data.pais,
      contacto_emergencia_nombre: data.contacto_emergencia_nombre,
      contacto_emergencia_telefono: data.contacto_emergencia_telefono,
    });
  }

  if (rol === 'usuario') {
    await ensureEmpleadoProfileForUsuario(supabase, {
      ...common,
      puesto: data.puesto,
      area: data.area,
      tipo_contratacion: data.tipo_contratacion,
      turno: data.turno,
      sueldo_base: data.sueldo_base,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      horarios_texto: data.horarios_texto,
      observaciones: data.observaciones,
    });
  }
}

export const fetchUsuariosServer = async (
  user: JwtUser
): Promise<ResponseUsuario[]> => {
  assertCanManageUsers(user);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('usuario')
    .select(USUARIO_SELECT)
    .order('creado_en', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((usuario) => toResponseUsuario(usuario as Usuario));
};

export const createUsuarioServer = async (
  user: JwtUser,
  payload: CreateUsuarioDto
): Promise<ResponseUsuario> => {
  assertCanManageUsers(user);
  const supabase = getSupabaseServerClient();

  const rol = sanitizeRole(payload.rol);
  const email = normalizeEmail(payload.email);
  const nombre = payload.nombre?.trim();
  const dni = payload.dni?.trim() ?? '';
  const useInitialPassword = payload.use_initial_password ?? true;

  if (!nombre || !email) {
    throw new Error('Nombre y email son obligatorios');
  }

  if ((rol === 'socio' || rol === 'usuario' || useInitialPassword) && !dni) {
    throw new Error('El DNI es obligatorio para generar la contraseña inicial y vincular el perfil operativo');
  }

  const plainPassword = useInitialPassword
    ? buildInitialPasswordFromDni(dni)
    : payload.password?.trim();

  if (!plainPassword) {
    throw new Error('La contraseña es obligatoria para crear un usuario');
  }

  const password_hash = await bcrypt.hash(plainPassword, 10);

  const { data: usuarioCreado, error: usuarioError } = await supabase
    .from('usuario')
    .insert([
      {
        nombre,
        email,
        password_hash,
        rol,
        activo: true,
        foto: payload.foto ?? null,
        dni: dni || null,
        permisos_menu: sanitizeMenuPermissionsForRole(rol, payload.permisos_menu),
        must_change_password: useInitialPassword,
        password_actualizado_en: null,
      },
    ])
    .select(USUARIO_SELECT)
    .single();

  if (usuarioError) throw new Error(usuarioError.message);

  try {
    await syncProfileForUsuario(supabase, usuarioCreado as Usuario, payload);
  } catch (error: any) {
    await supabase.from('usuario').delete().eq('id', usuarioCreado.id);
    throw new Error(
      `Usuario creado, pero no se pudo crear o vincular el perfil operativo: ${error.message}`
    );
  }

  return toResponseUsuario(usuarioCreado as Usuario);
};

export const updateUsuarioServer = async (
  user: JwtUser,
  id: string,
  updateData: UpdateUsuarioDto
): Promise<ResponseUsuario> => {
  assertCanManageUsers(user);
  const supabase = getSupabaseServerClient();

  if (!id) throw new Error('ID de usuario requerido');

  const { data: usuarioActual, error: usuarioActualError } = await supabase
    .from('usuario')
    .select(USUARIO_SELECT)
    .eq('id', id)
    .single();

  if (usuarioActualError) throw new Error(usuarioActualError.message);
  if (!usuarioActual) throw new Error('No se encontró el usuario con ese ID');

  const payload: Record<string, unknown> = { ...updateData };
  delete payload.password_hash;
  delete payload.telefono;
  delete payload.direccion;
  delete payload.sexo;
  delete payload.fecnac;
  delete payload.ciudad;
  delete payload.provincia;
  delete payload.pais;
  delete payload.contacto_emergencia_nombre;
  delete payload.contacto_emergencia_telefono;
  delete payload.fecha_alta;
  delete payload.puesto;
  delete payload.area;
  delete payload.tipo_contratacion;
  delete payload.turno;
  delete payload.sueldo_base;
  delete payload.fecha_inicio;
  delete payload.fecha_fin;
  delete payload.horarios_texto;
  delete payload.observaciones;

  if (typeof updateData.email === 'string') {
    payload.email = normalizeEmail(updateData.email);
  }

  if (typeof updateData.nombre === 'string') {
    payload.nombre = updateData.nombre.trim();
  }

  if (typeof updateData.dni === 'string') {
    payload.dni = updateData.dni.trim() || null;
  }

  const nextRole = typeof updateData.rol === 'string' ? sanitizeRole(updateData.rol) : undefined;
  const roleForPermissions = nextRole ?? sanitizeRole((usuarioActual as Usuario).rol);

  if (nextRole) {
    payload.rol = nextRole;
  }

  if ('permisos_menu' in updateData || nextRole) {
    payload.permisos_menu = sanitizeMenuPermissionsForRole(
      roleForPermissions,
      updateData.permisos_menu
    );
  }

  if (updateData.password) {
    payload.password_hash = await bcrypt.hash(updateData.password.trim(), 10);
    payload.must_change_password = Boolean(updateData.must_change_password);
    payload.password_actualizado_en = new Date().toISOString();
    delete payload.password;
  }

  const { data, error } = await supabase
    .from('usuario')
    .update(payload)
    .eq('id', id)
    .select(USUARIO_SELECT)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el usuario con ese ID');

  const usuarioActualizado = data as Usuario;
  await syncProfileForUsuario(supabase, usuarioActualizado, updateData);

  return toResponseUsuario(usuarioActualizado);
};

export const setUsuarioActivoServer = async (
  user: JwtUser,
  id: string,
  activo: boolean
): Promise<ResponseUsuario> => {
  assertCanManageUsers(user);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('usuario')
    .update({ activo })
    .eq('id', id)
    .select(USUARIO_SELECT)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el usuario con ese ID');

  const usuarioActualizado = data as Usuario;
  const fechaBaja = activo ? null : new Date().toISOString().slice(0, 10);

  if (usuarioActualizado.rol === 'socio') {
    const { error: socioError } = await supabase
      .from('socio')
      .update({ activo, fecha_baja: fechaBaja })
      .eq('usuario_id', usuarioActualizado.id);

    if (socioError) {
      throw new Error(`Usuario actualizado, pero no se pudo sincronizar el socio asociado: ${socioError.message}`);
    }
  }

  if (usuarioActualizado.rol === 'usuario') {
    const { error: empleadoError } = await supabase
      .from('empleados')
      .update({ activo, fecha_fin: activo ? null : new Date().toISOString().slice(0, 10) })
      .eq('usuario_id', usuarioActualizado.id);

    if (empleadoError) {
      throw new Error(`Usuario actualizado, pero no se pudo sincronizar el empleado asociado: ${empleadoError.message}`);
    }
  }

  return toResponseUsuario(usuarioActualizado);
};

export const deactivateUsuarioServer = async (
  user: JwtUser,
  id: string
): Promise<ResponseUsuario> => setUsuarioActivoServer(user, id, false);

export const getUsuarioByIdServer = async (
  user: JwtUser,
  id: string
): Promise<ResponseUsuario> => {
  if (user.rol === 'socio' && user.id !== id) {
    throw new Error('No autorizado para consultar este usuario');
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('usuario')
    .select(USUARIO_SELECT)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el usuario con ese ID');

  return toResponseUsuario(data as Usuario);
};
