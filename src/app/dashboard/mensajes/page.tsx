'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  MailPlus,
  MessageCircle,
  Send,
} from 'lucide-react';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SocioMensaje, SocioMensajeCategoria, SocioMensajeEstado } from '@/interfaces/socioMensaje.interface';
import { crearMensajeSocio, getMisMensajesSocio } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatFrontendDateTime } from '@/utils/dateFormat';

const categorias: Array<{ value: SocioMensajeCategoria; label: string; help: string }> = [
  { value: 'consulta', label: 'Consulta', help: 'Duda general sobre tu cuenta o el gimnasio.' },
  { value: 'pregunta', label: 'Pregunta', help: 'Algo puntual que necesitás resolver.' },
  { value: 'reclamo', label: 'Reclamo', help: 'Algo que requiere revisión administrativa.' },
  { value: 'critica', label: 'Crítica', help: 'Comentario para mejorar el servicio.' },
  { value: 'sugerencia', label: 'Sugerencia', help: 'Idea o propuesta para el gimnasio.' },
  { value: 'otro', label: 'Otro', help: 'Otro tipo de mensaje.' },
];

const estadoLabel: Record<SocioMensajeEstado, string> = {
  pendiente: 'Pendiente',
  leido: 'Leído',
  respondido: 'Respondido',
  cerrado: 'Cerrado',
};

const estadoTone: Record<SocioMensajeEstado, string> = {
  pendiente:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700/70 dark:bg-amber-950/40 dark:text-amber-100',
  leido:
    'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-700/70 dark:bg-sky-950/40 dark:text-sky-100',
  respondido:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700/70 dark:bg-emerald-950/40 dark:text-emerald-100',
  cerrado:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
};

const estadoIcon: Record<SocioMensajeEstado, typeof Clock3> = {
  pendiente: Clock3,
  leido: Inbox,
  respondido: CheckCircle2,
  cerrado: CheckCircle2,
};

