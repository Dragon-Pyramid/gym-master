import { randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { JwtUser } from '@/interfaces/jwtUser.interface';

type ResolvedScan = {
  tipo_resuelto: 'producto' | 'servicio' | 'pack' | 'infraestructura' | 'desconocido';
  item_tipo: 'producto' | 'servicio' | 'pack' | null;
  producto_id?: string | null;
  servicio_id?: string | null;
  pack_id?: string | null;
  item_nombre?: string | null;
  payload?: Record<string, unknown>;
};

import type {
  ComercialScannerEvent,
  ComercialScannerSession,
  ComercialScannerState,
  PublicComercialScannerScanResponse,
  PublicComercialScannerSessionInfo,
} from '@/interfaces/comercialMobileScanner.interface';

function getComercialDbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada para operar scanner móvil comercial desde API server.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeCode(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 160);
}

function buildToken() {
  return `gm-pos-${randomBytes(18).toString('hex')}`;
}

function addHours(date: Date, hours: number) {
  const copy = new Date(date.getTime());
  copy.setHours(copy.getHours() + hours);
  return copy;
}

function isExpired(session: ComercialScannerSession | null) {
  if (!session) return true;
  return new Date(session.expira_en).getTime() < Date.now();
}

function mapSession(row: any): ComercialScannerSession {
  return {
    id: row.id,
    token: row.token,
    canal: row.canal ?? 'pos_kiosco',
    estado: row.estado ?? 'activa',
    usuario_id: row.usuario_id ?? null,
    creado_en: row.creado_en,
    expira_en: row.expira_en,
    cerrado_en: row.cerrado_en ?? null,
    ultimo_evento_en: row.ultimo_evento_en ?? null,
  };
}

function mapEvent(row: any): ComercialScannerEvent {
  return {
    id: row.id,
    session_id: row.session_id,
    codigo: row.codigo,
    tipo_resuelto: row.tipo_resuelto ?? 'desconocido',
    item_tipo: row.item_tipo ?? null,
    producto_id: row.producto_id ?? null,
    servicio_id: row.servicio_id ?? null,
    pack_id: row.pack_id ?? null,
    item_nombre: row.item_nombre ?? null,
    payload: row.payload ?? null,
    estado: row.estado ?? 'pendiente',
    creado_en: row.creado_en,
    procesado_en: row.procesado_en ?? null,
  };
}

async function getActiveSessionById(supabase: ReturnType<typeof getComercialDbClient>, sessionId: string) {
  const { data, error } = await supabase
    .from('comercial_scanner_session')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapSession(data) : null;
}

async function getSessionByToken(supabase: ReturnType<typeof getComercialDbClient>, token: string) {
  const { data, error } = await supabase
    .from('comercial_scanner_session')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapSession(data) : null;
}

