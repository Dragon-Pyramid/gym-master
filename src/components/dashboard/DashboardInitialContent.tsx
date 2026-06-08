'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCuotaEstado, getFichaMedicaActual, pagarCuotaConStripe } from '@/services/apiClient';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, Dumbbell, FileWarning, Star, ClipboardCheck } from 'lucide-react';
import ProfileImage from '@/components/perfil/ProfileImage';
import { formatFrontendDate, formatFrontendTime } from '@/utils/dateFormat';

const DashboardInitialContent = () => {
  const { user } = useAuthStore();
  const userName = user?.nombre || 'Invitado';
  const userType = user?.rol || '';
  const userImage = user?.foto || '/gm_logo.svg';

  const isSocio = userType === 'socio';
  const isInternalUser = userType === 'usuario';

  const motivationalMessages = useMemo(
    () =>
      isInternalUser
        ? [
            'Cada tarea bien registrada mejora la operación del gimnasio.',
            'La atención ordenada también forma parte de la experiencia del socio.',
            'Tu gestión diaria mantiene el gimnasio funcionando.',
            'Un buen control evita problemas antes de que aparezcan.',
            'La organización del equipo se nota en cada detalle.',
          ]
        : [
            'La clave no es querer, sino hacer. ¡Empieza hoy!',
            'Tu cuerpo puede lograrlo. Solo tu mente tiene que creerlo.',
            'Cada esfuerzo te acerca a tu mejor versión. ¡No te rindas!',
            'No esperes el momento perfecto, haz perfecto el momento.',
            'La disciplina es el puente entre tus metas y tus logros.',
            'El dolor que sientes hoy será la fuerza que sientes mañana.',
            'No se trata de ser perfecto, se trata de ser mejor que ayer.',
            'Tu única competencia eres tú mismo de ayer.',
          ],
    [isInternalUser]
  );

  const [motivationIndex, setMotivationIndex] = useState(() =>
    Math.floor(Math.random() * motivationalMessages.length)
  );
  const [isFading, setIsFading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeTimer);
  }, []);

  useEffect(() => {
    if (motivationalMessages.length === 0) return;

    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setMotivationIndex(
          (prevIndex) => (prevIndex + 1) % motivationalMessages.length
        );
        setIsFading(false);
      }, 300);
    }, 5000);

    return () => clearInterval(timer);
  }, [motivationalMessages.length]);

  const randomMotivation = motivationalMessages[motivationIndex];
  const heroActionText = isInternalUser
    ? '¡Listo para gestionar la operación del gimnasio!'
    : '¡Llegó la hora de entrenar!';
  const HeroIcon = isInternalUser ? ClipboardCheck : Dumbbell;
  const actionCards = isInternalUser
    ? [
        { icon: '✅', label: 'Operación', className: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800', textClassName: 'text-blue-700 dark:text-blue-300' },
        { icon: '🤝', label: 'Atención', className: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800', textClassName: 'text-green-700 dark:text-green-300' },
        { icon: '📊', label: 'Control', className: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 dark:border-orange-800', textClassName: 'text-orange-700 dark:text-orange-300' },
      ]
    : [
        { icon: '💪', label: 'Fuerza', className: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800', textClassName: 'text-blue-700 dark:text-blue-300' },
        { icon: '🎯', label: 'Enfoque', className: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800', textClassName: 'text-green-700 dark:text-green-300' },
        { icon: '🔥', label: 'Energía', className: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 dark:border-orange-800', textClassName: 'text-orange-700 dark:text-orange-300' },
      ];

  const hour = currentTime.getHours();
  let timeOfDay = '';

  if (hour < 12) {
    timeOfDay = 'Buenos días';
  } else if (hour < 19) {
    timeOfDay = 'Buenas tardes';
  } else {
    timeOfDay = 'Buenas noches';
  }

  const typeDisplay =
    userType === 'socio'
      ? 'Socio'
      : userType === 'usuario'
      ? 'Usuario'
      : 'Administrador';

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
    ? 'Al día'
    : estadoCuotaValor === 'vencido'
      ? 'Vencida'
      : 'Pendiente';
  const cuotaMontoAdeudado = Number(estadoCuotaSocio?.monto_adeudado ?? 0);
  const cuotaFechaLabel = cuotaAlDia
    ? formatDate(estadoCuotaSocio?.vencimiento_cuota)
    : formatDate(estadoCuotaSocio?.fecha_limite_pago);
  const cuotaFechaTitulo = cuotaAlDia
    ? 'Vencimiento de cuota'
    : 'Fecha límite de pago';
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

  return (
    <div className='p-4 bg-gradient-to-br from-background via-background to-muted/20 md:p-8'>
      <div className='mx-auto max-w-7xl'>
        <div className='grid items-center gap-8 lg:grid-cols-2 lg:gap-12'>
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
                        Estado de cuota
                      </span>
                      <span className={`inline-flex items-center gap-2 text-lg font-semibold ${cuotaEstadoClass}`}>
                        {cuotaAlDia ? (
                          <CheckCircle2 className='w-5 h-5' />
                        ) : (
                          <AlertCircle className='w-5 h-5' />
                        )}
                        {loadingEstadoCuota ? 'Consultando...' : cuotaEstadoLabel}
                      </span>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm text-muted-foreground'>
                        {cuotaAlDia ? 'Monto adeudado' : 'Monto a regularizar'}
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
                          Incluye {estadoCuotaSocio.dias_gracia} días de gracia.
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
                        {loadingPago ? 'Redirigiendo...' : 'Pagar con Stripe'}
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
                        Ficha médica pendiente
                      </p>
                      <p className='mt-1 text-sm text-amber-800 dark:text-amber-200'>
                        No es obligatoria para ingresar, pero es importante presentarla para que el gimnasio conozca antecedentes, apto médico y contactos preventivos.
                      </p>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => router.push('/dashboard/ficha-medica')}
                    className='rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700'
                  >
                    Cargar ficha médica
                  </button>
                </div>
              </Card>
            ) : null}

            <Card className='p-6 bg-gradient-to-r backdrop-blur-sm from-primary/5 via-primary/10 to-primary/5 border-primary/20'>
              <div className='flex items-start gap-3'>
                <div className='w-2 h-2 mt-3 rounded-full animate-pulse bg-primary' />
                <blockquote
                  className={`text-lg sm:text-xl font-medium text-foreground leading-relaxed transition-all duration-300 ${
                    isFading
                      ? 'opacity-0 transform translate-y-2'
                      : 'opacity-100 transform translate-y-0'
                  }`}
                >
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
