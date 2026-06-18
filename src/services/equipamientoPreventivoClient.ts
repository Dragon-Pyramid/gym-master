import type {
  CreateEquipamientoOrdenTecnicaDTO,
  CreateEquipamientoPlanPreventivoDTO,
  EquipamientoOrdenTecnica,
  EquipamientoPlanPreventivo,
  EquipamientoPreventivosDashboard,
  UpdateEquipamientoOrdenTecnicaDTO,
} from '@/interfaces/equipamientoPreventivo.interface';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Error en preventivos de equipamientos.');
  }
  return payload as T;
}

export async function getEquipamientosPreventivosDashboardClient() {
  return parseJsonResponse<EquipamientoPreventivosDashboard>(
    await fetch('/api/equipamientos/preventivos', {
      method: 'GET',
      cache: 'no-store',
    }),
  );
}

export async function createEquipamientoPlanPreventivoClient(payload: CreateEquipamientoPlanPreventivoDTO) {
  const response = await fetch('/api/equipamientos/preventivos/planes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse<{ message: string; data: EquipamientoPlanPreventivo }>(response);
}

export async function createEquipamientoOrdenTecnicaClient(payload: CreateEquipamientoOrdenTecnicaDTO) {
  const response = await fetch('/api/equipamientos/preventivos/ordenes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse<{ message: string; data: EquipamientoOrdenTecnica }>(response);
}

export async function updateEquipamientoOrdenTecnicaClient(id: string, payload: UpdateEquipamientoOrdenTecnicaDTO) {
  const response = await fetch(`/api/equipamientos/preventivos/ordenes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse<{ message: string; data: EquipamientoOrdenTecnica }>(response);
}
