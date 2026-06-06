import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type {
  GimnasioParametrizacion,
  GimnasioParametrizacionPayload,
} from '@/interfaces/gimnasioParametrizacion.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';

const SINGLETON_KEY = 'principal';

const DEFAULT_BRANDING: Omit<
  GimnasioParametrizacion,
  'id' | 'creado_en' | 'actualizado_en' | 'actualizado_por'
> = {
  singleton_key: SINGLETON_KEY,
  nombre_comercial: 'Gym Master',
  razon_social: null,
  identificacion_fiscal: null,
  condicion_fiscal: null,
  domicilio_legal: null,
  ciudad: null,
  provincia: null,
  pais: 'Argentina',
  telefono: null,
  email: null,
  sitio_web: null,
  instagram_url: null,
  facebook_url: null,
  logo_url: '/gm_logo.svg',
  logo_alternativo_url: null,
  color_primario: '#0EA5E9',
  color_secundario: '#111827',
  color_acento: '#22C55E',
  texto_legal_recibos: null,
  texto_legal_reportes: null,
  pie_pagina_documentos: 'Documento generado por Gym Master.',
  activo: true,
};

const EMPTY_BRANDING: GimnasioParametrizacion = {
  id: '',
  singleton_key: SINGLETON_KEY,
  nombre_comercial: '',
  razon_social: null,
  identificacion_fiscal: null,
  condicion_fiscal: null,
  domicilio_legal: null,
  ciudad: null,
  provincia: null,
  pais: 'Argentina',
  telefono: null,
  email: null,
  sitio_web: null,
  instagram_url: null,
  facebook_url: null,
  logo_url: DEFAULT_BRANDING.logo_url,
  logo_alternativo_url: null,
  color_primario: DEFAULT_BRANDING.color_primario,
  color_secundario: DEFAULT_BRANDING.color_secundario,
  color_acento: DEFAULT_BRANDING.color_acento,
  texto_legal_recibos: null,
  texto_legal_reportes: null,
  pie_pagina_documentos: null,
  activo: true,
  creado_en: null,
  actualizado_en: null,
  actualizado_por: null,
};

function assertAdmin(user: JwtUser) {
  if (user.rol !== 'admin') {
    throw new Error('No autorizado. Solo administradores pueden modificar los datos legales del gimnasio.');
  }
}

function trimString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length ? text : null;
}

function normalizeHexColor(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const text = value.trim().toUpperCase();

  if (/^#[0-9A-F]{6}$/.test(text)) return text;
  if (/^[0-9A-F]{6}$/.test(text)) return `#${text}`;

  return fallback;
}

function normalizeUrlOrPath(value: unknown) {
  const text = trimString(value);
  if (!text) return null;

  if (text.startsWith('/')) return text;

  try {
    const url = new URL(text);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
  } catch {
    // Se ignora y se conserva null para evitar guardar strings inválidos.
  }

  return null;
}

function normalizePayload(input: GimnasioParametrizacionPayload, user: JwtUser) {
  const payload: Record<string, unknown> = {
    singleton_key: SINGLETON_KEY,
    actualizado_por: user.id,
  };

  const stringFields: Array<keyof GimnasioParametrizacionPayload> = [
    'nombre_comercial',
    'razon_social',
    'identificacion_fiscal',
    'condicion_fiscal',
    'domicilio_legal',
    'ciudad',
    'provincia',
    'pais',
    'telefono',
    'email',
    'texto_legal_recibos',
    'texto_legal_reportes',
    'pie_pagina_documentos',
  ];

  for (const field of stringFields) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      const value = trimString(input[field]);
      payload[field] = field === 'nombre_comercial' ? value || DEFAULT_BRANDING.nombre_comercial : value;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'sitio_web')) {
    payload.sitio_web = normalizeUrlOrPath(input.sitio_web);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'instagram_url')) {
    payload.instagram_url = normalizeUrlOrPath(input.instagram_url);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'facebook_url')) {
    payload.facebook_url = normalizeUrlOrPath(input.facebook_url);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'logo_url')) {
    payload.logo_url = normalizeUrlOrPath(input.logo_url) || DEFAULT_BRANDING.logo_url;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'logo_alternativo_url')) {
    payload.logo_alternativo_url = normalizeUrlOrPath(input.logo_alternativo_url);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'color_primario')) {
    payload.color_primario = normalizeHexColor(input.color_primario, DEFAULT_BRANDING.color_primario);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'color_secundario')) {
    payload.color_secundario = normalizeHexColor(input.color_secundario, DEFAULT_BRANDING.color_secundario);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'color_acento')) {
    payload.color_acento = normalizeHexColor(input.color_acento, DEFAULT_BRANDING.color_acento);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'activo')) {
    payload.activo = input.activo !== false;
  }

  return payload;
}

