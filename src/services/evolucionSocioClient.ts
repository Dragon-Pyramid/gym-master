import { getToken } from "./storageService";
import {
  CreateEvolucionSocioDto,
  EvolucionSocio,
  EvolucionFisicaAdminResumen,
} from "@/interfaces/evolucionSocio.interface";

export interface SocioBasico {
  id?: string;
  id_socio?: string;
  usuario_id?: string;
  nombre_completo?: string;
  dni?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  usuario?: {
    nombre?: string;
    apellido?: string;
    email?: string;
  };
}

const authHeaders = (json = false): HeadersInit => {
  const token = getToken();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const readJson = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export async function registrarEvolucionFisica(body: CreateEvolucionSocioDto) {
  const res = await fetch("/api/evolucion_socio/registro", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || "Error al registrar evolución física"
    );
  }

  return {
    ok: res.ok,
    data: data?.data as EvolucionSocio,
    message: data?.message as string | undefined,
  };
}

export async function getEvolucionesFisicas(socioId: string = "me") {
  const res = await fetch(`/api/evolucion_socio/${encodeURIComponent(socioId)}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || "Error al obtener evolución física"
    );
  }

  return {
    ok: res.ok,
    data: Array.isArray(data?.data) ? (data.data as EvolucionSocio[]) : [],
  };
}

export async function getSociosBasicos() {
  const res = await fetch("/api/socios", {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });

  const data = await readJson(res);

  if (!res.ok) {
    return {
      ok: false,
      data: [] as SocioBasico[],
      error: data?.error || "No se pudieron obtener socios",
    };
  }

  const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

  return {
    ok: true,
    data: rows as SocioBasico[],
  };
}

export async function getEvolucionFisicaAdminResumen() {
  const res = await fetch("/api/evolucion_socio/admin/resumen", {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || "Error al obtener resumen administrativo de evolución física"
    );
  }

  return {
    ok: res.ok,
    data: Array.isArray(data?.data)
      ? (data.data as EvolucionFisicaAdminResumen[])
      : [],
  };
}

export async function analizarEvolucionFisicaConRag(body: {
  socio_id?: string;
  idioma?: 'es' | 'en';
  mensajeSocio?: string;
  objetivo?: string;
  restricciones?: string;
}) {
  const res = await fetch('/api/evolucion_socio/rag-assistant/analizar', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });

  const data = await readJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || 'Error al analizar evolución física con RAG Coach'
    );
  }

  return {
    ok: res.ok,
    data: data?.data,
    message: data?.message as string | undefined,
  };
}
