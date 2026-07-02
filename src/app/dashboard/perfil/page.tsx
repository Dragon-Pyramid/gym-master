'use client';

import { useEffect, useMemo, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ClipboardList,
  CreditCard,
  HeartPulse,
  KeyRound,
  MessageCircle,
  Settings,
  ShieldCheck,
  Utensils,
  Dumbbell,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProfileCard from '@/components/perfil/ProfileCard';
import type { Usuario } from '@/interfaces/usuario.interface';

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
};

const socioActions: QuickAction[] = [
  {
    title: 'Ficha médica',
    description: 'Actualizá salud, apto y antecedentes.',
    href: '/dashboard/ficha-medica',
    icon: HeartPulse,
    tone: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/60 dark:text-rose-100 dark:border-rose-700/70',
  },
  {
    title: 'Rutinas',
    description: 'Revisá tu plan de entrenamiento.',
    href: '/dashboard/rutinas',
    icon: Dumbbell,
    tone: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-700/60',
  },
  {
    title: 'Dietas',
    description: 'Consultá tu alimentación asignada.',
    href: '/dashboard/dietas',
    icon: Utensils,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-700/60',
  },
  {
    title: 'Evolución',
    description: 'Mirá tus cambios físicos.',
    href: '/dashboard/evolucion-fisica',
    icon: TrendingUp,
    tone: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/60 dark:text-violet-100 dark:border-violet-700/70',
  },
  {
    title: 'Pagos',
    description: 'Estado de cuota y recibos.',
    href: '/dashboard/mi-cuenta/historial-pagos',
    icon: CreditCard,
    tone: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-700/60',
  },
  {
    title: 'Mensajes',
    description: 'Contactá a administración.',
    href: '/dashboard/mensajes',
    icon: MessageCircle,
    tone: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-100 dark:border-indigo-700/60',
  },
];

const staffActions: QuickAction[] = [
  {
    title: 'Preferencias',
    description: 'Ajustes personales del panel.',
    href: '/dashboard/settings/preferences',
    icon: Settings,
    tone: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-700/60',
  },
  {
    title: 'Contraseña',
    description: 'Cambiá tu clave de acceso.',
    href: '/auth/change-password',
    icon: KeyRound,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-700/60',
  },
  {
    title: 'Notificaciones',
    description: 'Revisá novedades del sistema.',
    href: '/dashboard/notificaciones',
    icon: Bell,
    tone: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/60 dark:text-violet-100 dark:border-violet-700/70',
  },
  {
    title: 'Dashboard',
    description: 'Volver al inicio operativo.',
    href: '/dashboard',
    icon: ClipboardList,
    tone: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-700/60',
  },
];

function roleLabel(rol?: string | null) {
  if (rol === 'socio') return 'Socio';
  if (rol === 'admin') return 'Administrador';
  if (rol === 'usuario') return 'Usuario interno';
  return 'Usuario';
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;

  return (
    <a
      href={action.href}
      className={`group flex min-h-[116px] flex-col justify-between rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${action.tone}`}
    >
      <div className='flex items-center justify-between gap-3'>
        <span className='rounded-2xl bg-white/70 p-2 shadow-sm ring-1 ring-black/5 dark:bg-slate-950/40'>
          <Icon className='h-5 w-5' />
        </span>
        <span className='text-[11px] font-bold uppercase tracking-[0.18em] text-current/90'>
          Abrir
        </span>
      </div>
      <div className='mt-4'>
        <h3 className='text-base font-black leading-tight'>{action.title}</h3>
        <p className='mt-1 text-xs leading-5 text-current/90'>{action.description}</p>
      </div>
    </a>
  );
}

export default function PerfilPage() {
  const { isAuthenticated, initializeAuth, isInitialized, user } =
    useAuthStore() as any;
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  const profileUser: Partial<Usuario> = useMemo(
    () => ({
      id: user?.id || user?.sub || '',
      nombre: user?.nombre || user?.nombre_completo || '',
      email: user?.email || user?.correo || '',
      creado_en: user?.creado_en || user?.created_at || user?.createdAt || '',
      foto: user?.foto || user?.avatar || user?.image || null,
      rol: user?.rol || user?.role || '',
      dni: user?.dni ?? null,
      must_change_password: Boolean(user?.must_change_password),
      password_actualizado_en: user?.password_actualizado_en ?? null,
      ultimo_login_en: user?.ultimo_login_en ?? null,
    }),
    [user]
  );

  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  const isSocio = profileUser.rol === 'socio';
  const actions = isSocio ? socioActions : staffActions;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset className='!grid !min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto]'>
          <AppHeader title='Mi perfil' />
          <section className='min-h-0 space-y-5 bg-gradient-to-b from-sky-50/70 via-background to-background px-4 py-4 sm:px-6 md:space-y-6 md:p-6 dark:from-sky-950/10'>
            <div className='mx-auto w-full max-w-5xl space-y-5 md:space-y-6'>
              <div className='overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-sm dark:border-sky-900/60 dark:bg-slate-950/80'>
                <div className='relative isolate p-5 sm:p-6 md:p-8'>
                  <div className='absolute -right-12 -top-12 h-36 w-36 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/20' />
                  <div className='absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-700/15' />
                  <div className='relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                    <div className='min-w-0'>
                      <p className='inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900/70'>
                        <UserRound className='h-3.5 w-3.5' />
                        Perfil personal
                      </p>
                      <h1 className='mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl dark:text-white'>
                        {profileUser.nombre || 'Mi cuenta'}
                      </h1>
                      <p className='mt-2 max-w-2xl text-sm leading-6 text-muted-foreground'>
                        Revisá tus datos principales, actualizá tu foto y accedé rápido a las secciones más importantes de tu cuenta.
                      </p>
                    </div>
                    <div className='flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-emerald-200'>
                      <ShieldCheck className='h-4 w-4' />
                      Cuenta activa · {roleLabel(profileUser.rol)}
                    </div>
                  </div>
                </div>
              </div>

              <ProfileCard user={profileUser} size={128} />

              <div className='rounded-[2rem] border border-border bg-white p-4 shadow-sm dark:bg-slate-950/80 sm:p-5'>
                <div className='mb-4 flex items-center justify-between gap-3'>
                  <div>
                    <h2 className='text-lg font-black'>Accesos rápidos</h2>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      Atajos útiles para completar tu perfil y continuar usando Gym Master desde el celular.
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6'>
                  {actions.map((action) => (
                    <QuickActionCard key={action.href} action={action} />
                  ))}
                </div>
              </div>

              <div className='rounded-[2rem] border border-amber-100 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100 sm:p-5'>
                <div className='flex items-start gap-3'>
                  <ShieldCheck className='mt-0.5 h-5 w-5 shrink-0' />
                  <div>
                    <p className='font-bold'>Recomendación de seguridad</p>
                    <p className='mt-1'>
                      Si compartís este dispositivo o cambiaste tu clave inicial recientemente, usá “Cambiar contraseña” desde Preferencias o desde el engranaje superior.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
