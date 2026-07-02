'use client';

import type { ComponentType } from 'react';
import { CalendarClock, Fingerprint, KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import type { Usuario } from '@/interfaces/usuario.interface';
import { formatFrontendDate } from '@/utils/dateFormat';

function formatDate(d?: string | Date | null) {
  if (!d) return 'No registrado';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (!date || isNaN(date.getTime())) return 'No registrado';
  return formatFrontendDate(date);
}

function roleLabel(rol?: string | null) {
  if (rol === 'socio') return 'Socio';
  if (rol === 'admin') return 'Administrador';
  if (rol === 'usuario') return 'Usuario interno';
  return 'Usuario';
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className='rounded-2xl border border-border bg-background p-4 shadow-sm'>
      <div className='flex items-center gap-2 text-muted-foreground'>
        <Icon className='h-4 w-4' />
        <span className='text-[11px] font-bold uppercase tracking-[0.18em]'>{label}</span>
      </div>
      <p className='mt-2 break-words text-sm font-semibold text-foreground'>
        {value || 'No registrado'}
      </p>
    </div>
  );
}

export default function ProfileDetails({
  user,
}: {
  user?: Partial<Usuario> | null;
}) {
  const passwordStatus = user?.must_change_password
    ? 'Cambio pendiente'
    : user?.password_actualizado_en
      ? `Actualizada: ${formatDate(user.password_actualizado_en)}`
      : 'Sin cambio reciente registrado';

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-black text-foreground'>Datos de cuenta</h3>
        <p className='mt-1 text-sm leading-6 text-muted-foreground'>
          Información principal de tu usuario dentro de Gym Master.
        </p>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <DetailItem icon={UserRound} label='Nombre' value={user?.nombre} />
        <DetailItem icon={Mail} label='Email' value={user?.email} />
        <DetailItem icon={ShieldCheck} label='Rol' value={roleLabel(user?.rol)} />
        <DetailItem icon={Fingerprint} label='DNI' value={user?.dni ?? null} />
        <DetailItem icon={CalendarClock} label='Alta de cuenta' value={formatDate(user?.creado_en)} />
        <DetailItem icon={KeyRound} label='Contraseña' value={passwordStatus} />
      </div>
    </div>
  );
}
