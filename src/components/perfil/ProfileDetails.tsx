'use client';

import type { Usuario } from '@/interfaces/usuario.interface';
import { formatFrontendDate } from '@/utils/dateFormat';

export default function ProfileDetails({
  user,
}: {
  user?: Partial<Usuario> | null;
}) {
  const formatDate = (d?: string | Date | null) => {
    if (!d) return '-';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (!date || isNaN(date.getTime())) return '-';
    return formatFrontendDate(date);
  };

  return (
    <div className='flex flex-col gap-2'>
      <div className='text-lg font-semibold truncate text-foreground'>
        {user?.nombre ?? 'Nombre no disponible'}
      </div>
      <div className='text-sm text-muted-foreground'>
        Creado: {formatDate(user?.creado_en)}
      </div>
      <div className='text-sm break-words text-foreground'>
        {user?.email ?? 'Email no disponible'}
      </div>
      <div className='mt-2'>
        <div className='mb-1 text-xs text-muted-foreground'>Contraseña</div>
        <div className='w-full p-2 mt-1 rounded-md bg-muted'>********</div>
      </div>
    </div>
  );
}
