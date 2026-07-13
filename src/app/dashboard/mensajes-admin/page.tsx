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
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';
import { formatFrontendDateTime } from '@/utils/dateFormat';

function mensajesAdminTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function getEstadosOptions(locale: GymMasterLocale): Array<{ value: SocioMensajeEstado | 'todos'; label: string }> {
  const c = (es: string, en: string) => mensajesAdminTx(locale, es, en);

  return [
    { value: 'todos', label: c('Todos', 'All') },
    { value: 'pendiente', label: c('Pendientes', 'Pending') },
    { value: 'leido', label: c('Leídos', 'Read') },
    { value: 'respondido', label: c('Respondidos', 'Responded') },
    { value: 'cerrado', label: c('Cerrados', 'Closed') },
  ];
}

function getEstadoLabel(locale: GymMasterLocale, estado: string) {
  const labels: Record<GymMasterLocale, Record<string, string>> = {
    es: {
      pendiente: 'Pendiente',
      leido: 'Leído',
      respondido: 'Respondido',
      cerrado: 'Cerrado',
    },
    en: {
      pendiente: 'Pending',
      leido: 'Read',
      respondido: 'Responded',
      cerrado: 'Closed',
    },
  };

  return labels[locale][estado] ?? estado;
}

export default function MensajesAdminPage() {
  const { locale } = useI18n();
  const c = (es: string, en: string) => mensajesAdminTx(locale, es, en);
  const estados = useMemo(() => getEstadosOptions(locale), [locale]);
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
      if (!response.ok) throw new Error(response.error || c('No se pudieron cargar los mensajes', 'Messages could not be loaded'));
      setMensajes(response.data ?? []);
    } catch (error) {
      setMensajes([]);
      toast.error(error instanceof Error ? error.message : c('Error al cargar mensajes', 'Error loading messages'));
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
      toast.error(c('Escribí una respuesta antes de enviar.', 'Write a reply before sending.'));
      return;
    }

    setSaving(true);
    try {
      const response = await actualizarMensajeSocioAdmin(selected.id, { respuesta });
      if (!response.ok || !response.data) throw new Error(response.error || c('No se pudo responder el mensaje', 'The message could not be answered'));
      toast.success(c('Respuesta guardada y enviada al socio por email', 'Reply saved and sent to the member by email'));
      setSelected(response.data);
      await loadMensajes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : c('Error al responder', 'Error sending reply'));
    } finally {
      setSaving(false);
    }
  };

  const handleCerrar = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await actualizarMensajeSocioAdmin(selected.id, { estado: 'cerrado' });
      if (!response.ok || !response.data) throw new Error(response.error || c('No se pudo cerrar el mensaje', 'The message could not be closed'));
      toast.success(c('Mensaje cerrado', 'Message closed'));
      setSelected(response.data);
      await loadMensajes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : c('Error al cerrar mensaje', 'Error closing message'));
    } finally {
      setSaving(false);
    }
  };

  if (!isInitialized) return <div>{c('Cargando...', 'Loading...')}</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c('Mensajes de socios', 'Member messages')} />
          <main className='flex-1 space-y-6 bg-slate-50/70 p-6 dark:bg-slate-950'>
            <section className='grid gap-4 md:grid-cols-3'>
              <Card className='border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70'>
                <CardContent className='flex items-center gap-3 p-4'>
                  <Inbox className='h-8 w-8 text-sky-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>{c('Mensajes', 'Messages')}</p>
                    <p className='text-2xl font-bold'>{totals.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className='border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70'>
                <CardContent className='flex items-center gap-3 p-4'>
                  <MessageSquareReply className='h-8 w-8 text-amber-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>{c('Pendientes', 'Pending')}</p>
                    <p className='text-2xl font-bold'>{totals.pendientes}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className='border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70'>
                <CardContent className='flex items-center gap-3 p-4'>
                  <MailCheck className='h-8 w-8 text-emerald-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>{c('Respondidos', 'Responded')}</p>
                    <p className='text-2xl font-bold'>{totals.respondidos}</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
              <Card className='border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70'>
                <CardHeader className='border-b border-slate-200 p-4 dark:border-slate-800'>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <h2 className='text-xl font-bold'>{c('Bandeja de entrada', 'Inbox')}</h2>
                      <p className='text-sm text-muted-foreground'>{c('Consultas, reclamos y preguntas enviadas por socios.', 'Queries, complaints, and questions sent by members.')}</p>
                    </div>
                    <form className='flex flex-wrap gap-2' onSubmit={handleSearchSubmit}>
                      <select
                        value={estadoFilter}
                        onChange={(event) => setEstadoFilter(event.target.value as SocioMensajeEstado | 'todos')}
                        className='h-10 rounded-md border border-input bg-background px-3 text-sm dark:border-slate-700 dark:bg-slate-950'
                      >
                        {estados.map((estado) => (
                          <option key={estado.value} value={estado.value}>{estado.label}</option>
                        ))}
                      </select>
                      <div className='relative'>
                        <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                        <Input
                          type='search'
                          className='w-64 pl-8 dark:border-slate-700 dark:bg-slate-950'
                          placeholder={c('Buscar asunto o mensaje...', 'Search subject or message...')}
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                        />
                      </div>
                      <Button type='submit' variant='outline'>{c('Buscar', 'Search')}</Button>
                    </form>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3 p-4'>
                  {loading ? (
                    <div className='py-8 text-center text-muted-foreground'>{c('Cargando mensajes...', 'Loading messages...')}</div>
                  ) : mensajes.length === 0 ? (
                    <div className='rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground dark:border-slate-700'>{c('No hay mensajes para el filtro seleccionado.', 'There are no messages for the selected filter.')}</div>
                  ) : (
                    mensajes.map((mensaje) => (
                      <button
                        key={mensaje.id}
                        type='button'
                        onClick={() => handleSelect(mensaje)}
                        className={`w-full rounded-xl border p-4 text-left transition hover:bg-muted/60 dark:border-slate-800 dark:hover:bg-slate-900/80 ${selected?.id === mensaje.id ? 'border-primary bg-muted dark:bg-slate-900' : 'bg-white dark:bg-slate-950/40'}`}
                      >
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                          <div>
                            <h3 className='font-semibold'>{mensaje.asunto}</h3>
                            <p className='text-xs text-muted-foreground'>
                              {mensaje.socio?.nombre_completo ?? c('Socio', 'Member')} · {mensaje.socio?.email ?? c('sin email', 'no email')}
                            </p>
                          </div>
                          <span className='rounded-full bg-background px-3 py-1 text-xs font-medium dark:bg-slate-900'>{getEstadoLabel(locale, mensaje.estado)}</span>
                        </div>
                        <p className='mt-2 line-clamp-2 text-sm text-muted-foreground'>{mensaje.mensaje}</p>
                        <p className='mt-2 text-xs text-muted-foreground'>{formatFrontendDateTime(mensaje.creado_en)}</p>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className='border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70'>
                <CardHeader className='border-b border-slate-200 p-4 dark:border-slate-800'>
                  <h2 className='text-xl font-bold'>{c('Detalle y respuesta', 'Details and reply')}</h2>
                </CardHeader>
                <CardContent className='space-y-4 p-4'>
                  {!selected ? (
                    <div className='rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground dark:border-slate-700'>{c('Seleccioná un mensaje para responder.', 'Select a message to reply.')}</div>
                  ) : (
                    <>
                      <div>
                        <p className='text-xs text-muted-foreground'>{c('Socio', 'Member')}</p>
                        <p className='font-semibold'>{selected.socio?.nombre_completo ?? c('Sin nombre', 'No name')}</p>
                        <p className='text-sm text-muted-foreground'>{selected.socio?.email ?? c('Sin email', 'No email')} · {c('DNI', 'ID')} {selected.socio?.dni ?? '-'}</p>
                      </div>
                      <div>
                        <p className='text-xs text-muted-foreground'>{c('Asunto', 'Subject')}</p>
                        <p className='font-semibold'>{selected.asunto}</p>
                      </div>
                      <div className='rounded-lg bg-muted p-3 text-sm dark:bg-slate-900'>
                        <p className='whitespace-pre-line'>{selected.mensaje}</p>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='respuesta'>{c('Respuesta administrativa', 'Admin reply')}</Label>
                        <textarea
                          id='respuesta'
                          value={respuesta}
                          rows={7}
                          placeholder={c('Escribí la respuesta para el socio...', 'Write the reply for the member...')}
                          onChange={(event) => setRespuesta(event.target.value)}
                          className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-slate-700 dark:bg-slate-950'
                        />
                      </div>
                      {selected.email_respuesta_error && (
                        <div className='rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100'>
                          {c('Email no enviado:', 'Email not sent:')} {selected.email_respuesta_error}
                        </div>
                      )}
                      <div className='flex flex-wrap justify-end gap-2'>
                        <Button type='button' variant='outline' onClick={handleCerrar} disabled={saving || selected.estado === 'cerrado'}>
                          {c('Cerrar', 'Close')}
                        </Button>
                        <Button type='button' onClick={handleResponder} disabled={saving}>
                          {saving ? c('Guardando...', 'Saving...') : c('Responder y enviar email', 'Reply and send email')}
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
