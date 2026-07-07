'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Headphones,
  LifeBuoy,
  MailWarning,
  MessageSquarePlus,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from 'lucide-react';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  SoporteTicket,
  SoporteTicketCategoria,
  SoporteTicketEstado,
  SoporteTicketPrioridad,
} from '@/interfaces/soporteTicket.interface';
import {
  actualizarSoporteTicket,
  crearSoporteTicket,
  getSoporteTicket,
  getSoporteTickets,
} from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatFrontendDateTime } from '@/utils/dateFormat';

const categorias: Array<{ value: SoporteTicketCategoria; label: string }> = [
  { value: 'fallas', label: 'Fallas' },
  { value: 'dudas', label: 'Dudas' },
  { value: 'problemas', label: 'Problemas' },
  { value: 'sugerencias', label: 'Sugerencias' },
  { value: 'otros', label: 'Otros' },
];

const prioridades: Array<{ value: SoporteTicketPrioridad; label: string }> = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

const estados: Array<{ value: SoporteTicketEstado | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'respondido', label: 'Respondidos' },
  { value: 'cerrado', label: 'Cerrados' },
];

const estadoLabel: Record<SoporteTicketEstado, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  respondido: 'Respondido',
  cerrado: 'Cerrado',
};

const prioridadLabel: Record<SoporteTicketPrioridad, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

const prioridadClass: Record<SoporteTicketPrioridad, string> = {
  baja: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200',
  media: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
  alta: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  critica: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200',
};

const estadoClass: Record<SoporteTicketEstado, string> = {
  pendiente: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  en_revision: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
  respondido: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  cerrado: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200',
};

const initialForm = {
  categoria: 'fallas' as SoporteTicketCategoria,
  prioridad: 'media' as SoporteTicketPrioridad,
  asunto: '',
  descripcion: '',
  adjunto_url: '',
};

function isOpenTicket(ticket: SoporteTicket) {
  return ticket.estado === 'pendiente' || ticket.estado === 'en_revision';
}

function getTicketAgeHours(ticket: SoporteTicket) {
  const createdAt = new Date(ticket.creado_en).getTime();
  if (Number.isNaN(createdAt)) return 0;
  return Math.max(0, Math.floor((Date.now() - createdAt) / 36e5));
}

function isStaleTicket(ticket: SoporteTicket) {
  return isOpenTicket(ticket) && getTicketAgeHours(ticket) >= 48;
}

function getFormattedDate(value?: string | null) {
  return value ? formatFrontendDateTime(value) : 'Sin definir';
}

