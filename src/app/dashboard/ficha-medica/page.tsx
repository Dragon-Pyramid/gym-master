'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, FileText, HeartPulse, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import Tabs from '@/components/ficha-medica/Tabs';
import type { Socio } from '@/interfaces/socio.interface';
import { fetchSociosApi } from '@/services/browser/socioApiClient';
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';

const REVIEW_ROLES = new Set(['admin', 'usuario']);

function normalizeRole(role?: string | null) {
  return String(role ?? '').trim().toLowerCase();
}

function medicalTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function getSocioLabel(socio: Socio | null | undefined, locale: GymMasterLocale) {
  if (!socio) return medicalTx(locale, 'Socio no seleccionado', 'No member selected');
  return socio.nombre_completo || socio.email || `${medicalTx(locale, 'Socio', 'Member')} ${socio.id_socio}`;
}

export default function FichaMedicaPage() {
  const { isAuthenticated, initializeAuth, isInitialized, user } =
    useAuthStore() as any;
  const router = useRouter();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [sociosLoading, setSociosLoading] = useState(false);
  const [sociosError, setSociosError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSocioId, setSelectedSocioId] = useState<string>('');
  const { locale } = useI18n();
  const tx = useCallback((es: string, en: string) => medicalTx(locale, es, en), [locale]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  const userRole = normalizeRole(user?.rol);
  const canReviewSocios = REVIEW_ROLES.has(userRole);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !canReviewSocios) return;

    let cancelled = false;
    setSociosLoading(true);
    setSociosError(null);

    fetchSociosApi()
      .then((data) => {
        if (cancelled) return;
        const list = data ?? [];
        setSocios(list);
        setSelectedSocioId((current) => {
          if (current && list.some((socio) => String(socio.id_socio) === current)) {
            return current;
          }
          const firstActive = list.find((socio) => socio.activo !== false);
          return String((firstActive ?? list[0])?.id_socio ?? '');
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSocios([]);
        setSociosError(tx('No se pudo cargar el listado de socios para revisión.', 'Could not load the member list for review.'));
      })
      .finally(() => {
        if (!cancelled) setSociosLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isInitialized, isAuthenticated, canReviewSocios, tx]);

  const filteredSocios = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return socios;
    return socios.filter((socio) => {
      const haystack = [
        socio.nombre_completo,
        socio.dni,
        socio.email,
        socio.telefono,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [socios, searchTerm]);

  const selectedSocio = useMemo(
    () => socios.find((socio) => String(socio.id_socio) === String(selectedSocioId)) ?? null,
    [socios, selectedSocioId]
  );

  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  const ownSocioId = user?.id_socio ?? user?.id ?? user?.usuario_id ?? user?.usuario ?? undefined;
  const socioId = canReviewSocios ? selectedSocioId || undefined : ownSocioId;
  const sociosActivos = socios.filter((socio) => socio.activo !== false).length;

  return (
    <SidebarProvider>
      <div className='flex min-h-[100dvh] w-full overflow-hidden'>
        <AppSidebar />
        <SidebarInset className='!grid !min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto]'>
          <AppHeader title={tx('Ficha médica', 'Medical record')} />
          <section className='min-h-0 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8'>
            <div className='mx-auto flex w-full max-w-7xl flex-col gap-5 pb-6'>
              <div className='overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 text-white shadow-xl dark:border-emerald-500/30'>
                <div className='p-5 sm:p-6 lg:p-7'>
                  <div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='max-w-3xl'>
                      <div className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100'>
                        <HeartPulse className='h-3.5 w-3.5' />
                        {canReviewSocios ? tx('Revisión médica operativa', 'Operational medical review') : tx('Mi control médico', 'My medical check')}
                      </div>
                      <h1 className='mt-4 text-2xl font-black leading-tight sm:text-3xl'>
                        {canReviewSocios ? tx('Ficha médica del socio', 'Member medical record') : tx('Mi ficha médica', 'My medical record')}
                      </h1>
                      <p className='mt-2 text-sm leading-6 text-emerald-50/90 sm:text-base'>
                        {canReviewSocios
                          ? tx('Centralizá datos clínicos básicos, apto médico, adjuntos e historial para una revisión rápida antes de entrenamientos o actividades.', 'Centralize basic clinical data, medical clearance, attachments, and history for a quick review before workouts or activities.')
                          : tx('Consultá tus datos vigentes, registrá una nueva actualización y revisá tu historial médico cargado en el gimnasio.', 'Review your current information, register a new update, and check your medical history stored by the gym.')}
                      </p>
                    </div>
                    {canReviewSocios ? (
                      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[440px]'>
                        <div className='rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur'>
                          <div className='text-xs text-emerald-100'>{tx('Modo', 'Mode')}</div>
                          <div className='mt-1 text-lg font-black'>Admin</div>
                        </div>
                        <div className='rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur'>
                          <div className='text-xs text-emerald-100'>{tx('Socios', 'Members')}</div>
                          <div className='mt-1 text-lg font-black'>{socios.length}</div>
                        </div>
                        <div className='rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur'>
                          <div className='text-xs text-emerald-100'>{tx('Activos', 'Active')}</div>
                          <div className='mt-1 text-lg font-black'>{sociosActivos}</div>
                        </div>
                        <div className='rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur'>
                          <div className='text-xs text-emerald-100'>{tx('Revisión', 'Review')}</div>
                          <div className='mt-1 text-lg font-black'>{socioId ? tx('Lista', 'Ready') : tx('Pendiente', 'Pending')}</div>
                        </div>
                      </div>
                    ) : (
                      <div className='grid gap-3 sm:grid-cols-3 lg:min-w-[440px]'>
                        <div className='rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur'>
                          <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-100'>
                            <UserCheck className='h-3.5 w-3.5' />
                            {tx('Actual', 'Current')}
                          </div>
                          <div className='mt-1 text-sm font-bold text-white'>{tx('Datos vigentes', 'Current data')}</div>
                        </div>
                        <div className='rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur'>
                          <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-100'>
                            <FileText className='h-3.5 w-3.5' />
                            {tx('Nueva', 'New')}
                          </div>
                          <div className='mt-1 text-sm font-bold text-white'>{tx('Registrar control', 'Register check')}</div>
                        </div>
                        <div className='rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur'>
                          <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-100'>
                            <ClipboardList className='h-3.5 w-3.5' />
                            {tx('Historial', 'History')}
                          </div>
                          <div className='mt-1 text-sm font-bold text-white'>{tx('Ver registros', 'View records')}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {canReviewSocios ? (
                <div className='rounded-2xl border bg-background p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:p-5'>
                  <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
                    <div>
                      <div className='flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300'>
                        <ShieldCheck className='h-4 w-4' />
                        {tx('Panel de revisión admin', 'Admin review panel')}
                      </div>
                      <h2 className='mt-1 text-xl font-black'>{tx('Seleccionar socio para revisar', 'Select member to review')}</h2>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {tx('Buscá por nombre, DNI, email o teléfono y abrí la ficha actual, historial o nueva carga del socio seleccionado.', 'Search by name, ID, email, or phone and open the selected member’s current record, history, or new entry.')}
                      </p>
                    </div>
                    <div className='grid w-full gap-3 lg:max-w-3xl lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]'>
                      <div className='relative'>
                        <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                        <input
                          type='search'
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder={tx('Buscar socio...', 'Search member...')}
                          className='h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900'
                        />
                      </div>
                      <select
                        value={selectedSocioId}
                        onChange={(event) => setSelectedSocioId(event.target.value)}
                        disabled={sociosLoading || filteredSocios.length === 0}
                        className='h-11 w-full rounded-xl border bg-background px-3 text-sm font-medium outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900'
                      >
                        {filteredSocios.length === 0 ? (
                          <option value=''>{tx('Sin resultados', 'No results')}</option>
                        ) : (
                          filteredSocios.map((socio) => (
                            <option key={socio.id_socio} value={socio.id_socio}>
                              {getSocioLabel(socio, locale)}{socio.dni ? ` · ${tx('DNI', 'ID')} ${socio.dni}` : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {sociosError ? (
                    <div className='mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'>
                      {sociosError}
                    </div>
                  ) : null}

                  <div className='mt-4 grid gap-3 sm:grid-cols-3'>
                    <div className='rounded-xl border bg-muted/30 p-3 dark:border-slate-800 dark:bg-slate-900/70'>
                      <div className='text-xs text-muted-foreground'>{tx('Socio seleccionado', 'Selected member')}</div>
                      <div className='mt-1 truncate text-sm font-bold'>{getSocioLabel(selectedSocio, locale)}</div>
                    </div>
                    <div className='rounded-xl border bg-muted/30 p-3 dark:border-slate-800 dark:bg-slate-900/70'>
                      <div className='text-xs text-muted-foreground'>{tx('Contacto', 'Contact')}</div>
                      <div className='mt-1 truncate text-sm font-bold'>{selectedSocio?.email || selectedSocio?.telefono || '—'}</div>
                    </div>
                    <div className='rounded-xl border bg-muted/30 p-3 dark:border-slate-800 dark:bg-slate-900/70'>
                      <div className='text-xs text-muted-foreground'>{tx('Estado', 'Status')}</div>
                      <div className='mt-1 inline-flex items-center gap-2 text-sm font-bold'>
                        <UserCheck className='h-4 w-4 text-emerald-600' />
                        {selectedSocio?.activo === false ? tx('Inactivo', 'Inactive') : tx('Activo', 'Active')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className='rounded-2xl border bg-background p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:p-4'>
                <div className='mb-4 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-start'>
                  <ClipboardList className='mt-0.5 h-4 w-4 shrink-0' />
                  <p className='text-xs leading-5 sm:text-sm'>
                    {tx('La ficha médica es una herramienta administrativa y preventiva. No reemplaza diagnóstico ni indicación profesional. Ante alertas clínicas, derivar a un profesional de salud.', 'The medical record is an administrative and preventive tool. It does not replace diagnosis or professional advice. For clinical alerts, refer to a health professional.')}
                  </p>
                </div>
                <Tabs
                  socioId={socioId}
                  socioLabel={canReviewSocios ? getSocioLabel(selectedSocio, locale) : user?.nombre ?? tx('Socio', 'Member')}
                  socioEmail={canReviewSocios ? selectedSocio?.email : user?.email}
                  isAdminReview={canReviewSocios}
                />
              </div>
            </div>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
