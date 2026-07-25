import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

import type { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';
import { sanitizeMenuPermissionsForRole } from '@/lib/permissions/menuPermissions';
import {
  noStoreJson,
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';
import { getPasswordPolicyMessage, isStrongPassword } from '@/utils/passwordPolicy';

export const dynamic = 'force-dynamic';

const CHANGE_PASSWORD_BODY_MAX_BYTES = 8 * 1024;

type ChangePasswordBody = {
  new_password?: unknown;
};

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const body = await readJsonBody<ChangePasswordBody>(
      req,
      CHANGE_PASSWORD_BODY_MAX_BYTES,
    );
    const newPassword = typeof body.new_password === 'string'
      ? body.new_password
      : '';

    if (!newPassword) {
      return noStoreJson(
        { error: 'La nueva contraseña es obligatoria' },
        400,
      );
    }

    if (!isStrongPassword(newPassword)) {
      return noStoreJson(
        { error: getPasswordPolicyMessage() },
        400,
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado para cambio de contraseña.');
      return noStoreJson(
        { error: 'No se pudo actualizar la contraseña' },
        500,
      );
    }

    const supabase = getSupabaseServerClient();
    const password_hash = await bcrypt.hash(newPassword.trim(), 10);

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

    if (error || !updatedUser) {
      console.error('No se pudo actualizar la contraseña:', {
        code: error?.code ?? 'UPDATE_USER_FAILED',
      });
      return noStoreJson(
        { error: 'No se pudo actualizar la contraseña' },
        500,
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
        updatedUser.permisos_menu,
      ),
      must_change_password: false,
    };

    const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '12h') as jwt.SignOptions['expiresIn'];
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: jwtExpiresIn });

    return noStoreJson(
      {
        message: 'Contraseña actualizada correctamente',
        token,
      },
      200,
    );
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error inesperado al cambiar contraseña:', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
    return runtimeErrorResponse(
      error,
      'No se pudo actualizar la contraseña',
    );
  }
}
