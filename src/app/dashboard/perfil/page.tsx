'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProfileCard from '@/components/perfil/ProfileCard';
import type { Usuario } from '@/interfaces/usuario.interface';

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

  return (
    <SidebarProvider>
      <div className='flex w-full min-h-screen'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Perfil' />
          <main className='flex-1 p-6 space-y-6'>
            <ProfileCard user={profileUser} size={120} />
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
