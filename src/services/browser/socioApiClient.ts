import { CreateSocioDto, Socio, UpdateSocioDto } from '@/interfaces/socio.interface';
import { authHeader } from '@/services/storageService';

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(payload.error || payload.message || 'Error en la operación de socios');
  }

  return payload as T;
}

export async function fetchSociosApi(): Promise<Socio[]> {
  const res = await fetch('/api/socios', {
    method: 'GET',
    headers: authHeader(),
  });
  return parseResponse<Socio[]>(res);
}

export async function createSocioApi(payload: CreateSocioDto): Promise<Socio> {
  const res = await fetch('/api/socios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });
  const response = await parseResponse<{ data: Socio }>(res);
  return response.data;
}

export async function updateSocioApi(
  id: string,
  updateData: UpdateSocioDto
): Promise<Socio> {
  const res = await fetch('/api/socios', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ id, ...updateData }),
  });
  const response = await parseResponse<{ data: Socio }>(res);
  return response.data;
}

export async function setSocioActivoApi(
  id: string,
  activo: boolean
): Promise<Socio> {
  return updateSocioApi(id, { activo });
}

export async function deactivateSocioApi(id: string): Promise<Socio> {
  const res = await fetch('/api/socios', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ id }),
  });
  const response = await parseResponse<{ data: Socio }>(res);
  return response.data;
}
