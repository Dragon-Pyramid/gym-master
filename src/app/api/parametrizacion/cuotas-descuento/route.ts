import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";
import {
  fetchCuotaDescuentoConfig,
  upsertCuotaDescuentoConfig,
} from "@/services/cuotaDescuentoService";

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = "force-dynamic";

function toBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function toPercentage(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, 100);
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function GET(req: NextRequest) {
  try {
    await authorizeDashboardRequest(
      req,
      '/dashboard/parametrizacion',
      ['admin']
    );

    const supabase = getSupabaseServerClient();
    const config = await fetchCuotaDescuentoConfig(supabase);

    return NextResponse.json({ data: config }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error(
      "Error al obtener descuento por pago adelantado:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error al obtener descuento por pago adelantado.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await authorizeDashboardRequest(
      req,
      '/dashboard/parametrizacion',
      ['admin']
    );

    const body = await req.json();
    const supabase = getSupabaseServerClient();

    const config = await upsertCuotaDescuentoConfig(supabase, {
      activo: toBoolean(body.activo),
      cuotas_minimas: toPositiveInteger(body.cuotas_minimas, 2),
      porcentaje: toPercentage(body.porcentaje),
      descripcion: toNullableString(body.descripcion),
    });

    return NextResponse.json(
      {
        data: config,
        message: "Descuento por pago adelantado actualizado correctamente",
      },
      { status: 200 }
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error(
      "Error al actualizar descuento por pago adelantado:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error al actualizar descuento por pago adelantado.",
      },
      { status: 500 }
    );
  }
}
