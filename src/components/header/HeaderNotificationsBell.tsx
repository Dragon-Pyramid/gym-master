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

export function HeaderNotificationsBell() {
  const router = useRouter();
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
      if (!response.ok) throw new Error(json?.error || 'No se pudieron cargar notificaciones');

      setPayload(json?.data ?? { total: 0, items: [], generated_at: new Date().toISOString() });
    } catch {
      setPayload({ total: 0, items: [], generated_at: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

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
          aria-label={total > 0 ? `Notificaciones pendientes: ${total}` : 'Notificaciones'}
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
          <span>Notificaciones</span>
          {loading ? <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' /> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {items.length === 0 ? (
          <div className='flex items-start gap-3 px-4 py-5 text-sm text-muted-foreground'>
            <CheckCircle2 className='mt-0.5 h-5 w-5 text-emerald-600' />
            <div>
              <p className='font-medium text-foreground'>Sin pendientes críticos</p>
              <p>Cuando haya cuotas, mensajes, stock o mantenimientos pendientes, aparecerán acá.</p>
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
                  {item.severity}
                </span>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <p className='font-semibold leading-tight text-foreground'>{item.title}</p>
                    {item.count && item.count > 1 ? (
                      <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'>
                        {item.count}
                      </span>
                    ) : null}
                  </div>
                  <p className='mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground'>
                    {item.summary}
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
            Actualizar
          </button>
          <button
            type='button'
            className='flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 dark:text-sky-200 dark:hover:bg-sky-950/40'
            onClick={() => handleNavigate('/dashboard/notificaciones')}
          >
            Ver centro completo
            <ChevronRight className='h-3.5 w-3.5' />
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
