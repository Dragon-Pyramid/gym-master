import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { getSocioByIdUsuario } from '@/services/socioService';
import { Socio } from '@/interfaces/socio.interface';

type BienvenidaSocioProps = {
  foto?: string | null;
  nombre?: string;
  onClose?: () => void;
};

export default function BienvenidaSocio({
  foto,
  nombre,
  onClose,
}: BienvenidaSocioProps) {
  const [mounted, setMounted] = useState(false);
  const [socioData, setSocioData] = useState<Socio | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const redirectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setMounted(true);
    const fetchSocioData = async () => {
      if (!user || !user.id || !user.dbName) return;

      setLoading(true);
      try {
        const socio = await getSocioByIdUsuario(user.id, user.dbName);
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
  }, [user]);

  useEffect(() => {
    if (mounted && socioData) {
      redirectTimeoutRef.current = setTimeout(() => {
        router.push('/dashboard');
      }, 5000);
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [mounted, socioData, router]);

  const handleClose = () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    onClose?.();
  };

  const displayNombre = socioData?.nombre_completo || nombre || 'Socio';
  const displayFoto = socioData?.foto || foto;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm'>
      <div
        className={`transform transition-all duration-500 ease-out ${
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } w-full max-w-3xl`}
      >
        <div className='overflow-hidden bg-white shadow-2xl dark:bg-slate-900 rounded-2xl'>
          <div className='flex flex-col items-center gap-6 p-8 md:flex-row md:p-12'>
            <div className='flex items-center justify-center flex-shrink-0 w-40 h-40 overflow-hidden bg-gray-100 rounded-full md:w-56 md:h-56'>
              {loading ? (
                <div className='w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin'></div>
              ) : displayFoto ? (
                <Image
                  src={displayFoto}
                  alt={displayNombre}
                  width={224}
                  height={224}
                  className='object-cover w-full h-full'
                />
              ) : (
                <div className='text-sm text-slate-400'>Sin foto</div>
              )}
            </div>
            <div className='flex-1 text-center md:text-left'>
              <h1 className='text-4xl font-extrabold leading-tight md:text-5xl text-slate-900 dark:text-white'>
                ¡Bienvenido{displayNombre ? `, ${displayNombre}` : '!'}
              </h1>
              <p className='mt-3 text-lg text-slate-600 dark:text-slate-300'>
                Asistencia registrada correctamente
              </p>
              {socioData && (
                <div className='p-3 mt-4 rounded-lg bg-gray-50 dark:bg-slate-800'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    <strong>ID Socio:</strong> {socioData.id_socio}
                  </p>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    <strong>Estado:</strong>{' '}
                    {socioData.activo ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              )}
              <div className='flex items-center justify-center gap-3 mt-6 md:justify-start'>
                <button
                  onClick={handleClose}
                  className='px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700'
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
