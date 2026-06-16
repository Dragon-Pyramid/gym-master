import type {
  CreateInfraestructuraActivoDTO,
  CreateInfraestructuraSectorDTO,
  CreateMantenimientoEdilicioOrdenDTO,
  InfraestructuraActivo,
  InfraestructuraMantenimientoDashboard,
  InfraestructuraSector,
  MantenimientoEdilicioOrden,
  UpdateMantenimientoEdilicioOrdenDTO,
} from '@/interfaces/infraestructuraMantenimiento.interface';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Error en operación de infraestructura.');
  }
  return payload as T;
}

export async function getInfraestructuraMantenimientoDashboardClient() {
  return parseJsonResponse<InfraestructuraMantenimientoDashboard>(
    await fetch('/api/infraestructura/mantenimiento-edilicio', {
      method: 'GET',
      cache: 'no-store',
    }),
  );
}

export async function createInfraestructuraSectorClient(payload: CreateInfraestructuraSectorDTO) {
  const response = await fetch('/api/infraestructura/sectores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse<{ message: string; data: InfraestructuraSector }>(response);
}

export async function createInfraestructuraActivoClient(payload: CreateInfraestructuraActivoDTO) {
  const response = await fetch('/api/infraestructura/activos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse<{ message: string; data: InfraestructuraActivo }>(response);
}

export async function createMantenimientoEdilicioOrdenClient(payload: CreateMantenimientoEdilicioOrdenDTO) {
  const response = await fetch('/api/infraestructura/ordenes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse<{ message: string; data: MantenimientoEdilicioOrden }>(response);
}

export async function updateMantenimientoEdilicioOrdenClient(
  id: string,
  payload: UpdateMantenimientoEdilicioOrdenDTO,
) {
  const response = await fetch(`/api/infraestructura/ordenes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse<{ message: string; data: MantenimientoEdilicioOrden }>(response);
}
