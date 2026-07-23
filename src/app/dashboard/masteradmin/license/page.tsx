'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  Ban,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileClock,
  DollarSign,
  KeyRound,
  LockKeyhole,
  Power,
  LogOut,
  RefreshCcw,
  Save,
  ShieldCheck,
  TimerReset,
  UnlockKeyhole,
} from 'lucide-react';
import { AppFooter } from '@/components/footer/AppFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import {
  getDragonPyramidLicenseControl,
  reactivateDragonPyramidLicenseControl,
  updateDragonPyramidLicenseControl,
} from '@/services/apiClient';
import type {
  DragonPyramidClientPaymentStatus,
  DragonPyramidLicenseControl,
  DragonPyramidLicenseStatus,
} from '@/interfaces/dragonPyramidLicense.interface';
import { buildDragonPyramidGraceWarning } from '@/utils/dragonPyramidLicenseWarning';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';
import {
  getLicenseStatusLabel,
  getLicenseStatusOptions,
  getPaymentStatusLabel,
  getPaymentStatusOptions,
  masterAdminLicenseText,
  type MasterAdminLicenseMessageKey,
} from '@/i18n/masterAdminLicenseLabels';

const statusTone: Record<DragonPyramidLicenseStatus, string> = {
  active: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100',
  trial: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-950/40 dark:text-sky-100',
  grace: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100',
  suspended: 'border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-100',
  cancelled: 'border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
};

const paymentStatusTone: Record<DragonPyramidClientPaymentStatus, string> = {
  paid: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100',
  pending: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-950/40 dark:text-sky-100',
  overdue: 'border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-100',
  grace: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100',
  suspended_candidate: 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-100',
  unknown: 'border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
};

function toDateTimeInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDateTime(locale: GymMasterLocale, value?: string | null) {
  if (!value) return masterAdminLicenseText(locale, 'undefined');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return masterAdminLicenseText(locale, 'undefined');
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatCurrency(
  locale: GymMasterLocale,
  amount?: number | null,
  currency?: string | null,
) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return masterAdminLicenseText(locale, 'undefined');
  }
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency: currency || 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function getDaysUntil(value?: string | null) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function isOperationalBlocked(status: DragonPyramidLicenseStatus) {
  return status === 'suspended' || status === 'cancelled';
}

type QuickActionId = 'mark_paid' | 'set_trial' | 'set_grace' | 'mark_overdue' | 'suspend_service' | 'cancel_service';

function buildInitialForm(locale: GymMasterLocale, license?: DragonPyramidLicenseControl | null) {
  return {
    client_code: license?.client_code ?? 'gym_master_client',
    client_name: license?.client_name ?? masterAdminLicenseText(locale, 'defaultClientName'),
    license_status: license?.license_status ?? 'active',
    payment_status: license?.payment_status ?? 'unknown',
    billing_plan: license?.billing_plan ?? '',
    expected_amount: license?.expected_amount !== null && license?.expected_amount !== undefined ? String(license.expected_amount) : '',
    currency: license?.currency ?? 'ARS',
    last_payment_at: toDateTimeInput(license?.last_payment_at),
    next_due_at: toDateTimeInput(license?.next_due_at),
    payment_notes: license?.payment_notes ?? '',
    expires_at: toDateTimeInput(license?.expires_at),
    grace_until: toDateTimeInput(license?.grace_until),
    suspension_reason: license?.suspension_reason ?? '',
  };
}

