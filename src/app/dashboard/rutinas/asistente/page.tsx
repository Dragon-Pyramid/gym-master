'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, CheckCircle2, Loader2, MessageSquareText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Nivel } from '@/interfaces/niveles.interface';
import { Objetivo } from '@/interfaces/objetivo.interface';
import { RagRutinasAssistantResponseData } from '@/interfaces/ragRutinasAssistant.interface';
import { getNiveles, getObjetivos } from '@/services/apiClient';
import { generarRutinaConAsistente } from '@/services/ragRutinasAssistantService';
import { useAuthStore } from '@/stores/authStore';

const DIAS_DISPONIBLES = [1, 2, 3, 4, 5, 6];

function isAdminRole(role?: string | null) {
  const normalized = role?.trim().toLowerCase();
  return normalized === 'admin' || normalized === 'administrador';
}

export default function RutinasAssistantPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, isInitialized, token } = useAuthStore();

  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [objetivo, setObjetivo] = useState<string>('1');
  const [nivel, setNivel] = useState<string>('1');
  const [dias, setDias] = useState<number>(3);
  const [idioma, setIdioma] = useState<'es' | 'en'>('es');
  const [mensajeSocio, setMensajeSocio] = useState('');
  const [restricciones, setRestricciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RagRutinasAssistantResponseData | null>(null);

  const usuarioEsAdmin = isAdminRole(user?.rol);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const cargarCatalogos = useCallback(async () => {
    if (!token) return;

    try {
      const [objetivosResponse, nivelesResponse] = await Promise.all([
        getObjetivos(),
        getNiveles(),
      ]);

      if (objetivosResponse.ok) {
        const objetivosData = objetivosResponse.data ?? [];
        setObjetivos(objetivosData);
        if (objetivosData[0]?.id_objetivo) setObjetivo(String(objetivosData[0].id_objetivo));
      }

      if (nivelesResponse.ok) {
        const nivelesData = nivelesResponse.data ?? [];
        setNiveles(nivelesData);
        if (nivelesData[0]?.id_nivel) setNivel(String(nivelesData[0].id_nivel));
      }
    } catch (error) {
      console.error('Error al cargar catálogos del asistente:', error);
      toast.error('No se pudieron cargar objetivos y niveles');
    }
  }, [token]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && token) {
      cargarCatalogos();
    }
  }, [cargarCatalogos, isAuthenticated, isInitialized, token]);

  const objetivoSeleccionado = useMemo(
    () => objetivos.find((item) => String(item.id_objetivo) === objetivo)?.nombre_objetivo ?? `Objetivo ${objetivo}`,
    [objetivo, objetivos]
  );

  const nivelSeleccionado = useMemo(
    () => niveles.find((item) => String(item.id_nivel) === nivel)?.nombre_nivel ?? `Nivel ${nivel}`,
    [nivel, niveles]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await generarRutinaConAsistente({
        objetivo: Number(objetivo),
        nivel: Number(nivel),
        dias,
        idioma,
        mensajeSocio,
        restricciones,
      });

      if (!response.ok || !response.data) {
        throw new Error(response.error || 'No se pudo generar la rutina');
      }

      setResult(response.data);
      toast.success('Rutina generada correctamente');
    } catch (error) {
      console.error('Error al generar rutina con asistente:', error);
      toast.error(error instanceof Error ? error.message : 'Error al generar rutina');
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Asistente de Rutinas' />

          <main className='flex-1 bg-muted/30 px-4 py-6 md:px-8'>
            <div className='mx-auto flex max-w-6xl flex-col gap-6'>
              <section className='rounded-3xl border bg-card p-6 shadow-sm'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                  <div className='space-y-2'>
                    <div className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary'>
                      <Bot className='h-4 w-4' />
                      Gym Master RAG Coach · puente inicial
                    </div>
                    <h1 className='text-3xl font-bold tracking-tight text-foreground'>
                      Generá tu rutina con asistencia inteligente
                    </h1>
                    <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>
                      Este flujo prepara la integración con el futuro microservicio{' '}
                      <strong>gym-master-rag-coach</strong>. Por ahora usa el generador formal
                      de Gym Master como respaldo seguro y deja listo el contrato para RAG.
                    </p>
                  </div>

                  <div className='rounded-2xl border bg-background p-4 text-sm text-muted-foreground'>
                    <p className='font-medium text-foreground'>Resultado esperado</p>
                    <p>La rutina queda guardada en el menú Rutinas.</p>
                  </div>
                </div>
              </section>

              <div className='grid gap-6 lg:grid-cols-[1.15fr_0.85fr]'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <MessageSquareText className='h-5 w-5 text-primary' />
                      Entrevista rápida
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className='space-y-5' onSubmit={handleSubmit}>
                      {usuarioEsAdmin && (
                        <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'>
                          Estás ingresando como admin. Esta primera versión está orientada al socio
                          logueado; para asignación administrativa avanzada se integrará luego con
                          Gestor de Rutinas.
                        </div>
                      )}

                      <div className='grid gap-4 md:grid-cols-3'>
                        <div className='space-y-2'>
                          <Label htmlFor='objetivo'>Objetivo</Label>
                          <select
                            id='objetivo'
                            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            value={objetivo}
                            onChange={(event) => setObjetivo(event.target.value)}
                          >
                            {objetivos.map((item) => (
                              <option key={item.id_objetivo} value={String(item.id_objetivo)}>
                                {item.nombre_objetivo}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='nivel'>Nivel</Label>
                          <select
                            id='nivel'
                            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            value={nivel}
                            onChange={(event) => setNivel(event.target.value)}
                          >
                            {niveles.map((item) => (
                              <option key={item.id_nivel} value={String(item.id_nivel)}>
                                {item.nombre_nivel}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='dias'>Días por semana</Label>
                          <select
                            id='dias'
                            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            value={dias}
                            onChange={(event) => setDias(Number(event.target.value))}
                          >
                            {DIAS_DISPONIBLES.map((item) => (
                              <option key={item} value={item}>
                                {item} {item === 1 ? 'día' : 'días'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className='grid gap-4 md:grid-cols-[1fr_180px]'>
                        <div className='space-y-2'>
                          <Label htmlFor='mensaje'>Qué querés lograr o priorizar</Label>
                          <textarea
                            id='mensaje'
                            className='min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            placeholder='Ejemplo: quiero ganar masa muscular, priorizar pecho y espalda, entrenar 6 días y no repetir exactamente mi rutina anterior.'
                            value={mensajeSocio}
                            maxLength={1200}
                            onChange={(event) => setMensajeSocio(event.target.value)}
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='idioma'>Idioma</Label>
                          <select
                            id='idioma'
                            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            value={idioma}
                            onChange={(event) => setIdioma(event.target.value as 'es' | 'en')}
                          >
                            <option value='es'>Español</option>
                            <option value='en'>English</option>
                          </select>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='restricciones'>Restricciones o aclaraciones</Label>
                        <Input
                          id='restricciones'
                          placeholder='Ejemplo: sin lesiones, evitar impacto, no tengo poleas, prefiero máquinas.'
                          value={restricciones}
                          maxLength={1200}
                          onChange={(event) => setRestricciones(event.target.value)}
                        />
                      </div>

                      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                        <Button type='submit' disabled={usuarioEsAdmin || loading || objetivos.length === 0 || niveles.length === 0}>
                          {loading ? (
                            <>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Sparkles className='h-4 w-4' />
                              {usuarioEsAdmin ? 'Disponible para socio' : 'Generar rutina'}
                            </>
                          )}
                        </Button>
                        <Button type='button' variant='outline' asChild>
                          <Link href='/dashboard/rutinas'>Ver mis rutinas</Link>
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className='space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Parámetros actuales</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3 text-sm'>
                      <div className='rounded-2xl bg-muted p-4'>
                        <p className='text-muted-foreground'>Objetivo</p>
                        <p className='font-semibold'>{objetivoSeleccionado}</p>
                      </div>
                      <div className='rounded-2xl bg-muted p-4'>
                        <p className='text-muted-foreground'>Nivel</p>
                        <p className='font-semibold'>{nivelSeleccionado}</p>
                      </div>
                      <div className='rounded-2xl bg-muted p-4'>
                        <p className='text-muted-foreground'>Frecuencia</p>
                        <p className='font-semibold'>{dias} días por semana</p>
                      </div>
                    </CardContent>
                  </Card>

                  {result && (
                    <Card className='border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/20'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-green-800 dark:text-green-200'>
                          <CheckCircle2 className='h-5 w-5' />
                          Rutina generada
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-4 text-sm text-green-900 dark:text-green-100'>
                        <p>{result.mensajeFinal}</p>
                        <div className='rounded-xl bg-background/80 p-3 text-muted-foreground'>
                          <p>
                            Modo: <strong>{result.modo === 'rag_bridge' ? 'RAG Coach' : 'Fallback local'}</strong>
                          </p>
                          <p>{result.resumen}</p>
                          {result.ragError && <p>RAG externo: {result.ragError}</p>}
                        </div>
                        <Button asChild>
                          <Link href='/dashboard/rutinas'>Ir al menú Rutinas</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </main>

          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
