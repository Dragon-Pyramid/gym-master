import { signIn } from "@/services/loginService";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

type LoginError = Error & {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
};

function getLoginStatus(error: LoginError) {
  if (error.status) return error.status;
  if (error.message?.includes('contraseña')) return 401;
  if (error.message?.includes('inactivo')) return 403;
  if (error.message?.includes('desactiv')) return 403;
  return 500;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, rol } = body;

    if (!email || !password || !rol) {
      return NextResponse.json(
        {
          message: "Faltan datos",
          error_code: "LOGIN_MISSING_FIELDS",
        },
        { status: 400 }
      );
    }

    const loginSignin = await signIn({ email, password, rol });

    return NextResponse.json(
      {
        message: "Logueado con exito",
        token: loginSignin,
      },
      { status: 200 }
    );
  } catch (error) {
    const loginError = error as LoginError;
    const status = getLoginStatus(loginError);

    console.error("Error en el inicio de sesión:", {
      message: loginError.message,
      code: loginError.code,
      status,
    });

    return NextResponse.json(
      {
        message: loginError.message || "Error al iniciar sesión",
        error_code: loginError.code || "LOGIN_ERROR",
        details: loginError.details ?? null,
      },
      { status }
    );
  }
}