export default function SoporteDragonPyramidPage() {
  const { isAuthenticated, initializeAuth, isInitialized, user } = useAuthStore();
  const [tickets, setTickets] = useState<SoporteTicket[]>([]);
  const [selected, setSelected] = useState<SoporteTicket | null>(null);
  const [form, setForm] = useState(initialForm);
  const [estadoFilter, setEstadoFilter] = useState<SoporteTicketEstado | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [comentario, setComentario] = useState('');
  const [respuesta, setRespuesta] = useState('');

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSoporteTickets({
        estado: estadoFilter,
        q: searchTerm.trim(),
      });
      if (!response.ok) throw new Error(response.error || 'No se pudieron cargar los tickets');
      const nextTickets = response.data ?? [];
      setTickets(nextTickets);
      setSelected((current) => {
        if (!current) return current;
        return nextTickets.find((ticket) => ticket.id === current.id) ?? current;
      });
    } catch (error) {
      setTickets([]);
      toast.error(error instanceof Error ? error.message : 'Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  }, [estadoFilter, searchTerm]);

  useEffect(() => {
    if (isAuthenticated) loadTickets();
  }, [isAuthenticated, loadTickets]);

  const totals = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc.total += 1;
        if (isOpenTicket(ticket)) acc.abiertos += 1;
        if (ticket.prioridad === 'critica') acc.criticos += 1;
        if (ticket.estado === 'cerrado') acc.cerrados += 1;
        if (ticket.estado === 'en_revision') acc.enRevision += 1;
        if (!ticket.email_notificacion_enviado) acc.emailPendiente += 1;
        if (isStaleTicket(ticket)) acc.vencidos += 1;
        return acc;
      },
      { total: 0, abiertos: 0, criticos: 0, cerrados: 0, enRevision: 0, emailPendiente: 0, vencidos: 0 }
    );
  }, [tickets]);

  const supportHealth = useMemo(() => {
    if (totals.criticos > 0 || totals.vencidos > 0) {
      return {
        label: 'Atención prioritaria',
        description: 'Hay tickets críticos o con más de 48 horas abiertos.',
        tone: 'danger',
      };
    }

    if (totals.abiertos > 0 || totals.emailPendiente > 0) {
      return {
        label: 'Seguimiento activo',
        description: 'Hay tickets abiertos o notificaciones de email pendientes de confirmar.',
        tone: 'warning',
      };
    }

    return {
      label: 'Mesa estable',
      description: 'No hay tickets abiertos que requieran intervención inmediata.',
      tone: 'success',
    };
  }, [totals]);

  const nextAction = useMemo(() => {
    const critical = tickets.find((ticket) => isOpenTicket(ticket) && ticket.prioridad === 'critica');
    if (critical) return `Priorizar ${critical.codigo}: ${critical.asunto}`;

    const stale = tickets.find(isStaleTicket);
    if (stale) return `Actualizar seguimiento de ${stale.codigo}; lleva ${getTicketAgeHours(stale)} h abierto.`;

    if (totals.emailPendiente > 0) return 'Revisar configuración de email de soporte Dragon Pyramid.';
    if (totals.abiertos > 0) return 'Mantener seguimiento diario de tickets abiertos.';
    return 'Registrar nuevos incidentes con captura, pasos y usuario afectado cuando ocurran.';
  }, [tickets, totals.abiertos, totals.emailPendiente]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.asunto.trim()) {
      toast.error('El asunto es obligatorio.');
      return;
    }

    if (!form.descripcion.trim()) {
      toast.error('La descripción es obligatoria.');
      return;
    }

    setSaving(true);
    try {
      const response = await crearSoporteTicket({
        categoria: form.categoria,
        prioridad: form.prioridad,
        asunto: form.asunto,
        descripcion: form.descripcion,
        adjunto_url: form.adjunto_url || null,
      });

      if (!response.ok || !response.data) {
        throw new Error(response.error || 'No se pudo crear el ticket');
      }

      toast.success('Ticket enviado a Dragon Pyramid');
      setForm(initialForm);
      setSelected(response.data);
      await loadTickets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadTickets();
  };

  const handleUpdateTicket = async (payload: { estado?: SoporteTicketEstado; comentario?: string; respuesta?: string }) => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await actualizarSoporteTicket(selected.id, payload);
      if (!response.ok || !response.data) throw new Error(response.error || 'No se pudo actualizar el ticket');
      toast.success('Ticket actualizado');
      const detail = await getSoporteTicket(selected.id);
      setSelected(detail.ok && detail.data ? detail.data : response.data);
      setComentario('');
      setRespuesta('');
      await loadTickets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTicket = async (ticket: SoporteTicket) => {
    setSelected(ticket);
    const response = await getSoporteTicket(ticket.id);
    if (response.ok && response.data) setSelected(response.data);
  };

  if (!isInitialized) {
    return <div className='flex min-h-screen items-center justify-center text-sm text-muted-foreground'>Cargando soporte...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950'>
        <AppSidebar />
        <SidebarInset className='grid h-[100dvh] max-h-[100dvh] min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
          <AppHeader title='Soporte Dragon Pyramid' />
          <main className='min-h-0 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8'>
            <div className='mx-auto flex w-full max-w-7xl flex-col gap-6 pb-6'>
              <section className='overflow-hidden rounded-3xl border border-sky-500/30 bg-slate-950 text-white shadow-xl dark:border-sky-400/30'>
                <div className='grid gap-6 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.26),_transparent_34%),linear-gradient(135deg,_#020617,_#082f49)] p-6 lg:grid-cols-[1fr_auto] lg:p-8'>
                  <div className='space-y-4'>
                    <span className='inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-100'>
                      <Headphones className='h-4 w-4' />
                      Mesa de ayuda interna
                    </span>
                    <div>
                      <h1 className='text-3xl font-black tracking-tight md:text-4xl'>Soporte Dragon Pyramid</h1>
                      <p className='mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-base'>
                        Registrá incidencias, dudas o mejoras del gimnasio cliente y mantené seguimiento operativo con trazabilidad de estados, prioridad, email y respuesta.
                      </p>
                    </div>
                  </div>
                  <div className='grid gap-3 sm:grid-cols-2 lg:w-[360px]'>
                    <div className='rounded-2xl border border-white/10 bg-white/10 p-4'>
                      <p className='text-xs uppercase tracking-[0.18em] text-cyan-100'>Estado</p>
                      <p className='mt-2 text-xl font-black'>{supportHealth.label}</p>
                      <p className='mt-1 text-xs text-slate-200'>{supportHealth.description}</p>
                    </div>
                    <div className='rounded-2xl border border-white/10 bg-white/10 p-4'>
                      <p className='text-xs uppercase tracking-[0.18em] text-cyan-100'>Tickets abiertos</p>
                      <p className='mt-2 text-3xl font-black'>{totals.abiertos}</p>
                      <p className='mt-1 text-xs text-slate-200'>{totals.criticos} críticos</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                <Card className='border-sky-100 bg-white dark:border-sky-900/60 dark:bg-slate-900'>
                  <CardContent className='flex items-center gap-3 p-5'>
                    <LifeBuoy className='h-9 w-9 text-sky-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Tickets totales</p>
                      <p className='text-3xl font-black'>{totals.total}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className='border-amber-100 bg-white dark:border-amber-900/60 dark:bg-slate-900'>
                  <CardContent className='flex items-center gap-3 p-5'>
                    <MessageSquarePlus className='h-9 w-9 text-amber-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Abiertos</p>
                      <p className='text-3xl font-black'>{totals.abiertos}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className='border-red-100 bg-white dark:border-red-900/60 dark:bg-slate-900'>
                  <CardContent className='flex items-center gap-3 p-5'>
                    <AlertTriangle className='h-9 w-9 text-red-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Críticos / +48 h</p>
                      <p className='text-3xl font-black'>{totals.criticos + totals.vencidos}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className='border-emerald-100 bg-white dark:border-emerald-900/60 dark:bg-slate-900'>
                  <CardContent className='flex items-center gap-3 p-5'>
                    <CheckCircle2 className='h-9 w-9 text-emerald-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Cerrados</p>
                      <p className='text-3xl font-black'>{totals.cerrados}</p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className='grid gap-4 xl:grid-cols-[0.8fr_1.2fr]'>
                <Card className='border-cyan-200 bg-cyan-50/80 dark:border-cyan-900/60 dark:bg-cyan-950/30'>
                  <CardContent className='space-y-4 p-5'>
                    <div className='flex items-center gap-3'>
                      <ShieldCheck className='h-6 w-6 text-cyan-600 dark:text-cyan-300' />
                      <div>
                        <h2 className='font-black'>Lectura ejecutiva de soporte</h2>
                        <p className='text-sm text-muted-foreground'>Priorización para no perder incidencias importantes.</p>
                      </div>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-3'>
                      <div className='rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-950'>
                        <p className='text-xs uppercase text-muted-foreground'>En revisión</p>
                        <p className='text-2xl font-black'>{totals.enRevision}</p>
                      </div>
                      <div className='rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-950'>
                        <p className='text-xs uppercase text-muted-foreground'>Email pendiente</p>
                        <p className='text-2xl font-black'>{totals.emailPendiente}</p>
                      </div>
                      <div className='rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-950'>
                        <p className='text-xs uppercase text-muted-foreground'>+48 h</p>
                        <p className='text-2xl font-black'>{totals.vencidos}</p>
                      </div>
                    </div>
                    <div className='rounded-xl border border-cyan-200 bg-white p-4 text-sm dark:border-cyan-900 dark:bg-slate-950'>
                      <p className='font-bold'>Próximo paso recomendado</p>
                      <p className='mt-1 text-muted-foreground'>{nextAction}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className='border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'>
                  <CardContent className='grid gap-4 p-5 md:grid-cols-3'>
                    <div className='rounded-xl border border-dashed p-4 dark:border-slate-700'>
                      <TimerReset className='mb-3 h-6 w-6 text-sky-600' />
                      <p className='font-bold'>Triage rápido</p>
                      <p className='mt-1 text-sm text-muted-foreground'>Clasificá por prioridad y categoría para que Dragon Pyramid reciba contexto accionable.</p>
                    </div>
                    <div className='rounded-xl border border-dashed p-4 dark:border-slate-700'>
                      <MailWarning className='mb-3 h-6 w-6 text-amber-600' />
                      <p className='font-bold'>Email de soporte</p>
                      <p className='mt-1 text-sm text-muted-foreground'>Si no hay destinatario configurado, el ticket queda registrado y visible para seguimiento.</p>
                    </div>
                    <div className='rounded-xl border border-dashed p-4 dark:border-slate-700'>
                      <Sparkles className='mb-3 h-6 w-6 text-fuchsia-600' />
                      <p className='font-bold'>Trazabilidad</p>
                      <p className='mt-1 text-sm text-muted-foreground'>Cada comentario, respuesta y cambio de estado queda en historial del ticket.</p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <div className='grid gap-6 xl:grid-cols-[0.85fr_1.15fr]'>
                <Card className='bg-white dark:border-slate-800 dark:bg-slate-900'>
                  <CardHeader className='border-b p-5 dark:border-slate-800'>
                    <h2 className='text-xl font-black'>Nuevo ticket</h2>
                    <p className='text-sm text-muted-foreground'>Reportá fallas, dudas, problemas o sugerencias al soporte de Dragon Pyramid.</p>
                  </CardHeader>
                  <CardContent className='p-5'>
                    <form className='space-y-4' onSubmit={handleCreate}>
                      <div className='grid gap-3 md:grid-cols-2'>
                        <div className='space-y-2'>
                          <Label htmlFor='categoria'>Categoría</Label>
                          <select
                            id='categoria'
                            name='categoria'
                            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
                            value={form.categoria}
                            onChange={handleChange}
                          >
                            {categorias.map((categoria) => (
                              <option key={categoria.value} value={categoria.value}>{categoria.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='prioridad'>Prioridad</Label>
                          <select
                            id='prioridad'
                            name='prioridad'
                            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
                            value={form.prioridad}
                            onChange={handleChange}
                          >
                            {prioridades.map((prioridad) => (
                              <option key={prioridad.value} value={prioridad.value}>{prioridad.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='asunto'>Asunto</Label>
                        <Input
                          id='asunto'
                          name='asunto'
                          value={form.asunto}
                          onChange={handleChange}
                          placeholder='Ejemplo: error al registrar pagos manuales'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='descripcion'>Descripción</Label>
                        <textarea
                          id='descripcion'
                          name='descripcion'
                          rows={6}
                          value={form.descripcion}
                          onChange={handleChange}
                          className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                          placeholder='Describí qué pasó, qué usuario lo reportó, pasos para reproducirlo y cualquier dato relevante.'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='adjunto_url'>Adjunto / captura URL opcional</Label>
                        <Input
                          id='adjunto_url'
                          name='adjunto_url'
                          value={form.adjunto_url}
                          onChange={handleChange}
                          placeholder='https://...'
                        />
                      </div>

                      <div className='rounded-lg bg-muted p-3 text-xs text-muted-foreground'>
                        Usuario emisor: {user?.nombre ?? user?.email ?? 'Usuario actual'}. El sistema enviará notificación por email si el soporte de Dragon Pyramid está configurado.
                      </div>

                      <Button type='submit' disabled={saving} className='w-full gap-2'>
                        <Send className='h-4 w-4' />
                        {saving ? 'Enviando...' : 'Enviar ticket'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className='min-w-0 bg-white dark:border-slate-800 dark:bg-slate-900'>
                  <CardHeader className='border-b p-5 dark:border-slate-800'>
                    <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
                      <div>
                        <h2 className='text-xl font-black'>Tickets enviados</h2>
                        <p className='text-sm text-muted-foreground'>Seguimiento y trazabilidad de tickets enviados a Dragon Pyramid.</p>
                      </div>
                      <form className='flex flex-col gap-2 sm:flex-row sm:flex-wrap' onSubmit={handleSearchSubmit}>
                        <select
                          value={estadoFilter}
                          onChange={(event) => setEstadoFilter(event.target.value as SoporteTicketEstado | 'todos')}
                          className='h-10 rounded-md border border-input bg-background px-3 text-sm'
                        >
                          {estados.map((estado) => (
                            <option key={estado.value} value={estado.value}>{estado.label}</option>
                          ))}
                        </select>
                        <div className='relative min-w-0 sm:w-64'>
                          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                          <Input
                            type='search'
                            className='w-full pl-8'
                            placeholder='Buscar ticket...'
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                          />
                        </div>
                        <Button type='submit' variant='outline'>Buscar</Button>
                        <Button type='button' variant='outline' className='gap-2' onClick={loadTickets} disabled={loading}>
                          <RefreshCcw className='h-4 w-4' />
                          Actualizar
                        </Button>
                      </form>
                    </div>
                  </CardHeader>
                  <CardContent className='grid gap-4 p-5 xl:grid-cols-[0.95fr_1.05fr]'>
                    <div className='max-h-[680px] space-y-3 overflow-y-auto pr-1'>
                      {loading ? (
                        <div className='py-8 text-center text-muted-foreground'>Cargando tickets...</div>
                      ) : tickets.length === 0 ? (
                        <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>No hay tickets para el filtro seleccionado.</div>
                      ) : (
                        tickets.map((ticket) => (
                          <button
                            key={ticket.id}
                            type='button'
                            onClick={() => handleSelectTicket(ticket)}
                            className={`w-full rounded-xl border p-4 text-left transition hover:bg-muted/60 ${selected?.id === ticket.id ? 'border-primary bg-muted' : 'bg-background'}`}
                          >
                            <div className='flex flex-wrap items-start justify-between gap-3'>
                              <div className='min-w-0'>
                                <h3 className='break-words font-bold'>{ticket.asunto}</h3>
                                <p className='text-xs text-muted-foreground'>{ticket.codigo} · {getFormattedDate(ticket.creado_en)}</p>
                              </div>
                              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClass[ticket.estado]}`}>{estadoLabel[ticket.estado]}</span>
                            </div>
                            <p className='mt-2 line-clamp-2 text-sm text-muted-foreground'>{ticket.descripcion}</p>
                            <div className='mt-3 flex flex-wrap gap-2 text-xs'>
                              <span className='rounded-full bg-muted px-2 py-1'>{ticket.categoria}</span>
                              <span className={`rounded-full border px-2 py-1 font-bold ${prioridadClass[ticket.prioridad]}`}>Prioridad {prioridadLabel[ticket.prioridad]}</span>
                              {isStaleTicket(ticket) && (
                                <span className='inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 font-bold text-red-700 dark:bg-red-950/50 dark:text-red-200'>
                                  <Clock3 className='h-3 w-3' /> +48 h abierto
                                </span>
                              )}
                              {!ticket.email_notificacion_enviado && (
                                <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-200'>
                                  <MailWarning className='h-3 w-3' /> Email no confirmado
                                </span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className='min-w-0 rounded-xl border p-4 dark:border-slate-800'>
                      {selected ? (
                        <div className='space-y-4'>
                          <div className='flex flex-wrap items-start justify-between gap-3'>
                            <div>
                              <p className='text-xs text-muted-foreground'>Ticket</p>
                              <h3 className='text-lg font-black'>{selected.codigo}</h3>
                              <p className='text-sm text-muted-foreground'>{selected.asunto}</p>
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClass[selected.estado]}`}>{estadoLabel[selected.estado]}</span>
                          </div>
                          <div className='grid gap-2 text-sm md:grid-cols-2'>
                            <p><strong>Prioridad:</strong> {prioridadLabel[selected.prioridad]}</p>
                            <p><strong>Categoría:</strong> {selected.categoria}</p>
                            <p><strong>Creado:</strong> {getFormattedDate(selected.creado_en)}</p>
                            <p><strong>Actualizado:</strong> {getFormattedDate(selected.actualizado_en)}</p>
                            <p className='md:col-span-2'><strong>Email soporte:</strong> {selected.email_notificacion_enviado ? 'enviado' : selected.email_notificacion_error || 'pendiente/no configurado'}</p>
                          </div>
                          <div className='rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap'>{selected.descripcion}</div>
                          {selected.adjunto_url && (
                            <a href={selected.adjunto_url} target='_blank' rel='noreferrer' className='text-sm font-bold text-primary underline'>Abrir adjunto / captura</a>
                          )}

                          <div className='space-y-2'>
                            <Label htmlFor='comentario'>Comentario interno / seguimiento</Label>
                            <textarea
                              id='comentario'
                              rows={3}
                              value={comentario}
                              onChange={(event) => setComentario(event.target.value)}
                              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                              placeholder='Agregar nota de seguimiento...'
                            />
                            <Button
                              type='button'
                              variant='outline'
                              disabled={saving || !comentario.trim()}
                              onClick={() => handleUpdateTicket({ comentario })}
                            >
                              Guardar comentario
                            </Button>
                          </div>

                          <div className='space-y-2'>
                            <Label htmlFor='respuesta'>Respuesta / resolución</Label>
                            <textarea
                              id='respuesta'
                              rows={3}
                              value={respuesta}
                              onChange={(event) => setRespuesta(event.target.value)}
                              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                              placeholder='Registrar respuesta o resolución recibida de Dragon Pyramid...'
                            />
                            <Button
                              type='button'
                              disabled={saving || !respuesta.trim()}
                              onClick={() => handleUpdateTicket({ respuesta })}
                            >
                              Marcar respondido
                            </Button>
                          </div>

                          <div className='flex flex-wrap gap-2'>
                            <Button type='button' variant='outline' disabled={saving || selected.estado === 'en_revision'} onClick={() => handleUpdateTicket({ estado: 'en_revision' })}>En revisión</Button>
                            <Button type='button' variant='outline' disabled={saving || selected.estado === 'cerrado'} onClick={() => handleUpdateTicket({ estado: 'cerrado' })}>Cerrar</Button>
                          </div>

                          <div className='space-y-2 border-t pt-4 dark:border-slate-800'>
                            <h4 className='font-black'>Historial</h4>
                            {selected.eventos && selected.eventos.length > 0 ? (
                              selected.eventos.map((evento) => (
                                <div key={evento.id} className='rounded-lg border bg-background p-3 text-sm dark:border-slate-800'>
                                  <div className='flex flex-wrap justify-between gap-2'>
                                    <span className='font-bold'>{evento.tipo}</span>
                                    <span className='text-xs text-muted-foreground'>{getFormattedDate(evento.creado_en)}</span>
                                  </div>
                                  <p className='mt-1 whitespace-pre-wrap text-muted-foreground'>{evento.mensaje || 'Evento sin detalle.'}</p>
                                </div>
                              ))
                            ) : (
                              <p className='text-sm text-muted-foreground'>El historial se verá al abrir el detalle después de crear o actualizar el ticket.</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className='flex min-h-[320px] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-800'>Seleccioná un ticket para ver detalle e historial.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
