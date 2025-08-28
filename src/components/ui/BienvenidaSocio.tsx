import { useRef } from 'react';
import ProfileImage from '@/components/perfil/ProfileImage';

type BienvenidaSocioProps = {
  foto?: string | null;
  nombre?: string;
  onClose?: () => void;
  isAdminView?: boolean;
  id_socio?: string;
  qrCode?: string;
};

export default function BienvenidaSocio({
  foto,
  nombre,
  onClose,
  isAdminView = false,
  id_socio,
}: BienvenidaSocioProps) {
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    onClose?.();
  };

  const displayNombre = nombre || 'Socio';
  const displayFoto = foto;
  const displayIdSocio = id_socio;

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm'>
      <div className='w-full max-w-3xl'>
        <div className='overflow-hidden bg-white shadow-2xl dark:bg-slate-900 rounded-2xl'>
          <div className='flex flex-col items-center gap-6 p-8 md:flex-row md:p-12'>
            <div className='flex items-center justify-center flex-shrink-0'>
              <ProfileImage
                foto={displayFoto}
                alt={displayNombre}
                size={224}
                showButton={false}
                onClick={handleClose}
              />
            </div>
            <div className='flex-1 text-center md:text-left'>
              <h1 className='text-4xl font-extrabold leading-tight md:text-5xl text-slate-900 dark:text-white'>
                {isAdminView ? '¡Socio accedió!' : '¡Bienvenido'}
                {displayNombre && !isAdminView
                  ? `, ${displayNombre}`
                  : isAdminView
                  ? ` ${displayNombre}`
                  : '!'}
              </h1>
              <p className='mt-3 text-lg text-slate-600 dark:text-slate-300'>
                {isAdminView
                  ? 'Un socio ha registrado su asistencia'
                  : 'Asistencia registrada correctamente'}
              </p>
              {isAdminView && displayIdSocio && (
                <div className='p-3 mt-4 rounded-lg bg-gray-50 dark:bg-slate-800'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    <strong>ID Socio:</strong> {displayIdSocio}
                  </p>
                </div>
              )}
              {!isAdminView && (
                <div className='flex items-center justify-center gap-3 mt-6 md:justify-start'>
                  <button
                    onClick={handleClose}
                    className='px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700'
                  >
                    Continuar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
