import 'server-only';

import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type {
  DragonPyramidLicenseControl,
  DragonPyramidLicenseStatus,
  DragonPyramidLicenseUpdateInput,
} from '@/interfaces/dragonPyramidLicense.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';

const LICENSE_SINGLETON_KEY = 'principal';

const allowedStatuses: DragonPyramidLicenseStatus[] = [
  'active',
  'trial',
  'grace',
  'suspended',
  'cancelled',
];

export function assertMasterAdmin(user?: JwtUser | null) {
  if (user?.rol !== 'masteradmin') {
    throw new Error('No tenés permisos para administrar la licencia Dragon Pyramid');
  }
}

function emptyToNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeTimestamp(value: unknown): string | null | undefined {
  const clean = emptyToNull(value);
  if (clean === undefined || clean === null) return clean;
  const date = new Date(clean);
  if (Number.isNaN(date.getTime())) {
    throw new Error('La fecha informada no es válida');
  }
  return date.toISOString();
}

function normalizeStatus(value: unknown): DragonPyramidLicenseStatus | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const status = String(value).trim().toLowerCase() as DragonPyramidLicenseStatus;
  if (!allowedStatuses.includes(status)) {
    throw new Error('El estado de licencia no es válido');
  }
  return status;
}

function buildUpdatePayload(input: DragonPyramidLicenseUpdateInput) {
  const status = normalizeStatus(input.license_status);
  const payload: Record<string, unknown> = {
    last_checked_at: new Date().toISOString(),
  };

  if (input.client_code !== undefined) payload.client_code = emptyToNull(input.client_code) ?? 'gym_master_client';
  if (input.client_name !== undefined) payload.client_name = emptyToNull(input.client_name) ?? 'Gym Master Cliente';
  if (status !== undefined) payload.license_status = status;
  if (input.activated_at !== undefined) payload.activated_at = normalizeTimestamp(input.activated_at);
  if (input.expires_at !== undefined) payload.expires_at = normalizeTimestamp(input.expires_at);
  if (input.grace_until !== undefined) payload.grace_until = normalizeTimestamp(input.grace_until);
  if (input.suspended_at !== undefined) payload.suspended_at = normalizeTimestamp(input.suspended_at);
  if (input.reactivated_at !== undefined) payload.reactivated_at = normalizeTimestamp(input.reactivated_at);
  if (input.suspension_reason !== undefined) payload.suspension_reason = emptyToNull(input.suspension_reason);
  if (input.sync_source !== undefined) payload.sync_source = emptyToNull(input.sync_source) ?? 'manual_masteradmin';
  if (input.metadata !== undefined) payload.metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : {};

  if (status === 'suspended' && input.suspended_at === undefined) {
    payload.suspended_at = new Date().toISOString();
  }

  if ((status === 'active' || status === 'trial') && input.reactivated_at === undefined) {
    payload.reactivated_at = new Date().toISOString();
  }

  return payload;
}

export async function getDragonPyramidLicense(): Promise<DragonPyramidLicenseControl | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('dragon_pyramid_license_control')
    .select('*')
    .eq('singleton_key', LICENSE_SINGLETON_KEY)
    .maybeSingle();

  if (error) {
    console.error('Error al obtener licencia Dragon Pyramid:', error.message);
    throw new Error('Error al obtener licencia Dragon Pyramid');
  }

  return (data as DragonPyramidLicenseControl | null) ?? null;
}

export async function upsertDragonPyramidLicense(
  input: DragonPyramidLicenseUpdateInput,
): Promise<DragonPyramidLicenseControl> {
  const supabase = getSupabaseServerClient();
  const payload = {
    singleton_key: LICENSE_SINGLETON_KEY,
    product_code: 'gym_master',
    ...buildUpdatePayload(input),
  };

  const { data, error } = await supabase
    .from('dragon_pyramid_license_control')
    .upsert(payload, { onConflict: 'singleton_key' })
    .select('*')
    .single();

  if (error) {
    console.error('Error al actualizar licencia Dragon Pyramid:', error.message);
    throw new Error('Error al actualizar licencia Dragon Pyramid');
  }

  return data as DragonPyramidLicenseControl;
}
