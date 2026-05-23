import { useRef } from 'react';
import ProfileImage from '@/components/perfil/ProfileImage';

type BienvenidaVariant = 'success' | 'debt' | 'inactive';

type BienvenidaSocioProps = {
  foto?: string | null;
  nombre?: string;
  onClose?: () => void;
  isAdminView?: boolean;
  id_socio?: string;
  qrCode?: string;
  variant?: BienvenidaVariant;
  message?: string | null;
};

const variantStyles: Record<
  BienvenidaVariant,
  {
    panel: string;
    badge: string;
    title: string;
    text: string;
    button: string;
  }
> = {
  success: {
    panel: 'bg-white dark:bg-slate-900',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    title: 'text-slate-900 dark:text-white',
    text: 'text-slate-600 dark:text-slate-300',
    button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  debt: {
    panel: 'bg-red-50 dark:bg-red-950 border-2 border-red-300 dark:border-red-700',
    badge: 'bg-red-100 text-red-700 border-red-300',
    title: 'text-red-800 dark:text-red-100',
    text: 'text-red-700 dark:text-red-200',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
  inactive: {
    panel: 'bg-amber-50 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    title: 'text-amber-900 dark:text-amber-100',
    text: 'text-amber-800 dark:text-amber-200',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
};

export default function BienvenidaSocio({
  foto,
  nombre,
  onClose,
  isAdminView = false,
  id_socio,
  variant = 'success',
  message,
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
  const styles = variantStyles[variant];

  const title =
    variant === 'inactive'
      ? 'Socio desactivado'
      : variant === 'debt'
      ? 'Cuota pendiente'
      : isAdminView
      ? `¡Socio accedió! ${displayNombre}`
      : `¡Bienvenido, ${displayNombre}`;

  const description =
    message ||
    (variant === 'inactive'
      ? 'Regularice su situación en administración para poder registrar el ingreso.'
      : variant === 'debt'
      ? 'Usted adeuda la cuota correspondiente. Regularice su situación en administración.'
      : isAdminView
      ? 'Un socio ha registrado su asistencia'
      : 'Asistencia registrada correctamente');

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm'>
      <div className='w-full max-w-3xl'>
        <div className={`overflow-hidden shadow-2xl rounded-2xl ${styles.panel}`}>
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
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles.badge}`}
              >
                {variant === 'inactive'
                  ? 'Acceso bloqueado'
                  : variant === 'debt'
                  ? 'Atención requerida'
                  : 'Acceso permitido'}
              </span>

              <h1 className={`mt-4 text-4xl font-extrabold leading-tight md:text-5xl ${styles.title}`}>
                {title}
              </h1>

              <p className={`mt-3 text-lg font-medium ${styles.text}`}>{description}</p>

              {isAdminView && displayIdSocio && (
                <div className='p-3 mt-4 rounded-lg bg-white/70 dark:bg-slate-800/70'>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    <strong>ID Socio:</strong> {displayIdSocio}
                  </p>
                </div>
              )}

              {!isAdminView && (
                <div className='flex items-center justify-center gap-3 mt-6 md:justify-start'>
                  <button
                    onClick={handleClose}
                    className={`px-6 py-3 font-semibold rounded-lg shadow ${styles.button}`}
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
