import {
  CreateOtrosGastosDto,
  OtrosGastos,
  OtrosGastosComprobanteUploadResponse,
  UpdateOtrosGastosDto,
} from '@/interfaces/otros_gastos.interface';
import { authHeader } from '@/services/storageService';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || 'Error al operar gastos');
  }

  return payload?.data as T;
}

export const getAllOtrosGastos = async (): Promise<OtrosGastos[]> => {
  const response = await fetch('/api/otros_gastos', {
    method: 'GET',
    headers: authHeader(),
    cache: 'no-store',
  });

  return parseJsonResponse<OtrosGastos[]>(response);
};

export const createOtrosGastos = async (
  payload: CreateOtrosGastosDto
): Promise<OtrosGastos> => {
  const response = await fetch('/api/otros_gastos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<OtrosGastos>(response);
};

export const updateOtrosGastos = async (
  id: string,
  updateData: UpdateOtrosGastosDto
): Promise<OtrosGastos> => {
  const response = await fetch('/api/otros_gastos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ id, updateData }),
  });

  return parseJsonResponse<OtrosGastos>(response);
};

export const deleteOtrosGastos = async (id: string): Promise<OtrosGastos> => {
  const response = await fetch('/api/otros_gastos', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ id }),
  });

  return parseJsonResponse<OtrosGastos>(response);
};

export async function uploadOtrosGastosComprobante(
  file: File
): Promise<OtrosGastosComprobanteUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/otros_gastos/comprobante-upload', {
    method: 'POST',
    headers: authHeader(),
    body: formData,
  });

  return parseJsonResponse<OtrosGastosComprobanteUploadResponse>(response);
}
