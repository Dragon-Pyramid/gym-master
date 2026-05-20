import { CreateUsuarioDto, ResponseUsuario, UpdateUsuarioDto } from '@/interfaces/usuario.interface';
import { authHeader } from '@/services/storageService';

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(payload.error || payload.message || 'Error en la operación de usuarios');
  }

  return payload as T;
}

export async function fetchUsuariosApi(): Promise<ResponseUsuario[]> {
  const res = await fetch('/api/usuarios', {
    method: 'GET',
    headers: authHeader(),
  });
  const payload = await parseResponse<{ data: ResponseUsuario[] }>(res);
  return payload.data ?? [];
}

export async function createUsuarioApi(
  payload: CreateUsuarioDto
): Promise<ResponseUsuario> {
  const res = await fetch('/api/usuarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });
  const response = await parseResponse<{ data: ResponseUsuario }>(res);
  return response.data;
}

export async function updateUsuarioApi(
  id: string,
  updateData: UpdateUsuarioDto
): Promise<ResponseUsuario> {
  const res = await fetch('/api/usuarios', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ id, updateData }),
  });
  const response = await parseResponse<{ data: ResponseUsuario }>(res);
  return response.data;
}

export async function deactivateUsuarioApi(id: string): Promise<ResponseUsuario> {
  const res = await fetch('/api/usuarios', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ id }),
  });
  const response = await parseResponse<{ data: ResponseUsuario }>(res);
  return response.data;
}
