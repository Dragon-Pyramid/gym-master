import type {
  DragonPyramidClientPaymentStatus,
  DragonPyramidLicenseControl,
  DragonPyramidLicenseStatus,
} from '@/interfaces/dragonPyramidLicense.interface';

export type DragonPyramidSuspensionReason =
  | 'license_suspended'
  | 'license_cancelled'
  | null;

export type DragonPyramidSuspensionStatus = {
  isSuspended: boolean;
  reason: DragonPyramidSuspensionReason;
  title: string;
  message: string;
  details: string[];
  clientName: string | null;
  licenseStatus: DragonPyramidLicenseStatus | null;
  paymentStatus: DragonPyramidClientPaymentStatus | null;
  suspendedAt: string | null;
  graceUntil: string | null;
  nextDueAt: string | null;
  canUseMasterAdminRecovery: boolean;
};

const licenseStatusLabel: Record<DragonPyramidLicenseStatus, string> = {
  active: 'activa',
  trial: 'trial',
  grace: 'en gracia',
  suspended: 'suspendida',
  cancelled: 'cancelada',
};

const paymentStatusLabel: Record<DragonPyramidClientPaymentStatus, string> = {
  paid: 'al día',
  pending: 'pendiente',
  overdue: 'vencido',
  grace: 'en gracia',
  suspended_candidate: 'candidato a suspensión',
  unknown: 'sin dato',
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function buildDragonPyramidSuspensionStatus(
  license?: DragonPyramidLicenseControl | null,
): DragonPyramidSuspensionStatus {
  const licenseStatus = license?.license_status ?? null;
  const paymentStatus = license?.payment_status ?? null;
  const isSuspended = licenseStatus === 'suspended' || licenseStatus === 'cancelled';
  const reason: DragonPyramidSuspensionReason = licenseStatus === 'suspended'
    ? 'license_suspended'
    : licenseStatus === 'cancelled'
    ? 'license_cancelled'
    : null;

  const details: string[] = [];

  if (licenseStatus || paymentStatus) {
    details.push(
      `Estado actual: licencia ${licenseStatus ? licenseStatusLabel[licenseStatus] : 'sin dato'} · pago ${paymentStatus ? paymentStatusLabel[paymentStatus] : 'sin dato'}.`,
    );
  }

  const suspendedAt = formatDate(license?.suspended_at);
  const graceUntil = formatDate(license?.grace_until);
  const nextDueAt = formatDate(license?.next_due_at);

  if (suspendedAt) details.push(`Suspensión registrada: ${suspendedAt}.`);
  if (graceUntil) details.push(`Período de gracia configurado hasta: ${graceUntil}.`);
  if (nextDueAt) details.push(`Próximo vencimiento comercial: ${nextDueAt}.`);
  if (license?.suspension_reason) details.push(`Motivo: ${license.suspension_reason}.`);

  if (!license) {
    return {
      isSuspended: false,
      reason: null,
      title: 'Licencia no configurada',
      message: 'No existe todavía un estado local de licencia Dragon Pyramid para esta instancia.',
      details: [],
      clientName: null,
      licenseStatus: null,
      paymentStatus: null,
      suspendedAt: null,
      graceUntil: null,
      nextDueAt: null,
      canUseMasterAdminRecovery: true,
    };
  }

  if (!isSuspended) {
    return {
      isSuspended: false,
      reason: null,
      title: 'Servicio operativo',
      message: 'La instancia se encuentra habilitada para operar.',
      details,
      clientName: license.client_name ?? null,
      licenseStatus,
      paymentStatus,
      suspendedAt: license.suspended_at ?? null,
      graceUntil: license.grace_until ?? null,
      nextDueAt: license.next_due_at ?? null,
      canUseMasterAdminRecovery: true,
    };
  }

  return {
    isSuspended: true,
    reason,
    title: reason === 'license_cancelled'
      ? 'Servicio cancelado por Dragon Pyramid'
      : 'Servicio suspendido temporalmente',
    message: reason === 'license_cancelled'
      ? 'Esta instancia de Gym Master fue dada de baja. Para revisar o reactivar el servicio, ingresá con el acceso reservado de Dragon Pyramid.'
      : 'Esta instancia de Gym Master se encuentra suspendida. El acceso operativo queda pausado hasta regularizar o reactivar la licencia desde Dragon Pyramid.',
    details,
    clientName: license.client_name ?? null,
    licenseStatus,
    paymentStatus,
    suspendedAt: license.suspended_at ?? null,
    graceUntil: license.grace_until ?? null,
    nextDueAt: license.next_due_at ?? null,
    canUseMasterAdminRecovery: true,
  };
}
