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
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';
import { formatFrontendDateTime } from '@/utils/dateFormat';

type LocalizedText = {
  es: string;
  en: string;
};

const categorias: SoporteTicketCategoria[] = ['fallas', 'dudas', 'problemas', 'sugerencias', 'otros'];

const prioridades: SoporteTicketPrioridad[] = ['baja', 'media', 'alta', 'critica'];

const estados: Array<SoporteTicketEstado | 'todos'> = ['todos', 'pendiente', 'en_revision', 'respondido', 'cerrado'];

const categoriaLabel: Record<SoporteTicketCategoria, LocalizedText> = {
  fallas: { es: 'Fallas', en: 'Failures' },
  dudas: { es: 'Dudas', en: 'Questions' },
  problemas: { es: 'Problemas', en: 'Issues' },
  sugerencias: { es: 'Sugerencias', en: 'Suggestions' },
  otros: { es: 'Otros', en: 'Other' },
};

const estadoFilterLabel: Record<SoporteTicketEstado | 'todos', LocalizedText> = {
  todos: { es: 'Todos', en: 'All' },
  pendiente: { es: 'Pendientes', en: 'Pending' },
  en_revision: { es: 'En revisión', en: 'Under review' },
  respondido: { es: 'Respondidos', en: 'Responded' },
  cerrado: { es: 'Cerrados', en: 'Closed' },
};

const estadoLabel: Record<SoporteTicketEstado, LocalizedText> = {
  pendiente: { es: 'Pendiente', en: 'Pending' },
  en_revision: { es: 'En revisión', en: 'Under review' },
  respondido: { es: 'Respondido', en: 'Responded' },
  cerrado: { es: 'Cerrado', en: 'Closed' },
};

const prioridadLabel: Record<SoporteTicketPrioridad, LocalizedText> = {
  baja: { es: 'Baja', en: 'Low' },
  media: { es: 'Media', en: 'Medium' },
  alta: { es: 'Alta', en: 'High' },
  critica: { es: 'Crítica', en: 'Critical' },
};

function supportTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function localizedLabel<T extends string>(locale: GymMasterLocale, labels: Record<T, LocalizedText>, value: T) {
  return labels[value]?.[locale] ?? value;
}

function getCategoriaLabel(locale: GymMasterLocale, value: SoporteTicketCategoria) {
  return localizedLabel(locale, categoriaLabel, value);
}

function getEstadoLabel(locale: GymMasterLocale, value: SoporteTicketEstado) {
  return localizedLabel(locale, estadoLabel, value);
}

function getEstadoFilterLabel(locale: GymMasterLocale, value: SoporteTicketEstado | 'todos') {
  return localizedLabel(locale, estadoFilterLabel, value);
}

function getPrioridadLabel(locale: GymMasterLocale, value: SoporteTicketPrioridad) {
  return localizedLabel(locale, prioridadLabel, value);
}

function getEmailStatusLabel(locale: GymMasterLocale, ticket: SoporteTicket) {
  if (ticket.email_notificacion_enviado) {
    return supportTx(locale, 'enviado', 'sent');
  }

  return ticket.email_notificacion_error || supportTx(locale, 'pendiente/no configurado', 'pending/not configured');
}

function translateEventType(locale: GymMasterLocale, value?: string | null) {
  if (!value) return supportTx(locale, 'Evento', 'Event');

  const normalized = value.toLowerCase().trim();
  const translations: Record<string, LocalizedText> = {
    creado: { es: 'Creado', en: 'Created' },
    comentario: { es: 'Comentario', en: 'Comment' },
    respuesta: { es: 'Respuesta', en: 'Reply' },
    estado: { es: 'Estado', en: 'Status' },
    cierre: { es: 'Cierre', en: 'Closure' },
  };

  return translations[normalized]?.[locale] ?? value;
}

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

function getFormattedDate(locale: GymMasterLocale, value?: string | null) {
  return value ? formatFrontendDateTime(value) : supportTx(locale, 'Sin definir', 'Undefined');
}

