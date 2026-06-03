'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Inbox, MailCheck, MessageSquareReply, Search } from 'lucide-react';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SocioMensaje, SocioMensajeEstado } from '@/interfaces/socioMensaje.interface';
import { actualizarMensajeSocioAdmin, getMensajesSociosAdmin } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatFrontendDateTime } from '@/utils/dateFormat';

const estados: Array<{ value: SocioMensajeEstado | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'leido', label: 'Leídos' },
  { value: 'respondido', label: 'Respondidos' },
  { value: 'cerrado', label: 'Cerrados' },
];

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  leido: 'Leído',
  respondido: 'Respondido',
  cerrado: 'Cerrado',
};

export default function MensajesAdminPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const [mensajes, setMensajes] = useState<SocioMensaje[]>([]);
  const [selected, setSelected] = useState<SocioMensaje | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<SocioMensajeEstado | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const loadMensajes = async () => {
    setLoading(true);
    try {
      const response = await getMensajesSociosAdmin({ estado: estadoFilter, q: searchTerm.trim() });
      if (!response.ok) throw new Error(response.error || 'No se pudieron cargar los mensajes');
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
  }, [isAuthenticated, estadoFilter]);

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

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadMensajes();
  };

  const handleSelect = async (mensaje: SocioMensaje) => {
    setSelected(mensaje);
    setRespuesta(mensaje.respuesta ?? '');

    if (mensaje.estado === 'pendiente') {
      const response = await actualizarMensajeSocioAdmin(mensaje.id, { estado: 'leido' });
      if (response.ok && response.data) {
        setSelected(response.data);
        setMensajes((prev) => prev.map((item) => (item.id === mensaje.id ? response.data! : item)));
      }
    }
  };

  const handleResponder = async () => {
    if (!selected) return;
    if (!respuesta.trim()) {
      toast.error('Escribí una respuesta antes de enviar.');
      return;
    }

    setSaving(true);
    try {
      const response = await actualizarMensajeSocioAdmin(selected.id, { respuesta });
      if (!response.ok || !response.data) throw new Error(response.error || 'No se pudo responder el mensaje');
      toast.success('Respuesta guardada y enviada al socio por email');
      setSelected(response.data);
      await loadMensajes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al responder');
    } finally {
      setSaving(false);
    }
  };

  const handleCerrar = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await actualizarMensajeSocioAdmin(selected.id, { estado: 'cerrado' });
      if (!response.ok || !response.data) throw new Error(response.error || 'No se pudo cerrar el mensaje');
      toast.success('Mensaje cerrado');
      setSelected(response.data);
      await loadMensajes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cerrar mensaje');
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
          <AppHeader title='Mensajes de socios' />
          <main className='flex-1 space-y-6 p-6'>
            <section className='grid gap-4 md:grid-cols-3'>
              <Card>
                <CardContent className='flex items-center gap-3 p-4'>
                  <Inbox className='h-8 w-8 text-sky-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Mensajes</p>
                    <p className='text-2xl font-bold'>{totals.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center gap-3 p-4'>
                  <MessageSquareReply className='h-8 w-8 text-amber-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Pendientes</p>
                    <p className='text-2xl font-bold'>{totals.pendientes}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='flex items-center gap-3 p-4'>
                  <MailCheck className='h-8 w-8 text-emerald-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Respondidos</p>
                    <p className='text-2xl font-bold'>{totals.respondidos}</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
              <Card>
                <CardHeader className='border-b p-4'>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <h2 className='text-xl font-bold'>Bandeja de entrada</h2>
                      <p className='text-sm text-muted-foreground'>Consultas, reclamos y preguntas enviadas por socios.</p>
                    </div>
                    <form className='flex flex-wrap gap-2' onSubmit={handleSearchSubmit}>
                      <select
                        value={estadoFilter}
                        onChange={(event) => setEstadoFilter(event.target.value as SocioMensajeEstado | 'todos')}
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
                          placeholder='Buscar asunto o mensaje...'
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                        />
                      </div>
                      <Button type='submit' variant='outline'>Buscar</Button>
                    </form>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3 p-4'>
                  {loading ? (
                    <div className='py-8 text-center text-muted-foreground'>Cargando mensajes...</div>
                  ) : mensajes.length === 0 ? (
                    <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>No hay mensajes para el filtro seleccionado.</div>
                  ) : (
                    mensajes.map((mensaje) => (
                      <button
                        key={mensaje.id}
                        type='button'
                        onClick={() => handleSelect(mensaje)}
                        className={`w-full rounded-xl border p-4 text-left transition hover:bg-muted/60 ${selected?.id === mensaje.id ? 'border-primary bg-muted' : ''}`}
                      >
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                          <div>
                            <h3 className='font-semibold'>{mensaje.asunto}</h3>
                            <p className='text-xs text-muted-foreground'>
                              {mensaje.socio?.nombre_completo ?? 'Socio'} · {mensaje.socio?.email ?? 'sin email'}
                            </p>
                          </div>
                          <span className='rounded-full bg-background px-3 py-1 text-xs font-medium'>{estadoLabel[mensaje.estado] ?? mensaje.estado}</span>
                        </div>
                        <p className='mt-2 line-clamp-2 text-sm text-muted-foreground'>{mensaje.mensaje}</p>
                        <p className='mt-2 text-xs text-muted-foreground'>{formatFrontendDateTime(mensaje.creado_en)}</p>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='border-b p-4'>
                  <h2 className='text-xl font-bold'>Detalle y respuesta</h2>
                </CardHeader>
                <CardContent className='space-y-4 p-4'>
                  {!selected ? (
                    <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>Seleccioná un mensaje para responder.</div>
                  ) : (
                    <>
                      <div>
                        <p className='text-xs text-muted-foreground'>Socio</p>
                        <p className='font-semibold'>{selected.socio?.nombre_completo ?? 'Sin nombre'}</p>
                        <p className='text-sm text-muted-foreground'>{selected.socio?.email ?? 'Sin email'} · DNI {selected.socio?.dni ?? '-'}</p>
                      </div>
                      <div>
                        <p className='text-xs text-muted-foreground'>Asunto</p>
                        <p className='font-semibold'>{selected.asunto}</p>
                      </div>
                      <div className='rounded-lg bg-muted p-3 text-sm'>
                        <p className='whitespace-pre-line'>{selected.mensaje}</p>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='respuesta'>Respuesta administrativa</Label>
                        <textarea
                          id='respuesta'
                          value={respuesta}
                          rows={7}
                          placeholder='Escribí la respuesta para el socio...'
                          onChange={(event) => setRespuesta(event.target.value)}
                          className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        />
                      </div>
                      {selected.email_respuesta_error && (
                        <div className='rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900'>
                          Email no enviado: {selected.email_respuesta_error}
                        </div>
                      )}
                      <div className='flex flex-wrap justify-end gap-2'>
                        <Button type='button' variant='outline' onClick={handleCerrar} disabled={saving || selected.estado === 'cerrado'}>
                          Cerrar
                        </Button>
                        <Button type='button' onClick={handleResponder} disabled={saving}>
                          {saving ? 'Guardando...' : 'Responder y enviar email'}
                        </Button>
                      </div>
                    </>
                  )}
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
