import {
  CatalogoParametrizableMutationResponse,
  CatalogoParametrizablePayload,
  ParametrizacionCatalogosResponse,
} from "@/interfaces/parametrizacion.interface";

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
    cache: "no-store",
  });

  return parseJsonResponse<ParametrizacionCatalogosResponse>(response);
}

export async function createParametrizacionCatalogoItem(
  payload: CatalogoParametrizablePayload
): Promise<CatalogoParametrizableMutationResponse> {
  const response = await fetch("/api/parametrizacion/catalogos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<CatalogoParametrizableMutationResponse>(response);
}

export async function updateParametrizacionCatalogoItem(
  payload: CatalogoParametrizablePayload
): Promise<CatalogoParametrizableMutationResponse> {
  const response = await fetch("/api/parametrizacion/catalogos", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<CatalogoParametrizableMutationResponse>(response);
}

export async function toggleParametrizacionCatalogoItem(
  payload: Pick<CatalogoParametrizablePayload, "catalogo" | "id" | "activo">
): Promise<CatalogoParametrizableMutationResponse> {
  return updateParametrizacionCatalogoItem(payload);
}
