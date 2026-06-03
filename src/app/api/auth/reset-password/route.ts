import { NextResponse } from 'next/server';

import {
  getPasswordRecoveryErrorStatus,
  resetPasswordWithToken,
  validatePasswordResetToken,
} from '@/services/authRecoveryService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') ?? '';
  const result = await validatePasswordResetToken(token);
  return NextResponse.json(result, { status: result.valid ? 200 : 400 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await resetPasswordWithToken({
      token: body.token,
      newPassword: body.new_password,
      headers: req.headers,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const status = getPasswordRecoveryErrorStatus(error);
    const message = error instanceof Error ? error.message : 'No se pudo restablecer la contraseña';

    return NextResponse.json({ error: message }, { status });
  }
}
