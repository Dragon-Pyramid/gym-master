import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

import { authMiddleware } from '@/middlewares/auth.middleware';
import { sanitizeMenuPermissionsForRole } from '@/lib/permissions/menuPermissions';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { getPasswordPolicyMessage, isStrongPassword } from '@/utils/passwordPolicy';
import type { JwtUser } from '@/interfaces/jwtUser.interface';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const { new_password } = await req.json();

    if (!new_password || typeof new_password !== 'string') {
      return NextResponse.json(
        { error: 'La nueva contraseña es obligatoria' },
        { status: 400 }
      );
    }

    if (!isStrongPassword(new_password)) {
      return NextResponse.json(
        { error: getPasswordPolicyMessage() },
        { status: 400 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'JWT_SECRET no está definido en las variables de entorno' },
        { status: 500 }
      );
    }

    const supabase = getSupabaseServerClient();
    const password_hash = await bcrypt.hash(new_password.trim(), 10);

    const { data: updatedUser, error } = await supabase
      .from('usuario')
      .update({
        password_hash,
        must_change_password: false,
        password_actualizado_en: new Date().toISOString(),
        primer_login_en: user.iat ? new Date(user.iat * 1000).toISOString() : new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id,nombre,email,rol,activo,foto,permisos_menu,must_change_password')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'No se pudo actualizar la contraseña' },
        { status: 500 }
      );
    }

    let idSocio = user.id_socio ?? '';

    if (updatedUser.rol === 'socio') {
      const { data: socio } = await supabase
        .from('socio')
        .select('id_socio')
        .eq('usuario_id', updatedUser.id)
        .maybeSingle();

      idSocio = socio?.id_socio ?? idSocio;
    }

    const payload: JwtUser = {
      sub: updatedUser.id,
      id: updatedUser.id,
      id_socio: idSocio,
      email: updatedUser.email,
      rol: updatedUser.rol,
      nombre: updatedUser.nombre,
      foto: updatedUser.foto ? updatedUser.foto : null,
      permisos_menu: sanitizeMenuPermissionsForRole(
        updatedUser.rol,
        updatedUser.permisos_menu
      ),
      must_change_password: false,
    };

    const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '12h') as jwt.SignOptions['expiresIn'];
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: jwtExpiresIn });

    return NextResponse.json(
      {
        message: 'Contraseña actualizada correctamente',
        token,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al cambiar contraseña' },
      { status: error.message?.includes('Token') ? 401 : 500 }
    );
  }
}
