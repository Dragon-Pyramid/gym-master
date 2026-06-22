import type {
  ComercialScannerEvent,
  ComercialScannerSession,
  ComercialScannerState,
  PublicComercialScannerScanResponse,
  PublicComercialScannerSessionInfo,
} from '@/interfaces/comercialMobileScanner.interface';
import { getToken } from './storageService';

function buildHeaders(hasBody = false): HeadersInit {
  const token = getToken();
  return {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse<T>(res: Response, fallback: string): Promise<T> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error || fallback);
  return payload?.data as T;
}

export async function createComercialMobileScannerSession(): Promise<ComercialScannerSession> {
  const res = await fetch('/api/comercial/mobile-scanner', {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({ action: 'crear_sesion' }),
  });
  const data = await parseResponse<{ session: ComercialScannerSession }>(res, 'Error al crear scanner móvil');
  return data.session;
}

export async function closeComercialMobileScannerSession(sessionId: string): Promise<ComercialScannerSession> {
  const res = await fetch('/api/comercial/mobile-scanner', {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({ action: 'cerrar_sesion', session_id: sessionId }),
  });
  const data = await parseResponse<{ session: ComercialScannerSession }>(res, 'Error al cerrar scanner móvil');
  return data.session;
}

export async function getComercialMobileScannerState(sessionId: string): Promise<ComercialScannerState> {
  const res = await fetch(`/api/comercial/mobile-scanner?session_id=${encodeURIComponent(sessionId)}`, {
    method: 'GET',
    headers: buildHeaders(false),
    cache: 'no-store',
  });
  return parseResponse<ComercialScannerState>(res, 'Error al obtener eventos del scanner móvil');
}

export async function markComercialMobileScannerEventProcessed(eventId: string): Promise<ComercialScannerEvent> {
  const res = await fetch('/api/comercial/mobile-scanner', {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({ action: 'marcar_evento_procesado', event_id: eventId }),
  });
  const data = await parseResponse<{ event: ComercialScannerEvent }>(res, 'Error al marcar evento del scanner');
  return data.event;
}

export async function getPublicComercialScannerSession(token: string): Promise<PublicComercialScannerSessionInfo> {
  const res = await fetch(`/api/comercial/mobile-scanner/public/${encodeURIComponent(token)}`, {
    method: 'GET',
    cache: 'no-store',
  });
  return parseResponse<PublicComercialScannerSessionInfo>(res, 'Error al obtener scanner móvil');
}

export async function sendPublicComercialScannerCode(
  token: string,
  codigo: string
): Promise<PublicComercialScannerScanResponse> {
  const res = await fetch(`/api/comercial/mobile-scanner/public/${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo }),
  });
  return parseResponse<PublicComercialScannerScanResponse>(res, 'Error al enviar código escaneado');
}
