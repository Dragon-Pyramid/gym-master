'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';
import { useAuthStore } from '@/stores/authStore';

interface SidebarLogoutButtonProps {
  isMobile: boolean;
  closeSidebar: () => void;
}

export const SidebarLogoutButton: React.FC<SidebarLogoutButtonProps> = ({
  isMobile,
  closeSidebar,
}) => {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();

    if (isMobile) {
      closeSidebar();
    }

    router.push('/auth/login');
  };

  return (
    <div className='mt-auto border-t border-sidebar-border/60 px-2 pb-4 pt-3'>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            type='button'
            onClick={handleLogout}
            className='flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground'
            title='Cerrar sesión'
            aria-label='Cerrar sesión'
          >
            <LogOut className='h-4 w-4' aria-hidden='true' />
            <span>Cerrar sesión</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
};
