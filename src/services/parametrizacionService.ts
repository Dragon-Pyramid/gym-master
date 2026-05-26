import {
  CatalogoParametrizableMutationResponse,
  CatalogoParametrizablePayload,
  ParametrizacionCatalogosResponse,
} from "@/interfaces/parametrizacion.interface";
import type { PagoDescuentoConfig } from "@/interfaces/pago.interface";
import { authHeader } from "@/services/storageService";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Error en operación de parametrización");
  }

  return payload as T;
}

export async function getParametrizacionCatalogos(): Promise<ParametrizacionCatalogosResponse> {
  const response = await fetch("/api/parametrizacion/catalogos", {
    method: "GET",
    headers: authHeader(),
    cache: "no-store",
  });

  return parseJsonResponse<ParametrizacionCatalogosResponse>(response);
}

export async function createParametrizacionCatalogoItem(
  payload: CatalogoParametrizablePayload
): Promise<CatalogoParametrizableMutationResponse> {
  const response = await fetch("/api/parametrizacion/catalogos", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<CatalogoParametrizableMutationResponse>(response);
}

export async function updateParametrizacionCatalogoItem(
  payload: CatalogoParametrizablePayload
): Promise<CatalogoParametrizableMutationResponse> {
  const response = await fetch("/api/parametrizacion/catalogos", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<CatalogoParametrizableMutationResponse>(response);
}

export async function toggleParametrizacionCatalogoItem(
  payload: Pick<CatalogoParametrizablePayload, "catalogo" | "id" | "activo">
): Promise<CatalogoParametrizableMutationResponse> {
  return updateParametrizacionCatalogoItem(payload);
}


export async function getCuotaDescuentoConfig(): Promise<PagoDescuentoConfig> {
  const response = await fetch("/api/parametrizacion/cuotas-descuento", {
    method: "GET",
    headers: authHeader(),
    cache: "no-store",
  });

  const payload = await parseJsonResponse<{ data: PagoDescuentoConfig }>(response);
  return payload.data;
}

export async function updateCuotaDescuentoConfig(
  payload: Partial<PagoDescuentoConfig>
): Promise<PagoDescuentoConfig> {
  const response = await fetch("/api/parametrizacion/cuotas-descuento", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });

  const parsed = await parseJsonResponse<{ data: PagoDescuentoConfig }>(response);
  return parsed.data;
}
