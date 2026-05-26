import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";
import {
  fetchCuotaDescuentoConfig,
  upsertCuotaDescuentoConfig,
} from "@/services/cuotaDescuentoService";

export const dynamic = "force-dynamic";

function assertAdminRole(rol?: string | null) {
  if (rol !== "admin") {
    throw new Error("No autorizado para parametrizar descuentos de cuotas");
  }
}

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
    const { user } = await authMiddleware(req);
    assertAdminRole(user?.rol);

    const supabase = getSupabaseServerClient();
    const config = await fetchCuotaDescuentoConfig(supabase);

    return NextResponse.json({ data: config }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener descuento por pago adelantado" },
      { status: error.message?.includes("No autorizado") ? 403 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
    assertAdminRole(user?.rol);

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
    return NextResponse.json(
      { error: error.message || "Error al actualizar descuento por pago adelantado" },
      { status: error.message?.includes("No autorizado") ? 403 : 500 }
    );
  }
}
