'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  DollarSign,
  KeyRound,
  LockKeyhole,
  LogOut,
  RefreshCcw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { AppFooter } from '@/components/footer/AppFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import {
  getDragonPyramidLicenseControl,
  updateDragonPyramidLicenseControl,
} from '@/services/apiClient';
import type {
  DragonPyramidClientPaymentStatus,
  DragonPyramidLicenseControl,
  DragonPyramidLicenseStatus,
} from '@/interfaces/dragonPyramidLicense.interface';

const statusOptions: Array<{ value: DragonPyramidLicenseStatus; label: string; helper: string }> = [
  { value: 'active', label: 'Activa', helper: 'Cliente habilitado normalmente.' },
  { value: 'trial', label: 'Trial', helper: 'Cliente en período de prueba.' },
  { value: 'grace', label: 'Gracia', helper: 'Vencido, pero con tolerancia operativa.' },
  { value: 'suspended', label: 'Suspendida', helper: 'Base para bloqueo futuro por falta de pago.' },
  { value: 'cancelled', label: 'Cancelada', helper: 'Cliente dado de baja.' },
];

const paymentStatusOptions: Array<{ value: DragonPyramidClientPaymentStatus; label: string; helper: string }> = [
  { value: 'paid', label: 'Al día', helper: 'El cliente tiene el pago vigente.' },
  { value: 'pending', label: 'Pendiente', helper: 'Pago pendiente de confirmación o emisión.' },
  { value: 'overdue', label: 'Vencido', helper: 'El pago está vencido y requiere seguimiento.' },
  { value: 'grace', label: 'En gracia', helper: 'Cliente vencido dentro del período de gracia operativo.' },
  { value: 'suspended_candidate', label: 'Suspensión sugerida', helper: 'Cliente candidato a suspensión futura por falta de pago.' },
  { value: 'unknown', label: 'Sin dato', helper: 'Todavía no hay estado comercial sincronizado.' },
];

const statusLabel: Record<DragonPyramidLicenseStatus, string> = {
  active: 'Activa',
  trial: 'Trial',
  grace: 'Gracia',
  suspended: 'Suspendida',
  cancelled: 'Cancelada',
};

const paymentStatusLabel: Record<DragonPyramidClientPaymentStatus, string> = {
  paid: 'Al día',
  pending: 'Pendiente',
  overdue: 'Vencido',
  grace: 'En gracia',
  suspended_candidate: 'Suspensión sugerida',
  unknown: 'Sin dato',
};

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

