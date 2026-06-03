'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { MailPlus, MessageCircle, Send } from 'lucide-react';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SocioMensaje, SocioMensajeCategoria } from '@/interfaces/socioMensaje.interface';
import { crearMensajeSocio, getMisMensajesSocio } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatFrontendDateTime } from '@/utils/dateFormat';

const categorias: Array<{ value: SocioMensajeCategoria; label: string }> = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'pregunta', label: 'Pregunta' },
  { value: 'reclamo', label: 'Reclamo' },
  { value: 'critica', label: 'Crítica' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'otro', label: 'Otro' },
];

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  leido: 'Leído',
  respondido: 'Respondido',
  cerrado: 'Cerrado',
};

export default function MensajesSocioPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const [mensajes, setMensajes] = useState<SocioMensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    asunto: '',
    categoria: 'consulta' as SocioMensajeCategoria,
    mensaje: '',
  });

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const loadMensajes = async () => {
    setLoading(true);
    try {
      const response = await getMisMensajesSocio();
      if (!response.ok) throw new Error(response.error || 'No se pudieron cargar tus mensajes');
      setMensajes(response.data ?? []);
    } catch (error) {
      setMensajes([]);
      toast.error(error instanceof Error ? error.message : 'Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadMensajes();
  }, [isAuthenticated]);

  const totals = useMemo(() => {
    return mensajes.reduce(
      (acc, mensaje) => {
        acc.total += 1;
        acc.pendientes += mensaje.estado === 'pendiente' ? 1 : 0;
        acc.respondidos += mensaje.estado === 'respondido' ? 1 : 0;
        return acc;
      },
      { total: 0, pendientes: 0, respondidos: 0 }
    );
  }, [mensajes]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.asunto.trim() || !form.mensaje.trim()) {
      toast.error('Completá asunto y mensaje.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await crearMensajeSocio(form);
      if (!response.ok) throw new Error(response.error || 'No se pudo enviar el mensaje');
      toast.success('Mensaje enviado a administración');
      setForm({ asunto: '', categoria: 'consulta', mensaje: '' });
      await loadMensajes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar mensaje');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isInitialized) return <div>Cargando...</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Mensajes' />
          <main className='flex-1 space-y-6 p-6'>
            <section className='grid gap-4 md:grid-cols-3'>
              <Card>
                <CardContent className='flex items-center gap-3 p-4'>
                  <MessageCircle className='h-8 w-8 text-sky-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Mensajes</p>
                    <p className='text-2xl font-bold'>{totals.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center gap-3 p-4'>
                  <MailPlus className='h-8 w-8 text-amber-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Pendientes</p>
                    <p className='text-2xl font-bold'>{totals.pendientes}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center gap-3 p-4'>
                  <Send className='h-8 w-8 text-emerald-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Respondidos</p>
                    <p className='text-2xl font-bold'>{totals.respondidos}</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader className='border-b p-4'>
                <h2 className='text-xl font-bold'>Enviar mensaje a administración</h2>
                <p className='text-sm text-muted-foreground'>Consultas, reclamos, críticas, sugerencias o preguntas para el gimnasio.</p>
              </CardHeader>
              <CardContent className='p-4'>
                <form className='space-y-4' onSubmit={handleSubmit}>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='asunto'>Asunto</Label>
                      <Input
                        id='asunto'
                        value={form.asunto}
                        maxLength={140}
                        placeholder='Ejemplo: consulta sobre mi cuota'
                        onChange={(event) => setForm((prev) => ({ ...prev, asunto: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='categoria'>Categoría</Label>
                      <select
                        id='categoria'
                        value={form.categoria}
                        onChange={(event) => setForm((prev) => ({ ...prev, categoria: event.target.value as SocioMensajeCategoria }))}
                        className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
                      >
                        {categorias.map((categoria) => (
                          <option key={categoria.value} value={categoria.value}>{categoria.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='mensaje'>Mensaje</Label>
                    <textarea
                      id='mensaje'
                      value={form.mensaje}
                      rows={5}
                      maxLength={2000}
                      placeholder='Escribí tu consulta para administración...'
                      onChange={(event) => setForm((prev) => ({ ...prev, mensaje: event.target.value }))}
                      className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    />
                  </div>
                  <div className='flex justify-end'>
                    <Button type='submit' disabled={submitting}>
                      {submitting ? 'Enviando...' : 'Enviar mensaje'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='border-b p-4'>
                <h2 className='text-xl font-bold'>Historial de mensajes</h2>
              </CardHeader>
              <CardContent className='space-y-3 p-4'>
                {loading ? (
                  <div className='py-8 text-center text-muted-foreground'>Cargando mensajes...</div>
                ) : mensajes.length === 0 ? (
                  <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>Todavía no enviaste mensajes.</div>
                ) : (
                  mensajes.map((mensaje) => (
                    <article key={mensaje.id} className='rounded-xl border p-4'>
                      <div className='flex flex-wrap items-start justify-between gap-3'>
                        <div>
                          <h3 className='font-semibold'>{mensaje.asunto}</h3>
                          <p className='text-xs text-muted-foreground'>{formatFrontendDateTime(mensaje.creado_en)} · {mensaje.categoria}</p>
                        </div>
                        <span className='rounded-full bg-muted px-3 py-1 text-xs font-medium'>{estadoLabel[mensaje.estado] ?? mensaje.estado}</span>
                      </div>
                      <p className='mt-3 whitespace-pre-line text-sm'>{mensaje.mensaje}</p>
                      {mensaje.respuesta && (
                        <div className='mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/40'>
                          <p className='font-semibold text-emerald-700 dark:text-emerald-300'>Respuesta de administración</p>
                          <p className='mt-2 whitespace-pre-line'>{mensaje.respuesta}</p>
                          {mensaje.respondido_en && <p className='mt-2 text-xs text-muted-foreground'>{formatFrontendDateTime(mensaje.respondido_en)}</p>}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
