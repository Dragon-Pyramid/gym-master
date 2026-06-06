import type {
  GimnasioParametrizacion,
  GimnasioParametrizacionPayload,
  GimnasioParametrizacionResponse,
  GimnasioLogoUploadResponse,
  GimnasioStripeStatusResponse,
} from '@/interfaces/gimnasioParametrizacion.interface';
import { authHeader } from '@/services/storageService';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Error en parametrización del gimnasio');
  }

  return payload as T;
}

export async function getGimnasioParametrizacion(): Promise<GimnasioParametrizacion> {
  const response = await fetch('/api/gimnasio-parametrizacion', {
    method: 'GET',
    headers: authHeader(),
    cache: 'no-store',
  });

  const payload = await parseJsonResponse<GimnasioParametrizacionResponse>(response);
  return payload.data;
}

export async function updateGimnasioParametrizacion(
  input: GimnasioParametrizacionPayload
): Promise<GimnasioParametrizacion> {
  const response = await fetch('/api/gimnasio-parametrizacion', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(input),
  });

  const payload = await parseJsonResponse<GimnasioParametrizacionResponse>(response);
  return payload.data;
}


export async function uploadGimnasioLogo(file: File): Promise<GimnasioLogoUploadResponse['data']> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/gimnasio-parametrizacion/logo-upload', {
    method: 'POST',
    headers: authHeader(),
    body: formData,
  });

  const payload = await parseJsonResponse<GimnasioLogoUploadResponse>(response);
  return payload.data;
}


export async function getGimnasioStripeStatus() {
  const response = await fetch('/api/gimnasio-parametrizacion/stripe-status', {
    method: 'GET',
    headers: authHeader(),
    cache: 'no-store',
  });

  const payload = await parseJsonResponse<GimnasioStripeStatusResponse>(response);
  return payload.data;
}
