'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Bell, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';

export type HeaderNotificationSeverity = 'alta' | 'media' | 'baja';

export interface HeaderNotificationItem {
  id: string;
  audience: 'socio' | 'gestion';
  type: string;
  severity: HeaderNotificationSeverity;
  title: string;
  summary: string;
  route: string;
  count?: number;
}

interface HeaderNotificationsResponse {
  total: number;
  items: HeaderNotificationItem[];
  generated_at: string;
}

const severityClass: Record<HeaderNotificationSeverity, string> = {
  alta: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200',
  media: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  baja: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200',
};

function getBadgeLabel(total: number) {
  if (total > 99) return '99+';
  return String(total);
}


function translateSeverity(severity: HeaderNotificationSeverity, isEnglish: boolean) {
  if (!isEnglish) return severity;

  const labels: Record<HeaderNotificationSeverity, string> = {
    alta: 'high',
    media: 'medium',
    baja: 'low',
  };

  return labels[severity] ?? severity;
}

function translateNotificationTitle(title: string, isEnglish: boolean) {
  if (!isEnglish) return title;

  const normalized = title.trim();
  const titleMap: Record<string, string> = {
    'Socios con cuotas vencidas': 'Members with overdue fees',
    'Mantenimientos de equipos pendientes': 'Pending equipment maintenance',
    'Stock crítico': 'Critical stock',
    'Mensajes de socios pendientes': 'Pending member messages',
    'Cuota sin pagos registrados': 'Fee with no registered payments',
    'Cuota vencida': 'Overdue fee',
    'Tu acceso puede bloquearse pronto': 'Your access may be blocked soon',
    'Acceso en riesgo por mora': 'Access at risk due to overdue payment',
    'Tu cuota está por vencer': 'Your fee is about to expire',
    'Cargá tu foto de perfil': 'Upload your profile photo',
    'Tenés mensajes en tu casilla': 'You have messages in your inbox',
    'Completá tu ficha médica': 'Complete your medical record',
    'Actualizá tu ficha médica': 'Update your medical record',
  };

  return titleMap[normalized] ?? title;
}

function translateNotificationSummary(summary: string, isEnglish: boolean) {
  if (!isEnglish) return summary;

  const normalized = summary.trim();
  let match = normalized.match(/^(\d+) socio\(s\) requieren seguimiento: (\d+) vencido\(s\), (\d+) sin pagos\.$/);
  if (match) {
    return `${match[1]} member(s) require follow-up: ${match[2]} overdue, ${match[3]} with no payments.`;
  }

  match = normalized.match(/^(\d+) alerta\(s\): (\d+) mantenimiento\(s\) y (\d+) revisión\(es\) vencida\(s\)\.$/);
  if (match) {
    return `${match[1]} alert(s): ${match[2]} maintenance item(s) and ${match[3]} overdue review(s).`;
  }

  match = normalized.match(/^(\d+) producto\(s\) en stock crítico; (\d+) sin stock\.$/);
  if (match) {
    return `${match[1]} product(s) in critical stock; ${match[2]} out of stock.`;
  }

  match = normalized.match(/^(\d+) producto\(s\) están en stock mínimo o por debajo\.$/);
  if (match) {
    return `${match[1]} product(s) are at or below minimum stock.`;
  }

  match = normalized.match(/^(\d+) mensaje\(s\) requieren lectura o respuesta\.$/);
  if (match) {
    return `${match[1]} message(s) require reading or reply.`;
  }

  match = normalized.match(/^Tu cuota está vencida(?: hace (\d+) días)?\.$/);
  if (match) {
    return match[1]
      ? `Your fee is overdue by ${match[1]} day(s).`
      : 'Your fee is overdue.';
  }

  match = normalized.match(/^Te quedan (\d+) día\(s\) de gracia para regularizar la cuota\.$/);
  if (match) {
    return `You have ${match[1]} grace day(s) left to regularize the fee.`;
  }

  match = normalized.match(/^Tu período vigente vence en (\d+) día\(s\)\.$/);
  if (match) {
    return `Your current period expires in ${match[1]} day(s).`;
  }

  match = normalized.match(/^Tenés (\d+) mensaje\(s\) respondidos por administración\.$/);
  if (match) {
    return `You have ${match[1]} message(s) answered by administration.`;
  }

  const summaryMap: Record<string, string> = {
    'No registrás pagos activos. Regularizá tu cuota para mantener el acceso.': 'You do not have active payments registered. Regularize your fee to keep access.',
    'Regularizá tu cuota para evitar restricciones de ingreso al sistema o al gimnasio.': 'Regularize your fee to avoid access restrictions to the system or gym.',
    'Todavía usás la imagen por defecto. Subí una foto o sacate una desde el celular para completar tu perfil.': 'You are still using the default image. Upload a photo or take one from your phone to complete your profile.',
    'Tu ficha médica todavía no está cargada. Completala para mejorar tu seguimiento.': 'Your medical record has not been uploaded yet. Complete it to improve your follow-up.',
    'La próxima revisión médica indicada ya venció o corresponde actualizarla.': 'The indicated next medical review is overdue or should be updated.',
  };

  return summaryMap[normalized] ?? summary;
}

