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

function sanitizeRole(rol?: string) {
  const normalized = (rol || 'socio').trim().toLowerCase();
  if (!allowedRoles.has(normalized)) {
    throw new Error('Rol inválido');
  }
  return normalized;
}

function uniqueSocioMatches(matches: any[]) {
  const seen = new Set<string>();
  return matches.filter((match) => {
    if (!match?.id_socio || seen.has(match.id_socio)) return false;
    seen.add(match.id_socio);
    return true;
  });
}

async function findSociosByDniOrEmail(
  supabase: ReturnType<typeof getSupabaseServerClient>,
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
      .eq('email', email);

    if (error) throw new Error(error.message);
    matches.push(...(data ?? []));
  }

  return uniqueSocioMatches(matches);
}

type SocioProfileInput = {
  id: string;
  nombre: string;
  email: string;
  dni?: string | null;
  foto?: string | null;
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

function cleanNullableText(value?: string | null) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanOptionalDate(value?: string | null) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildSocioPayloadForUsuario(usuario: SocioProfileInput) {
  const dni = usuario.dni?.trim() ?? '';
  const email = usuario.email.trim().toLowerCase();

  const payload: Record<string, unknown> = {
    usuario_id: usuario.id,
    nombre_completo: usuario.nombre,
    dni,
    email,
    activo: true,
    fecha_baja: null,
    telefono: cleanNullableText(usuario.telefono),
    direccion: cleanNullableText(usuario.direccion),
    sexo: usuario.sexo === 'M' || usuario.sexo === 'F' ? usuario.sexo : null,
    fecnac: cleanOptionalDate(usuario.fecnac),
    ciudad: cleanNullableText(usuario.ciudad),
    provincia: cleanNullableText(usuario.provincia),
    pais: cleanNullableText(usuario.pais) ?? 'Argentina',
    contacto_emergencia_nombre: cleanNullableText(usuario.contacto_emergencia_nombre),
    contacto_emergencia_telefono: cleanNullableText(usuario.contacto_emergencia_telefono),
    fecha_alta: cleanOptionalDate(usuario.fecha_alta) ?? new Date().toISOString().slice(0, 10),
  };

  if (usuario.foto) {
    payload.foto = usuario.foto;
  }

  return payload;
}

async function ensureSocioProfileForUsuario(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  usuario: SocioProfileInput
) {
  const dni = usuario.dni?.trim() ?? '';
  const email = usuario.email.trim().toLowerCase();

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

  const socioPayload = buildSocioPayloadForUsuario(usuario);

  if (alreadyLinked || unlinked.length === 1) {
    const socioId = (alreadyLinked ?? unlinked[0]).id_socio;
    const { error } = await supabase
      .from('socio')
      .update(socioPayload)
      .eq('id_socio', socioId);

    if (error) {
      throw new Error(`No se pudo vincular el perfil de socio: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase.from('socio').insert([socioPayload]);

  if (error) {
    throw new Error(`No se pudo crear el perfil de socio: ${error.message}`);
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
  const email = payload.email?.trim().toLowerCase();
  const nombre = payload.nombre?.trim();
  const dni = payload.dni?.trim() ?? '';
  const useInitialPassword = payload.use_initial_password ?? true;

  if (!nombre || !email) {
    throw new Error('Nombre y email son obligatorios');
  }

  if ((rol === 'socio' || useInitialPassword) && !dni) {
    throw new Error('El DNI es obligatorio para generar la contraseña inicial');
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

  if (rol === 'socio') {
    try {
      await ensureSocioProfileForUsuario(supabase, {
        id: usuarioCreado.id,
        nombre,
        email,
        dni,
        foto: payload.foto ?? null,
        telefono: payload.telefono ?? null,
        direccion: payload.direccion ?? null,
        sexo: payload.sexo ?? null,
        fecnac: payload.fecnac ?? null,
        ciudad: payload.ciudad ?? null,
        provincia: payload.provincia ?? null,
        pais: payload.pais ?? null,
        contacto_emergencia_nombre: payload.contacto_emergencia_nombre ?? null,
        contacto_emergencia_telefono: payload.contacto_emergencia_telefono ?? null,
        fecha_alta: payload.fecha_alta ?? null,
      });
    } catch (error: any) {
      await supabase.from('usuario').delete().eq('id', usuarioCreado.id);
      throw new Error(
        `Usuario creado, pero no se pudo crear o vincular el perfil de socio: ${error.message}`
      );
    }
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

  if (typeof updateData.email === 'string') {
    payload.email = updateData.email.trim().toLowerCase();
  }

  if (typeof updateData.nombre === 'string') {
    payload.nombre = updateData.nombre.trim();
  }

  if (typeof updateData.dni === 'string') {
    payload.dni = updateData.dni.trim() || null;
  }

  const nextRole = typeof updateData.rol === 'string' ? sanitizeRole(updateData.rol) : undefined;

  if (nextRole) {
    payload.rol = nextRole;
  }

  if ('permisos_menu' in updateData || nextRole) {
    payload.permisos_menu = sanitizeMenuPermissionsForRole(
      nextRole ?? updateData.rol,
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

  if (usuarioActualizado.rol === 'socio') {
    await ensureSocioProfileForUsuario(supabase, {
      id: usuarioActualizado.id,
      nombre: usuarioActualizado.nombre,
      email: usuarioActualizado.email,
      dni: usuarioActualizado.dni ?? null,
      foto: usuarioActualizado.foto ?? null,
      telefono: updateData.telefono ?? null,
      direccion: updateData.direccion ?? null,
      sexo: updateData.sexo ?? null,
      fecnac: updateData.fecnac ?? null,
      ciudad: updateData.ciudad ?? null,
      provincia: updateData.provincia ?? null,
      pais: updateData.pais ?? null,
      contacto_emergencia_nombre: updateData.contacto_emergencia_nombre ?? null,
      contacto_emergencia_telefono: updateData.contacto_emergencia_telefono ?? null,
      fecha_alta: updateData.fecha_alta ?? null,
    });

    if (typeof updateData.activo === 'boolean') {
      await supabase
        .from('socio')
        .update({ activo: updateData.activo, fecha_baja: updateData.activo ? null : new Date().toISOString().slice(0, 10) })
        .eq('usuario_id', usuarioActualizado.id);
    }
  }

  return toResponseUsuario(usuarioActualizado);
};

export const deactivateUsuarioServer = async (
  user: JwtUser,
  id: string
): Promise<ResponseUsuario> => {
  assertCanManageUsers(user);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('usuario')
    .update({ activo: false })
    .eq('id', id)
    .select(USUARIO_SELECT)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el usuario con ese ID');

  const usuarioDesactivado = data as Usuario;

  if (usuarioDesactivado.rol === 'socio') {
    await supabase
      .from('socio')
      .update({ activo: false, fecha_baja: new Date().toISOString().slice(0, 10) })
      .eq('usuario_id', usuarioDesactivado.id);
  }

  return toResponseUsuario(usuarioDesactivado);
};

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
