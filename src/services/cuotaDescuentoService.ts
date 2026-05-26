import type { PagoDescuentoConfig } from "@/interfaces/pago.interface";
import {
  DEFAULT_PAGO_ADELANTADO_CONFIG,
  normalizePagoDescuentoConfig,
} from "@/lib/cuotas/descuentoPago";

type SupabaseLikeClient = {
  from: (table: string) => any;
};

export async function fetchCuotaDescuentoConfig(
  supabase: SupabaseLikeClient
): Promise<PagoDescuentoConfig> {
  const { data, error } = await supabase
    .from("cuota_descuento_config")
    .select("*")
    .eq("codigo", "pago_adelantado")
    .maybeSingle();

  if (error) {
    // Permite que ambientes antiguos sigan funcionando hasta aplicar migración.
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return DEFAULT_PAGO_ADELANTADO_CONFIG;
    }

    throw new Error(error.message || "Error al consultar descuento por pago adelantado");
  }

  return normalizePagoDescuentoConfig(data);
}

export async function upsertCuotaDescuentoConfig(
  supabase: SupabaseLikeClient,
  payload: Partial<PagoDescuentoConfig>
): Promise<PagoDescuentoConfig> {
  const config = normalizePagoDescuentoConfig({
    ...DEFAULT_PAGO_ADELANTADO_CONFIG,
    ...payload,
    codigo: "pago_adelantado",
  });

  const { data, error } = await supabase
    .from("cuota_descuento_config")
    .upsert(
      {
        codigo: "pago_adelantado",
        activo: config.activo,
        cuotas_minimas: config.cuotas_minimas,
        porcentaje: config.porcentaje,
        descripcion: config.descripcion,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "codigo" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Error al guardar descuento por pago adelantado");
  }

  return normalizePagoDescuentoConfig(data);
}