function getEstadoMeta(estado: string) {
  const normalized = estado as SocioMensajeEstado;
  return {
    label: estadoLabel[normalized] ?? estado,
    tone: estadoTone[normalized] ?? estadoTone.pendiente,
    Icon: estadoIcon[normalized] ?? Clock3,
  };
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof MessageCircle;
  tone: string;
}) {
  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${tone}`}>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.18em] text-current/75'>{label}</p>
          <p className='mt-2 text-3xl font-black leading-none'>{value}</p>
        </div>
        <span className='rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-black/5 dark:bg-slate-950/35'>
          <Icon className='h-5 w-5' />
        </span>
      </div>
    </div>
  );
}

function MensajeCard({ mensaje }: { mensaje: SocioMensaje }) {
  const { label, tone, Icon } = getEstadoMeta(mensaje.estado);
  const categoria = categorias.find((item) => item.value === mensaje.categoria)?.label ?? mensaje.categoria;

  return (
    <article className='rounded-[1.75rem] border border-border bg-background p-4 shadow-sm transition hover:shadow-md dark:bg-slate-950/70'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tone}`}>
              <Icon className='h-3.5 w-3.5' />
              {label}
            </span>
            <span className='rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground'>
              {categoria}
            </span>
          </div>
          <h3 className='mt-3 break-words text-base font-black leading-tight text-foreground'>
            {mensaje.asunto}
          </h3>
          <p className='mt-1 text-xs text-muted-foreground'>{formatFrontendDateTime(mensaje.creado_en)}</p>
        </div>
      </div>

      <div className='mt-4 rounded-2xl bg-muted/45 p-3 text-sm leading-6 text-foreground dark:bg-slate-900/70'>
        <p className='whitespace-pre-line break-words'>{mensaje.mensaje}</p>
      </div>

      {mensaje.respuesta ? (
        <div className='mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-950 dark:border-emerald-700/70 dark:bg-emerald-950/40 dark:text-emerald-50'>
          <div className='flex items-center gap-2 font-black'>
            <CheckCircle2 className='h-4 w-4' />
            Respuesta de administración
          </div>
          <p className='mt-2 whitespace-pre-line break-words'>{mensaje.respuesta}</p>
          {mensaje.respondido_en ? (
            <p className='mt-2 text-xs text-emerald-800/80 dark:text-emerald-100/75'>
              {formatFrontendDateTime(mensaje.respondido_en)}
            </p>
          ) : null}
        </div>
      ) : (
        <div className='mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-100'>
          Administración todavía no respondió este mensaje. Cuando haya respuesta, también puede llegarte por email.
        </div>
      )}
    </article>
  );
}

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

  const selectedCategoria = categorias.find((item) => item.value === form.categoria);

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
      <div className='flex h-[100dvh] min-h-0 w-full overflow-hidden'>
        <AppSidebar />
        <SidebarInset className='grid h-[100dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
          <AppHeader title='Mensajes' />
          <section className='min-h-0 overflow-y-auto overscroll-contain bg-gradient-to-b from-indigo-50/70 via-background to-background px-4 py-4 pb-6 dark:from-indigo-950/10 sm:px-6 md:p-6'>
            <div className='mx-auto w-full max-w-6xl space-y-5 md:space-y-6'>
              <div className='overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-sm dark:border-indigo-900/60 dark:bg-slate-950/80'>
                <div className='relative isolate p-5 sm:p-6 md:p-8'>
                  <div className='absolute -right-12 -top-12 h-36 w-36 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-700/20' />
                  <div className='absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-700/15' />
                  <div className='relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                    <div className='min-w-0'>
                      <p className='inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-100 dark:ring-indigo-800/70'>
                        <MessageCircle className='h-3.5 w-3.5' />
                        Mensajes con administración
                      </p>
                      <h1 className='mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl dark:text-white'>
                        Contactá al gimnasio desde tu celular
                      </h1>
                      <p className='mt-2 max-w-2xl text-sm leading-6 text-muted-foreground'>
                        Enviá consultas, reclamos, sugerencias o preguntas. Las respuestas quedan guardadas en tu historial y también pueden llegar por email.
                      </p>
                    </div>
                    <div className='rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-700/70 dark:bg-emerald-950/35 dark:text-emerald-100'>
                      Canal seguro con administración
                    </div>
                  </div>
                </div>
              </div>

              <section className='grid gap-3 sm:grid-cols-3'>
                <StatCard
                  label='Mensajes'
                  value={totals.total}
                  icon={MessageCircle}
                  tone='border-sky-100 bg-sky-50 text-sky-800 dark:border-sky-800/70 dark:bg-sky-950/40 dark:text-sky-100'
                />
                <StatCard
                  label='Pendientes'
                  value={totals.pendientes}
                  icon={MailPlus}
                  tone='border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-100'
                />
                <StatCard
                  label='Respondidos'
                  value={totals.respondidos}
                  icon={Send}
                  tone='border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-100'
                />
              </section>

              <div className='grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'>
                <Card className='overflow-hidden rounded-[2rem] border-border bg-white shadow-sm dark:bg-slate-950/80'>
                  <CardHeader className='border-b p-4 sm:p-5'>
                    <h2 className='text-xl font-black'>Nuevo mensaje</h2>
                    <p className='text-sm leading-6 text-muted-foreground'>
                      Escribí de forma clara para que administración pueda responderte mejor.
                    </p>
                  </CardHeader>
                  <CardContent className='p-4 sm:p-5'>
                    <form className='space-y-4' onSubmit={handleSubmit}>
                      <div className='space-y-2'>
                        <Label htmlFor='asunto'>Asunto</Label>
                        <Input
                          id='asunto'
                          value={form.asunto}
                          maxLength={140}
                          placeholder='Ejemplo: consulta sobre mi cuota'
                          onChange={(event) => setForm((prev) => ({ ...prev, asunto: event.target.value }))}
                        />
                        <p className='text-right text-xs text-muted-foreground'>{form.asunto.length}/140</p>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='categoria'>Categoría</Label>
                        <select
                          id='categoria'
                          value={form.categoria}
                          onChange={(event) => setForm((prev) => ({ ...prev, categoria: event.target.value as SocioMensajeCategoria }))}
                          className='h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        >
                          {categorias.map((categoria) => (
                            <option key={categoria.value} value={categoria.value}>{categoria.label}</option>
                          ))}
                        </select>
                        {selectedCategoria ? (
                          <p className='text-xs leading-5 text-muted-foreground'>{selectedCategoria.help}</p>
                        ) : null}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='mensaje'>Mensaje</Label>
                        <textarea
                          id='mensaje'
                          value={form.mensaje}
                          rows={7}
                          maxLength={2000}
                          placeholder='Escribí tu consulta para administración...'
                          onChange={(event) => setForm((prev) => ({ ...prev, mensaje: event.target.value }))}
                          className='min-h-[160px] w-full resize-y rounded-2xl border border-input bg-background px-3 py-3 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        />
                        <div className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
                          <span>Incluí fechas, comprobantes o detalles si corresponde.</span>
                          <span>{form.mensaje.length}/2000</span>
                        </div>
                      </div>

                      <div className='rounded-2xl border border-sky-100 bg-sky-50 p-3 text-xs leading-5 text-sky-900 dark:border-sky-800/70 dark:bg-sky-950/35 dark:text-sky-100'>
                        <div className='flex gap-2'>
                          <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
                          <p>Este canal queda registrado en tu cuenta. Evitá compartir contraseñas o datos sensibles.</p>
                        </div>
                      </div>

                      <Button type='submit' className='h-11 w-full rounded-xl font-bold' disabled={submitting}>
                        <Send className='mr-2 h-4 w-4' />
                        {submitting ? 'Enviando...' : 'Enviar mensaje'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className='overflow-hidden rounded-[2rem] border-border bg-white shadow-sm dark:bg-slate-950/80'>
                  <CardHeader className='border-b p-4 sm:p-5'>
                    <h2 className='text-xl font-black'>Historial</h2>
                    <p className='text-sm text-muted-foreground'>Tus mensajes y respuestas de administración.</p>
                  </CardHeader>
                  <CardContent className='space-y-3 p-4 sm:p-5'>
                    {loading ? (
                      <div className='rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground'>
                        Cargando mensajes...
                      </div>
                    ) : mensajes.length === 0 ? (
                      <div className='rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground'>
                        <Inbox className='mx-auto mb-3 h-8 w-8 opacity-60' />
                        Todavía no enviaste mensajes. Cuando escribas a administración, tu historial aparecerá acá.
                      </div>
                    ) : (
                      mensajes.map((mensaje) => <MensajeCard key={mensaje.id} mensaje={mensaje} />)
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
