import Image from 'next/image';
import { useEffect, useState } from 'react';

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
  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => {}, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm'>
      <div
        className={`transform transition-all duration-500 ease-out ${
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } w-full max-w-3xl`}
      >
        <div className='bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden'>
          <div className='flex flex-col md:flex-row items-center gap-6 p-8 md:p-12'>
            <div className='flex-shrink-0 w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center'>
              {foto ? (
                <Image
                  src={foto}
                  alt={nombre || 'Socio'}
                  width={224}
                  height={224}
                  className='object-cover w-full h-full'
                />
              ) : (
                <div className='text-slate-400 text-sm'>Sin foto</div>
              )}
            </div>
            <div className='flex-1 text-center md:text-left'>
              <h1 className='text-4xl md:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white'>
                ¡Bienvenido{nombre ? `, ${nombre}` : '!'}
              </h1>
              <p className='mt-3 text-lg text-slate-600 dark:text-slate-300'>
                Asistencia registrada correctamente
              </p>
              <div className='mt-6 flex items-center justify-center md:justify-start gap-3'>
                <button
                  onClick={onClose}
                  className='px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow'
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
