'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  LifeBuoy,
  MailWarning,
  MessageSquarePlus,
  Search,
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

const initialForm = {
  categoria: 'fallas' as SoporteTicketCategoria,
  prioridad: 'media' as SoporteTicketPrioridad,
  asunto: '',
  descripcion: '',
  adjunto_url: '',
};

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

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await getSoporteTickets({
        estado: estadoFilter,
        q: searchTerm.trim(),
      });
      if (!response.ok) throw new Error(response.error || 'No se pudieron cargar los tickets');
      const nextTickets = response.data ?? [];
      setTickets(nextTickets);
      if (selected) {
        const refreshed = nextTickets.find((ticket) => ticket.id === selected.id) ?? null;
        setSelected(refreshed);
      }
    } catch (error) {
      setTickets([]);
      toast.error(error instanceof Error ? error.message : 'Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, estadoFilter]);

  const totals = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc.total += 1;
        acc.abiertos += ticket.estado === 'pendiente' || ticket.estado === 'en_revision' ? 1 : 0;
        acc.criticos += ticket.prioridad === 'critica' ? 1 : 0;
        acc.cerrados += ticket.estado === 'cerrado' ? 1 : 0;
        return acc;
      },
      { total: 0, abiertos: 0, criticos: 0, cerrados: 0 }
    );
  }, [tickets]);

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

  if (!isInitialized) return <div>Cargando...</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Soporte Dragon Pyramid' />
          <main className='flex-1 space-y-6 p-6'>
            <section className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardContent className='flex items-center gap-3 p-4'>
                  <LifeBuoy className='h-8 w-8 text-sky-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Tickets</p>
                    <p className='text-2xl font-bold'>{totals.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center gap-3 p-4'>
                  <MessageSquarePlus className='h-8 w-8 text-amber-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Abiertos</p>
                    <p className='text-2xl font-bold'>{totals.abiertos}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center gap-3 p-4'>
                  <AlertTriangle className='h-8 w-8 text-red-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Críticos</p>
                    <p className='text-2xl font-bold'>{totals.criticos}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center gap-3 p-4'>
                  <CheckCircle2 className='h-8 w-8 text-emerald-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Cerrados</p>
                    <p className='text-2xl font-bold'>{totals.cerrados}</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <div className='grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
              <Card>
                <CardHeader className='border-b p-4'>
                  <h2 className='text-xl font-bold'>Nuevo ticket</h2>
                  <p className='text-sm text-muted-foreground'>Reportá fallas, dudas, problemas o sugerencias al soporte de Dragon Pyramid.</p>
                </CardHeader>
                <CardContent className='p-4'>
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

              <Card>
                <CardHeader className='border-b p-4'>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <h2 className='text-xl font-bold'>Tickets enviados</h2>
                      <p className='text-sm text-muted-foreground'>Seguimiento y trazabilidad de tickets enviados a Dragon Pyramid.</p>
                    </div>
                    <form className='flex flex-wrap gap-2' onSubmit={handleSearchSubmit}>
                      <select
                        value={estadoFilter}
                        onChange={(event) => setEstadoFilter(event.target.value as SoporteTicketEstado | 'todos')}
                        className='h-10 rounded-md border border-input bg-background px-3 text-sm'
                      >
                        {estados.map((estado) => (
                          <option key={estado.value} value={estado.value}>{estado.label}</option>
                        ))}
                      </select>
                      <div className='relative'>
                        <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                        <Input
                          type='search'
                          className='w-64 pl-8'
                          placeholder='Buscar ticket...'
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                        />
                      </div>
                      <Button type='submit' variant='outline'>Buscar</Button>
                    </form>
                  </div>
                </CardHeader>
                <CardContent className='grid gap-4 p-4 xl:grid-cols-[0.95fr_1.05fr]'>
                  <div className='space-y-3'>
                    {loading ? (
                      <div className='py-8 text-center text-muted-foreground'>Cargando tickets...</div>
                    ) : tickets.length === 0 ? (
                      <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>No hay tickets para el filtro seleccionado.</div>
                    ) : (
                      tickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          type='button'
                          onClick={async () => {
                            setSelected(ticket);
                            const response = await getSoporteTicket(ticket.id);
                            if (response.ok && response.data) setSelected(response.data);
                          }}
                          className={`w-full rounded-xl border p-4 text-left transition hover:bg-muted/60 ${selected?.id === ticket.id ? 'border-primary bg-muted' : ''}`}
                        >
                          <div className='flex flex-wrap items-start justify-between gap-3'>
                            <div>
                              <h3 className='font-semibold'>{ticket.asunto}</h3>
                              <p className='text-xs text-muted-foreground'>{ticket.codigo} · {formatFrontendDateTime(ticket.creado_en)}</p>
                            </div>
                            <span className='rounded-full bg-background px-3 py-1 text-xs font-medium'>{estadoLabel[ticket.estado]}</span>
                          </div>
                          <p className='mt-2 line-clamp-2 text-sm text-muted-foreground'>{ticket.descripcion}</p>
                          <div className='mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground'>
                            <span className='rounded-full bg-muted px-2 py-1'>{ticket.categoria}</span>
                            <span className='rounded-full bg-muted px-2 py-1'>Prioridad {prioridadLabel[ticket.prioridad]}</span>
                            {!ticket.email_notificacion_enviado && (
                              <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700'>
                                <MailWarning className='h-3 w-3' /> Email no confirmado
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className='rounded-xl border p-4'>
                    {selected ? (
                      <div className='space-y-4'>
                        <div>
                          <p className='text-xs text-muted-foreground'>Ticket</p>
                          <h3 className='text-lg font-bold'>{selected.codigo}</h3>
                          <p className='text-sm text-muted-foreground'>{selected.asunto}</p>
                        </div>
                        <div className='grid gap-2 text-sm md:grid-cols-2'>
                          <p><strong>Estado:</strong> {estadoLabel[selected.estado]}</p>
                          <p><strong>Prioridad:</strong> {prioridadLabel[selected.prioridad]}</p>
                          <p><strong>Categoría:</strong> {selected.categoria}</p>
                          <p><strong>Creado:</strong> {formatFrontendDateTime(selected.creado_en)}</p>
                          <p className='md:col-span-2'><strong>Email soporte:</strong> {selected.email_notificacion_enviado ? 'enviado' : selected.email_notificacion_error || 'pendiente/no configurado'}</p>
                        </div>
                        <div className='rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap'>{selected.descripcion}</div>
                        {selected.adjunto_url && (
                          <a href={selected.adjunto_url} target='_blank' rel='noreferrer' className='text-sm font-medium text-primary underline'>Abrir adjunto / captura</a>
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

                        <div className='space-y-2 border-t pt-4'>
                          <h4 className='font-semibold'>Historial</h4>
                          {selected.eventos && selected.eventos.length > 0 ? (
                            selected.eventos.map((evento) => (
                              <div key={evento.id} className='rounded-lg border p-3 text-sm'>
                                <div className='flex flex-wrap justify-between gap-2'>
                                  <span className='font-medium'>{evento.tipo}</span>
                                  <span className='text-xs text-muted-foreground'>{formatFrontendDateTime(evento.creado_en)}</span>
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
                      <div className='flex min-h-[320px] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>Seleccioná un ticket para ver detalle e historial.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
