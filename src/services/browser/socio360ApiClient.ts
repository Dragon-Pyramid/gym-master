import { Socio } from '@/interfaces/socio.interface';
import {
  Socio360ActividadResumen,
  Socio360CuotaEstado,
  Socio360MensajeResumen,
  Socio360ModuloResumen,
  Socio360Perfil,
} from '@/interfaces/socio360.interface';
import { authHeader } from '@/services/storageService';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    headers: authHeader(),
  });
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = payload?.error || payload?.message || `No se pudo consultar ${url}`;
    throw new Error(message);
  }

  return payload as T;
}

function asArray<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as any).data)) {
    return (value as any).data as T[];
  }
  return [];
}

function getFirstDate(record: any): string | undefined {
  return (
    record?.fecha ||
    record?.fecha_alta ||
    record?.fecha_creacion ||
    record?.creado_en ||
    record?.created_at ||
    record?.actualizado_en ||
    undefined
  );
}

function normalizeDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function buildModuloResumen(list: any[], options?: { titleKeys?: string[]; estadoKeys?: string[] }): Socio360ModuloResumen {
  const total = list.length;
  const latest = list[0];
  const titleKeys = options?.titleKeys ?? ['nombre', 'titulo', 'objetivo', 'descripcion', 'tipo'];
  const estadoKeys = options?.estadoKeys ?? ['estado', 'status', 'activo'];

  const ultimoTitulo = titleKeys.map((key) => latest?.[key]).find(Boolean);
  const ultimoEstadoValue = estadoKeys.map((key) => latest?.[key]).find((value) => value !== undefined && value !== null);

  return {
    total,
    activo: total > 0,
    ultimoTitulo: typeof ultimoTitulo === 'string' ? ultimoTitulo : undefined,
    ultimoEstado:
      typeof ultimoEstadoValue === 'boolean'
        ? ultimoEstadoValue
          ? 'Activo'
          : 'Inactivo'
        : ultimoEstadoValue
          ? String(ultimoEstadoValue)
          : undefined,
    ultimaFecha: normalizeDate(getFirstDate(latest)),
  };
}

