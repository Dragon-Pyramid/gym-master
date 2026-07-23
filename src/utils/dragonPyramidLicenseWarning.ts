import type {
  DragonPyramidClientPaymentStatus,
  DragonPyramidLicenseControl,
  DragonPyramidLicenseStatus,
} from '@/interfaces/dragonPyramidLicense.interface';
import type { GymMasterLocale } from '@/i18n/config';
import {
  masterAdminLicenseText,
  type MasterAdminLicenseMessageKey,
} from '@/i18n/masterAdminLicenseLabels';

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

function daysUntil(value?: string | null) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.ceil((targetDay - startOfToday) / (1000 * 60 * 60 * 24));
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

function localizedRelativeMessage(
  locale: GymMasterLocale,
  days: number,
  futureKey: MasterAdminLicenseMessageKey,
  todayKey: MasterAdminLicenseMessageKey,
  pastKey: MasterAdminLicenseMessageKey,
) {
  if (days < 0) {
    return masterAdminLicenseText(locale, pastKey, { days: Math.abs(days) });
  }
  if (days === 0) {
    return masterAdminLicenseText(locale, todayKey);
  }
  return masterAdminLicenseText(locale, futureKey, { days });
}

function warningLicenseStatusLabel(
  locale: GymMasterLocale,
  status: DragonPyramidLicenseStatus | null,
) {
  const keys: Record<DragonPyramidLicenseStatus, MasterAdminLicenseMessageKey> = {
    active: 'warningLicenseActive',
    trial: 'warningLicenseTrial',
    grace: 'warningLicenseGraceStatus',
    suspended: 'warningLicenseSuspendedStatus',
    cancelled: 'warningLicenseCancelledStatus',
  };
  return status
    ? masterAdminLicenseText(locale, keys[status])
    : masterAdminLicenseText(locale, 'warningPaymentUnknown');
}

function warningPaymentStatusLabel(
  locale: GymMasterLocale,
  status: DragonPyramidClientPaymentStatus | null,
) {
  const keys: Record<DragonPyramidClientPaymentStatus, MasterAdminLicenseMessageKey> = {
    paid: 'warningPaymentPaid',
    pending: 'warningPaymentPendingStatus',
    overdue: 'warningPaymentOverdueStatus',
    grace: 'warningPaymentGraceStatus',
    suspended_candidate: 'warningPaymentSuspendedCandidateStatus',
    unknown: 'warningPaymentUnknown',
  };
  return status
    ? masterAdminLicenseText(locale, keys[status])
    : masterAdminLicenseText(locale, 'warningPaymentUnknown');
}

export function buildDragonPyramidGraceWarning(
  license?: DragonPyramidLicenseControl | null,
  locale: GymMasterLocale = 'es',
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
      title: masterAdminLicenseText(locale, 'warningNoLicenseTitle'),
      message: masterAdminLicenseText(locale, 'warningNoLicenseMessage'),
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
    details.push(masterAdminLicenseText(locale, 'warningPaymentPending'));
  }

  if (paymentStatus === 'overdue') {
    severity = maxSeverity(severity, 'critical');
    details.push(masterAdminLicenseText(locale, 'warningPaymentOverdue'));
  }

  if (paymentStatus === 'grace') {
    severity = maxSeverity(severity, 'warning');
    details.push(masterAdminLicenseText(locale, 'warningPaymentGrace'));
  }

  if (paymentStatus === 'suspended_candidate') {
    severity = maxSeverity(severity, 'critical');
    details.push(masterAdminLicenseText(locale, 'warningSuspensionCandidate'));
  }

  if (licenseStatus === 'grace') {
    severity = maxSeverity(severity, 'warning');
    details.push(masterAdminLicenseText(locale, 'warningLicenseGrace'));
  }

  if (licenseStatus === 'suspended') {
    severity = maxSeverity(severity, 'critical');
    details.push(masterAdminLicenseText(locale, 'warningLicenseSuspended'));
  }

  if (licenseStatus === 'cancelled') {
    severity = maxSeverity(severity, 'critical');
    details.push(masterAdminLicenseText(locale, 'warningLicenseCancelled'));
  }

  if (daysUntilPaymentDue !== null) {
    if (daysUntilPaymentDue < 0) {
      severity = maxSeverity(severity, 'critical');
      details.push(
        localizedRelativeMessage(
          locale,
          daysUntilPaymentDue,
          'warningPaymentDueFuture',
          'warningPaymentDueToday',
          'warningPaymentDuePast',
        ),
      );
    } else if (daysUntilPaymentDue <= NEAR_DUE_DAYS) {
      severity = maxSeverity(severity, 'warning');
      details.push(
        localizedRelativeMessage(
          locale,
          daysUntilPaymentDue,
          'warningPaymentDueFuture',
          'warningPaymentDueToday',
          'warningPaymentDuePast',
        ),
      );
    }
  }

  if (daysUntilLicenseExpiration !== null) {
    if (daysUntilLicenseExpiration < 0) {
      severity = maxSeverity(severity, 'critical');
      details.push(
        localizedRelativeMessage(
          locale,
          daysUntilLicenseExpiration,
          'warningLicenseDueFuture',
          'warningLicenseDueToday',
          'warningLicenseDuePast',
        ),
      );
    } else if (daysUntilLicenseExpiration <= NEAR_DUE_DAYS) {
      severity = maxSeverity(severity, 'warning');
      details.push(
        localizedRelativeMessage(
          locale,
          daysUntilLicenseExpiration,
          'warningLicenseDueFuture',
          'warningLicenseDueToday',
          'warningLicenseDuePast',
        ),
      );
    }
  }

  if (daysUntilGraceEnd !== null && (paymentStatus === 'grace' || licenseStatus === 'grace')) {
    if (daysUntilGraceEnd < 0) {
      severity = maxSeverity(severity, 'critical');
    } else {
      severity = maxSeverity(severity, daysUntilGraceEnd <= NEAR_DUE_DAYS ? 'critical' : 'warning');
    }
    details.push(
      localizedRelativeMessage(
        locale,
        daysUntilGraceEnd,
        'warningGraceDueFuture',
        'warningGraceDueToday',
        'warningGraceDuePast',
      ),
    );
  }

  const visible = details.length > 0;
  const title =
    severity === 'critical'
      ? masterAdminLicenseText(locale, 'warningCriticalTitle')
      : severity === 'warning'
        ? masterAdminLicenseText(locale, 'warningWarningTitle')
        : masterAdminLicenseText(locale, 'warningInfoTitle');

  const message = visible
    ? masterAdminLicenseText(locale, 'warningVisibleMessage')
    : masterAdminLicenseText(locale, 'warningClearMessage');

  if (licenseStatus || paymentStatus) {
    details.unshift(
      masterAdminLicenseText(locale, 'warningCurrentStatus', {
        license: warningLicenseStatusLabel(locale, licenseStatus),
        payment: warningPaymentStatusLabel(locale, paymentStatus),
      }),
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