export function HeaderNotificationsBell() {
  const router = useRouter();
  const { locale } = useI18n();
  const isEnglish = locale === 'en';
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const { token, isAuthenticated } = useAuthStore();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [payload, setPayload] = React.useState<HeaderNotificationsResponse>({
    total: 0,
    items: [],
    generated_at: new Date().toISOString(),
  });

  const loadNotifications = React.useCallback(async () => {
    if (!isAuthenticated || !token) {
      setPayload({ total: 0, items: [], generated_at: new Date().toISOString() });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/notificaciones/header', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.error || tx('No se pudieron cargar notificaciones', 'Notifications could not be loaded'));

      setPayload(json?.data ?? { total: 0, items: [], generated_at: new Date().toISOString() });
    } catch {
      setPayload({ total: 0, items: [], generated_at: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, isEnglish]);

  React.useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60_000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) loadNotifications();
  };

  const handleNavigate = (route: string) => {
    setOpen(false);
    router.push(route);
  };

  const total = payload.total ?? 0;
  const items = payload.items ?? [];

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative text-muted-foreground hover:text-foreground'
          aria-label={total > 0 ? tx(`Notificaciones pendientes: ${total}`, `${total} pending notifications`) : tx('Notificaciones', 'Notifications')}
        >
          <Bell className='h-5 w-5' />
          {total > 0 ? (
            <span className='absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-background'>
              {getBadgeLabel(total)}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' sideOffset={8} className='w-[calc(100vw-1rem)] max-w-[400px] overflow-hidden rounded-2xl p-0'>
        <DropdownMenuLabel className='flex items-center justify-between gap-3 px-4 py-3'>
          <span>{tx('Notificaciones', 'Notifications')}</span>
          {loading ? <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' /> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {items.length === 0 ? (
          <div className='flex items-start gap-3 px-4 py-5 text-sm text-muted-foreground'>
            <CheckCircle2 className='mt-0.5 h-5 w-5 text-emerald-600' />
            <div>
              <p className='font-medium text-foreground'>{tx('Sin pendientes críticos', 'No critical pending items')}</p>
              <p>{tx('Cuando haya cuotas, mensajes, stock o mantenimientos pendientes, aparecerán acá.', 'When there are pending fees, messages, stock, or maintenance items, they will appear here.')}</p>
            </div>
          </div>
        ) : (
          <div className='max-h-[min(420px,70dvh)] overflow-y-auto py-1'>
            {items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className='cursor-pointer items-start gap-3 px-4 py-3 focus:bg-muted'
                onClick={() => handleNavigate(item.route)}
              >
                <span className={`mt-0.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${severityClass[item.severity]}`}>
                  {translateSeverity(item.severity, isEnglish)}
                </span>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <p className='font-semibold leading-tight text-foreground'>{translateNotificationTitle(item.title, isEnglish)}</p>
                    {item.count && item.count > 1 ? (
                      <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'>
                        {item.count}
                      </span>
                    ) : null}
                  </div>
                  <p className='mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground'>
                    {translateNotificationSummary(item.summary, isEnglish)}
                  </p>
                </div>
                <ChevronRight className='mt-1 h-4 w-4 shrink-0 text-muted-foreground' />
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <div className='grid grid-cols-1 gap-1 p-2 sm:grid-cols-2'>
          <button
            type='button'
            className='flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
            onClick={loadNotifications}
          >
            <AlertCircle className='h-3.5 w-3.5' />
            {tx('Actualizar', 'Refresh')}
          </button>
          <button
            type='button'
            className='flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 dark:text-sky-200 dark:hover:bg-sky-950/40'
            onClick={() => handleNavigate('/dashboard/notificaciones')}
          >
            {tx('Ver centro completo', 'View full center')}
            <ChevronRight className='h-3.5 w-3.5' />
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