function formatDateTime(value?: string | null) {
  if (!value) return 'Sin definir';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatCurrency(amount?: number | null, currency?: string | null) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return 'Sin definir';
  return new Intl.NumberFormat('es-AR', {
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

function buildInitialForm(license?: DragonPyramidLicenseControl | null) {
  return {
    client_code: license?.client_code ?? 'gym_master_client',
    client_name: license?.client_name ?? 'Gym Master Cliente',
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
  const { user, logout, initializeAuth, isInitialized, isAuthenticated } = useAuthStore();
  const [license, setLicense] = useState<DragonPyramidLicenseControl | null>(null);
  const [form, setForm] = useState(buildInitialForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const loadLicense = async () => {
    setLoading(true);
    try {
      const response = await getDragonPyramidLicenseControl();
      if (!response.ok) throw new Error(response.error || 'No se pudo cargar la licencia');
      const data = response.data as DragonPyramidLicenseControl | null;
      setLicense(data);
      setForm(buildInitialForm(data));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar licencia');
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
  const daysUntilPayment = getDaysUntil(license?.next_due_at);

  const paymentHealthLabel = useMemo(() => {
    if (daysUntilPayment === null) return 'Sin próximo vencimiento';
    if (daysUntilPayment < 0) return `Vencido hace ${Math.abs(daysUntilPayment)} día(s)`;
    if (daysUntilPayment === 0) return 'Vence hoy';
    return `Vence en ${daysUntilPayment} día(s)`;
  }, [daysUntilPayment]);

  const summaryCards = useMemo(
    () => [
      { label: 'Producto', value: 'Gym Master', icon: Activity },
      { label: 'Cliente', value: form.client_name || 'Sin definir', icon: ShieldCheck },
      { label: 'Licencia', value: statusLabel[currentStatus], icon: KeyRound },
      { label: 'Pago cliente', value: paymentStatusLabel[currentPaymentStatus], icon: CreditCard },
      { label: 'Próximo vencimiento', value: formatDateTime(license?.next_due_at), icon: CalendarClock },
      { label: 'Monto esperado', value: formatCurrency(license?.expected_amount, license?.currency), icon: DollarSign },
    ],
    [currentPaymentStatus, currentStatus, form.client_name, license?.currency, license?.expected_amount, license?.next_due_at],
  );

  const handleLogout = () => {
    logout();
    router.push('/auth/login/masteradmin');
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
      if (!response.ok) throw new Error(response.error || 'No se pudo actualizar la licencia');
      const data = response.data as DragonPyramidLicenseControl;
      setLicense(data);
      setForm(buildInitialForm(data));
      toast.success('Estado comercial actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar licencia');
    } finally {
      setSaving(false);
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
              Acceso Master Admin requerido
            </CardTitle>
            <CardDescription className='text-red-900/80 dark:text-red-100/80'>
              Esta sección está reservada para usuarios internos Dragon Pyramid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout}>Ir al login masteradmin</Button>
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
            <h1 className='text-xl font-black leading-tight sm:text-2xl'>Control comercial Gym Master</h1>
          </div>
          <Button className='w-full justify-center sm:w-auto' variant='secondary' onClick={handleLogout}>
            <LogOut className='mr-2 h-4 w-4' />
            Salir
          </Button>
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
                    Puerta reservada /auth/login/masteradmin
                  </div>
                  <h2 className='mt-4 text-2xl font-black sm:text-3xl'>Estado de pago del cliente SaaS</h2>
                  <p className='mt-2 text-sm leading-6 text-cyan-50/90 sm:text-base'>
                    Esta etapa agrega control comercial sobre la licencia local: estado de pago, próximo vencimiento, plan y monto esperado. Todavía no bloquea el servicio; deja la base lista para gracia, suspensión y reactivación futuras.
                  </p>
                </div>
                <div className='flex w-full flex-col gap-2 sm:w-auto'>
                  <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold sm:text-left ${statusTone[currentStatus]}`}>
                    Licencia: {statusLabel[currentStatus]}
                  </div>
                  <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold sm:text-left ${paymentStatusTone[currentPaymentStatus]}`}>
                    Pago: {paymentStatusLabel[currentPaymentStatus]}
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          <div className='grid w-full min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
            <Card className='min-w-0 border-white/10 bg-white text-slate-950 shadow-xl dark:bg-slate-900 dark:text-slate-50'>
              <CardHeader>
                <CardTitle>Estado local de licencia y pago</CardTitle>
                <CardDescription>
                  Base operativa de esta instancia. En el futuro será sincronizada desde Dragon Pyramid Platform.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {loading ? (
                  <div className='rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground'>Cargando licencia...</div>
                ) : null}

                <section className='space-y-4'>
                  <div>
                    <h3 className='text-sm font-black uppercase tracking-wide text-muted-foreground'>Identidad y licencia</h3>
                    <p className='text-xs text-muted-foreground'>Datos base del cliente Gym Master y estado funcional de licencia.</p>
                  </div>
                  <div className='grid min-w-0 gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='client_code'>Código cliente</Label>
                      <Input
                        id='client_code'
                        value={form.client_code}
                        onChange={(event) => setForm((prev) => ({ ...prev, client_code: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='client_name'>Nombre cliente</Label>
                      <Input
                        id='client_name'
                        value={form.client_name}
                        onChange={(event) => setForm((prev) => ({ ...prev, client_name: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='license_status'>Estado licencia</Label>
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
                      <Label htmlFor='expires_at'>Vencimiento licencia</Label>
                      <Input
                        id='expires_at'
                        type='datetime-local'
                        value={form.expires_at}
                        onChange={(event) => setForm((prev) => ({ ...prev, expires_at: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='grace_until'>Período de gracia hasta</Label>
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
                    <h3 className='text-sm font-black uppercase tracking-wide text-cyan-900 dark:text-cyan-100'>Estado de pago SaaS</h3>
                    <p className='text-xs text-cyan-900/75 dark:text-cyan-100/75'>Control comercial previo a las futuras reglas de gracia, suspensión y reactivación.</p>
                  </div>
                  <div className='grid min-w-0 gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='payment_status'>Estado de pago</Label>
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
                      <Label htmlFor='billing_plan'>Plan comercial</Label>
                      <Input
                        id='billing_plan'
                        value={form.billing_plan}
                        placeholder='Ej.: mensual, pro, franquicia, enterprise...'
                        onChange={(event) => setForm((prev) => ({ ...prev, billing_plan: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='expected_amount'>Monto esperado</Label>
                      <Input
                        id='expected_amount'
                        type='number'
                        min='0'
                        step='1'
                        value={form.expected_amount}
                        placeholder='Ej.: 50000'
                        onChange={(event) => setForm((prev) => ({ ...prev, expected_amount: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='currency'>Moneda</Label>
                      <Input
                        id='currency'
                        value={form.currency}
                        maxLength={8}
                        onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='last_payment_at'>Último pago</Label>
                      <Input
                        id='last_payment_at'
                        type='datetime-local'
                        value={form.last_payment_at}
                        onChange={(event) => setForm((prev) => ({ ...prev, last_payment_at: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='next_due_at'>Próximo vencimiento</Label>
                      <Input
                        id='next_due_at'
                        type='datetime-local'
                        value={form.next_due_at}
                        onChange={(event) => setForm((prev) => ({ ...prev, next_due_at: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2 sm:col-span-2'>
                      <Label htmlFor='payment_notes'>Notas comerciales</Label>
                      <textarea
                        id='payment_notes'
                        rows={3}
                        value={form.payment_notes}
                        placeholder='Ej.: pago confirmado por transferencia, pendiente Mercado Pago, convenio especial...'
                        onChange={(event) => setForm((prev) => ({ ...prev, payment_notes: event.target.value }))}
                        className='min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      />
                    </div>
                  </div>
                </section>

                <section className='space-y-2'>
                  <Label htmlFor='suspension_reason'>Motivo / observación de licencia</Label>
                  <textarea
                    id='suspension_reason'
                    rows={4}
                    value={form.suspension_reason}
                    placeholder='Ej.: Fundación inicial, prueba comercial, deuda vencida, reactivación manual...'
                    onChange={(event) => setForm((prev) => ({ ...prev, suspension_reason: event.target.value }))}
                    className='min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  />
                </section>

                <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
                  <Button className='w-full sm:w-auto' variant='outline' onClick={loadLicense} disabled={loading || saving}>
                    <RefreshCcw className='mr-2 h-4 w-4' />
                    Recargar
                  </Button>
                  <Button className='w-full sm:w-auto' onClick={handleSave} disabled={loading || saving}>
                    <Save className='mr-2 h-4 w-4' />
                    {saving ? 'Guardando...' : 'Guardar estado comercial'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className='min-w-0 border-cyan-300/30 bg-cyan-50 text-cyan-950 shadow-xl dark:bg-cyan-950/30 dark:text-cyan-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CheckCircle2 className='h-5 w-5' />
                  Conexión futura
                </CardTitle>
                <CardDescription className='text-cyan-900/80 dark:text-cyan-100/80'>
                  Esta pantalla no reemplaza a Dragon Pyramid Platform. Solo deja Gym Master listo para obedecer a esa plataforma madre.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 text-sm leading-6'>
                <div className={`rounded-2xl border p-4 ${paymentStatusTone[currentPaymentStatus]}`}>
                  <p className='text-xs font-semibold uppercase tracking-wide'>Estado de pago actual</p>
                  <p className='mt-1 text-2xl font-black'>{paymentStatusLabel[currentPaymentStatus]}</p>
                  <p className='mt-1 text-sm opacity-85'>{paymentHealthLabel}</p>
                </div>

                <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-1'>
                  <div className='rounded-2xl border border-cyan-300/40 bg-white/70 p-4 dark:bg-slate-950/40'>
                    <p className='text-xs font-semibold uppercase tracking-wide'>Último pago</p>
                    <p className='mt-1 font-black'>{formatDateTime(license?.last_payment_at)}</p>
                  </div>
                  <div className='rounded-2xl border border-cyan-300/40 bg-white/70 p-4 dark:bg-slate-950/40'>
                    <p className='text-xs font-semibold uppercase tracking-wide'>Plan / monto</p>
                    <p className='mt-1 font-black'>{license?.billing_plan || 'Sin plan'} · {formatCurrency(license?.expected_amount, license?.currency)}</p>
                  </div>
                </div>

                <div className='min-w-0 rounded-2xl border border-cyan-300/40 bg-white/70 p-4 dark:bg-slate-950/40'>
                  <p className='font-semibold'>Endpoint preparado para sincronización:</p>
                  <code className='mt-2 block max-w-full overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 text-xs text-cyan-100'>
                    POST /api/internal/dragon-pyramid/license-sync
                  </code>
                </div>
                <p>
                  La plataforma madre podrá enviar también paymentStatus, lastPaymentAt, nextDueAt, expectedAmount, currency, billingPlan y paymentNotes.
                </p>
                <p className='rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100'>
                  En esta feature se registra estado de pago, pero no se bloquea el sistema. El bloqueo real queda para la feature de suspensión por falta de pago.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className='shrink-0'>
        <AppFooter />
      </div>
    </main>
  );
}
