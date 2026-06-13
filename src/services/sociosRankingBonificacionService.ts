import type {
  SocioRankingBonificacionMutationPayload,
  SociosRankingBonificacionResponse,
} from "@/interfaces/sociosRankingBonificacion.interface";
import { authHeader } from "@/services/storageService";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || "Error en ranking de socios");
  }
  return payload as T;
}

export async function fetchSociosRankingBonificacion(
  anio: number,
  mes: number,
): Promise<SociosRankingBonificacionResponse> {
  const params = new URLSearchParams({ anio: String(anio), mes: String(mes) });
  const response = await fetch(`/api/socios/ranking-bonificacion-mensual?${params.toString()}`, {
    method: "GET",
    headers: authHeader(),
    cache: "no-store",
  });

  return parseJsonResponse<SociosRankingBonificacionResponse>(response);
}

export async function updateSocioRankingBonificacion(
  payload: SocioRankingBonificacionMutationPayload,
): Promise<SociosRankingBonificacionResponse> {
  const response = await fetch("/api/socios/ranking-bonificacion-mensual", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<SociosRankingBonificacionResponse>(response);
}
