'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import Tabs from '@/components/ficha-medica/Tabs';
import type { Usuario } from '@/interfaces/usuario.interface';

export default function FichaMedicaPage() {
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

  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  const profileUser: Partial<Usuario> = {
    nombre: user?.nombre || user?.nombre_completo || '',
    email: user?.email || user?.correo || '',
    creado_en: user?.creado_en || user?.created_at || user?.createdAt || '',
    foto: user?.foto || user?.avatar || user?.image || null,
    rol: user?.rol || user?.role || '',
  };

  const socioId = user?.id ?? user?.usuario_id ?? user?.usuario ?? undefined;

  return (
    <SidebarProvider>
      <div className='flex w-full min-h-screen'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Ficha médica' />
          <main className='flex-1 p-6 space-y-6'>
            <div className='p-6 rounded-md shadow page-bg'>
              <h2 className='mb-4 text-xl font-semibold'>Ficha médica</h2>
              <Tabs socioId={socioId} />
            </div>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
