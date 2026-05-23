import { ParametrizacionCatalogosResponse } from "@/interfaces/parametrizacion.interface";

export async function getParametrizacionCatalogos(): Promise<ParametrizacionCatalogosResponse> {
  const response = await fetch("/api/parametrizacion/catalogos", {
    method: "GET",
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Error al obtener catálogos de parametrización");
  }

  return payload as ParametrizacionCatalogosResponse;
}
