import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { getSocioByIdUsuario, getSocioById } from '@/services/socioService';
import { Socio } from '@/interfaces/socio.interface';
import ProfileImage from '@/components/perfil/ProfileImage';

type BienvenidaSocioProps = {
  foto?: string | null;
  nombre?: string;
  onClose?: () => void;
  isAdminView?: boolean;
  id_socio?: string;
};

export default function BienvenidaSocio({
  foto,
  nombre,
  onClose,
  isAdminView = false,
  id_socio,
}: BienvenidaSocioProps) {
  const [mounted, setMounted] = useState(false);
  const [socioData, setSocioData] = useState<Socio | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);

    const fetchSocioData = async () => {
      if (!user?.dbName) return;

      setLoading(true);
      try {
        let socio: Socio | null = null;

        if (!isAdminView) {
          if (user?.id) {
            socio = await getSocioByIdUsuario(user.id, user.dbName);
          }
        } else {
          if (id_socio) {
            socio = await getSocioById(id_socio, user.dbName);
          }
        }

        if (socio) {
          setSocioData(socio);
        }
      } catch (error) {
        console.error('Error al obtener datos del socio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocioData();
  }, [user, isAdminView, id_socio]);

  useEffect(() => {
    if (mounted && socioData && !isAdminView) {
      redirectTimeoutRef.current = setTimeout(() => {
        const redirectUrl =
          user?.rol === 'admin' ? '/dashboard?qr=open' : '/dashboard';
        router.push(redirectUrl);
      }, 5000);
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [mounted, socioData, router, user?.rol, isAdminView]);

  const handleClose = () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    onClose?.();
  };

  const displayNombre = socioData?.nombre_completo || nombre || 'Socio';
  const displayFoto =
    (socioData &&
      'usuario_id' in socioData &&
      (socioData.usuario_id as { foto?: string })?.foto) ||
    (socioData as { foto?: string })?.foto ||
    foto;
  const displayIdSocio = isAdminView ? id_socio : socioData?.id_socio;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm'>
      <div
        className={`transform transition-all duration-500 ease-out ${
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } w-full max-w-3xl`}
      >
        <div className='overflow-hidden bg-white shadow-2xl dark:bg-slate-900 rounded-2xl'>
          <div className='flex flex-col items-center gap-6 p-8 md:flex-row md:p-12'>
            <div className='flex items-center justify-center flex-shrink-0'>
              {loading ? (
                <div className='w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin'></div>
              ) : (
                <ProfileImage
                  foto={displayFoto}
                  alt={displayNombre}
                  size={224}
                  showButton={false}
                  onClick={handleClose}
                />
              )}
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
              {(socioData || (isAdminView && displayIdSocio)) && (
                <div className='p-3 mt-4 rounded-lg bg-gray-50 dark:bg-slate-800'>
                  {displayIdSocio && (
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      <strong>ID Socio:</strong> {displayIdSocio}
                    </p>
                  )}
                  {socioData?.activo !== undefined && (
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      <strong>Estado:</strong>{' '}
                      {socioData.activo ? 'Activo' : 'Inactivo'}
                    </p>
                  )}
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
