'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserRound } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginEntryPage() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    initializeAuth();
    if (isInitialized && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [initializeAuth, isAuthenticated, isInitialized, router]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4'>
      <div className='relative h-52 w-52 md:h-64 md:w-64'>
        <Image
          src='/gm_logo.svg'
          alt='Gym Master Logo'
          fill
          className='object-contain dark:invert'
          priority
        />
      </div>

      <div className='grid w-full max-w-3xl gap-4 md:grid-cols-2'>
        <Card className='border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <UserRound className='h-5 w-5' />
              Ingreso de socios
            </CardTitle>
            <CardDescription>
              Acceso directo para socios del gimnasio. No requiere seleccionar tipo de usuario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className='w-full'>
              <Link href='/auth/login/socio'>Entrar como socio</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className='border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ShieldCheck className='h-5 w-5' />
              Administración
            </CardTitle>
            <CardDescription>
              Acceso para administradores y usuarios internos del gimnasio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant='outline' className='w-full'>
              <Link href='/auth/login/admin'>Entrar al panel</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