export default function SoporteDragonPyramidPage() {
  const { locale } = useI18n();
  const c = useCallback((es: string, en: string) => supportTx(locale, es, en), [locale]);
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
      if (!response.ok) throw new Error(response.error || c('No se pudieron cargar los tickets', 'Could not load tickets'));
      const nextTickets = response.data ?? [];
      setTickets(nextTickets);
      setSelected((current) => {
        if (!current) return current;
        return nextTickets.find((ticket) => ticket.id === current.id) ?? current;
      });
    } catch (error) {
      setTickets([]);
      toast.error(error instanceof Error ? error.message : c('Error al cargar tickets', 'Error loading tickets'));
    } finally {
      setLoading(false);
    }
  }, [c, estadoFilter, searchTerm]);

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
        label: c('Atención prioritaria', 'Priority attention'),
        description: c('Hay tickets críticos o con más de 48 horas abiertos.', 'There are critical tickets or tickets open for more than 48 hours.'),
        tone: 'danger',
      };
    }

    if (totals.abiertos > 0 || totals.emailPendiente > 0) {
      return {
        label: c('Seguimiento activo', 'Active follow-up'),
        description: c('Hay tickets abiertos o notificaciones de email pendientes de confirmar.', 'There are open tickets or email notifications pending confirmation.'),
        tone: 'warning',
      };
    }

    return {
      label: c('Mesa estable', 'Stable desk'),
      description: c('No hay tickets abiertos que requieran intervención inmediata.', 'There are no open tickets requiring immediate intervention.'),
      tone: 'success',
    };
  }, [c, totals]);

  const nextAction = useMemo(() => {
    const critical = tickets.find((ticket) => isOpenTicket(ticket) && ticket.prioridad === 'critica');
    if (critical) return `${c('Priorizar', 'Prioritize')} ${critical.codigo}: ${critical.asunto}`;

    const stale = tickets.find(isStaleTicket);
    if (stale) {
      return `${c('Actualizar seguimiento de', 'Update follow-up for')} ${stale.codigo}; ${c('lleva', 'it has been')} ${getTicketAgeHours(stale)} h ${c('abierto.', 'open.')}`;
    }

    if (totals.emailPendiente > 0) return c('Revisar configuración de email de soporte Dragon Pyramid.', 'Review Dragon Pyramid support email settings.');
    if (totals.abiertos > 0) return c('Mantener seguimiento diario de tickets abiertos.', 'Keep daily follow-up on open tickets.');
    return c('Registrar nuevos incidentes con captura, pasos y usuario afectado cuando ocurran.', 'Log new incidents with screenshots, steps, and affected user whenever they happen.');
  }, [c, tickets, totals.abiertos, totals.emailPendiente]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.asunto.trim()) {
      toast.error(c('El asunto es obligatorio.', 'Subject is required.'));
      return;
    }

    if (!form.descripcion.trim()) {
      toast.error(c('La descripción es obligatoria.', 'Description is required.'));
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
        throw new Error(response.error || c('No se pudo crear el ticket', 'Could not create the ticket'));
      }

      toast.success(c('Ticket enviado a Dragon Pyramid', 'Ticket sent to Dragon Pyramid'));
      setForm(initialForm);
      setSelected(response.data);
      await loadTickets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : c('Error al crear ticket', 'Error creating ticket'));
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
      if (!response.ok || !response.data) throw new Error(response.error || c('No se pudo actualizar el ticket', 'Could not update the ticket'));
      toast.success(c('Ticket actualizado', 'Ticket updated'));
      const detail = await getSoporteTicket(selected.id);
      setSelected(detail.ok && detail.data ? detail.data : response.data);
      setComentario('');
      setRespuesta('');
      await loadTickets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : c('Error al actualizar ticket', 'Error updating ticket'));
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
    return <div className='flex min-h-screen items-center justify-center text-sm text-muted-foreground'>{c('Cargando soporte...', 'Loading support...')}</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950'>
        <AppSidebar />
        <SidebarInset className='grid h-[100dvh] max-h-[100dvh] min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
          <AppHeader title={c('Soporte Dragon Pyramid', 'Dragon Pyramid support')} />
          <main className='min-h-0 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8'>
            <div className='mx-auto flex w-full max-w-7xl flex-col gap-6 pb-6'>
              <section className='overflow-hidden rounded-3xl border border-sky-500/30 bg-slate-950 text-white shadow-xl dark:border-sky-400/30'>
                <div className='grid gap-6 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.26),_transparent_34%),linear-gradient(135deg,_#020617,_#082f49)] p-6 lg:grid-cols-[1fr_auto] lg:p-8'>
                  <div className='space-y-4'>
                    <span className='inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-100'>
                      <Headphones className='h-4 w-4' />
                      {c('Mesa de ayuda interna', 'Internal help desk')}
                    </span>
                    <div>
                      <h1 className='text-3xl font-black tracking-tight md:text-4xl'>{c('Soporte Dragon Pyramid', 'Dragon Pyramid support')}</h1>
                      <p className='mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-base'>
                        {c('Registrá incidencias, dudas o mejoras del gimnasio cliente y mantené seguimiento operativo con trazabilidad de estados, prioridad, email y respuesta.', 'Log incidents, questions, or improvements from the client gym and keep operational follow-up with status, priority, email, and reply traceability.')}
                      </p>
                    </div>
                  </div>
                  <div className='grid gap-3 sm:grid-cols-2 lg:w-[360px]'>
                    <div className='rounded-2xl border border-white/10 bg-white/10 p-4'>
                      <p className='text-xs uppercase tracking-[0.18em] text-cyan-100'>{c('Estado', 'Status')}</p>
                      <p className='mt-2 text-xl font-black'>{supportHealth.label}</p>
                      <p className='mt-1 text-xs text-slate-200'>{supportHealth.description}</p>
                    </div>
                    <div className='rounded-2xl border border-white/10 bg-white/10 p-4'>
                      <p className='text-xs uppercase tracking-[0.18em] text-cyan-100'>{c('Tickets abiertos', 'Open tickets')}</p>
                      <p className='mt-2 text-3xl font-black'>{totals.abiertos}</p>
                      <p className='mt-1 text-xs text-slate-200'>{totals.criticos} {c('críticos', 'critical')}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                <Card className='border-sky-100 bg-white dark:border-sky-900/60 dark:bg-slate-900'>
                  <CardContent className='flex items-center gap-3 p-5'>
                    <LifeBuoy className='h-9 w-9 text-sky-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>{c('Tickets totales', 'Total tickets')}</p>
                      <p className='text-3xl font-black'>{totals.total}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className='border-amber-100 bg-white dark:border-amber-900/60 dark:bg-slate-900'>
                  <CardContent className='flex items-center gap-3 p-5'>
                    <MessageSquarePlus className='h-9 w-9 text-amber-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>{c('Abiertos', 'Open')}</p>
                      <p className='text-3xl font-black'>{totals.abiertos}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className='border-red-100 bg-white dark:border-red-900/60 dark:bg-slate-900'>
                  <CardContent className='flex items-center gap-3 p-5'>
                    <AlertTriangle className='h-9 w-9 text-red-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>{c('Críticos / +48 h', 'Critical / +48 h')}</p>
                      <p className='text-3xl font-black'>{totals.criticos + totals.vencidos}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className='border-emerald-100 bg-white dark:border-emerald-900/60 dark:bg-slate-900'>
                  <CardContent className='flex items-center gap-3 p-5'>
                    <CheckCircle2 className='h-9 w-9 text-emerald-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>{c('Cerrados', 'Closed')}</p>
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
                        <h2 className='font-black'>{c('Lectura ejecutiva de soporte', 'Executive support reading')}</h2>
                        <p className='text-sm text-muted-foreground'>{c('Priorización para no perder incidencias importantes.', 'Prioritization to avoid missing important incidents.')}</p>
                      </div>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-3'>
                      <div className='rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-950'>
                        <p className='text-xs uppercase text-muted-foreground'>{c('En revisión', 'Under review')}</p>
                        <p className='text-2xl font-black'>{totals.enRevision}</p>
                      </div>
                      <div className='rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-950'>
                        <p className='text-xs uppercase text-muted-foreground'>{c('Email pendiente', 'Pending email')}</p>
                        <p className='text-2xl font-black'>{totals.emailPendiente}</p>
                      </div>
                      <div className='rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-950'>
                        <p className='text-xs uppercase text-muted-foreground'>+48 h</p>
                        <p className='text-2xl font-black'>{totals.vencidos}</p>
                      </div>
                    </div>
                    <div className='rounded-xl border border-cyan-200 bg-white p-4 text-sm dark:border-cyan-900 dark:bg-slate-950'>
                      <p className='font-bold'>{c('Próximo paso recomendado', 'Recommended next step')}</p>
                      <p className='mt-1 text-muted-foreground'>{nextAction}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className='border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'>
                  <CardContent className='grid gap-4 p-5 md:grid-cols-3'>
                    <div className='rounded-xl border border-dashed p-4 dark:border-slate-700'>
                      <TimerReset className='mb-3 h-6 w-6 text-sky-600' />
                      <p className='font-bold'>{c('Triage rápido', 'Quick triage')}</p>
                      <p className='mt-1 text-sm text-muted-foreground'>{c('Clasificá por prioridad y categoría para que Dragon Pyramid reciba contexto accionable.', 'Classify by priority and category so Dragon Pyramid receives actionable context.')}</p>
                    </div>
                    <div className='rounded-xl border border-dashed p-4 dark:border-slate-700'>
                      <MailWarning className='mb-3 h-6 w-6 text-amber-600' />
                      <p className='font-bold'>{c('Email de soporte', 'Support email')}</p>
                      <p className='mt-1 text-sm text-muted-foreground'>{c('Si no hay destinatario configurado, el ticket queda registrado y visible para seguimiento.', 'If no recipient is configured, the ticket remains logged and visible for follow-up.')}</p>
                    </div>
                    <div className='rounded-xl border border-dashed p-4 dark:border-slate-700'>
                      <Sparkles className='mb-3 h-6 w-6 text-fuchsia-600' />
                      <p className='font-bold'>{c('Trazabilidad', 'Traceability')}</p>
                      <p className='mt-1 text-sm text-muted-foreground'>{c('Cada comentario, respuesta y cambio de estado queda en historial del ticket.', 'Every comment, reply, and status change remains in the ticket history.')}</p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <div className='grid gap-6 xl:grid-cols-[0.85fr_1.15fr]'>
                <Card className='bg-white dark:border-slate-800 dark:bg-slate-900'>
                  <CardHeader className='border-b p-5 dark:border-slate-800'>
                    <h2 className='text-xl font-black'>{c('Nuevo ticket', 'New ticket')}</h2>
                    <p className='text-sm text-muted-foreground'>{c('Reportá fallas, dudas, problemas o sugerencias al soporte de Dragon Pyramid.', 'Report failures, questions, issues, or suggestions to Dragon Pyramid support.')}</p>
                  </CardHeader>
                  <CardContent className='p-5'>
                    <form className='space-y-4' onSubmit={handleCreate}>
                      <div className='grid gap-3 md:grid-cols-2'>
                        <div className='space-y-2'>
                          <Label htmlFor='categoria'>{c('Categoría', 'Category')}</Label>
                          <select
                            id='categoria'
                            name='categoria'
                            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
                            value={form.categoria}
                            onChange={handleChange}
                          >
                            {categorias.map((categoria) => (
                              <option key={categoria} value={categoria}>{getCategoriaLabel(locale, categoria)}</option>
                            ))}
                          </select>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='prioridad'>{c('Prioridad', 'Priority')}</Label>
                          <select
                            id='prioridad'
                            name='prioridad'
                            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
                            value={form.prioridad}
                            onChange={handleChange}
                          >
                            {prioridades.map((prioridad) => (
                              <option key={prioridad} value={prioridad}>{getPrioridadLabel(locale, prioridad)}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='asunto'>{c('Asunto', 'Subject')}</Label>
                        <Input
                          id='asunto'
                          name='asunto'
                          value={form.asunto}
                          onChange={handleChange}
                          placeholder={c('Ejemplo: error al registrar pagos manuales', 'Example: error when registering manual payments')}
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='descripcion'>{c('Descripción', 'Description')}</Label>
                        <textarea
                          id='descripcion'
                          name='descripcion'
                          rows={6}
                          value={form.descripcion}
                          onChange={handleChange}
                          className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                          placeholder={c('Describí qué pasó, qué usuario lo reportó, pasos para reproducirlo y cualquier dato relevante.', 'Describe what happened, which user reported it, steps to reproduce it, and any relevant details.')}
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='adjunto_url'>{c('Adjunto / captura URL opcional', 'Optional attachment / screenshot URL')}</Label>
                        <Input
                          id='adjunto_url'
                          name='adjunto_url'
                          value={form.adjunto_url}
                          onChange={handleChange}
                          placeholder='https://...'
                        />
                      </div>

                      <div className='rounded-lg bg-muted p-3 text-xs text-muted-foreground'>
                        {c('Usuario emisor:', 'Sender user:')} {user?.nombre ?? user?.email ?? c('Usuario actual', 'Current user')}. {c('El sistema enviará notificación por email si el soporte de Dragon Pyramid está configurado.', 'The system will send an email notification if Dragon Pyramid support is configured.')}
                      </div>

                      <Button type='submit' disabled={saving} className='w-full gap-2'>
                        <Send className='h-4 w-4' />
                        {saving ? c('Enviando...', 'Sending...') : c('Enviar ticket', 'Send ticket')}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className='min-w-0 bg-white dark:border-slate-800 dark:bg-slate-900'>
                  <CardHeader className='border-b p-5 dark:border-slate-800'>
                    <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
                      <div>
                        <h2 className='text-xl font-black'>{c('Tickets enviados', 'Sent tickets')}</h2>
                        <p className='text-sm text-muted-foreground'>{c('Seguimiento y trazabilidad de tickets enviados a Dragon Pyramid.', 'Follow-up and traceability for tickets sent to Dragon Pyramid.')}</p>
                      </div>
                      <form className='flex flex-col gap-2 sm:flex-row sm:flex-wrap' onSubmit={handleSearchSubmit}>
                        <select
                          value={estadoFilter}
                          onChange={(event) => setEstadoFilter(event.target.value as SoporteTicketEstado | 'todos')}
                          className='h-10 rounded-md border border-input bg-background px-3 text-sm'
                        >
                          {estados.map((estado) => (
                            <option key={estado} value={estado}>{getEstadoFilterLabel(locale, estado)}</option>
                          ))}
                        </select>
                        <div className='relative min-w-0 sm:w-64'>
                          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                          <Input
                            type='search'
                            className='w-full pl-8'
                            placeholder={c('Buscar ticket...', 'Search ticket...')}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                          />
                        </div>
                        <Button type='submit' variant='outline'>{c('Buscar', 'Search')}</Button>
                        <Button type='button' variant='outline' className='gap-2' onClick={loadTickets} disabled={loading}>
                          <RefreshCcw className='h-4 w-4' />
                          {c('Actualizar', 'Refresh')}
                        </Button>
                      </form>
                    </div>
                  </CardHeader>
                  <CardContent className='grid gap-4 p-5 xl:grid-cols-[0.95fr_1.05fr]'>
                    <div className='max-h-[680px] space-y-3 overflow-y-auto pr-1'>
                      {loading ? (
                        <div className='py-8 text-center text-muted-foreground'>{c('Cargando tickets...', 'Loading tickets...')}</div>
                      ) : tickets.length === 0 ? (
                        <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>{c('No hay tickets para el filtro seleccionado.', 'There are no tickets for the selected filter.')}</div>
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
                                <p className='text-xs text-muted-foreground'>{ticket.codigo} · {getFormattedDate(locale, ticket.creado_en)}</p>
                              </div>
                              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClass[ticket.estado]}`}>{getEstadoLabel(locale, ticket.estado)}</span>
                            </div>
                            <p className='mt-2 line-clamp-2 text-sm text-muted-foreground'>{ticket.descripcion}</p>
                            <div className='mt-3 flex flex-wrap gap-2 text-xs'>
                              <span className='rounded-full bg-muted px-2 py-1'>{getCategoriaLabel(locale, ticket.categoria)}</span>
                              <span className={`rounded-full border px-2 py-1 font-bold ${prioridadClass[ticket.prioridad]}`}>{c('Prioridad', 'Priority')} {getPrioridadLabel(locale, ticket.prioridad)}</span>
                              {isStaleTicket(ticket) && (
                                <span className='inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 font-bold text-red-700 dark:bg-red-950/50 dark:text-red-200'>
                                  <Clock3 className='h-3 w-3' /> +48 h {c('abierto', 'open')}
                                </span>
                              )}
                              {!ticket.email_notificacion_enviado && (
                                <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-200'>
                                  <MailWarning className='h-3 w-3' /> {c('Email no confirmado', 'Email not confirmed')}
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
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClass[selected.estado]}`}>{getEstadoLabel(locale, selected.estado)}</span>
                          </div>
                          <div className='grid gap-2 text-sm md:grid-cols-2'>
                            <p><strong>{c('Prioridad:', 'Priority:')}</strong> {getPrioridadLabel(locale, selected.prioridad)}</p>
                            <p><strong>{c('Categoría:', 'Category:')}</strong> {getCategoriaLabel(locale, selected.categoria)}</p>
                            <p><strong>{c('Creado:', 'Created:')}</strong> {getFormattedDate(locale, selected.creado_en)}</p>
                            <p><strong>{c('Actualizado:', 'Updated:')}</strong> {getFormattedDate(locale, selected.actualizado_en)}</p>
                            <p className='md:col-span-2'><strong>{c('Email soporte:', 'Support email:')}</strong> {getEmailStatusLabel(locale, selected)}</p>
                          </div>
                          <div className='rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap'>{selected.descripcion}</div>
                          {selected.adjunto_url && (
                            <a href={selected.adjunto_url} target='_blank' rel='noreferrer' className='text-sm font-bold text-primary underline'>{c('Abrir adjunto / captura', 'Open attachment / screenshot')}</a>
                          )}

                          <div className='space-y-2'>
                            <Label htmlFor='comentario'>{c('Comentario interno / seguimiento', 'Internal comment / follow-up')}</Label>
                            <textarea
                              id='comentario'
                              rows={3}
                              value={comentario}
                              onChange={(event) => setComentario(event.target.value)}
                              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                              placeholder={c('Agregar nota de seguimiento...', 'Add follow-up note...')}
                            />
                            <Button
                              type='button'
                              variant='outline'
                              disabled={saving || !comentario.trim()}
                              onClick={() => handleUpdateTicket({ comentario })}
                            >
                              {c('Guardar comentario', 'Save comment')}
                            </Button>
                          </div>

                          <div className='space-y-2'>
                            <Label htmlFor='respuesta'>{c('Respuesta / resolución', 'Reply / resolution')}</Label>
                            <textarea
                              id='respuesta'
                              rows={3}
                              value={respuesta}
                              onChange={(event) => setRespuesta(event.target.value)}
                              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                              placeholder={c('Registrar respuesta o resolución recibida de Dragon Pyramid...', 'Log reply or resolution received from Dragon Pyramid...')}
                            />
                            <Button
                              type='button'
                              disabled={saving || !respuesta.trim()}
                              onClick={() => handleUpdateTicket({ respuesta })}
                            >
                              {c('Marcar respondido', 'Mark as responded')}
                            </Button>
                          </div>

                          <div className='flex flex-wrap gap-2'>
                            <Button type='button' variant='outline' disabled={saving || selected.estado === 'en_revision'} onClick={() => handleUpdateTicket({ estado: 'en_revision' })}>{c('En revisión', 'Under review')}</Button>
                            <Button type='button' variant='outline' disabled={saving || selected.estado === 'cerrado'} onClick={() => handleUpdateTicket({ estado: 'cerrado' })}>{c('Cerrar', 'Close')}</Button>
                          </div>

                          <div className='space-y-2 border-t pt-4 dark:border-slate-800'>
                            <h4 className='font-black'>{c('Historial', 'History')}</h4>
                            {selected.eventos && selected.eventos.length > 0 ? (
                              selected.eventos.map((evento) => (
                                <div key={evento.id} className='rounded-lg border bg-background p-3 text-sm dark:border-slate-800'>
                                  <div className='flex flex-wrap justify-between gap-2'>
                                    <span className='font-bold'>{translateEventType(locale, evento.tipo)}</span>
                                    <span className='text-xs text-muted-foreground'>{getFormattedDate(locale, evento.creado_en)}</span>
                                  </div>
                                  <p className='mt-1 whitespace-pre-wrap text-muted-foreground'>{evento.mensaje || c('Evento sin detalle.', 'Event without details.')}</p>
                                </div>
                              ))
                            ) : (
                              <p className='text-sm text-muted-foreground'>{c('El historial se verá al abrir el detalle después de crear o actualizar el ticket.', 'The history will appear when opening the details after creating or updating the ticket.')}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className='flex min-h-[320px] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-800'>{c('Seleccioná un ticket para ver detalle e historial.', 'Select a ticket to view details and history.')}</div>
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
