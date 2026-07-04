import type {
  DragonPyramidClientPaymentStatus,
  DragonPyramidLicenseControl,
  DragonPyramidLicenseStatus,
} from '@/interfaces/dragonPyramidLicense.interface';

export type DragonPyramidGraceWarningSeverity = 'info' | 'warning' | 'critical';

export type DragonPyramidGraceWarning = {
  visible: boolean;
  severity: DragonPyramidGraceWarningSeverity;
  title: string;
  message: string;
  details: string[];
  licenseStatus: DragonPyramidLicenseStatus | null;
  paymentStatus: DragonPyramidClientPaymentStatus | null;
  daysUntilLicenseExpiration: number | null;
  daysUntilPaymentDue: number | null;
  daysUntilGraceEnd: number | null;
  clientName: string | null;
  nextDueAt: string | null;
  graceUntil: string | null;
};

const NEAR_DUE_DAYS = 7;

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

function daysUntil(value?: string | null) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.ceil((targetDay - startOfToday) / (1000 * 60 * 60 * 24));
}

function formatRelative(days: number | null, futureLabel: string, todayLabel: string, pastLabel: string) {
  if (days === null) return null;
  if (days < 0) return `${pastLabel} hace ${Math.abs(days)} día(s)`;
  if (days === 0) return todayLabel;
  return `${futureLabel} en ${days} día(s)`;
}

function maxSeverity(
  current: DragonPyramidGraceWarningSeverity,
  next: DragonPyramidGraceWarningSeverity,
): DragonPyramidGraceWarningSeverity {
  const rank: Record<DragonPyramidGraceWarningSeverity, number> = {
    info: 1,
    warning: 2,
    critical: 3,
  };
  return rank[next] > rank[current] ? next : current;
}

export function buildDragonPyramidGraceWarning(
  license?: DragonPyramidLicenseControl | null,
): DragonPyramidGraceWarning {
  const licenseStatus = license?.license_status ?? null;
  const paymentStatus = license?.payment_status ?? null;
  const daysUntilLicenseExpiration = daysUntil(license?.expires_at);
  const daysUntilPaymentDue = daysUntil(license?.next_due_at);
  const daysUntilGraceEnd = daysUntil(license?.grace_until);
  const details: string[] = [];
  let severity: DragonPyramidGraceWarningSeverity = 'info';

  if (!license) {
    return {
      visible: false,
      severity: 'info',
      title: 'Sin estado de licencia configurado',
      message: 'Todavía no hay datos comerciales sincronizados para esta instancia.',
      details: [],
      licenseStatus,
      paymentStatus,
      daysUntilLicenseExpiration,
      daysUntilPaymentDue,
      daysUntilGraceEnd,
      clientName: null,
      nextDueAt: null,
      graceUntil: null,
    };
  }

  if (paymentStatus === 'pending') {
    severity = maxSeverity(severity, 'warning');
    details.push('El pago del cliente figura como pendiente de confirmación.');
  }

  if (paymentStatus === 'overdue') {
    severity = maxSeverity(severity, 'critical');
    details.push('El pago del cliente figura como vencido.');
  }

  if (paymentStatus === 'grace') {
    severity = maxSeverity(severity, 'warning');
    details.push('El cliente está dentro del período de gracia comercial.');
  }

  if (paymentStatus === 'suspended_candidate') {
    severity = maxSeverity(severity, 'critical');
    details.push('El cliente está marcado como candidato a suspensión futura.');
  }

  if (licenseStatus === 'grace') {
    severity = maxSeverity(severity, 'warning');
    details.push('La licencia está marcada en período de gracia.');
  }

  if (licenseStatus === 'suspended') {
    severity = maxSeverity(severity, 'critical');
    details.push('La licencia está marcada como suspendida. En esta etapa solo se informa; el bloqueo real queda para la siguiente feature.');
  }

  if (licenseStatus === 'cancelled') {
    severity = maxSeverity(severity, 'critical');
    details.push('La licencia está marcada como cancelada.');
  }

  if (daysUntilPaymentDue !== null) {
    if (daysUntilPaymentDue < 0) {
      severity = maxSeverity(severity, 'critical');
      details.push(formatRelative(daysUntilPaymentDue, 'El pago vence', 'El pago vence hoy', 'El pago venció') as string);
    } else if (daysUntilPaymentDue <= NEAR_DUE_DAYS) {
      severity = maxSeverity(severity, 'warning');
      details.push(formatRelative(daysUntilPaymentDue, 'El pago vence', 'El pago vence hoy', 'El pago venció') as string);
    }
  }

  if (daysUntilLicenseExpiration !== null) {
    if (daysUntilLicenseExpiration < 0) {
      severity = maxSeverity(severity, 'critical');
      details.push(formatRelative(daysUntilLicenseExpiration, 'La licencia vence', 'La licencia vence hoy', 'La licencia venció') as string);
    } else if (daysUntilLicenseExpiration <= NEAR_DUE_DAYS) {
      severity = maxSeverity(severity, 'warning');
      details.push(formatRelative(daysUntilLicenseExpiration, 'La licencia vence', 'La licencia vence hoy', 'La licencia venció') as string);
    }
  }

  if (daysUntilGraceEnd !== null && (paymentStatus === 'grace' || licenseStatus === 'grace')) {
    if (daysUntilGraceEnd < 0) {
      severity = maxSeverity(severity, 'critical');
      details.push(formatRelative(daysUntilGraceEnd, 'El período de gracia termina', 'El período de gracia termina hoy', 'El período de gracia terminó') as string);
    } else {
      severity = maxSeverity(severity, daysUntilGraceEnd <= NEAR_DUE_DAYS ? 'critical' : 'warning');
      details.push(formatRelative(daysUntilGraceEnd, 'El período de gracia termina', 'El período de gracia termina hoy', 'El período de gracia terminó') as string);
    }
  }

  const visible = details.length > 0;
  const title = severity === 'critical'
    ? 'Atención: licencia o pago en estado crítico'
    : severity === 'warning'
    ? 'Aviso de licencia y pago Dragon Pyramid'
    : 'Estado comercial informativo';

  const message = visible
    ? 'El sistema seguirá operando normalmente en esta etapa, pero este aviso anticipa una posible suspensión futura si no se regulariza la situación comercial.'
    : 'La licencia y el estado comercial no requieren advertencias en este momento.';

  if (licenseStatus || paymentStatus) {
    details.unshift(
      `Estado actual: licencia ${licenseStatus ? licenseStatusLabel[licenseStatus] : 'sin dato'} · pago ${paymentStatus ? paymentStatusLabel[paymentStatus] : 'sin dato'}.`,
    );
  }

  return {
    visible,
    severity,
    title,
    message,
    details,
    licenseStatus,
    paymentStatus,
    daysUntilLicenseExpiration,
    daysUntilPaymentDue,
    daysUntilGraceEnd,
    clientName: license.client_name ?? null,
    nextDueAt: license.next_due_at ?? null,
    graceUntil: license.grace_until ?? null,
  };
}