function normalizeMensajes(mensajes: any[], socio: Socio): Socio360MensajeResumen {
  const lowerEmail = socio.email?.toLowerCase() ?? '';
  const lowerName = socio.nombre_completo?.toLowerCase() ?? '';
  const socioMensajes = mensajes.filter((mensaje) => {
    const values = [
      mensaje?.socio_nombre,
      mensaje?.nombre_completo,
      mensaje?.email,
      mensaje?.socio_email,
      mensaje?.remitente,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (lowerEmail && values.includes(lowerEmail)) || (lowerName && values.includes(lowerName));
  });

  const latest = socioMensajes[0];
  return {
    total: socioMensajes.length,
    pendientes: socioMensajes.filter((mensaje) => ['pendiente', 'abierto', 'nuevo'].includes(String(mensaje?.estado ?? '').toLowerCase())).length,
    respondidos: socioMensajes.filter((mensaje) => ['respondido', 'cerrado', 'resuelto'].includes(String(mensaje?.estado ?? '').toLowerCase())).length,
    ultimoAsunto: latest?.asunto || latest?.titulo || undefined,
    ultimoEstado: latest?.estado || undefined,
    ultimaFecha: normalizeDate(getFirstDate(latest)),
  };
}

function normalizeActividades(inscripciones: any[], socioId: string): Socio360ActividadResumen {
  const propias = inscripciones.filter((inscripcion) => {
    const rawSocioId = inscripcion?.socio_id || inscripcion?.id_socio || inscripcion?.socio?.id_socio;
    return rawSocioId === socioId;
  });
  const latest = propias[0];

  return {
    total: propias.length,
    pendientes: propias.filter((inscripcion) => String(inscripcion?.estado ?? '').toLowerCase() === 'lista_espera').length,
    inscriptas: propias.filter((inscripcion) => ['inscripto', 'asistio'].includes(String(inscripcion?.estado ?? '').toLowerCase())).length,
    asistencias: propias.filter((inscripcion) => String(inscripcion?.estado ?? '').toLowerCase() === 'asistio').length,
    ultimoEstado: latest?.estado || undefined,
    ultimaFecha: normalizeDate(getFirstDate(latest)),
  };
}

export async function fetchSocio360Api(socio: Socio): Promise<Socio360Perfil> {
  const errores: string[] = [];
  const socioId = socio.id_socio;
  const mensajesQuery = encodeURIComponent(socio.email || socio.nombre_completo || '');

  const requests = await Promise.allSettled([
    fetchJson<{ data: Socio360CuotaEstado }>(`/api/cuota-estado?socio_id=${encodeURIComponent(socioId)}`),
    fetchJson<any[]>(`/api/rutina/${encodeURIComponent(socioId)}`),
    fetchJson<any[]>(`/api/dieta/socio/${encodeURIComponent(socioId)}`),
    fetchJson<{ data: any[] }>(`/api/evolucion_socio/${encodeURIComponent(socioId)}`),
    fetchJson<{ data: any }>(`/api/socios/${encodeURIComponent(socioId)}/ficha-medica/actual`),
    fetchJson<{ data: any[] }>(`/api/socios/${encodeURIComponent(socioId)}/ficha-medica/historial?page=1`),
    fetchJson<{ data: any[] }>(`/api/admin/socios-mensajes?q=${mensajesQuery}`),
    fetchJson<{ inscripciones?: any[]; data?: any[] }>(`/api/actividades/turnos-cupos`),
  ]);

  const getValue = <T>(index: number, fallback: T): T => {
    const result = requests[index];
    if (result.status === 'fulfilled') return result.value as T;
    errores.push(result.reason instanceof Error ? result.reason.message : 'No se pudo cargar un módulo 360');
    return fallback;
  };

  const cuotaPayload = getValue<{ data: Socio360CuotaEstado } | null>(0, null);
  const rutinasPayload = getValue<any[]>(1, []);
  const dietasPayload = getValue<any[]>(2, []);
  const evolucionPayload = getValue<{ data: any[] }>(3, { data: [] });
  const fichaActualPayload = getValue<{ data: any } | null>(4, null);
  const fichaHistorialPayload = getValue<{ data: any[] }>(5, { data: [] });
  const mensajesPayload = getValue<{ data: any[] }>(6, { data: [] });
  const actividadesPayload = getValue<{ inscripciones?: any[]; data?: any[] }>(7, { data: [] });

  const fichaActual = fichaActualPayload?.data;
  const fichaHistorial = asArray(fichaHistorialPayload);
  const fichaTotal = fichaActual ? Math.max(1, fichaHistorial.length) : fichaHistorial.length;

  return {
    socio,
    cuota: cuotaPayload?.data ?? null,
    fichaMedica: {
      total: fichaTotal,
      activo: Boolean(fichaActual),
      ultimoTitulo: fichaActual ? 'Ficha vigente cargada' : undefined,
      ultimoEstado: fichaActual?.apto_medico ? 'Apto presentado' : fichaActual ? 'Pendiente de apto' : 'Sin ficha vigente',
      ultimaFecha: normalizeDate(fichaActual?.fecha_control || fichaActual?.creado_en || fichaActual?.actualizado_en),
      detalle: fichaActual?.observaciones || fichaActual?.diagnostico || undefined,
    },
    rutinas: buildModuloResumen(asArray(rutinasPayload), {
      titleKeys: ['objetivo', 'nombre', 'titulo', 'descripcion'],
      estadoKeys: ['estado', 'activo'],
    }),
    dietas: buildModuloResumen(asArray(dietasPayload), {
      titleKeys: ['objetivo', 'nombre', 'titulo', 'descripcion'],
      estadoKeys: ['estado', 'activo'],
    }),
    evolucion: buildModuloResumen(asArray(evolucionPayload), {
      titleKeys: ['observaciones', 'objetivo', 'tipo'],
      estadoKeys: ['estado', 'status'],
    }),
    mensajes: normalizeMensajes(asArray(mensajesPayload), socio),
    actividades: normalizeActividades(actividadesPayload.inscripciones ?? asArray(actividadesPayload), socioId),
    errores: Array.from(new Set(errores)).slice(0, 4),
  };
}
