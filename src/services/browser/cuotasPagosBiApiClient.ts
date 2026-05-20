import { CuotasPagosDashboardBiResponse } from "@/interfaces/cuotasPagosBi.interface";

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const message = payload?.error || payload?.message || "Error al consultar BI de cuotas y pagos";
    throw new Error(message);
  }

  return payload as T;
}

export async function getCuotasPagosDashboardBi(): Promise<CuotasPagosDashboardBiResponse> {
  const res = await fetch("/api/admin/cuotas/dashboard-bi", {
    method: "GET",
    cache: "no-store",
  });

  return parseResponse<CuotasPagosDashboardBiResponse>(res);
}