export default function MasterAdminLicensePage() {
  const router = useRouter();
  const { locale } = useI18n();
  const m = useCallback(
    (key: MasterAdminLicenseMessageKey, params?: Record<string, string | number>) =>
      masterAdminLicenseText(locale, key, params),
    [locale],
  );
  const statusOptions = useMemo(() => getLicenseStatusOptions(locale), [locale]);
  const paymentStatusOptions = useMemo(() => getPaymentStatusOptions(locale), [locale]);
  const { user, logout, initializeAuth, isInitialized, isAuthenticated } = useAuthStore();
  const [license, setLicense] = useState<DragonPyramidLicenseControl | null>(null);
  const [form, setForm] = useState(() => buildInitialForm(locale, null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [quickActionLoading, setQuickActionLoading] = useState<QuickActionId | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const loadLicense = async () => {
    setLoading(true);
    try {
      const response = await getDragonPyramidLicenseControl();
      if (!response.ok) throw new Error(m('loadLicenseError'));
      const data = response.data as DragonPyramidLicenseControl | null;
      setLicense(data);
      setForm(buildInitialForm(locale, data));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : m('loadLicenseError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace('/auth/login/masteradmin');
      return;
    }
    if (user?.rol !== 'masteradmin') return;
    void loadLicense();
  }, [isAuthenticated, isInitialized, user?.rol]);

  const currentStatus = (form.license_status || license?.license_status || 'active') as DragonPyramidLicenseStatus;
  const currentPaymentStatus = (form.payment_status || license?.payment_status || 'unknown') as DragonPyramidClientPaymentStatus;
  const operationalBlocked = isOperationalBlocked(currentStatus);
  const daysUntilPayment = getDaysUntil(license?.next_due_at);

  const paymentHealthLabel = useMemo(() => {
    if (daysUntilPayment === null) return m('noNextDue');
    if (daysUntilPayment < 0) return m('overdueDays', { days: Math.abs(daysUntilPayment) });
    if (daysUntilPayment === 0) return m('dueToday');
    return m('dueInDays', { days: daysUntilPayment });
  }, [daysUntilPayment, m]);

  const graceWarning = useMemo(
    () => buildDragonPyramidGraceWarning(license, locale),
    [license, locale],
  );

  const canShowReactivationAction =
    currentStatus === 'suspended' ||
    currentStatus === 'cancelled' ||
    currentPaymentStatus === 'overdue' ||
    currentPaymentStatus === 'grace' ||
    currentPaymentStatus === 'suspended_candidate';

  const summaryCards = useMemo(
    () => [
      { label: m('product'), value: 'Gym Master', icon: Activity },
      { label: m('client'), value: form.client_name || m('undefined'), icon: ShieldCheck },
      { label: m('license'), value: getLicenseStatusLabel(locale, currentStatus), icon: KeyRound },
      {
        label: m('operationalStatus'),
        value: operationalBlocked ? m('blocked') : m('enabled'),
        icon: operationalBlocked ? Ban : Power,
      },
      { label: m('clientPayment'), value: getPaymentStatusLabel(locale, currentPaymentStatus), icon: CreditCard },
      { label: m('nextDue'), value: formatDateTime(locale, license?.next_due_at), icon: CalendarClock },
      {
        label: m('expectedAmount'),
        value: formatCurrency(locale, license?.expected_amount, license?.currency),
        icon: DollarSign,
      },
    ],
    [
      currentPaymentStatus,
      currentStatus,
      form.client_name,
      license?.currency,
      license?.expected_amount,
      license?.next_due_at,
      locale,
      m,
      operationalBlocked,
    ],
  );

  const handleLogout = () => {
    logout();
    router.push('/auth/login/masteradmin');
  };

  const handleQuickAction = async (action: QuickActionId) => {
    const requiresConfirmation = action === 'suspend_service' || action === 'cancel_service';
    if (requiresConfirmation) {
      const confirmed = window.confirm(
        action === 'suspend_service'
          ? m('confirmSuspend')
          : m('confirmCancel'),
      );
      if (!confirmed) return;
    }

    setQuickActionLoading(action);
    try {
      const now = new Date().toISOString();
      const basePayload = {
        client_code: form.client_code,
        client_name: form.client_name,
        billing_plan: form.billing_plan,
        expected_amount: form.expected_amount ? Number(form.expected_amount) : null,
        currency: form.currency || 'ARS',
      };

      const payloadByAction: Record<QuickActionId, Record<string, unknown>> = {
        mark_paid: {
          ...basePayload,
          license_status: 'active',
          payment_status: 'paid',
          last_payment_at: now,
          next_due_at: form.next_due_at ? new Date(form.next_due_at).toISOString() : addDaysIso(30),
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : addDaysIso(30),
          grace_until: null,
          suspension_reason: null,
        },
        set_trial: {
          ...basePayload,
          license_status: 'trial',
          payment_status: 'pending',
          next_due_at: addDaysIso(14),
          expires_at: addDaysIso(14),
          grace_until: null,
          suspension_reason: m('trialReason'),
        },
        set_grace: {
          ...basePayload,
          license_status: 'grace',
          payment_status: 'grace',
          next_due_at: now,
          expires_at: now,
          grace_until: addDaysIso(7),
          suspension_reason: m('graceReason'),
        },
        mark_overdue: {
          ...basePayload,
          license_status: 'active',
          payment_status: 'overdue',
          next_due_at: form.next_due_at ? new Date(form.next_due_at).toISOString() : addDaysIso(-1),
          suspension_reason: m('overdueReason'),
        },
        suspend_service: {
          ...basePayload,
          license_status: 'suspended',
          payment_status: 'suspended_candidate',
          suspended_at: now,
          suspension_reason: m('suspensionReason'),
        },
        cancel_service: {
          ...basePayload,
          license_status: 'cancelled',
          payment_status: 'suspended_candidate',
          suspended_at: now,
          suspension_reason: m('cancellationReason'),
        },
      };

      const response = await updateDragonPyramidLicenseControl({
        ...payloadByAction[action],
        sync_source: `manual_masteradmin_quick_${action}`,
        metadata: {
          quick_action: action,
          source: 'license-admin-panel-v1',
          applied_at: now,
        },
      });

      if (!response.ok) throw new Error(m('quickActionError'));
      const data = response.data as DragonPyramidLicenseControl;
      setLicense(data);
      setForm(buildInitialForm(locale, data));
      toast.success(m('quickActionSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : m('quickActionError'));
    } finally {
      setQuickActionLoading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        client_code: form.client_code,
        client_name: form.client_name,
        license_status: form.license_status,
        payment_status: form.payment_status,
        billing_plan: form.billing_plan,
        expected_amount: form.expected_amount ? Number(form.expected_amount) : null,
        currency: form.currency,
        last_payment_at: form.last_payment_at ? new Date(form.last_payment_at).toISOString() : null,
        next_due_at: form.next_due_at ? new Date(form.next_due_at).toISOString() : null,
        payment_notes: form.payment_notes,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        grace_until: form.grace_until ? new Date(form.grace_until).toISOString() : null,
        suspension_reason: form.suspension_reason,
      };

      const response = await updateDragonPyramidLicenseControl(payload);
      if (!response.ok) throw new Error(m('saveLicenseError'));
      const data = response.data as DragonPyramidLicenseControl;
      setLicense(data);
      setForm(buildInitialForm(locale, data));
      toast.success(m('saveLicenseSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : m('saveLicenseError'));
    } finally {
      setSaving(false);
    }
  };


  const handleReactivateAfterPayment = async () => {
    setReactivating(true);
    try {
      const response = await reactivateDragonPyramidLicenseControl({
        client_code: form.client_code,
        client_name: form.client_name,
        billing_plan: form.billing_plan,
        expected_amount: form.expected_amount ? Number(form.expected_amount) : null,
        currency: form.currency,
        last_payment_at: form.last_payment_at ? new Date(form.last_payment_at).toISOString() : new Date().toISOString(),
        next_due_at: form.next_due_at ? new Date(form.next_due_at).toISOString() : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        payment_notes: form.payment_notes || m('regularizedPaymentNote'),
        reason: form.suspension_reason || m('manualReactivationReason'),
      });

      if (!response.ok) throw new Error(m('reactivateError'));
      const data = response.data as DragonPyramidLicenseControl;
      setLicense(data);
      setForm(buildInitialForm(locale, data));
      toast.success(m('reactivateSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : m('reactivateError'));
    } finally {
      setReactivating(false);
    }
  };

  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  if (user?.rol !== 'masteradmin') {
    return (
      <main className='flex min-h-[100dvh] items-center justify-center bg-background px-4'>
        <Card className='max-w-xl border-red-300 bg-red-50/90 text-red-950 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-100'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5' />
              {m('accessRequired')}
            </CardTitle>
            <CardDescription className='text-red-900/80 dark:text-red-100/80'>
              {m('accessReserved')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout}>{m('goMasterLogin')}</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className='grid h-[100dvh] max-h-[100dvh] max-w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-slate-950 text-white'>
      <header className='w-full max-w-full shrink-0 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur sm:px-6'>
        <div className='mx-auto flex w-full max-w-7xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0 w-full sm:w-auto'>
            <div className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300'>
              Dragon Pyramid · Master Admin
            </div>
            <h1 className='text-xl font-black leading-tight sm:text-2xl'>{m('controlTitle')}</h1>
          </div>
          <div className='flex w-full items-center gap-2 sm:w-auto'>
            <LanguageSwitcher compact />
            <Button className='flex-1 justify-center sm:w-auto' variant='secondary' onClick={handleLogout}>
              <LogOut className='mr-2 h-4 w-4' />
              {m('logout')}
            </Button>
          </div>
        </div>
      </header>

      <section className='min-h-0 w-full max-w-full overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 lg:px-8'>
        <div className='mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-8'>
          <div className='w-full min-w-0 overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-950 shadow-2xl shadow-cyan-950/30'>
            <div className='p-5 sm:p-7'>
              <div className='flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
                <div className='min-w-0 max-w-3xl'>
                  <div className='inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100'>
                    <LockKeyhole className='h-3.5 w-3.5' />
                    {m('reservedGate')}
                  </div>
                  <h2 className='mt-4 text-2xl font-black sm:text-3xl'>{m('panelTitle')}</h2>
                  <p className='mt-2 text-sm leading-6 text-cyan-50/90 sm:text-base'>
                    {m('panelDescription')}
                  </p>
                </div>
                <div className='flex w-full flex-col gap-2 sm:w-auto'>
                  <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold sm:text-left ${statusTone[currentStatus]}`}>
                    {m('licensePrefix')}: {getLicenseStatusLabel(locale, currentStatus)}
                  </div>
                  <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold sm:text-left ${paymentStatusTone[currentPaymentStatus]}`}>
                    {m('paymentPrefix')}: {getPaymentStatusLabel(locale, currentPaymentStatus)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {graceWarning.visible && (
            <Card
              className={`min-w-0 border shadow-xl ${
                graceWarning.severity === 'critical'
                  ? 'border-red-400/40 bg-red-950/30 text-red-50'
                  : 'border-amber-400/40 bg-amber-950/30 text-amber-50'
              }`}
            >
              <CardContent className='flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between'>
                <div className='flex min-w-0 gap-3'>
                  <AlertTriangle className='mt-1 h-5 w-5 shrink-0' />
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold uppercase tracking-[0.22em] opacity-80'>
                      {m('preSuspensionWarning')}
                    </p>
                    <h3 className='mt-1 text-lg font-black'>{graceWarning.title}</h3>
                    <p className='mt-1 text-sm leading-6'>{graceWarning.message}</p>
                    <ul className='mt-3 list-disc space-y-1 pl-4 text-sm leading-6'>
                      {graceWarning.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                    <p className='mt-3 text-xs opacity-80'>
                      {m('warningDecisionNote')}
                    </p>
                  </div>
                </div>
                <div className='rounded-2xl border border-current/20 px-4 py-3 text-sm font-bold'>
                  {graceWarning.clientName ?? form.client_name ?? m('defaultClientName')}
                </div>
              </CardContent>
            </Card>
          )}

          {canShowReactivationAction && (
            <Card className='min-w-0 border-emerald-400/40 bg-emerald-950/25 text-emerald-50 shadow-xl'>
              <CardContent className='flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between'>
                <div className='flex min-w-0 gap-3'>
                  <UnlockKeyhole className='mt-1 h-5 w-5 shrink-0 text-emerald-200' />
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/90'>
                      {m('reactivationEyebrow')}
                    </p>
                    <h3 className='mt-1 text-lg font-black'>{m('reactivationTitle')}</h3>
                    <p className='mt-1 text-sm leading-6 text-emerald-50/85'>
                      {m('reactivationDescription')}
                    </p>
                  </div>
                </div>
                <Button
                  className='w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 lg:w-auto'
                  onClick={handleReactivateAfterPayment}
                  disabled={loading || saving || reactivating}
                >
                  <UnlockKeyhole className='mr-2 h-4 w-4' />
                  {reactivating ? m('reactivating') : m('reactivateService')}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className='grid w-full min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6'>
            {summaryCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className='min-w-0 border-white/10 bg-white text-slate-950 shadow-xl dark:bg-slate-900 dark:text-slate-50'>
                  <CardContent className='flex items-start gap-3 p-4'>
                    <div className='rounded-2xl bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200'>
                      <Icon className='h-5 w-5' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{item.label}</p>
                      <p className='mt-1 truncate text-base font-black'>{item.value}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className='min-w-0 border-cyan-300/30 bg-white text-slate-950 shadow-xl dark:bg-slate-900 dark:text-slate-50'>
            <CardHeader>
              <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <ShieldCheck className='h-5 w-5 text-cyan-500' />
                    {m('operationalPanelTitle')}
                  </CardTitle>
                  <CardDescription>
                    {m('operationalPanelDescription')}
                  </CardDescription>
                </div>
                <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${operationalBlocked ? statusTone.suspended : statusTone.active}`}>
                  {operationalBlocked ? m('serviceBlocked') : m('serviceOperational')}
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-5'>
              <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                {[
                  {
                    id: 'mark_paid' as QuickActionId,
                    title: m('actionMarkPaidTitle'),
                    description: m('actionMarkPaidDescription'),
                    icon: CheckCircle2,
                    button: m('actionMarkPaidButton'),
                    tone: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-100',
                  },
                  {
                    id: 'set_trial' as QuickActionId,
                    title: m('actionTrialTitle'),
                    description: m('actionTrialDescription'),
                    icon: TimerReset,
                    button: m('actionTrialButton'),
                    tone: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/40 dark:bg-sky-950/30 dark:text-sky-100',
                  },
                  {
                    id: 'set_grace' as QuickActionId,
                    title: m('actionGraceTitle'),
                    description: m('actionGraceDescription'),
                    icon: BellRing,
                    button: m('actionGraceButton'),
                    tone: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100',
                  },
                  {
                    id: 'mark_overdue' as QuickActionId,
                    title: m('actionOverdueTitle'),
                    description: m('actionOverdueDescription'),
                    icon: FileClock,
                    button: m('actionOverdueButton'),
                    tone: 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-500/40 dark:bg-orange-950/30 dark:text-orange-100',
                  },
                  {
                    id: 'suspend_service' as QuickActionId,
                    title: m('actionSuspendTitle'),
                    description: m('actionSuspendDescription'),
                    icon: LockKeyhole,
                    button: m('actionSuspendButton'),
                    tone: 'border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-100',
                  },
                  {
                    id: 'cancel_service' as QuickActionId,
                    title: m('actionCancelTitle'),
                    description: m('actionCancelDescription'),
                    icon: Ban,
                    button: m('actionCancelButton'),
                    tone: 'border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100',
                  },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <div key={action.id} className={`flex min-w-0 flex-col gap-4 rounded-2xl border p-4 ${action.tone}`}>
                      <div className='flex items-start gap-3'>
                        <div className='rounded-2xl bg-white/60 p-2 dark:bg-black/20'>
                          <Icon className='h-5 w-5' />
                        </div>
                        <div className='min-w-0'>
                          <h3 className='font-black'>{action.title}</h3>
                          <p className='mt-1 text-sm leading-5 opacity-85'>{action.description}</p>
                        </div>
                      </div>
                      <Button
                        className='mt-auto w-full'
                        variant={action.id === 'suspend_service' || action.id === 'cancel_service' ? 'destructive' : 'secondary'}
                        disabled={loading || saving || reactivating || quickActionLoading !== null}
                        onClick={() => handleQuickAction(action.id)}
                      >
                        {quickActionLoading === action.id ? m('applying') : action.button}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className='grid gap-3 lg:grid-cols-3'>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{m('lastValidation')}</p>
                  <p className='mt-1 font-black'>{formatDateTime(locale, license?.last_checked_at)}</p>
                </div>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{m('lastReactivation')}</p>
                  <p className='mt-1 font-black'>{formatDateTime(locale, license?.reactivated_at)}</p>
                </div>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{m('lastSuspension')}</p>
                  <p className='mt-1 font-black'>{formatDateTime(locale, license?.suspended_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='grid w-full min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
            <Card className='min-w-0 border-white/10 bg-white text-slate-950 shadow-xl dark:bg-slate-900 dark:text-slate-50'>
              <CardHeader>
                <CardTitle>{m('localStatusTitle')}</CardTitle>
                <CardDescription>
                  {m('localStatusDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {loading ? (
                  <div className='rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground'>{m('loadingLicense')}</div>
                ) : null}

                <section className='space-y-4'>
                  <div>
                    <h3 className='text-sm font-black uppercase tracking-wide text-muted-foreground'>{m('identityTitle')}</h3>
                    <p className='text-xs text-muted-foreground'>{m('identityDescription')}</p>
                  </div>
                  <div className='grid min-w-0 gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='client_code'>{m('clientCode')}</Label>
                      <Input
                        id='client_code'
                        value={form.client_code}
                        onChange={(event) => setForm((prev) => ({ ...prev, client_code: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='client_name'>{m('clientName')}</Label>
                      <Input
                        id='client_name'
                        value={form.client_name}
                        onChange={(event) => setForm((prev) => ({ ...prev, client_name: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='license_status'>{m('licenseStatus')}</Label>
                      <select
                        id='license_status'
                        value={form.license_status}
                        onChange={(event) => setForm((prev) => ({ ...prev, license_status: event.target.value as DragonPyramidLicenseStatus }))}
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <p className='text-xs text-muted-foreground'>
                        {statusOptions.find((option) => option.value === form.license_status)?.helper}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='expires_at'>{m('licenseExpiry')}</Label>
                      <Input
                        id='expires_at'
                        type='datetime-local'
                        value={form.expires_at}
                        onChange={(event) => setForm((prev) => ({ ...prev, expires_at: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='grace_until'>{m('graceUntil')}</Label>
                      <Input
                        id='grace_until'
                        type='datetime-local'
                        value={form.grace_until}
                        onChange={(event) => setForm((prev) => ({ ...prev, grace_until: event.target.value }))}
                      />
                    </div>
                  </div>
                </section>

                <section className='space-y-4 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 dark:border-cyan-900/60 dark:bg-cyan-950/20'>
                  <div>
                    <h3 className='text-sm font-black uppercase tracking-wide text-cyan-900 dark:text-cyan-100'>{m('paymentSaasTitle')}</h3>
                    <p className='text-xs text-cyan-900/75 dark:text-cyan-100/75'>{m('paymentSaasDescription')}</p>
                  </div>
                  <div className='grid min-w-0 gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='payment_status'>{m('paymentStatus')}</Label>
                      <select
                        id='payment_status'
                        value={form.payment_status}
                        onChange={(event) => setForm((prev) => ({ ...prev, payment_status: event.target.value as DragonPyramidClientPaymentStatus }))}
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      >
                        {paymentStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <p className='text-xs text-muted-foreground'>
                        {paymentStatusOptions.find((option) => option.value === form.payment_status)?.helper}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='billing_plan'>{m('commercialPlan')}</Label>
                      <Input
                        id='billing_plan'
                        value={form.billing_plan}
                        placeholder={m('commercialPlanPlaceholder')}
                        onChange={(event) => setForm((prev) => ({ ...prev, billing_plan: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='expected_amount'>{m('expectedAmount')}</Label>
                      <Input
                        id='expected_amount'
                        type='number'
                        min='0'
                        step='1'
                        value={form.expected_amount}
                        placeholder={m('amountPlaceholder')}
                        onChange={(event) => setForm((prev) => ({ ...prev, expected_amount: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='currency'>{m('currency')}</Label>
                      <Input
                        id='currency'
                        value={form.currency}
                        maxLength={8}
                        onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='last_payment_at'>{m('lastPayment')}</Label>
                      <Input
                        id='last_payment_at'
                        type='datetime-local'
                        value={form.last_payment_at}
                        onChange={(event) => setForm((prev) => ({ ...prev, last_payment_at: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='next_due_at'>{m('nextDue')}</Label>
                      <Input
                        id='next_due_at'
                        type='datetime-local'
                        value={form.next_due_at}
                        onChange={(event) => setForm((prev) => ({ ...prev, next_due_at: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2 sm:col-span-2'>
                      <Label htmlFor='payment_notes'>{m('commercialNotes')}</Label>
                      <textarea
                        id='payment_notes'
                        rows={3}
                        value={form.payment_notes}
                        placeholder={m('commercialNotesPlaceholder')}
                        onChange={(event) => setForm((prev) => ({ ...prev, payment_notes: event.target.value }))}
                        className='min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      />
                    </div>
                  </div>
                </section>

                <section className='space-y-2'>
                  <Label htmlFor='suspension_reason'>{m('licenseReason')}</Label>
                  <textarea
                    id='suspension_reason'
                    rows={4}
                    value={form.suspension_reason}
                    placeholder={m('licenseReasonPlaceholder')}
                    onChange={(event) => setForm((prev) => ({ ...prev, suspension_reason: event.target.value }))}
                    className='min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  />
                </section>

                <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
                  <Button className='w-full sm:w-auto' variant='outline' onClick={loadLicense} disabled={loading || saving}>
                    <RefreshCcw className='mr-2 h-4 w-4' />
                    {m('reload')}
                  </Button>
                  <Button className='w-full sm:w-auto' onClick={handleSave} disabled={loading || saving}>
                    <Save className='mr-2 h-4 w-4' />
                    {saving ? m('saving') : m('saveCommercialStatus')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className='min-w-0 border-cyan-300/30 bg-cyan-50 text-cyan-950 shadow-xl dark:bg-cyan-950/30 dark:text-cyan-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CheckCircle2 className='h-5 w-5' />
                  {m('futureConnection')}
                </CardTitle>
                <CardDescription className='text-cyan-900/80 dark:text-cyan-100/80'>
                  {m('futureConnectionDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 text-sm leading-6'>
                <div className={`rounded-2xl border p-4 ${paymentStatusTone[currentPaymentStatus]}`}>
                  <p className='text-xs font-semibold uppercase tracking-wide'>{m('currentPaymentStatus')}</p>
                  <p className='mt-1 text-2xl font-black'>{getPaymentStatusLabel(locale, currentPaymentStatus)}</p>
                  <p className='mt-1 text-sm opacity-85'>{paymentHealthLabel}</p>
                </div>

                <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-1'>
                  <div className='rounded-2xl border border-cyan-300/40 bg-white/70 p-4 dark:bg-slate-950/40'>
                    <p className='text-xs font-semibold uppercase tracking-wide'>{m('lastPayment')}</p>
                    <p className='mt-1 font-black'>{formatDateTime(locale, license?.last_payment_at)}</p>
                  </div>
                  <div className='rounded-2xl border border-cyan-300/40 bg-white/70 p-4 dark:bg-slate-950/40'>
                    <p className='text-xs font-semibold uppercase tracking-wide'>{m('planAmount')}</p>
                    <p className='mt-1 font-black'>{license?.billing_plan || m('noPlan')} · {formatCurrency(locale, license?.expected_amount, license?.currency)}</p>
                  </div>
                </div>

                <div className='min-w-0 rounded-2xl border border-cyan-300/40 bg-white/70 p-4 dark:bg-slate-950/40'>
                  <p className='font-semibold'>{m('syncEndpoint')}</p>
                  <code className='mt-2 block max-w-full overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 text-xs text-cyan-100'>
                    POST /api/internal/dragon-pyramid/license-sync
                  </code>
                </div>
                <p>
                  {m('futurePayload')}
                </p>
                <p className='rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100'>
                  {m('operationalBlockDescription')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className='gm-dashboard-footer shrink-0 bg-slate-950'>
        <AppFooter />
      </div>
    </main>
  );
}
