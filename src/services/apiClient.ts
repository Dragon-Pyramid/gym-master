import { getToken, loginSession, logoutSession } from "./storageService";

export async function login({
  email,
  password,
  rol,
  dbName,
}: {
  email: string;
  password: string;
  rol: string;
  dbName: string;
}) {
  const res = await fetch("/api/custom-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, rol, dbName }),
  });
  const data = await res.json();
  if (res.ok && data.token) {
    loginSession(data.token);
  }
  return { ok: res.ok, ...data };
}

export async function pagarCuotaConStripe() {
  const token = getToken();
  const res = await fetch("/api/pagar-cuota", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export function logout() {
  logoutSession();
}

export async function getEvolucionPromedioRutinas() {
  const token = getToken();
  const res = await fetch("/api/admin/metricas/rutinas/evolucion-promedio", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getAdherenciaRutinas() {
  const token = getToken();
  const res = await fetch("/api/admin/metricas/rutinas/adherencia", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function generarRutina(body: any) {
  const token = getToken();
  const res = await fetch("/api/admin/metricas/rutinas/generar-rutina", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function generarRutinaPersonalizada(body: any) {
  const token = getToken();
  const res = await fetch(
    "/api/admin/metricas/rutinas/generar-rutina-personalizada",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getSegmentacionPagos() {
  const token = getToken();
  const res = await fetch("/api/admin/metricas/pagos/segmentacion", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getProyeccionIngresos() {
  const token = getToken();
  const res = await fetch("/api/admin/metricas/pagos/proyeccion-ingresos", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getHistogramaPagos() {
  const token = getToken();
  const res = await fetch("/api/admin/metricas/pagos/histograma", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getTopFallosEquipamiento() {
  const token = getToken();
  const res = await fetch("/api/admin/metricas/equipamiento/top-fallos", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getPrediccionFalloEquipamiento() {
  const token = getToken();
  const res = await fetch("/api/admin/metricas/equipamiento/prediccion-fallo", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getEstadoActualEquipamiento() {
  const token = getToken();
  const res = await fetch("/api/admin/metricas/equipamiento/estado-actual", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getCostoBeneficioEquipamiento() {
  const token = getToken();
  const res = await fetch("/api/admin/metricas/equipamiento/costo-beneficio", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getTopInactivosAsistencia() {
  const token = getToken();
  const res = await fetch("/api/admin/metricas/asistencia/top-inactivos", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getPrediccionAbandonoAsistencia() {
  const token = getToken();
  const res = await fetch(
    "/api/admin/metricas/asistencia/prediccion-abandono",
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getConcurrenciaAsistencia(
  tipo: "semanal" | "mensual" | "anual"
) {
  const token = getToken();
  const res = await fetch(`/api/admin/metricas/asistencia/${tipo}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getHistorialRutinas() {
  const token = getToken();
  const res = await fetch("/api/rutina/historial", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getObjetivos() {
  const token = getToken();
  const res = await fetch("/api/objetivos", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getNiveles() {
  const token = getToken();
  const res = await fetch("/api/niveles", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function generarNuevaRutina(body: {
  objetivo: number;
  nivel: number;
  dias: number;
}) {
  const token = getToken();
  const res = await fetch("/api/rutina/generar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getRutinasPorSocio(idSocio: number | string) {
  const token = getToken();
  const res = await fetch(`/api/rutina/${idSocio}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function crearEntrenador(body: any) {
  const token = getToken();
  const res = await fetch("/api/entrenadores", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getEntrenador(id: number | string) {
  const token = getToken();
  const res = await fetch(`/api/entrenadores/${id}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getEntrenadores() {
  const token = getToken();
  const res = await fetch(`/api/entrenadores`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getHorariosEntrenador(id: number | string) {
  const token = getToken();
  const res = await fetch(`/api/entrenadores/${id}/horarios`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function actualizarEntrenador(id: number | string, body: any) {
  const token = getToken();
  const res = await fetch(`/api/entrenadores/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
