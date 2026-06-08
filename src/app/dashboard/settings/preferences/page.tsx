'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Dumbbell, Lock, Mail, MessageSquare, Moon, ShieldCheck, UserCog } from 'lucide-react';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/authStore';

type PreferenceState = {
  emailNotifications: boolean;
  systemNotifications: boolean;
  monthlySummary: boolean;
  trainingReminders: boolean;
  darkPreference: boolean;
};

const STORAGE_KEY = 'gym-master-user-preferences-v1';

export default function PreferencesPage() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth, isInitialized, user } = useAuthStore();
  const [preferences, setPreferences] = useState<PreferenceState>({
    emailNotifications: true,
    systemNotifications: true,
    monthlySummary: true,
    trainingReminders: user?.rol === 'socio',
    darkPreference: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPreferences((current) => ({ ...current, ...JSON.parse(raw) }));
      }
    } catch {
      // Preferencias locales no críticas.
    }
  }, []);

  const roleLabel = useMemo(() => {
    if (user?.rol === 'admin') return 'Administrador';
    if (user?.rol === 'usuario') return 'Usuario interno';
    return 'Socio';
  }, [user?.rol]);

  const roleCards = useMemo(() => {
    if (user?.rol === 'admin') {
      return [
        {
          icon: <ShieldCheck className='h-5 w-5 text-blue-600' />,
          title: 'Administración',
          description: 'Accesos rápidos a parametrización, notificaciones y datos del gimnasio.',
          action: 'Ir a parametrización',
          href: '/dashboard/parametrizacion',
        },
        {
          icon: <Bell className='h-5 w-5 text-orange-600' />,
          title: 'Alertas operativas',
          description: 'Controlá avisos, promociones, stock crítico y comunicaciones.',
          action: 'Ver notificaciones',
          href: '/dashboard/notificaciones',
        },
      ];
    }

    if (user?.rol === 'usuario') {
      return [
        {
          icon: <UserCog className='h-5 w-5 text-blue-600' />,
          title: 'Preferencias operativas',
          description: 'Mantené tus datos y accesos personales actualizados.',
          action: 'Editar perfil',
          href: '/dashboard/perfil',
        },
        {
          icon: <MessageSquare className='h-5 w-5 text-green-600' />,
          title: 'Comunicación interna',
          description: 'Consultá mensajes o avisos asignados por la administración.',
          action: 'Ver inicio',
          href: '/dashboard',
        },
      ];
    }

    return [
      {
        icon: <Dumbbell className='h-5 w-5 text-blue-600' />,
        title: 'Entrenamiento',
        description: 'Accedé a rutinas, dietas, evolución física y mensajes con el gimnasio.',
        action: 'Ir a rutinas',
        href: '/dashboard/rutinas/asistente',
      },
      {
        icon: <Mail className='h-5 w-5 text-green-600' />,
        title: 'Comunicaciones',
        description: 'Recibí avisos importantes sobre cuotas, promociones y novedades.',
        action: 'Ver mensajes',
        href: '/dashboard/mensajes',
      },
    ];
  }, [user?.rol]);

  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  const updatePreference = (key: keyof PreferenceState, value: boolean) => {
    setSaved(false);
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const savePreferences = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    setSaved(true);
  };

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Preferencias' />
          <main className='flex-1 space-y-6 p-6'>
            <section className='rounded-xl border bg-background p-6 shadow-sm'>
              <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>{roleLabel}</p>
                  <h2 className='text-2xl font-bold'>Preferencias personales</h2>
                  <p className='mt-2 max-w-3xl text-sm text-muted-foreground'>
                    Esta pantalla centraliza configuraciones personales simples. Las preferencias avanzadas por gimnasio se mantienen en Parametrización y Datos del Gimnasio.
                  </p>
                </div>
                {saved ? (
                  <div className='rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300'>
                    Preferencias guardadas en este dispositivo.
                  </div>
                ) : null}
              </div>
            </section>

            <section className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              {roleCards.map((card) => (
                <div key={card.title} className='rounded-xl border bg-background p-5 shadow-sm'>
                  <div className='flex items-start gap-3'>
                    <div className='rounded-lg bg-muted p-2'>{card.icon}</div>
                    <div>
                      <h3 className='font-semibold'>{card.title}</h3>
                      <p className='mt-1 text-sm text-muted-foreground'>{card.description}</p>
                      <button
                        type='button'
                        onClick={() => router.push(card.href)}
                        className='mt-3 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted'
                      >
                        {card.action}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className='rounded-xl border bg-background p-6 shadow-sm'>
              <h3 className='text-lg font-semibold'>Notificaciones y experiencia</h3>
              <p className='mt-1 text-sm text-muted-foreground'>
                Preferencias iniciales guardadas localmente. Más adelante podrán persistirse por usuario en base de datos.
              </p>
              <div className='mt-5 grid grid-cols-1 gap-3 md:grid-cols-2'>
                <PreferenceToggle
                  label='Recibir notificaciones del sistema'
                  description='Avisos dentro de Gym Master.'
                  checked={preferences.systemNotifications}
                  onChange={(checked) => updatePreference('systemNotifications', checked)}
                />
                <PreferenceToggle
                  label='Recibir emails operativos'
                  description='Cuotas, recibos, avisos y novedades.'
                  checked={preferences.emailNotifications}
                  onChange={(checked) => updatePreference('emailNotifications', checked)}
                />
                <PreferenceToggle
                  label='Resumen mensual'
                  description='Indicadores relevantes según tu rol.'
                  checked={preferences.monthlySummary}
                  onChange={(checked) => updatePreference('monthlySummary', checked)}
                />
                <PreferenceToggle
                  label='Recordatorios de entrenamiento'
                  description='Útil para socios con rutinas activas.'
                  checked={preferences.trainingReminders}
                  onChange={(checked) => updatePreference('trainingReminders', checked)}
                />
                <PreferenceToggle
                  label='Preferir modo oscuro'
                  description='El cambio visual inmediato se realiza desde el icono sol/luna.'
                  checked={preferences.darkPreference}
                  onChange={(checked) => updatePreference('darkPreference', checked)}
                  icon={<Moon className='h-4 w-4' />}
                />
              </div>
              <div className='mt-6 flex flex-col gap-2 md:flex-row md:justify-end'>
                <button
                  type='button'
                  onClick={() => router.push('/auth/change-password')}
                  className='rounded-md border px-4 py-2 font-medium hover:bg-muted'
                >
                  Cambiar contraseña
                </button>
                <button
                  type='button'
                  onClick={savePreferences}
                  className='rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700'
                >
                  Guardar preferencias
                </button>
              </div>
            </section>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className='flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 hover:bg-muted/40'>
      <span className='flex items-start gap-3'>
        <span className='mt-0.5 rounded-md bg-muted p-2'>{icon ?? <Bell className='h-4 w-4' />}</span>
        <span>
          <span className='block font-medium'>{label}</span>
          <span className='mt-1 block text-sm text-muted-foreground'>{description}</span>
        </span>
      </span>
      <input
        type='checkbox'
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className='mt-1 h-5 w-5'
      />
    </label>
  );
}
