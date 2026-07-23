import { Socio } from '@/interfaces/socio.interface';
import {
  Socio360ActividadResumen,
  Socio360CuotaEstado,
  Socio360MensajeResumen,
  Socio360ModuloResumen,
  Socio360Perfil,
} from '@/interfaces/socio360.interface';
import type { GymMasterLocale } from '@/i18n/config';
import { authHeader } from '@/services/storageService';

function socio360Tx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

async function fetchJson<T>(url: string, locale: GymMasterLocale): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...authHeader(),
      'Accept-Language': locale,
    },
  });
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const rawMessage = payload?.error || payload?.message;
    const message =
      locale === 'es' && rawMessage
        ? String(rawMessage)
        : socio360Tx(locale, `No se pudo consultar ${url}`, 'A member 360 module request failed');
    throw new Error(message);
  }

  return payload as T;
}


function translateKnownStatus(value: string, locale: GymMasterLocale) {
  const normalized = value.toLowerCase().replaceAll('_', ' ').trim();
  const labels: Array<[string[], string, string]> = [
    [['activo', 'active'], 'Activo', 'Active'],
    [['inactivo', 'inactive'], 'Inactivo', 'Inactive'],
    [['pendiente', 'pending'], 'Pendiente', 'Pending'],
    [['lista espera', 'waitlist', 'waiting list'], 'Lista de espera', 'Waitlist'],
    [['inscripto', 'inscrito', 'registered', 'enrolled'], 'Inscripto', 'Registered'],
    [['asistio', 'asistió', 'attended'], 'Asistió', 'Attended'],
    [['completado', 'completed'], 'Completado', 'Completed'],
    [['cancelado', 'cancelled', 'canceled'], 'Cancelado', 'Cancelled'],
  ];
  const match = labels.find(([tokens]) => tokens.some((token) => normalized === token));
  return match ? socio360Tx(locale, match[1], match[2]) : value;
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

function normalizeDate(value: string | null | undefined, locale: GymMasterLocale) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function buildModuloResumen(
  list: any[],
  locale: GymMasterLocale,
  options?: { titleKeys?: string[]; estadoKeys?: string[] }
): Socio360ModuloResumen {
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
          ? socio360Tx(locale, 'Activo', 'Active')
          : socio360Tx(locale, 'Inactivo', 'Inactive')
        : ultimoEstadoValue
          ? translateKnownStatus(String(ultimoEstadoValue), locale)
          : undefined,
    ultimaFecha: normalizeDate(getFirstDate(latest), locale),
  };
}

function normalizeMensajes(mensajes: any[], socio: Socio, locale: GymMasterLocale): Socio360MensajeResumen {
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
    ultimoEstado: latest?.estado ? translateKnownStatus(String(latest.estado), locale) : undefined,
    ultimaFecha: normalizeDate(getFirstDate(latest), locale),
  };
}

function normalizeActividades(
  inscripciones: any[],
  socioId: string,
  locale: GymMasterLocale
): Socio360ActividadResumen {
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
    ultimoEstado: latest?.estado ? translateKnownStatus(String(latest.estado), locale) : undefined,
    ultimaFecha: normalizeDate(getFirstDate(latest), locale),
  };
}

export async function fetchSocio360Api(
  socio: Socio,
  locale: GymMasterLocale = 'es'
): Promise<Socio360Perfil> {
  const errores: string[] = [];
  const socioId = socio.id_socio;
  const mensajesQuery = encodeURIComponent(socio.email || socio.nombre_completo || '');

  const requests = await Promise.allSettled([
    fetchJson<{ data: Socio360CuotaEstado }>(`/api/cuota-estado?socio_id=${encodeURIComponent(socioId)}`, locale),
    fetchJson<any[]>(`/api/rutina/${encodeURIComponent(socioId)}`, locale),
    fetchJson<any[]>(`/api/dieta/socio/${encodeURIComponent(socioId)}`, locale),
    fetchJson<{ data: any[] }>(`/api/evolucion_socio/${encodeURIComponent(socioId)}`, locale),
    fetchJson<{ data: any }>(`/api/socios/${encodeURIComponent(socioId)}/ficha-medica/actual`, locale),
    fetchJson<{ data: any[] }>(`/api/socios/${encodeURIComponent(socioId)}/ficha-medica/historial?page=1`, locale),
    fetchJson<{ data: any[] }>(`/api/admin/socios-mensajes?q=${mensajesQuery}`, locale),
    fetchJson<{ inscripciones?: any[]; data?: any[] }>(`/api/actividades/turnos-cupos`, locale),
  ]);

  const getValue = <T>(index: number, fallback: T): T => {
    const result = requests[index];
    if (result.status === 'fulfilled') return result.value as T;
    errores.push(
      locale === 'es' && result.reason instanceof Error
        ? result.reason.message
        : socio360Tx(locale, 'No se pudo cargar un módulo 360', 'A 360 module could not be loaded')
    );
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
      ultimoTitulo: fichaActual ? socio360Tx(locale, 'Ficha vigente cargada', 'Current record available') : undefined,
      ultimoEstado: fichaActual?.apto_medico
        ? socio360Tx(locale, 'Apto presentado', 'Medical clearance submitted')
        : fichaActual
          ? socio360Tx(locale, 'Pendiente de apto', 'Medical clearance pending')
          : socio360Tx(locale, 'Sin ficha vigente', 'No current medical record'),
      ultimaFecha: normalizeDate(fichaActual?.fecha_control || fichaActual?.creado_en || fichaActual?.actualizado_en, locale),
      detalle: fichaActual?.observaciones || fichaActual?.diagnostico || undefined,
    },
    rutinas: buildModuloResumen(asArray(rutinasPayload), locale, {
      titleKeys: ['objetivo', 'nombre', 'titulo', 'descripcion'],
      estadoKeys: ['estado', 'activo'],
    }),
    dietas: buildModuloResumen(asArray(dietasPayload), locale, {
      titleKeys: ['objetivo', 'nombre', 'titulo', 'descripcion'],
      estadoKeys: ['estado', 'activo'],
    }),
    evolucion: buildModuloResumen(asArray(evolucionPayload), locale, {
      titleKeys: ['observaciones', 'objetivo', 'tipo'],
      estadoKeys: ['estado', 'status'],
    }),
    mensajes: normalizeMensajes(asArray(mensajesPayload), socio, locale),
    actividades: normalizeActividades(actividadesPayload.inscripciones ?? asArray(actividadesPayload), socioId, locale),
    errores: Array.from(new Set(errores)).slice(0, 4),
  };
}