export async function createComercialMobileScannerSession(user?: JwtUser | null): Promise<ComercialScannerSession> {
  const supabase = getComercialDbClient();
  const token = buildToken();
  const now = new Date();

  const { data, error } = await supabase
    .from('comercial_scanner_session')
    .insert({
      token,
      canal: 'pos_kiosco',
      estado: 'activa',
      usuario_id: user?.id ?? null,
      expira_en: addHours(now, 8).toISOString(),
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapSession(data);
}

export async function closeComercialMobileScannerSession(sessionId: string): Promise<ComercialScannerSession> {
  const supabase = getComercialDbClient();
  const { data, error } = await supabase
    .from('comercial_scanner_session')
    .update({ estado: 'cerrada', cerrado_en: new Date().toISOString() })
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapSession(data);
}

export async function getComercialMobileScannerState(sessionId?: string | null): Promise<ComercialScannerState> {
  const supabase = getComercialDbClient();
  const cleanSessionId = String(sessionId ?? '').trim();

  if (!cleanSessionId) {
    return { session: null, pendingEvents: [], recentEvents: [] };
  }

  const session = await getActiveSessionById(supabase, cleanSessionId);
  if (!session) return { session: null, pendingEvents: [], recentEvents: [] };

  if (session.estado === 'activa' && isExpired(session)) {
    await supabase
      .from('comercial_scanner_session')
      .update({ estado: 'expirada', cerrado_en: new Date().toISOString() })
      .eq('id', session.id);
    return { session: { ...session, estado: 'expirada' }, pendingEvents: [], recentEvents: [] };
  }

  const [pendingResult, recentResult] = await Promise.all([
    supabase
      .from('comercial_scanner_event')
      .select('*')
      .eq('session_id', session.id)
      .eq('estado', 'pendiente')
      .order('creado_en', { ascending: true })
      .limit(20),
    supabase
      .from('comercial_scanner_event')
      .select('*')
      .eq('session_id', session.id)
      .order('creado_en', { ascending: false })
      .limit(20),
  ]);

  if (pendingResult.error) throw new Error(pendingResult.error.message);
  if (recentResult.error) throw new Error(recentResult.error.message);

  return {
    session,
    pendingEvents: (pendingResult.data ?? []).map(mapEvent),
    recentEvents: (recentResult.data ?? []).map(mapEvent),
  };
}

export async function markComercialMobileScannerEventProcessed(eventId: string): Promise<ComercialScannerEvent> {
  const supabase = getComercialDbClient();
  const { data, error } = await supabase
    .from('comercial_scanner_event')
    .update({ estado: 'procesado', procesado_en: new Date().toISOString() })
    .eq('id', eventId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapEvent(data);
}

async function resolveScannedCode(supabase: ReturnType<typeof getComercialDbClient>, codigo: string): Promise<ResolvedScan> {
  const exact = codigo.trim();
  const upper = exact.toUpperCase();

  const { data: qr } = await supabase
    .from('infraestructura_qr_codigo')
    .select('*')
    .eq('codigo', upper)
    .eq('activo', true)
    .maybeSingle();

  if (qr) {
    if (qr.target_type === 'producto') {
      const { data: product } = await supabase
        .from('producto')
        .select('id, nombre, precio, sku, codigo_barras, activo')
        .eq('id', qr.target_id)
        .maybeSingle();
      if (product && product.activo !== false) {
        return {
          tipo_resuelto: 'producto',
          item_tipo: 'producto',
          producto_id: product.id,
          item_nombre: product.nombre,
          payload: { origen: 'qr_interno', qr, producto: product },
        };
      }
    }

    if (qr.target_type === 'servicio') {
      const { data: service } = await supabase
        .from('servicio')
        .select('id, nombre, precio, categoria, activo')
        .eq('id', qr.target_id)
        .maybeSingle();
      if (service && service.activo !== false) {
        return {
          tipo_resuelto: 'servicio',
          item_tipo: 'servicio',
          servicio_id: service.id,
          item_nombre: service.nombre,
          payload: { origen: 'qr_interno', qr, servicio: service },
        };
      }
    }

    return {
      tipo_resuelto: 'infraestructura',
      item_tipo: null,
      item_nombre: qr.titulo || qr.codigo,
      payload: { origen: 'qr_interno', qr },
    };
  }

  const { data: product, error: productError } = await supabase
    .from('producto')
    .select('id, nombre, precio, sku, codigo_barras, activo')
    .or(`codigo_barras.eq.${exact},sku.eq.${exact},codigo_barras.eq.${upper},sku.eq.${upper}`)
    .eq('activo', true)
    .limit(1)
    .maybeSingle();

  if (!productError && product) {
    return {
      tipo_resuelto: 'producto',
      item_tipo: 'producto',
      producto_id: product.id,
      item_nombre: product.nombre,
      payload: { origen: 'barcode_sku', producto: product },
    };
  }

  const { data: service, error: serviceError } = await supabase
    .from('servicio')
    .select('id, nombre, precio, categoria, codigo, activo')
    .eq('codigo', upper)
    .eq('activo', true)
    .limit(1)
    .maybeSingle();

  if (!serviceError && service) {
    return {
      tipo_resuelto: 'servicio',
      item_tipo: 'servicio',
      servicio_id: service.id,
      item_nombre: service.nombre,
      payload: { origen: 'servicio_codigo', servicio: service },
    };
  }

  const { data: pack, error: packError } = await supabase
    .from('comercial_pack')
    .select('id, codigo, nombre, precio, activo')
    .eq('codigo', upper)
    .eq('activo', true)
    .limit(1)
    .maybeSingle();

  if (!packError && pack) {
    return {
      tipo_resuelto: 'pack',
      item_tipo: 'pack',
      pack_id: pack.id,
      item_nombre: pack.nombre,
      payload: { origen: 'pack_codigo', pack },
    };
  }

  return {
    tipo_resuelto: 'desconocido',
    item_tipo: null,
    item_nombre: null,
    payload: { origen: 'sin_resolver' },
  };
}

export async function getPublicComercialScannerSession(tokenInput: string): Promise<PublicComercialScannerSessionInfo> {
  const supabase = getComercialDbClient();
  const token = String(tokenInput ?? '').trim();
  if (!token) throw new Error('Token de scanner inválido');

  const session = await getSessionByToken(supabase, token);
  if (!session) throw new Error('Sesión de scanner no encontrada');

  const expired = isExpired(session);
  if (session.estado === 'activa' && expired) {
    await supabase
      .from('comercial_scanner_session')
      .update({ estado: 'expirada', cerrado_en: new Date().toISOString() })
      .eq('id', session.id);
  }

  const estado = expired && session.estado === 'activa' ? 'expirada' : session.estado;
  return {
    id: session.id,
    token: session.token,
    canal: session.canal,
    estado,
    expira_en: session.expira_en,
    puede_escanear: estado === 'activa',
  };
}

export async function createPublicComercialScannerEvent(
  tokenInput: string,
  codigoInput: string
): Promise<PublicComercialScannerScanResponse> {
  const supabase = getComercialDbClient();
  const token = String(tokenInput ?? '').trim();
  const codigo = normalizeCode(codigoInput);

  if (!token) throw new Error('Token de scanner inválido');
  if (!codigo) throw new Error('Ingresá o escaneá un código válido');

  const session = await getSessionByToken(supabase, token);
  if (!session) throw new Error('Sesión de scanner no encontrada');
  if (session.estado !== 'activa') throw new Error('La sesión de scanner no está activa');
  if (isExpired(session)) {
    await supabase
      .from('comercial_scanner_session')
      .update({ estado: 'expirada', cerrado_en: new Date().toISOString() })
      .eq('id', session.id);
    throw new Error('La sesión de scanner expiró');
  }

  const resolved = await resolveScannedCode(supabase, codigo);
  const { data, error } = await supabase
    .from('comercial_scanner_event')
    .insert({
      session_id: session.id,
      codigo,
      tipo_resuelto: resolved.tipo_resuelto,
      item_tipo: resolved.item_tipo,
      producto_id: resolved.producto_id ?? null,
      servicio_id: resolved.servicio_id ?? null,
      pack_id: resolved.pack_id ?? null,
      item_nombre: resolved.item_nombre ?? null,
      payload: resolved.payload ?? {},
      estado: 'pendiente',
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from('comercial_scanner_session')
    .update({ ultimo_evento_en: new Date().toISOString() })
    .eq('id', session.id);

  const event = mapEvent(data);
  const message = event.tipo_resuelto === 'desconocido'
    ? 'Código enviado al POS, pero no se encontró producto/servicio/pack asociado.'
    : `${event.item_nombre || event.codigo} enviado al POS.`;

  return { event, message };
}