function normalizeRow(row: Record<string, unknown>): GimnasioParametrizacion {
  return {
    id: String(row.id),
    singleton_key: 'principal',
    nombre_comercial: String(row.nombre_comercial || DEFAULT_BRANDING.nombre_comercial),
    razon_social: row.razon_social ? String(row.razon_social) : null,
    identificacion_fiscal: row.identificacion_fiscal ? String(row.identificacion_fiscal) : null,
    condicion_fiscal: row.condicion_fiscal ? String(row.condicion_fiscal) : null,
    domicilio_legal: row.domicilio_legal ? String(row.domicilio_legal) : null,
    ciudad: row.ciudad ? String(row.ciudad) : null,
    provincia: row.provincia ? String(row.provincia) : null,
    pais: row.pais ? String(row.pais) : null,
    telefono: row.telefono ? String(row.telefono) : null,
    email: row.email ? String(row.email) : null,
    sitio_web: row.sitio_web ? String(row.sitio_web) : null,
    instagram_url: row.instagram_url ? String(row.instagram_url) : null,
    facebook_url: row.facebook_url ? String(row.facebook_url) : null,
    logo_url: row.logo_url ? String(row.logo_url) : DEFAULT_BRANDING.logo_url,
    logo_alternativo_url: row.logo_alternativo_url ? String(row.logo_alternativo_url) : null,
    color_primario: String(row.color_primario || DEFAULT_BRANDING.color_primario),
    color_secundario: String(row.color_secundario || DEFAULT_BRANDING.color_secundario),
    color_acento: String(row.color_acento || DEFAULT_BRANDING.color_acento),
    texto_legal_recibos: row.texto_legal_recibos ? String(row.texto_legal_recibos) : null,
    texto_legal_reportes: row.texto_legal_reportes ? String(row.texto_legal_reportes) : null,
    pie_pagina_documentos: row.pie_pagina_documentos ? String(row.pie_pagina_documentos) : null,
    activo: row.activo !== false,
    creado_en: row.creado_en ? String(row.creado_en) : null,
    actualizado_en: row.actualizado_en ? String(row.actualizado_en) : null,
    actualizado_por: row.actualizado_por ? String(row.actualizado_por) : null,
  };
}

export async function getGimnasioParametrizacion(): Promise<GimnasioParametrizacion> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('gimnasio_parametrizacion')
    .select('*')
    .eq('singleton_key', SINGLETON_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al obtener parametrización del gimnasio: ${error.message}`);
  }

  if (data) return normalizeRow(data as Record<string, unknown>);

  // No se crea automáticamente un registro default. Si no hay datos legales,
  // el sistema debe poder detectar parametrización incompleta y bloquear
  // documentos comerciales hasta que el administrador cargue el gimnasio real.
  return EMPTY_BRANDING;
}

export async function updateGimnasioParametrizacion(
  input: GimnasioParametrizacionPayload,
  user: JwtUser
): Promise<GimnasioParametrizacion> {
  assertAdmin(user);

  const supabase = getSupabaseServerClient();
  const payload = normalizePayload(input, user);

  const { data, error } = await supabase
    .from('gimnasio_parametrizacion')
    .upsert(payload, { onConflict: 'singleton_key' })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Error al guardar parametrización del gimnasio: ${error.message}`);
  }

  return normalizeRow(data as Record<string, unknown>);
}
