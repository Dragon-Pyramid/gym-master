'use client';

import ProfileImage from './ProfileImage';
import ProfileDetails from './ProfileDetails';
import type { Usuario } from '@/interfaces/usuario.interface';

export default function ProfileCard({
  user,
  size = 96,
}: {
  user?: Partial<Usuario> | null;
  size?: number;
}) {
  return (
    <div className='w-full max-w-3xl mx-auto p-6 rounded-lg bg-card border-border shadow-sm'>
      <div className='flex items-center gap-6'>
        <ProfileImage
          src={user?.foto ?? null}
          alt={user?.nombre ?? 'Avatar'}
          size={size}
        />
        <div className='flex-1'>
          <div className='flex items-center justify-between gap-4'>
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
