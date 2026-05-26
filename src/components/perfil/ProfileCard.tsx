'use client';

import ProfileImage from './ProfileImage';
import ProfileDetails from './ProfileDetails';
import type { Usuario } from '@/interfaces/usuario.interface';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileCard({
  user,
  size = 96,
}: {
  user?: Partial<Usuario> | null;
  size?: number;
}) {
  const updateUser = useAuthStore((state) => state.updateUser);

  const handlePhotoUpload = (data: any) => {
    const url = data?.url || data?.foto || data?.path || null;
    if (url) {
      updateUser({ foto: url });
    }
  };

  return (
    <div className='w-full max-w-3xl p-6 mx-auto border rounded-lg bg-card border-border shadow-sm'>
      <div className='flex flex-col items-center gap-6 md:flex-row md:items-start'>
        <ProfileImage
          src={user?.foto ?? null}
          alt={user?.nombre ?? 'Avatar'}
          size={size}
          onUpload={handlePhotoUpload}
        />
        <div className='flex-1 w-full text-center md:text-left'>
          <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
            <div>
              <div className='text-2xl font-bold text-foreground'>
                Bienvenido, {user?.nombre ?? 'Usuario'}
              </div>
              <div className='mt-1 text-sm text-muted-foreground'>
                {user?.rol
                  ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1)
                  : 'Miembro'}
              </div>
            </div>
          </div>
          <div className='mt-4'>
            <ProfileDetails user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
