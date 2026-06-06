import { authHeader } from '@/services/storageService';

export type RespaldoFormato = 'xlsx' | 'json';

export type RespaldoModulo = {
  key: string;
  label: string;
  description: string;
  safeForClientExport: boolean;
};

export type RespaldoHistorialItem = {
  id: string;
  usuario_email: string | null;
  usuario_nombre: string | null;
  formato: RespaldoFormato;
  modulos: string[];
  registros_totales: number;
  estado: string;
  error: string | null;
  archivo_nombre: string | null;
  creado_en: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || payload.message || 'Error en respaldo de negocio');
  }
  return payload as T;
}

export async function fetchRespaldoNegocioMeta(): Promise<{
  modulos: RespaldoModulo[];
  historial: RespaldoHistorialItem[];
}> {
  const res = await fetch('/api/admin/respaldo-negocio', {
    method: 'GET',
    headers: authHeader(),
  });
  const payload = await parseJson<{ data: { modulos: RespaldoModulo[]; historial: RespaldoHistorialItem[] } }>(res);
  return payload.data;
}

export async function downloadRespaldoNegocio(formato: RespaldoFormato, modulos: string[]) {
  const res = await fetch('/api/admin/respaldo-negocio/exportar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ formato, modulos }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || payload.message || 'No se pudo generar el respaldo');
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const fileName = match?.[1] || `gym-master-respaldo-negocio.${formato === 'xlsx' ? 'xlsx' : 'json'}`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
