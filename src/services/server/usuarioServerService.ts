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

const allowedManagerRoles = new Set(['admin', 'usuario']);
const allowedRoles = new Set(['admin', 'usuario', 'socio']);

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
    permisos_menu: usuario.permisos_menu ?? null,
  };
}

function sanitizeRole(rol?: string) {
  const normalized = (rol || 'socio').trim().toLowerCase();
  if (!allowedRoles.has(normalized)) {
    throw new Error('Rol inválido');
  }
  return normalized;
}

export const fetchUsuariosServer = async (
  user: JwtUser
): Promise<ResponseUsuario[]> => {
  assertCanManageUsers(user);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('usuario')
    .select('id,nombre,email,rol,activo,foto,permisos_menu')
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

  if (!nombre || !email || !payload.password?.trim()) {
    throw new Error('Nombre, email y contraseña son obligatorios');
  }

  if (rol === 'socio' && !payload.dni?.trim()) {
    throw new Error('El DNI es obligatorio para crear un usuario socio');
  }

  const password_hash = await bcrypt.hash(payload.password.trim(), 10);

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
        permisos_menu: sanitizeMenuPermissionsForRole(rol, payload.permisos_menu),
      },
    ])
    .select('id,nombre,email,rol,activo,foto,permisos_menu')
    .single();

  if (usuarioError) throw new Error(usuarioError.message);

  if (rol === 'socio') {
    const { error: socioError } = await supabase.from('socio').insert([
      {
        usuario_id: usuarioCreado.id,
        nombre_completo: nombre,
        dni: payload.dni?.trim(),
        email,
        activo: true,
        foto: payload.foto ?? null,
      },
    ]);

    if (socioError) {
      await supabase.from('usuario').delete().eq('id', usuarioCreado.id);
      throw new Error(
        `Usuario creado, pero no se pudo crear el perfil de socio: ${socioError.message}`
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

  if (typeof updateData.email === 'string') {
    payload.email = updateData.email.trim().toLowerCase();
  }

  if (typeof updateData.nombre === 'string') {
    payload.nombre = updateData.nombre.trim();
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
    delete payload.password;
  }

  const { data, error } = await supabase
    .from('usuario')
    .update(payload)
    .eq('id', id)
    .select('id,nombre,email,rol,activo,foto,permisos_menu')
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el usuario con ese ID');

  return toResponseUsuario(data as Usuario);
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
    .select('id,nombre,email,rol,activo,foto,permisos_menu')
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el usuario con ese ID');

  return toResponseUsuario(data as Usuario);
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
    .select('id,nombre,email,rol,activo,foto,permisos_menu')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el usuario con ese ID');

  return toResponseUsuario(data as Usuario);
};
