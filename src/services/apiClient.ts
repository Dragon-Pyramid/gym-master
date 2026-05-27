import { getToken, loginSession, logoutSession } from './storageService';

export async function login({
  email,
  password,
  rol,
}: {
  email: string;
  password: string;
  rol: string;
}) {
  const res = await fetch('/api/custom-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, rol }),
  });
  const data = await res.json();
  if (res.ok && data.token) {
    loginSession(data.token);
  }
  return { ok: res.ok, ...data };
}

export async function pagarCuotaConStripe() {
  const token = getToken();
  const res = await fetch('/api/pagar-cuota', {
    method: 'POST',
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
  const res = await fetch('/api/admin/metricas/rutinas/evolucion-promedio', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getAdherenciaRutinas() {
  const token = getToken();
  const res = await fetch('/api/admin/metricas/rutinas/adherencia', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function generarRutina(body: any) {
  const token = getToken();
  const res = await fetch('/api/admin/metricas/rutinas/generar-rutina', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
    '/api/admin/metricas/rutinas/generar-rutina-personalizada',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
  const res = await fetch('/api/admin/metricas/pagos/segmentacion', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getProyeccionIngresos() {
  const token = getToken();
  const res = await fetch('/api/admin/metricas/pagos/proyeccion-ingresos', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getHistogramaPagos() {
  const token = getToken();
  const res = await fetch('/api/admin/metricas/pagos/histograma', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getTopFallosEquipamiento() {
  const token = getToken();
  const res = await fetch('/api/admin/metricas/equipamiento/top-fallos', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getPrediccionFalloEquipamiento() {
  const token = getToken();
  const res = await fetch('/api/admin/metricas/equipamiento/prediccion-fallo', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getEstadoActualEquipamiento() {
  const token = getToken();
  const res = await fetch('/api/admin/metricas/equipamiento/estado-actual', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getCostoBeneficioEquipamiento() {
  const token = getToken();
  const res = await fetch('/api/admin/metricas/equipamiento/costo-beneficio', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getTopInactivosAsistencia() {
  const token = getToken();
  const res = await fetch('/api/admin/metricas/asistencia/top-inactivos', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getPrediccionAbandonoAsistencia() {
  const token = getToken();
  const res = await fetch(
    '/api/admin/metricas/asistencia/prediccion-abandono',
    {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getConcurrenciaAsistencia(
  tipo: 'semanal' | 'mensual' | 'anual'
) {
  const token = getToken();
  const res = await fetch(`/api/admin/metricas/asistencia/${tipo}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getHistorialRutinas() {
  const token = getToken();
  const headers: HeadersInit = {
    'Cache-Control': 'no-cache',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`/api/rutina/historial?t=${Date.now()}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getObjetivos() {
  const token = getToken();
  const res = await fetch('/api/objetivos', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getNiveles() {
  const token = getToken();
  const res = await fetch('/api/niveles', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
export async function generarNuevaRutina(body: {
  objetivo: number;
  nivel: number;
  dias: number;
  id_socio?: string;
  idSocio?: string;
}) {
  const token = getToken();
  const res = await fetch('/api/rutina/generar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
export async function getRutinasPorSocio(idSocio: number | string) {
  const token = getToken();

  if (!token) {
    return {
      ok: false,
      data: [],
      error: 'Token no disponible para consultar rutinas del socio',
    };
  }

  const res = await fetch(`/api/rutina/${idSocio}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function eliminarRutina(idRutina: number | string) {
  const token = getToken();
  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const res = await fetch(`/api/rutina/${idRutina}`, {
    method: 'DELETE',
    headers,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  return { ok: res.ok, ...data };
}

export async function crearEntrenador(body: any) {
  const token = getToken();
  const res = await fetch('/api/entrenadores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getEntrenadores() {
  const token = getToken();
  const res = await fetch(`/api/entrenadores`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getHorariosEntrenador(id: number | string) {
  const token = getToken();
  const res = await fetch(`/api/entrenadores/${id}/horarios`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function actualizarEntrenador(id: number | string, body: any) {
  const token = getToken();
  const res = await fetch(`/api/entrenadores/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

// TODO: Eliminar las que no se usan, se implementaron algunas que no existen.

export async function getDietas() {
  const token = getToken();
  const res = await fetch(`/api/dieta/todas`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getDieta(id: number | string) {
  const token = getToken();
  const res = await fetch(`/api/dieta/${id}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function crearDieta(body: any) {
  const token = getToken();
  const res = await fetch(`/api/dieta/generar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function actualizarDieta(id: number | string, body: any) {
  const token = getToken();
  const res = await fetch(`/api/dieta/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function eliminarDieta(id: number | string) {
  const token = getToken();
  const res = await fetch(`/api/dieta/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function asignarDieta(
  socioId: number | string,
  dietaId: number | string
) {
  const token = getToken();
  const res = await fetch(`/api/dieta/socio/${socioId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ dietaId }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getDietasPorSocio(socioId: number | string) {
  const token = getToken();
  const res = await fetch(`/api/dieta/socio/${socioId}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function eliminarDietaDeSocio(
  socioId: number | string,
  dietaId: number | string
) {
  const token = getToken();
  const res = await fetch(`/api/dieta/socio/${socioId}/dietas/${dietaId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function generarDietaPersonalizada(body: any) {
  const token = getToken();
  const res = await fetch(`/api/dieta/generar-personalizada`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function getSocioByUsuarioId(usuarioId: string) {
  const token = getToken();
  const res = await fetch(`/api/socios`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok || !Array.isArray(data)) return null;
  return data.find((socio) => socio.usuario_id === usuarioId) || null;
}

// LLamadas API para Evolucion Fisica del Socio

export async function registrarEvolucionSocio(body: {
  peso: number;
  cintura: number;
  bicep: number;
  tricep: number;
  pierna: number;
  gluteos: number;
  pantorrilla: number;
  altura: number;
  observaciones: string;
}) {
  const token = getToken();
  const res = await fetch('/api/evolucion_socio/registro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getEvolucionesSocio(socio_id: string) {
  const token = getToken();
  const res = await fetch(`/api/evolucion_socio/${socio_id}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function uploadFile(
  file: File,
  fieldName = 'file',
  endpoint = '/api/file-upload'
) {
  const token = getToken();
  const form = new FormData();
  form.append(fieldName, file);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, data };
}

export async function getFichaMedicaActual(socioId: number | string) {
  const token = getToken();
  let resolved: number | string | null = null;
  if (typeof socioId === 'string') {
    const posible = await getSocioByUsuarioId(socioId);
    if (posible && posible.id_socio) {
      resolved = posible.id_socio;
    } else {
      const checkRes = await fetch(`/api/socios/${socioId}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (checkRes.ok) {
        resolved = socioId;
      } else {
        return {
          ok: false,
          data: { error: 'Socio no encontrado', code: 'socio_not_found' },
        };
      }
    }
  } else {
    resolved = socioId;
  }
  const res = await fetch(`/api/socios/${resolved}/ficha-medica/actual`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }
  if (data && typeof data === 'object' && 'data' in data) {
    return { ok: res.ok, data: (data as any).data };
  }
  return { ok: res.ok, data };
}

export async function crearFichaMedica(
  socioId: number | string,
  data: Record<string, any>,
  files?: (File | { fieldName?: string; file: File })[]
) {
  const token = getToken();
  const form = new FormData();
  if (data) {
    form.append('ficha', JSON.stringify(data));
  }
  if (files && files.length) {
    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item instanceof File) {
        form.append('file', item);
      } else if (item && item.file instanceof File) {
        form.append(item.fieldName || 'file', item.file);
      }
    }
  }
  let resolvedSocioId = socioId;
  if (typeof socioId === 'string') {
    const posible = await getSocioByUsuarioId(socioId);
    if (posible && posible.id_socio) {
      resolvedSocioId = posible.id_socio;
    } else {
      const checkRes = await fetch(`/api/socios/${socioId}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!checkRes.ok) {
        return {
          ok: false,
          data: { error: 'Socio no encontrado', code: 'socio_not_found' },
        };
      }
    }
  }

  const res = await fetch(`/api/socios/${resolvedSocioId}/ficha-medica`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  let resData = null;
  try {
    resData = await res.json();
  } catch {
    resData = null;
  }
  return { ok: res.ok, data: resData };
}

export async function getFichaMedicaHistorial(
  socioId: number | string,
  page = 1
) {
  const token = getToken();
  let resolved: number | string | null = null;
  if (typeof socioId === 'string') {
    const posible = await getSocioByUsuarioId(socioId);
    if (posible && posible.id_socio) {
      resolved = posible.id_socio;
    } else {
      const checkRes = await fetch(`/api/socios/${socioId}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (checkRes.ok) {
        resolved = socioId;
      } else {
        return {
          ok: false,
          data: { error: 'Socio no encontrado', code: 'socio_not_found' },
        };
      }
    }
  } else {
    resolved = socioId;
  }
  const url = `/api/socios/${resolved}/ficha-medica/historial?page=${encodeURIComponent(
    String(page)
  )}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, data };
}

export async function getCuotaEstado(socioId?: string) {
  const token = getToken();
  const query = socioId ? `?socio_id=${encodeURIComponent(socioId)}` : '';
  const res = await fetch(`/api/cuota-estado${query}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getAdminCuotasEstadoSocios() {
  const token = getToken();
  const res = await fetch('/api/admin/cuotas/estado-socios', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getAdminCuotasResumen() {
  const token = getToken();
  const res = await fetch('/api/admin/cuotas/resumen', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}


export async function getEjerciciosMediaCatalog(params?: {
  q?: string;
  objetivo?: string | number;
  nivel?: string | number;
  mediaStatus?: string;
  page?: number;
  pageSize?: number;
}) {
  const token = getToken();
  const searchParams = new URLSearchParams();

  if (params?.q) searchParams.set('q', params.q);
  if (params?.objetivo) searchParams.set('objetivo', String(params.objetivo));
  if (params?.nivel) searchParams.set('nivel', String(params.nivel));
  if (params?.mediaStatus) searchParams.set('mediaStatus', params.mediaStatus);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const query = searchParams.toString();
  const res = await fetch(`/api/rutinas/ejercicios-media${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function updateEjercicioMediaCatalog(payload: Record<string, unknown>) {
  const token = getToken();
  const res = await fetch('/api/rutinas/ejercicios-media', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function uploadEjercicioMedia(file: File, idEjercicio?: number | string) {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);

  if (idEjercicio) {
    form.append('id_ejercicio', String(idEjercicio));
  }

  const res = await fetch('/api/rutinas/ejercicios-media/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}


export async function importEjercicioMediaFromUrl(payload: {
  id_ejercicio: number | string;
  url: string;
  titulo?: string | null;
  descripcion_media?: string | null;
}) {
  const token = getToken();
  const res = await fetch('/api/rutinas/ejercicios-media/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}


export async function syncEjercicioMediaEquivalences(payload?: {
  apply?: boolean;
  limit?: number;
}) {
  const token = getToken();
  const res = await fetch('/api/rutinas/ejercicios-media/equivalence-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload ?? { apply: false }),
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}
