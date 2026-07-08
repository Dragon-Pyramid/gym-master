'use client';

import { useState, useEffect, useMemo, type ComponentType, type ReactNode } from 'react';
import { getCuotaEstado, getFichaMedicaActual, pagarCuotaConStripe } from '@/services/apiClient';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Activity, AlertCircle, CheckCircle2, ChevronRight, Clock, CreditCard, Dumbbell, FileWarning, HeartPulse, MessageCircle, QrCode, Star, ClipboardCheck, Utensils } from 'lucide-react';
import ProfileImage from '@/components/perfil/ProfileImage';
import { formatFrontendDate, formatFrontendTime } from '@/utils/dateFormat';
import SocioEvolucionProgressInsights from '@/components/dashboard/evolucion-fisica/SocioEvolucionProgressInsights';
import SocioMobileTodayPlan from '@/components/dashboard/socio/SocioMobileTodayPlan';
import SocioMobileAsistenciaQrCard from '@/components/dashboard/socio/SocioMobileAsistenciaQrCard';
import SocioMobileMensajeriaSoporteCard from '@/components/dashboard/socio/SocioMobileMensajeriaSoporteCard';
import SocioMobileSaludFichaMedicaCard from '@/components/dashboard/socio/SocioMobileSaludFichaMedicaCard';
import SocioMobilePagosRecibosCard from '@/components/dashboard/socio/SocioMobilePagosRecibosCard';
import SocioMobileActividadesAgendaCard from '@/components/dashboard/socio/SocioMobileActividadesAgendaCard';
import { useI18n } from '@/i18n/I18nProvider';

type SocioMobileFeedSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  badge?: string;
  accentClassName?: string;
};

type SocioMobileQuickAction = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  className: string;
};

const SocioMobileFeedSection = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
  badge,
  accentClassName = 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-200',
}: SocioMobileFeedSectionProps) => (
  <section className='space-y-3'>
    <div className='flex items-start justify-between gap-3 px-1'>
      <div className='flex min-w-0 items-start gap-3'>
        <div className={`mt-0.5 rounded-2xl p-2 ${accentClassName}`}>
          <Icon className='h-4 w-4' />
        </div>
        <div className='min-w-0'>
          <p className='text-[0.65rem] font-black uppercase tracking-[0.22em] text-muted-foreground'>
            {eyebrow}
          </p>
          <h2 className='text-lg font-black leading-tight text-foreground'>
            {title}
          </h2>
          <p className='mt-1 text-xs leading-relaxed text-muted-foreground'>
            {description}
          </p>
        </div>
      </div>
      {badge ? (
        <span className='shrink-0 rounded-full border border-border bg-background px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground'>
          {badge}
        </span>
      ) : null}
    </div>
    <div className='space-y-3'>{children}</div>
  </section>
);


const SocioMobileQuickActionRail = ({
  actions,
  onNavigate,
  eyebrow,
  title,
}: {
  actions: SocioMobileQuickAction[];
  onNavigate: (href: string) => void;
  eyebrow: string;
  title: string;
}) => (
  <Card className='overflow-hidden border-sky-100 bg-white/95 p-3 shadow-sm dark:border-sky-900/60 dark:bg-slate-950/70'>
    <div className='mb-3 flex items-center justify-between gap-3 px-1'>
      <div>
        <p className='text-[0.65rem] font-black uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300'>
          {eyebrow}
        </p>
        <h2 className='text-base font-black leading-tight'>{title}</h2>
      </div>
      <span className='rounded-full bg-sky-50 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-sky-700 dark:bg-sky-950 dark:text-sky-200'>
        App
      </span>
    </div>

    <div className='gm-mobile-scroll-x -mx-3 flex gap-3 px-3 pb-1'>
      {actions.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            type='button'
            onClick={() => onNavigate(item.href)}
            className={`min-w-[8.4rem] rounded-2xl border p-3 text-left shadow-sm transition active:scale-[0.98] ${item.className}`}
          >
            <div className='mb-3 flex items-center justify-between gap-2'>
              <Icon className='h-5 w-5' />
              <ChevronRight className='h-4 w-4 opacity-60' />
            </div>
            <p className='text-sm font-black leading-tight'>{item.title}</p>
            <p className='mt-1 text-[0.7rem] leading-4 opacity-75'>{item.description}</p>
          </button>
        );
      })}
    </div>
  </Card>
);


