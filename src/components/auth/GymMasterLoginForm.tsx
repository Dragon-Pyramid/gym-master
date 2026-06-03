'use client';

import { useState, FormEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import {
  Sun,
  Moon,
  Check,
  ChevronsUpDown,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type LoginRole = 'admin' | 'socio' | 'usuario';

const roleLabels: Record<LoginRole, string> = {
  admin: 'Administrador',
  socio: 'Socio',
  usuario: 'Usuario interno',
};

const allUserTypes: Array<{ value: LoginRole; label: string }> = [
  {
    value: 'admin',
    label: 'Administrador',
  },
  {
    value: 'socio',
    label: 'Socio',
  },
  {
    value: 'usuario',
    label: 'Usuario interno',
  },
];

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersSystem = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const initial = saved ? saved === 'dark' : prefersSystem;
    setDark(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { dark, toggle };
}

type GymMasterLoginFormProps = {
  title: string;
  description: string;
  lockedRole?: LoginRole;
  allowedRoles?: LoginRole[];
  defaultRole?: LoginRole;
  backHref?: string;
  backLabel?: string;
};

export default function GymMasterLoginForm({
  title,
  description,
  lockedRole,
  allowedRoles = ['admin', 'socio', 'usuario'],
  defaultRole,
  backHref = '/auth/login',
  backLabel = 'Volver',
}: GymMasterLoginFormProps) {
  const router = useRouter();
  const {
    login: authLogin,
    isLoading,
    error,
    isAuthenticated,
    initializeAuth,
    clearError,
    isInitialized,
  } = useAuthStore();

  const initialRole = lockedRole ?? defaultRole ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<LoginRole | ''>(initialRole);
  const [userTypeOpen, setUserTypeOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAlert, setLoginAlert] = useState<string | null>(null);
  const { dark, toggle } = useDarkMode();

  const userTypes = allUserTypes.filter((type) =>
    allowedRoles.includes(type.value)
  );
  const shouldShowRoleSelector = !lockedRole && userTypes.length > 1;
  const recoveryRole = lockedRole ?? userType ?? defaultRole ?? '';
  const forgotPasswordHref = recoveryRole
    ? `/auth/forgot-password?rol=${encodeURIComponent(recoveryRole)}`
    : '/auth/forgot-password';

  useEffect(() => {
    initializeAuth();
    if (isInitialized && isAuthenticated) {
      const currentUser = useAuthStore.getState().user;
      router.push(currentUser?.must_change_password ? '/auth/change-password' : '/dashboard');
    }
  }, [initializeAuth, isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (error) {
      setLoginAlert(error);
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginAlert(null);

    const selectedRole = lockedRole ?? userType;

    if (!email.trim()) {
      toast.error('El campo Usuario es obligatorio');
      return;
    }

    if (!password.trim()) {
      toast.error('El campo Contraseña es obligatorio');
      return;
    }

    if (!selectedRole) {
      toast.error('Debe seleccionar un tipo de usuario');
      return;
    }

    if (!allowedRoles.includes(selectedRole)) {
      toast.error('El tipo de usuario seleccionado no corresponde a esta pantalla');
      return;
    }

    const result = await authLogin({
      email: email.trim(),
      password: password.trim(),
      rol: selectedRole,
    });

    if (result.success) {
      if (result.mustChangePassword) {
        toast.info('Por seguridad, debés cambiar tu contraseña inicial.');
        router.push('/auth/change-password');
        return;
      }

      toast.success('Inicio de sesión exitoso');
      router.push('/dashboard');
    }
  };

  return (
    <div className='relative inset-0 flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4'>
      <div className='absolute left-4 top-4'>
        <Button variant='ghost' asChild>
          <Link href={backHref}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            {backLabel}
          </Link>
        </Button>
      </div>

      <div className='absolute right-4 top-4'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-foreground'
                onClick={toggle}
                aria-label='Cambiar modo claro/oscuro'
              >
                {dark ? (
                  <Moon className='size-7' />
                ) : (
                  <Sun className='size-7' />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {dark ? 'Modo claro' : 'Modo oscuro'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className='text-center'>
        <div className='relative mx-auto h-52 w-52 md:h-64 md:w-64'>
          <Image
            src='/gm_logo.svg'
            alt='Gym Master Logo'
            fill
            className='object-contain dark:invert'
            priority
          />
        </div>
      </div>

      <div className='w-full max-w-[400px]'>
        <Card className='w-full overflow-hidden rounded-xl shadow-md'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-center text-2xl font-bold'>
              {title}
            </CardTitle>
            <CardDescription className='text-center'>
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Usuario</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='usuario@correo.com'
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (loginAlert) setLoginAlert(null);
                  }}
                  required
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='password'>Contraseña</Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginAlert) setLoginAlert(null);
                    }}
                    className='pr-12'
                    autoComplete='current-password'
                    required
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' aria-hidden='true' />
                    ) : (
                      <Eye className='h-4 w-4' aria-hidden='true' />
                    )}
                  </Button>
                </div>
              </div>

              <div className='-mt-2 flex justify-end'>
                <Link
                  href={forgotPasswordHref}
                  className='text-sm font-medium text-primary underline-offset-4 hover:underline'
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {lockedRole ? (
                <div className='rounded-lg border bg-muted/40 p-3 text-sm'>
                  Acceso directo como <strong>{roleLabels[lockedRole]}</strong>.
                </div>
              ) : shouldShowRoleSelector ? (
                <div className='grid gap-2'>
                  <Label>Tipo de Usuario</Label>
                  <Popover open={userTypeOpen} onOpenChange={setUserTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        role='combobox'
                        className='w-full justify-between'
                        type='button'
                      >
                        {userType
                          ? userTypes.find((type) => type.value === userType)
                              ?.label
                          : 'Seleccione el tipo de usuario...'}
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-[352px] p-0' align='start'>
                      <Command>
                        <CommandInput
                          placeholder='Buscar tipo de usuario...'
                          className='h-9'
                        />
                        <CommandList>
                          <CommandEmpty>
                            No se encontró ningún tipo de usuario.
                          </CommandEmpty>
                          <CommandGroup>
                            {userTypes.map((type) => (
                              <CommandItem
                                key={type.value}
                                value={type.value}
                                onSelect={(currentValue) => {
                                  setUserType(
                                    currentValue === userType
                                      ? ''
                                      : (currentValue as LoginRole)
                                  );
                                  setUserTypeOpen(false);
                                }}
                              >
                                {type.label}
                                <Check
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    userType === type.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : null}

              {loginAlert && (
                <div
                  role='alert'
                  className='flex gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-100'
                >
                  <AlertTriangle className='mt-0.5 h-5 w-5 flex-shrink-0' />
                  <div>
                    <p className='font-semibold'>Acceso restringido</p>
                    <p className='mt-1 leading-relaxed'>{loginAlert}</p>
                  </div>
                </div>
              )}

              <Button
                type='submit'
                className='mt-2 w-full'
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent'></div>
                    <span>Ingresando...</span>
                  </div>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
