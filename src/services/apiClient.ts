import { getToken, loginSession, logoutSession } from './storageService';
import type {
  CreateSocioMensajeDto,
  SocioMensaje,
  SocioMensajeEstado,
  UpdateSocioMensajeAdminDto,
} from '@/interfaces/socioMensaje.interface';
import type {
  CreateSoporteTicketDto,
  SoporteTicket,
  SoporteTicketEstado,
  UpdateSoporteTicketDto,
} from '@/interfaces/soporteTicket.interface';

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


export async function getRutinaTrainingSessions(rutinaId: number | string) {
  const token = getToken();
  const headers: HeadersInit = {
    'Cache-Control': 'no-cache',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(
    `/api/rutina/training-sessions?rutinaId=${encodeURIComponent(String(rutinaId))}&t=${Date.now()}`,
    {
      method: 'GET',
      headers,
      cache: 'no-store',
    },
  );
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function startRutinaTrainingSession(payload: unknown) {
  const token = getToken();
  const res = await fetch('/api/rutina/training-sessions', {
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

export async function updateRutinaTrainingSession(sessionId: string, payload: unknown) {
  const token = getToken();
  const res = await fetch(`/api/rutina/training-sessions/${sessionId}`, {
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

export async function generarDietaConAsistente(body: any) {
  const token = getToken();
  const res = await fetch(`/api/dieta/rag-assistant/generar`, {
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
  if (!token) {
    return { ok: false, status: 401, data: { error: 'Token no disponible' } };
  }

  const res = await fetch(`/api/dieta/socio/${socioId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
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
  const res = await fetch(`/api/socios/${socioId}/ficha-medica/actual`, {
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

  const res = await fetch(`/api/socios/${socioId}/ficha-medica`, {
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
  const url = `/api/socios/${socioId}/ficha-medica/historial?page=${encodeURIComponent(
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

export async function crearEmpleado(body: any) {
  const token = getToken();
  const res = await fetch('/api/empleados', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function getEmpleado(id: number | string) {
  const token = getToken();
  const res = await fetch(`/api/empleados/${id}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function getEmpleados() {
  const token = getToken();
  const res = await fetch('/api/empleados', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function actualizarEmpleado(id: number | string, body: any) {
  const token = getToken();
  const res = await fetch(`/api/empleados/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function desactivarEmpleado(id: number | string) {
  const token = getToken();
  const res = await fetch(`/api/empleados/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}


export async function crearEmpleadoSueldo(body: any) {
  const token = getToken();
  const res = await fetch('/api/empleados-sueldos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function getEmpleadoSueldos() {
  const token = getToken();
  const res = await fetch('/api/empleados-sueldos', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function actualizarEmpleadoSueldo(id: number | string, body: any) {
  const token = getToken();
  const res = await fetch(`/api/empleados-sueldos/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function anularEmpleadoSueldo(id: number | string) {
  const token = getToken();
  const res = await fetch(`/api/empleados-sueldos/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function getNotificaciones() {
  const token = getToken();
  const res = await fetch('/api/notificaciones', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function getNotificacion(id: string) {
  const token = getToken();
  const res = await fetch(`/api/notificaciones/${id}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function getNotificacionPlantillas() {
  const token = getToken();
  const res = await fetch('/api/notificaciones/plantillas', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function crearNotificacion(body: any) {
  const token = getToken();
  const res = await fetch('/api/notificaciones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function actualizarNotificacion(id: string, body: any) {
  const token = getToken();
  const res = await fetch(`/api/notificaciones/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function cancelarNotificacion(id: string) {
  const token = getToken();
  const res = await fetch(`/api/notificaciones/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}

export async function enviarNotificacion(id: string) {
  const token = getToken();
  const res = await fetch(`/api/notificaciones/${id}/enviar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, data, ...(!res.ok ? data : {}) };
}



export async function getMisMensajesSocio() {
  const token = getToken();
  const res = await fetch('/api/socios/mensajes', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const data = await res.json();
  return { ok: res.ok, ...data } as { ok: boolean; data?: SocioMensaje[]; error?: string };
}

export async function crearMensajeSocio(payload: CreateSocioMensajeDto) {
  const token = getToken();
  const res = await fetch('/api/socios/mensajes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, ...data } as { ok: boolean; data?: SocioMensaje; error?: string };
}

export async function getMensajesSociosAdmin(filters?: {
  estado?: SocioMensajeEstado | 'todos';
  q?: string;
}) {
  const token = getToken();
  const params = new URLSearchParams();
  if (filters?.estado && filters.estado !== 'todos') params.set('estado', filters.estado);
  if (filters?.q) params.set('q', filters.q);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`/api/admin/socios-mensajes${query}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const data = await res.json();
  return { ok: res.ok, ...data } as { ok: boolean; data?: SocioMensaje[]; error?: string };
}

export async function actualizarMensajeSocioAdmin(
  id: string,
  payload: UpdateSocioMensajeAdminDto
) {
  const token = getToken();
  const res = await fetch(`/api/admin/socios-mensajes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, ...data } as { ok: boolean; data?: SocioMensaje; error?: string };
}

export async function getSoporteTickets(filters?: {
  estado?: SoporteTicketEstado | 'todos';
  q?: string;
}) {
  const token = getToken();
  const params = new URLSearchParams();
  if (filters?.estado && filters.estado !== 'todos') params.set('estado', filters.estado);
  if (filters?.q) params.set('q', filters.q);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`/api/soporte/tickets${query}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const data = await res.json();
  return { ok: res.ok, ...data } as { ok: boolean; data?: SoporteTicket[]; error?: string };
}

export async function crearSoporteTicket(payload: CreateSoporteTicketDto) {
  const token = getToken();
  const res = await fetch('/api/soporte/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, ...data } as { ok: boolean; data?: SoporteTicket; error?: string };
}

export async function getSoporteTicket(id: string) {
  const token = getToken();
  const res = await fetch(`/api/soporte/tickets/${id}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const data = await res.json();
  return { ok: res.ok, ...data } as { ok: boolean; data?: SoporteTicket; error?: string };
}

export async function actualizarSoporteTicket(
  id: string,
  payload: UpdateSoporteTicketDto
) {
  const token = getToken();
  const res = await fetch(`/api/soporte/tickets/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, ...data } as { ok: boolean; data?: SoporteTicket; error?: string };
}

export async function importEjerciciosYoutubeVideos(payload: {
  apply?: boolean;
  items: Array<{
    id_ejercicio?: number | string | null;
    nombre_ejercicio?: string | null;
    youtube_url_es?: string | null;
    youtube_url_en?: string | null;
    youtube_source?: string | null;
    youtube_review_status?: string | null;
    youtube_review_notes?: string | null;
  }>;
}) {
  const token = getToken();
  const res = await fetch('/api/rutinas/ejercicios-media/youtube-import', {
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


export async function autoDiscoverEjerciciosYoutubeVideos(payload: {
  apply?: boolean;
  limit?: number;
  idiomas?: Array<'es' | 'en'>;
  onlyMissing?: boolean;
  regionEs?: string;
  regionEn?: string;
}) {
  const token = getToken();
  const res = await fetch('/api/rutinas/ejercicios-media/youtube-auto-discovery', {
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


export async function getDragonPyramidLicenseControl() {
  const token = getToken();
  const res = await fetch('/api/dragon-pyramid/license', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function updateDragonPyramidLicenseControl(payload: unknown) {
  const token = getToken();
  const res = await fetch('/api/dragon-pyramid/license', {
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
