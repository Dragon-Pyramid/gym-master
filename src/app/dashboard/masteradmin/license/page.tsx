'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
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

const statusLabel: Record<DragonPyramidLicenseStatus, string> = {
  active: 'Activa',
  trial: 'Trial',
  grace: 'Gracia',
  suspended: 'Suspendida',
  cancelled: 'Cancelada',
};

const statusTone: Record<DragonPyramidLicenseStatus, string> = {
  active: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100',
  trial: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-950/40 dark:text-sky-100',
  grace: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100',
  suspended: 'border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-100',
  cancelled: 'border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
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

function buildInitialForm(license?: DragonPyramidLicenseControl | null) {
  return {
    client_code: license?.client_code ?? 'gym_master_client',
    client_name: license?.client_name ?? 'Gym Master Cliente',
    license_status: license?.license_status ?? 'active',
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

  const summaryCards = useMemo(
    () => [
      { label: 'Producto', value: 'Gym Master', icon: Activity },
      { label: 'Cliente', value: form.client_name || 'Sin definir', icon: ShieldCheck },
      { label: 'Estado', value: statusLabel[currentStatus], icon: KeyRound },
      { label: 'Última validación', value: formatDateTime(license?.last_checked_at), icon: CalendarClock },
    ],
    [currentStatus, form.client_name, license?.last_checked_at],
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
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        grace_until: form.grace_until ? new Date(form.grace_until).toISOString() : null,
        suspension_reason: form.suspension_reason,
      };

      const response = await updateDragonPyramidLicenseControl(payload);
      if (!response.ok) throw new Error(response.error || 'No se pudo actualizar la licencia');
      const data = response.data as DragonPyramidLicenseControl;
      setLicense(data);
      setForm(buildInitialForm(data));
      toast.success('Licencia actualizada');
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
      <header className='shrink-0 w-full max-w-full border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur sm:px-6'>
        <div className='mx-auto flex w-full max-w-7xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0 w-full sm:w-auto'>
            <div className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300'>
              Dragon Pyramid · Master Admin
            </div>
            <h1 className='text-xl font-black leading-tight sm:text-2xl'>Control de licencia Gym Master</h1>
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
                  <h2 className='mt-4 text-2xl font-black sm:text-3xl'>Fundación de control SaaS</h2>
                  <p className='mt-2 text-sm leading-6 text-cyan-50/90 sm:text-base'>
                    Esta instancia de Gym Master queda preparada para obedecer en el futuro a la plataforma madre Dragon Pyramid. En esta etapa se registra y administra el estado local de licencia, sin bloquear todavía el servicio del cliente.
                  </p>
                </div>
                <div className={`w-full rounded-2xl border px-4 py-3 text-center text-sm font-bold sm:w-auto sm:text-left ${statusTone[currentStatus]}`}>
                  Estado actual: {statusLabel[currentStatus]}
                </div>
              </div>
            </div>
          </div>

          <div className='grid w-full min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
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
                      <p className='mt-1 truncate text-lg font-black'>{item.value}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className='grid w-full min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
            <Card className='min-w-0 border-white/10 bg-white text-slate-950 shadow-xl dark:bg-slate-900 dark:text-slate-50'>
              <CardHeader>
                <CardTitle>Estado local de licencia</CardTitle>
                <CardDescription>
                  Base operativa de esta instancia. En el futuro será sincronizada desde Dragon Pyramid Platform.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {loading ? (
                  <div className='rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground'>Cargando licencia...</div>
                ) : null}

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
                    <Label htmlFor='license_status'>Estado</Label>
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
                    <Label htmlFor='expires_at'>Vencimiento</Label>
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
                  <div className='space-y-2 sm:col-span-2'>
                    <Label htmlFor='suspension_reason'>Motivo / observación</Label>
                    <textarea
                      id='suspension_reason'
                      rows={4}
                      value={form.suspension_reason}
                      placeholder='Ej.: Fundación inicial, prueba comercial, deuda vencida, reactivación manual...'
                      onChange={(event) => setForm((prev) => ({ ...prev, suspension_reason: event.target.value }))}
                      className='min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    />
                  </div>
                </div>

                <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
                  <Button className='w-full sm:w-auto' variant='outline' onClick={loadLicense} disabled={loading || saving}>
                    <RefreshCcw className='mr-2 h-4 w-4' />
                    Recargar
                  </Button>
                  <Button className='w-full sm:w-auto' onClick={handleSave} disabled={loading || saving}>
                    <Save className='mr-2 h-4 w-4' />
                    {saving ? 'Guardando...' : 'Guardar licencia'}
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
                <div className='min-w-0 rounded-2xl border border-cyan-300/40 bg-white/70 p-4 dark:bg-slate-950/40'>
                  <p className='font-semibold'>Endpoint preparado para sincronización:</p>
                  <code className='mt-2 block max-w-full overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 text-xs text-cyan-100'>
                    POST /api/internal/dragon-pyramid/license-sync
                  </code>
                </div>
                <p>
                  La plataforma madre podrá seleccionar producto, cliente y estado de licencia. Luego enviará la actualización a esta instancia mediante una clave interna de sincronización.
                </p>
                <p className='rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100'>
                  En esta foundation no se bloquea el sistema. El bloqueo real queda para la feature de suspensión por falta de pago.
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