const DashboardInitialContent = () => {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const userName = user?.nombre || t('socioDashboard.greeting.guest');
  const userType = user?.rol || '';
  const userImage = user?.foto || '/gm_logo.svg';

  const isSocio = userType === 'socio';
  const isInternalUser = userType === 'usuario';

  const motivationalMessages = useMemo(
    () =>
      isInternalUser
        ? [
            t('socioDashboard.motivation.internal1'),
            t('socioDashboard.motivation.internal2'),
            t('socioDashboard.motivation.internal3'),
            t('socioDashboard.motivation.internal4'),
            t('socioDashboard.motivation.internal5'),
          ]
        : [
            t('socioDashboard.motivation.member1'),
            t('socioDashboard.motivation.member2'),
            t('socioDashboard.motivation.member3'),
            t('socioDashboard.motivation.member4'),
            t('socioDashboard.motivation.member5'),
            t('socioDashboard.motivation.member6'),
            t('socioDashboard.motivation.member7'),
            t('socioDashboard.motivation.member8'),
          ],
    [isInternalUser, t]
  );

  const motivationSeed = `${user?.id ?? ''}-${userName}-${userType}`;
  const motivationIndex = useMemo(() => {
    if (motivationalMessages.length === 0) return 0;

    const hash = Array.from(motivationSeed).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0,
    );

    return hash % motivationalMessages.length;
  }, [motivationSeed, motivationalMessages.length]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeTimer);
  }, []);

  const randomMotivation = motivationalMessages[motivationIndex] ?? motivationalMessages[0] ?? '';
  const heroActionText = isInternalUser
    ? t('socioDashboard.greeting.internalHeroAction')
    : t('socioDashboard.greeting.memberHeroAction');
  const HeroIcon = isInternalUser ? ClipboardCheck : Dumbbell;
  const actionCards = isInternalUser
    ? [
        { icon: '✅', label: t('socioDashboard.common.administration'), className: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800', textClassName: 'text-blue-700 dark:text-blue-300' },
        { icon: '🤝', label: t('socioDashboard.messages.title'), className: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800', textClassName: 'text-green-700 dark:text-green-300' },
        { icon: '📊', label: t('socioDashboard.common.detail'), className: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 dark:border-orange-800', textClassName: 'text-orange-700 dark:text-orange-300' },
      ]
    : [
        { icon: '💪', label: t('socioDashboard.quickActions.training'), className: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800', textClassName: 'text-blue-700 dark:text-blue-300' },
        { icon: '🎯', label: t('socioDashboard.sections.progressEyebrow'), className: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800', textClassName: 'text-green-700 dark:text-green-300' },
        { icon: '🔥', label: t('socioDashboard.sections.todayEyebrow'), className: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 dark:border-orange-800', textClassName: 'text-orange-700 dark:text-orange-300' },
      ];

  const hour = currentTime.getHours();
  let timeOfDay = '';

  if (hour < 12) {
    timeOfDay = t('socioDashboard.greeting.morning');
  } else if (hour < 19) {
    timeOfDay = t('socioDashboard.greeting.afternoon');
  } else {
    timeOfDay = t('socioDashboard.greeting.evening');
  }

  const typeDisplay =
    userType === 'socio'
      ? t('socioDashboard.greeting.memberRole')
      : userType === 'usuario'
      ? t('socioDashboard.greeting.internalRole')
      : t('socioDashboard.greeting.adminRole');

  const getTypeColor = () => {
    switch (userType) {
      case 'socio':
        return 'bg-blue-500/10 text-blue-600 border border-blue-200';
      case 'usuario':
        return 'bg-green-500/10 text-green-600 border border-green-200';
      default:
        return 'bg-purple-500/10 text-purple-600 border border-purple-200';
    }
  };

  type EstadoCuotaSocioCard = {
    estado_cuota?: 'al_dia' | 'vencido' | 'sin_pagos' | string;
    vencimiento_cuota?: string | null;
    fecha_limite_pago?: string | null;
    monto_adeudado?: number | null;
    dias_vencido?: number | null;
    dias_gracia?: number | null;
  };

  const [estadoCuotaSocio, setEstadoCuotaSocio] =
    useState<EstadoCuotaSocioCard | null>(null);
  const [loadingEstadoCuota, setLoadingEstadoCuota] = useState(false);
  const [tieneFichaMedica, setTieneFichaMedica] = useState<boolean | null>(null);

  const formatMoney = (value: unknown) => {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) return '$ 0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    try {
      return formatFrontendDate(value);
    } catch {
      return value;
    }
  };

  const estadoCuotaValor = estadoCuotaSocio?.estado_cuota ?? 'sin_pagos';
  const cuotaAlDia = estadoCuotaValor === 'al_dia';
  const cuotaEstadoLabel = cuotaAlDia
    ? t('socioDashboard.fee.upToDate')
    : estadoCuotaValor === 'vencido'
      ? t('socioDashboard.fee.overdue')
      : t('socioDashboard.fee.pending');
  const cuotaMontoAdeudado = Number(estadoCuotaSocio?.monto_adeudado ?? 0);
  const cuotaFechaLabel = cuotaAlDia
    ? formatDate(estadoCuotaSocio?.vencimiento_cuota)
    : formatDate(estadoCuotaSocio?.fecha_limite_pago);
  const cuotaFechaTitulo = cuotaAlDia
    ? t('socioDashboard.fee.dueDate')
    : t('socioDashboard.fee.paymentDeadline');
  const cuotaCardClass = cuotaAlDia
    ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/20 dark:border-green-800'
    : estadoCuotaValor === 'vencido'
      ? 'border-red-200 bg-gradient-to-r from-red-50 to-rose-100 dark:from-red-950/20 dark:to-rose-900/20 dark:border-red-800'
      : 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-100 dark:from-orange-950/20 dark:to-amber-900/20 dark:border-orange-800';
  const cuotaEstadoClass = cuotaAlDia
    ? 'text-green-700 dark:text-green-300'
    : estadoCuotaValor === 'vencido'
      ? 'text-red-700 dark:text-red-300'
      : 'text-orange-700 dark:text-orange-300';

  useEffect(() => {
    if (!isSocio) return;
    let cancelled = false;

    const fetchEstadoCuota = async () => {
      try {
        setLoadingEstadoCuota(true);
        const res = await getCuotaEstado();
        if (cancelled) return;
        if (res.ok && res.data) {
          setEstadoCuotaSocio(res.data as EstadoCuotaSocioCard);
        } else {
          setEstadoCuotaSocio(null);
        }
      } catch {
        if (!cancelled) setEstadoCuotaSocio(null);
      } finally {
        if (!cancelled) setLoadingEstadoCuota(false);
      }
    };

    fetchEstadoCuota();
    return () => {
      cancelled = true;
    };
  }, [isSocio]);

  useEffect(() => {
    if (!isSocio) return;
    const socioId = user?.id_socio ?? user?.id;
    if (!socioId) return;
    let cancelled = false;

    const fetchFichaMedica = async () => {
      try {
        const res = await getFichaMedicaActual(socioId);
        if (cancelled) return;
        const raw = res.data;
        const ficha = Array.isArray(raw) ? raw[raw.length - 1] : raw;
        setTieneFichaMedica(Boolean(res.ok && ficha && Object.keys(ficha).length > 0));
      } catch {
        if (!cancelled) setTieneFichaMedica(false);
      }
    };

    fetchFichaMedica();
    return () => {
      cancelled = true;
    };
  }, [isSocio, user?.id, user?.id_socio]);

  const router = useRouter();
  const [loadingPago, setLoadingPago] = useState(false);

  const handlePagarStripe = async () => {
    setLoadingPago(true);
    try {
      const result = await pagarCuotaConStripe();
      if (result.ok && result.url) {
        window.location.assign(result.url);
        return;
      }
      router.push('/pago-fallido');
    } catch {
      router.push('/pago-fallido');
    } finally {
      setLoadingPago(false);
    }
  };

  const socioMobileActions = [
    {
      title: cuotaAlDia ? t('socioDashboard.quickActions.myFee') : t('socioDashboard.fee.payFee'),
      description: cuotaAlDia ? t('socioDashboard.quickActions.viewHistory') : t('socioDashboard.quickActions.regularize'),
      href: cuotaAlDia ? '/dashboard/mi-cuenta/historial-pagos' : '/dashboard/mi-cuenta/pagar-cuota',
      icon: CreditCard,
      className: cuotaAlDia ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-sky-200 bg-sky-50 text-sky-900',
    },
    {
      title: t('socioDashboard.quickActions.qrAttendance'),
      description: t('socioDashboard.quickActions.gymEntry'),
      href: '/dashboard/control-asistencia',
      icon: QrCode,
      className: 'border-indigo-200 bg-indigo-50 text-indigo-900',
    },
    {
      title: t('socioDashboard.quickActions.coach'),
      description: t('socioDashboard.quickActions.coachDescription'),
      href: '/dashboard/coach',
      icon: MessageCircle,
      className: 'border-cyan-200 bg-cyan-50 text-cyan-900',
    },
    {
      title: t('socioDashboard.quickActions.routine'),
      description: t('socioDashboard.quickActions.training'),
      href: '/dashboard/rutinas/asistente',
      icon: Dumbbell,
      className: 'border-orange-200 bg-orange-50 text-orange-900',
    },
    {
      title: t('socioDashboard.quickActions.diet'),
      description: t('socioDashboard.quickActions.mealPlan'),
      href: '/dashboard/dietas',
      icon: Utensils,
      className: 'border-lime-200 bg-lime-50 text-lime-900',
    },
    {
      title: t('socioDashboard.quickActions.evolution'),
      description: t('socioDashboard.quickActions.physicalProgress'),
      href: '/dashboard/evolucion-fisica',
      icon: Activity,
      className: 'border-violet-200 bg-violet-50 text-violet-900',
    },
    {
      title: t('socioDashboard.quickActions.medicalRecord'),
      description: tieneFichaMedica === false ? t('socioDashboard.quickActions.complete') : t('socioDashboard.quickActions.consult'),
      href: '/dashboard/ficha-medica',
      icon: HeartPulse,
      className: tieneFichaMedica === false ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-rose-200 bg-rose-50 text-rose-900',
    },
    {
      title: t('socioDashboard.quickActions.messages'),
      description: t('socioDashboard.quickActions.inbox'),
      href: '/dashboard/mensajes',
      icon: MessageCircle,
      className: 'border-slate-200 bg-slate-50 text-slate-900',
    },
  ];

  const socioMobileSecondaryActions = socioMobileActions.filter(
    (item) => item.href !== '/dashboard/mi-cuenta/historial-pagos' && item.href !== '/dashboard/mi-cuenta/pagar-cuota' && item.href !== '/dashboard/control-asistencia'
  );

  return (
    <div className='bg-gradient-to-br from-background via-background to-muted/20 p-4 md:flex md:min-h-[calc(100dvh-10.5rem)] md:items-center md:p-8'>
      <div className='mx-auto max-w-7xl'>
        {isSocio && (
          <section className='space-y-5 pb-4 md:hidden'>
            <div className='overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-5 text-white shadow-xl'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-3'>
                  <div className='shrink-0 rounded-2xl bg-white/10 p-1'>
                    <ProfileImage
                      foto={userImage}
                      alt={userName}
                      size={76}
                      showButton={false}
                    />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold uppercase tracking-[0.22em] text-sky-200'>
                      {timeOfDay}
                    </p>
                    <h1 className='truncate text-2xl font-black leading-tight'>
                      {userName}
                    </h1>
                    <p className='mt-1 text-sm text-slate-300'>
                      {t('socioDashboard.greeting.memberHeroDescription')}
                    </p>
                  </div>
                </div>
                <div className='shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-100'>
                  {formatFrontendTime(currentTime)}
                </div>
              </div>

              <div className='mt-5 rounded-2xl border border-white/10 bg-white/10 p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='text-xs uppercase tracking-[0.18em] text-sky-200'>
                      {t('socioDashboard.fee.statusTitle')}
                    </p>
                    <div className='mt-1 flex items-center gap-2 text-lg font-bold'>
                      {cuotaAlDia ? (
                        <CheckCircle2 className='h-5 w-5 text-emerald-300' />
                      ) : (
                        <AlertCircle className='h-5 w-5 text-amber-300' />
                      )}
                      {loadingEstadoCuota ? t('socioDashboard.common.loading') : cuotaEstadoLabel}
                    </div>
                    <p className='mt-1 text-xs text-slate-300'>
                      {cuotaFechaTitulo}: {cuotaFechaLabel}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-sky-200'>
                      {cuotaAlDia ? t('socioDashboard.fee.amountDue') : t('socioDashboard.fee.amountToRegularize')}
                    </p>
                    <p className='text-lg font-black'>
                      {cuotaAlDia ? '$ 0' : formatMoney(cuotaMontoAdeudado)}
                    </p>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => {
                    if (cuotaAlDia) {
                      router.push('/dashboard/mi-cuenta/historial-pagos');
                      return;
                    }

                    handlePagarStripe();
                  }}
                  disabled={!cuotaAlDia && loadingPago}
                  className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#02a8e1] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-sky-950/20 transition active:scale-[0.98] disabled:opacity-60'
                >
                  <CreditCard className='h-4 w-4' />
                  {cuotaAlDia ? t('socioDashboard.fee.viewPaymentHistory') : loadingPago ? t('socioDashboard.fee.redirecting') : t('socioDashboard.fee.payFee')}
                </button>
              </div>
            </div>

            <SocioMobileQuickActionRail
              actions={socioMobileSecondaryActions}
              eyebrow={t('socioDashboard.common.quickAccessEyebrow')}
              title={t('socioDashboard.common.quickAccessTitle')}
              onNavigate={(href) => router.push(href)}
            />

            <SocioMobileFeedSection
              eyebrow={t('socioDashboard.sections.priorityEyebrow')}
              title={t('socioDashboard.sections.accessTitle')}
              description={t('socioDashboard.sections.accessDescription')}
              icon={QrCode}
              badge={t('socioDashboard.common.now')}
              accentClassName='bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200'
            >
              <SocioMobileAsistenciaQrCard
                cuotaAlDia={cuotaAlDia}
                cuotaEstadoLabel={cuotaEstadoLabel}
                cuotaFechaTitulo={cuotaFechaTitulo}
                cuotaFechaLabel={cuotaFechaLabel}
                loadingEstadoCuota={loadingEstadoCuota}
                montoAdeudadoLabel={formatMoney(cuotaMontoAdeudado)}
              />

              <SocioMobilePagosRecibosCard
                cuotaAlDia={cuotaAlDia}
                cuotaEstadoLabel={cuotaEstadoLabel}
                cuotaFechaTitulo={cuotaFechaTitulo}
                cuotaFechaLabel={cuotaFechaLabel}
                loadingEstadoCuota={loadingEstadoCuota}
                montoAdeudadoLabel={formatMoney(cuotaMontoAdeudado)}
              />

              <SocioMobileSaludFichaMedicaCard />
            </SocioMobileFeedSection>

            <SocioMobileFeedSection
              eyebrow={t('socioDashboard.sections.todayEyebrow')}
              title={t('socioDashboard.sections.trainingAgendaTitle')}
              description={t('socioDashboard.sections.trainingAgendaDescription')}
              icon={Dumbbell}
              badge={t('socioDashboard.common.daily')}
              accentClassName='bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-200'
            >
              <SocioMobileTodayPlan />
              <SocioMobileActividadesAgendaCard />
            </SocioMobileFeedSection>

            <SocioMobileFeedSection
              eyebrow={t('socioDashboard.sections.progressEyebrow')}
              title={t('socioDashboard.sections.physicalEvolutionTitle')}
              description={t('socioDashboard.sections.physicalEvolutionDescription')}
              icon={Activity}
              accentClassName='bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200'
            >
              <SocioEvolucionProgressInsights />
            </SocioMobileFeedSection>

            <SocioMobileFeedSection
              eyebrow={t('socioDashboard.sections.communicationEyebrow')}
              title={t('socioDashboard.sections.supportTitle')}
              description={t('socioDashboard.sections.supportDescription')}
              icon={MessageCircle}
              accentClassName='bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
            >
              <SocioMobileMensajeriaSoporteCard />
            </SocioMobileFeedSection>

            <Card className='border-primary/20 bg-primary/5 p-4'>
              <div className='flex items-start gap-3'>
                <div className='mt-2 h-2 w-2 rounded-full bg-primary' />
                <blockquote className='min-h-[3.5rem] text-base font-medium leading-relaxed text-foreground'>
                  &ldquo;{randomMotivation}&rdquo;
                </blockquote>
              </div>
            </Card>
          </section>
        )}

        <div
          className={
            isSocio
              ? 'hidden items-center gap-8 md:grid lg:grid-cols-2 lg:gap-12'
              : 'grid items-center gap-8 lg:grid-cols-2 lg:gap-12'
          }
        >
          <div className='order-2 space-y-8 lg:order-1'>
            <div className='space-y-4'>
              <div className='flex flex-wrap items-center gap-3'>
                <div
                  className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getTypeColor()}`}
                >
                  <Star className='w-3 h-3 mr-1' />
                  {typeDisplay}
                </div>
                <div className='flex items-center gap-2 px-3 py-1 text-sm rounded-full text-muted-foreground bg-muted/50'>
                  <Clock className='w-4 h-4' />
                  {formatFrontendTime(currentTime)}
                </div>
              </div>

              <div className='space-y-2'>
                <h1 className='text-2xl font-medium text-muted-foreground'>
                  {timeOfDay}
                </h1>
                <div className='flex flex-col gap-5 mb-6 sm:flex-row sm:items-center sm:gap-7'>
                  <div className='shrink-0'>
                    <ProfileImage
                      foto={userImage}
                      alt={userName}
                      size={192}
                      showButton={false}
                    />
                  </div>
                  <h2 className='text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
                    <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-primary/80'>
                      {userName}
                    </span>
                  </h2>
                </div>
                <div className='flex items-center gap-3 pt-2'>
                  <HeroIcon className='w-8 h-8 text-primary' />
                  <p className='text-xl font-bold sm:text-2xl md:text-3xl text-foreground'>
                    {heroActionText}
                  </p>
                </div>
              </div>
            </div>

            {isSocio && (
              <Card className={`p-6 mb-4 ${cuotaCardClass}`}>
                <div className='flex flex-col gap-4'>
                  <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm text-muted-foreground'>
                        {t('socioDashboard.fee.statusTitle')}
                      </span>
                      <span className={`inline-flex items-center gap-2 text-lg font-semibold ${cuotaEstadoClass}`}>
                        {cuotaAlDia ? (
                          <CheckCircle2 className='w-5 h-5' />
                        ) : (
                          <AlertCircle className='w-5 h-5' />
                        )}
                        {loadingEstadoCuota ? t('socioDashboard.common.loading') : cuotaEstadoLabel}
                      </span>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm text-muted-foreground'>
                        {cuotaAlDia ? t('socioDashboard.fee.amountDue') : t('socioDashboard.fee.amountToRegularize')}
                      </span>
                      <span className={`text-lg font-semibold ${cuotaAlDia ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                        {cuotaAlDia ? '$ 0' : formatMoney(cuotaMontoAdeudado)}
                      </span>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm text-muted-foreground'>
                        {cuotaFechaTitulo}
                      </span>
                      <span className='text-lg font-semibold text-orange-700 dark:text-orange-300'>
                        {cuotaFechaLabel}
                      </span>
                      {!cuotaAlDia && estadoCuotaSocio?.dias_gracia ? (
                        <span className='text-xs text-muted-foreground'>
                          {t('socioDashboard.fee.graceDays', { days: estadoCuotaSocio.dias_gracia })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {!cuotaAlDia && (
                    <div className='flex justify-end pt-2'>
                      <button
                        className='px-6 py-2 rounded bg-[#02a8e1] text-white font-semibold hover:bg-[#0288b1] dark:bg-[#0288b1] dark:hover:bg-[#02a8e1] transition-colors disabled:opacity-60'
                        onClick={handlePagarStripe}
                        disabled={loadingPago}
                      >
                        {loadingPago ? t('socioDashboard.fee.redirecting') : t('socioDashboard.fee.payWithStripe')}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {isSocio && tieneFichaMedica === false ? (
              <Card className='mb-4 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-100 p-5 dark:border-amber-900 dark:from-amber-950/20 dark:to-orange-900/20'>
                <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                  <div className='flex items-start gap-3'>
                    <FileWarning className='mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300' />
                    <div>
                      <p className='font-semibold text-amber-900 dark:text-amber-100'>
                        {t('socioDashboard.health.pendingTitle')}
                      </p>
                      <p className='mt-1 text-sm text-amber-800 dark:text-amber-200'>
                        {t('socioDashboard.health.pendingDescription')}
                      </p>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => router.push('/dashboard/ficha-medica')}
                    className='rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700'
                  >
                    {t('socioDashboard.health.upload')}
                  </button>
                </div>
              </Card>
            ) : null}

            {isSocio ? (
              <Card className='border-sky-100 bg-white/95 p-4 shadow-sm dark:border-sky-900/60 dark:bg-slate-950/70 md:hidden'>
                <div className='mb-4 flex items-center justify-between gap-3'>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300'>
                      {t('socioDashboard.common.quickAccessEyebrow')}
                    </p>
                    <h2 className='text-lg font-bold'>{t('socioDashboard.quickActions.appTitle')}</h2>
                  </div>
                  <span className='rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-200'>
                    {t('socioDashboard.common.mobileWeb')}
                  </span>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  {socioMobileActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        type='button'
                        onClick={() => router.push(item.href)}
                        className={`flex min-h-[92px] flex-col justify-between rounded-2xl border p-3 text-left shadow-sm transition active:scale-[0.98] ${item.className}`}
                      >
                        <div className='flex items-center justify-between gap-2'>
                          <Icon className='h-5 w-5' />
                          <ChevronRight className='h-4 w-4 opacity-60' />
                        </div>
                        <div>
                          <p className='text-sm font-bold'>{item.title}</p>
                          <p className='text-xs opacity-75'>{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className='mt-3 text-xs leading-5 text-muted-foreground'>
                  {t('socioDashboard.quickActions.appDescription')}
                </p>
              </Card>
            ) : null}

            <Card className='p-6 bg-gradient-to-r backdrop-blur-sm from-primary/5 via-primary/10 to-primary/5 border-primary/20'>
              <div className='flex items-start gap-3'>
                <div className='w-2 h-2 mt-3 rounded-full bg-primary' />
                <blockquote className='min-h-[4.5rem] text-lg font-medium leading-relaxed text-foreground sm:text-xl'>
                  &ldquo;{randomMotivation}&rdquo;
                </blockquote>
              </div>
            </Card>

            <div className='grid grid-cols-3 gap-4 pt-4'>
              {actionCards.map((item) => (
                <Card key={item.label} className={`p-4 text-center ${item.className}`}>
                  <div className='text-2xl font-bold'>{item.icon}</div>
                  <p className={`mt-1 text-sm font-medium ${item.textClassName}`}>
                    {item.label}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          <div className='relative order-1 lg:order-2'>
            <div className='relative max-w-lg mx-auto aspect-square lg:max-w-none'>
              <div className='absolute inset-0 bg-gradient-to-br via-transparent rounded-3xl blur-3xl from-primary/20 to-primary/10' />
              <div className='relative p-8 border shadow-2xl bg-gradient-to-br rounded-3xl backdrop-blur-sm from-background to-muted/50'>
                <div className='relative aspect-square'>
                  <Image
                    src='/gm_logo.svg'
                    alt='Gym Master Logo'
                    fill
                    className='object-contain transition-transform duration-700 drop-shadow-2xl dark:invert hover:scale-105'
                    priority
                  />
                </div>
              </div>
            </div>

            <div className='absolute w-24 h-24 rounded-full -top-4 -right-4 bg-gradient-to-br blur-xl animate-pulse from-primary/20 to-primary/40' />
            <div className='absolute w-32 h-32 delay-1000 rounded-full -bottom-8 -left-8 bg-gradient-to-br blur-xl animate-pulse from-secondary/20 to-secondary/40' />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardInitialContent;
