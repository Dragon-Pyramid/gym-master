'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FileText,
  Filter,
  Inbox,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SquareTerminal,
} from 'lucide-react';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import NotificacionModal from '@/components/modal/NotificacionModal';
import NotificacionTable from '@/components/tables/NotificacionTable';
import NotificacionViewModal from '@/components/modal/NotificacionViewModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  Notificacion,
  NotificacionEstado,
  NotificacionPlantilla,
  NotificacionTipo,
} from '@/interfaces/notificacion.interface';
import {
  cancelarNotificacion,
  enviarNotificacion,
  getNotificacion,
  getNotificacionPlantillas,
  getNotificaciones,
} from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { downloadCommercialReportPdf } from '@/utils/commercialReportPdf';
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import { formatFrontendDateTime } from '@/utils/dateFormat';

const PAGE_SIZE = 10;
type EstadoFilter = 'todos' | NotificacionEstado;
type TipoFilter = 'todos' | NotificacionTipo;

const estados: Array<{ value: EstadoFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'programada', label: 'Programada' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'error', label: 'Error' },
];

const tipos: Array<{ value: TipoFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'general', label: 'General' },
  { value: 'feriado', label: 'Feriado' },
  { value: 'promocion', label: 'Promoción' },
  { value: 'stock', label: 'Stock' },
  { value: 'cumpleanos', label: 'Cumpleaños' },
  { value: 'cuota', label: 'Cuotas' },
  { value: 'recordatorio', label: 'Recordatorio' },
  { value: 'sistema', label: 'Sistema' },
  { value: 'otro', label: 'Otro' },
];

function estadoLabel(value: EstadoFilter) {
  const match = estados.find((estado) => estado.value === value);
  return match?.label ?? value;
}

function tipoLabel(value: TipoFilter) {
  const match = tipos.find((tipo) => tipo.value === value);
  return match?.label ?? value;
}

function dateInRange(value: string | null | undefined, desde: string, hasta: string) {
  if (!desde && !hasta) return true;
  if (!value) return false;
  const dateOnly = value.slice(0, 10);
  if (desde && dateOnly < desde) return false;
  if (hasta && dateOnly > hasta) return false;
  return true;
}

function isScheduledSoon(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const limit = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  return date >= now && date <= limit;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function normalizeLabel(value?: string | null) {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function NotificacionesPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [plantillas, setPlantillas] = useState<NotificacionPlantilla[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos');
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedNotificacion, setSelectedNotificacion] = useState<Notificacion | null>(null);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [notificacionVer, setNotificacionVer] = useState<Notificacion | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, isInitialized, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notificacionesResponse, plantillasResponse] = await Promise.all([
        getNotificaciones(),
        getNotificacionPlantillas(),
      ]);

      if (!notificacionesResponse.ok) throw new Error(notificacionesResponse.error || 'Error al cargar notificaciones');
      if (!plantillasResponse.ok) throw new Error(plantillasResponse.error || 'Error al cargar plantillas');

      setNotificaciones((notificacionesResponse.data || []) as Notificacion[]);
      setPlantillas((plantillasResponse.data || []) as NotificacionPlantilla[]);
    } catch (error) {
      setNotificaciones([]);
      setPlantillas([]);
      toast.error(error instanceof Error ? error.message : 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const filteredNotificaciones = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return notificaciones.filter((notificacion) => {
      const matchesEstado = estadoFilter === 'todos' || notificacion.estado === estadoFilter;
      const matchesTipo = tipoFilter === 'todos' || notificacion.tipo === tipoFilter;
      const matchesDate = dateInRange(notificacion.fecha_programada ?? notificacion.creado_en, fechaDesde, fechaHasta);
      const searchable = [
        notificacion.titulo,
        notificacion.asunto,
        notificacion.cuerpo,
        notificacion.tipo,
        notificacion.canal,
        notificacion.estado,
        notificacion.destinatario_segmento,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesEstado && matchesTipo && matchesDate && (!term || searchable.includes(term));
    });
  }, [notificaciones, searchTerm, estadoFilter, tipoFilter, fechaDesde, fechaHasta]);

  const totals = useMemo(() => {
    return filteredNotificaciones.reduce(
      (acc, item) => {
        const totalDestinatarios = Number(item.total_destinatarios ?? 0);
        const totalEnviados = Number(item.total_enviados ?? 0);
        acc.total += 1;
        acc.enviadas += item.estado === 'enviada' ? 1 : 0;
        acc.programadas += item.estado === 'programada' ? 1 : 0;
        acc.borradores += item.estado === 'borrador' ? 1 : 0;
        acc.canceladas += item.estado === 'cancelada' ? 1 : 0;
        acc.errores += item.estado === 'error' || Number(item.total_errores ?? 0) > 0 ? 1 : 0;
        acc.terminal += item.mostrar_terminal && item.terminal_visible ? 1 : 0;
        acc.destinatarios += totalDestinatarios;
        acc.enviados += totalEnviados;
        acc.proximas48 += item.estado === 'programada' && isScheduledSoon(item.fecha_programada) ? 1 : 0;
        acc.sinDestinatarios += totalDestinatarios === 0 ? 1 : 0;
        return acc;
      },
      {
        total: 0,
        enviadas: 0,
        programadas: 0,
        borradores: 0,
        canceladas: 0,
        errores: 0,
        terminal: 0,
        destinatarios: 0,
        enviados: 0,
        proximas48: 0,
        sinDestinatarios: 0,
      }
    );
  }, [filteredNotificaciones]);

  const deliveryRate = totals.destinatarios > 0 ? (totals.enviados / totals.destinatarios) * 100 : 0;
  const hasActiveFilters = Boolean(searchTerm || fechaDesde || fechaHasta || estadoFilter !== 'todos' || tipoFilter !== 'todos');
  const totalPages = Math.max(1, Math.ceil(filteredNotificaciones.length / PAGE_SIZE));
  const paginatedNotificaciones = filteredNotificaciones.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const adminPriorities = useMemo(() => {
    return filteredNotificaciones
      .filter((item) => item.estado === 'error' || item.total_errores > 0 || (item.estado === 'programada' && isScheduledSoon(item.fecha_programada)))
      .slice(0, 3);
  }, [filteredNotificaciones]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter, tipoFilter, fechaDesde, fechaHasta]);

  const clearFilters = () => {
    setSearchTerm('');
    setEstadoFilter('todos');
    setTipoFilter('todos');
    setFechaDesde('');
    setFechaHasta('');
  };

  const handleView = async (notificacion: Notificacion) => {
    const response = await getNotificacion(notificacion.id);

    if (!response.ok) {
      toast.error(response.error || 'No se pudo cargar el detalle');
      return;
    }

    setNotificacionVer(response.data as Notificacion);
    setOpenViewModal(true);
  };

  const handleSend = async (notificacion: Notificacion) => {
    if (!confirm(`¿Preparar/enviar la notificación “${notificacion.titulo}” a los socios del segmento seleccionado?`)) return;

    const response = await enviarNotificacion(notificacion.id);

    if (!response.ok) {
      toast.error(response.error || 'No se pudo enviar la notificación');
      return;
    }

    toast.success('Notificación registrada como enviada');
    setOpenViewModal(false);
    setNotificacionVer(null);
    await loadData();
  };

  const handleCancel = async (notificacion: Notificacion) => {
    if (!confirm(`¿Cancelar la notificación “${notificacion.titulo}”?`)) return;

    const response = await cancelarNotificacion(notificacion.id);

    if (!response.ok) {
      toast.error(response.error || 'No se pudo cancelar la notificación');
      return;
    }

    toast.success('Notificación cancelada');
    await loadData();
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Notificaciones');

    sheet.columns = [
      { header: 'Título', key: 'titulo', width: 28 },
      { header: 'Asunto', key: 'asunto', width: 36 },
      { header: 'Tipo', key: 'tipo', width: 16 },
      { header: 'Canal', key: 'canal', width: 16 },
      { header: 'Estado', key: 'estado', width: 16 },
      { header: 'Destinatarios', key: 'destinatarios', width: 16 },
      { header: 'Enviados', key: 'enviados', width: 14 },
      { header: 'Errores', key: 'errores', width: 14 },
      { header: 'Programada', key: 'programada', width: 22 },
      { header: 'Visible hasta', key: 'vigencia_hasta', width: 22 },
      { header: 'Terminal', key: 'terminal', width: 14 },
    ];

    filteredNotificaciones.forEach((notificacion) => {
      sheet.addRow({
        titulo: notificacion.titulo,
        asunto: notificacion.asunto,
        tipo: notificacion.tipo,
        canal: notificacion.canal,
        estado: notificacion.estado,
        destinatarios: notificacion.total_destinatarios,
        enviados: notificacion.total_enviados,
        errores: notificacion.total_errores,
        programada: formatFrontendDateTime(notificacion.fecha_programada),
        vigencia_hasta: formatFrontendDateTime(notificacion.fecha_vigencia_hasta),
        terminal: notificacion.mostrar_terminal ? 'Sí' : 'No',
      });
    });

    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = buildTimestampedDownloadFileName('listado-notificaciones', 'xlsx');
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadPdf = async () => {
    await downloadCommercialReportPdf({
      title: 'Centro de notificaciones',
      subtitle: 'Avisos administrativos, campañas, terminal, emails y seguimiento de envíos.',
      fileName: buildTimestampedDownloadFileName('listado-notificaciones', 'pdf'),
      rows: filteredNotificaciones,
      metrics: [
        { label: 'Registros', value: totals.total },
        { label: 'Enviadas', value: totals.enviadas },
        { label: 'Programadas', value: totals.programadas },
        { label: 'Errores', value: totals.errores },
        { label: 'Terminal visibles', value: totals.terminal },
      ],
      filtersLabel: `Estado: ${estadoLabel(estadoFilter)} · Tipo: ${tipoLabel(tipoFilter)} · Desde: ${fechaDesde || 'sin filtro'} · Hasta: ${fechaHasta || 'sin filtro'} · Búsqueda: ${searchTerm || 'sin búsqueda'}`,
      columns: [
        { header: 'Título', width: 36, getValue: (row) => row.titulo },
        { header: 'Tipo', width: 22, getValue: (row) => row.tipo },
        { header: 'Canal', width: 24, getValue: (row) => row.canal },
        { header: 'Estado', width: 24, getValue: (row) => row.estado },
        { header: 'Programada', width: 28, getValue: (row) => formatFrontendDateTime(row.fecha_programada) },
        { header: 'Hasta', width: 28, getValue: (row) => formatFrontendDateTime(row.fecha_vigencia_hasta) },
        { header: 'Envíos', width: 20, getValue: (row) => `${row.total_enviados}/${row.total_destinatarios}` },
      ],
    });
  };

  if (!isInitialized) return <div>Cargando...</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden'>
        <AppSidebar />
        <SidebarInset className='!grid !min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
          <AppHeader title='Notificaciones' />
          <section className='min-h-0 overflow-y-auto bg-gradient-to-b from-sky-50/70 via-background to-background px-4 py-4 sm:px-6 md:p-6 dark:from-sky-950/10'>
            <div className='mx-auto w-full max-w-7xl space-y-5 md:space-y-6'>
              <section className='overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-sm dark:border-sky-900/60 dark:bg-slate-950/80'>
                <div className='grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end'>
                  <div className='min-w-0'>
                    <p className='inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900/70'>
                      <BellRing className='h-3.5 w-3.5' />
                      Centro administrativo
                    </p>
                    <h1 className='mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl dark:text-white'>
                      Centro de notificaciones
                    </h1>
                    <p className='mt-2 max-w-3xl text-sm leading-6 text-muted-foreground'>
                      Controlá campañas, avisos programados, mensajes de sistema, alertas para Terminal y envíos a socios desde una vista operativa.
                    </p>
                  </div>
                  <div className='grid gap-2 sm:grid-cols-2 lg:min-w-[360px]'>
                    <Button type='button' variant='outline' onClick={loadData} disabled={loading} className='w-full'>
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      Actualizar
                    </Button>
                    <Button
                      type='button'
                      onClick={() => {
                        setSelectedNotificacion(null);
                        setOpenModal(true);
                      }}
                      className='w-full'
                    >
                      <Plus className='mr-2 h-4 w-4' /> Nueva notificación
                    </Button>
                  </div>
                </div>
              </section>

              <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-6'>
                <Card className='overflow-hidden rounded-[1.5rem] border-sky-100 bg-white shadow-sm dark:border-sky-900/60 dark:bg-slate-950/80'>
                  <CardContent className='flex items-center gap-3 p-4'>
                    <BellRing className='h-8 w-8 text-sky-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Registros</p>
                      <p className='text-2xl font-bold'>{totals.total}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className='overflow-hidden rounded-[1.5rem] border-emerald-100 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-slate-950/80'>
                  <CardContent className='flex items-center gap-3 p-4'>
                    <Send className='h-8 w-8 text-emerald-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Enviadas</p>
                      <p className='text-2xl font-bold'>{totals.enviadas}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className='overflow-hidden rounded-[1.5rem] border-amber-100 bg-white shadow-sm dark:border-amber-900/60 dark:bg-slate-950/80'>
                  <CardContent className='flex items-center gap-3 p-4'>
                    <CalendarClock className='h-8 w-8 text-amber-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Programadas</p>
                      <p className='text-2xl font-bold'>{totals.programadas}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className='overflow-hidden rounded-[1.5rem] border-red-100 bg-white shadow-sm dark:border-red-900/60 dark:bg-slate-950/80'>
                  <CardContent className='flex items-center gap-3 p-4'>
                    <AlertTriangle className='h-8 w-8 text-red-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Con error</p>
                      <p className='text-2xl font-bold'>{totals.errores}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className='overflow-hidden rounded-[1.5rem] border-violet-100 bg-white shadow-sm dark:border-violet-900/60 dark:bg-slate-950/80'>
                  <CardContent className='flex items-center gap-3 p-4'>
                    <SquareTerminal className='h-8 w-8 text-violet-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Terminal</p>
                      <p className='text-2xl font-bold'>{totals.terminal}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className='overflow-hidden rounded-[1.5rem] border-cyan-100 bg-white shadow-sm dark:border-cyan-900/60 dark:bg-slate-950/80'>
                  <CardContent className='flex items-center gap-3 p-4'>
                    <Mail className='h-8 w-8 text-cyan-600' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Entrega</p>
                      <p className='text-2xl font-bold'>{formatPercent(deliveryRate)}</p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]'>
                <Card className='overflow-hidden rounded-[2rem] border-border bg-white shadow-sm dark:bg-slate-950/80'>
                  <CardHeader className='border-b p-4'>
                    <div className='flex items-start gap-3'>
                      <span className='rounded-2xl bg-sky-100 p-2 text-sky-700 dark:bg-sky-950/50 dark:text-sky-200'>
                        <ShieldCheck className='h-5 w-5' />
                      </span>
                      <div>
                        <h2 className='text-lg font-black'>Salud del centro de avisos</h2>
                        <p className='text-sm text-muted-foreground'>Lectura rápida para detectar campañas trabadas o envíos que necesitan intervención.</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='grid gap-3 p-4 md:grid-cols-3'>
                    <div className='rounded-2xl border border-border/70 bg-muted/20 p-4'>
                      <p className='text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground'>Próximas 48 h</p>
                      <p className='mt-2 text-2xl font-black'>{totals.proximas48}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>Programaciones próximas a ejecutarse.</p>
                    </div>
                    <div className='rounded-2xl border border-border/70 bg-muted/20 p-4'>
                      <p className='text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground'>Borradores</p>
                      <p className='mt-2 text-2xl font-black'>{totals.borradores}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>Avisos pendientes de preparación o envío.</p>
                    </div>
                    <div className='rounded-2xl border border-border/70 bg-muted/20 p-4'>
                      <p className='text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground'>Sin destinatarios</p>
                      <p className='mt-2 text-2xl font-black'>{totals.sinDestinatarios}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>Revisar segmento antes de enviar.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className='overflow-hidden rounded-[2rem] border-border bg-white shadow-sm dark:bg-slate-950/80'>
                  <CardHeader className='border-b p-4'>
                    <div className='flex items-start gap-3'>
                      <span className='rounded-2xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200'>
                        <Inbox className='h-5 w-5' />
                      </span>
                      <div>
                        <h2 className='text-lg font-black'>Prioridades</h2>
                        <p className='text-sm text-muted-foreground'>Errores o envíos próximos.</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-3 p-4'>
                    {adminPriorities.length === 0 ? (
                      <div className='rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100'>
                        <div className='flex items-start gap-2'>
                          <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0' />
                          No hay alertas críticas para los filtros actuales.
                        </div>
                      </div>
                    ) : (
                      adminPriorities.map((item) => (
                        <button
                          key={item.id}
                          type='button'
                          className='w-full rounded-2xl border border-border/70 bg-muted/20 p-3 text-left transition hover:bg-muted/40'
                          onClick={() => handleView(item)}
                        >
                          <div className='flex items-start gap-2'>
                            <Clock3 className='mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300' />
                            <div className='min-w-0'>
                              <p className='truncate text-sm font-bold'>{item.titulo}</p>
                              <p className='text-xs text-muted-foreground'>
                                {normalizeLabel(item.estado)} · {formatFrontendDateTime(item.fecha_programada ?? item.creado_en)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>
              </section>

              <Card className='overflow-hidden rounded-[2rem] border-border bg-white shadow-sm dark:bg-slate-950/80'>
                <CardHeader className='flex flex-col items-start justify-between gap-4 border-b p-4 xl:flex-row xl:items-center'>
                  <div>
                    <h2 className='text-xl font-bold'>Listado operativo</h2>
                    <p className='text-sm text-muted-foreground'>Filtrá, exportá, revisá detalle y ejecutá acciones sobre las notificaciones.</p>
                  </div>
                  <div className='grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-3'>
                    <Button type='button' variant='outline' onClick={exportExcel}>
                      <FileSpreadsheet className='mr-2 h-4 w-4' /> Excel
                    </Button>
                    <Button type='button' variant='outline' onClick={downloadPdf}>
                      <FileText className='mr-2 h-4 w-4' /> Descargar PDF
                    </Button>
                    <Button
                      type='button'
                      onClick={() => {
                        setSelectedNotificacion(null);
                        setOpenModal(true);
                      }}
                    >
                      <Plus className='mr-2 h-4 w-4' /> Nueva notificación
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4 p-4'>
                  <div className='rounded-[1.5rem] border border-border/70 bg-muted/20 p-3'>
                    <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                      <div className='flex items-center gap-2 text-sm font-bold'>
                        <Filter className='h-4 w-4 text-sky-600' />
                        Filtros de búsqueda
                      </div>
                      {hasActiveFilters ? (
                        <Button type='button' variant='ghost' size='sm' onClick={clearFilters}>
                          Limpiar filtros
                        </Button>
                      ) : null}
                    </div>
                    <div className='grid gap-3 md:grid-cols-5'>
                      <div className='relative md:col-span-2'>
                        <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                        <Input
                          type='search'
                          placeholder='Buscar por título, asunto, tipo, canal o mensaje...'
                          className='pl-8'
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                        />
                      </div>
                      <select
                        value={estadoFilter}
                        onChange={(event) => setEstadoFilter(event.target.value as EstadoFilter)}
                        className='h-10 rounded-md border border-input bg-background px-3 text-sm'
                      >
                        {estados.map((estado) => (
                          <option key={estado.value} value={estado.value}>
                            {estado.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={tipoFilter}
                        onChange={(event) => setTipoFilter(event.target.value as TipoFilter)}
                        className='h-10 rounded-md border border-input bg-background px-3 text-sm'
                      >
                        {tipos.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                      <div className='grid grid-cols-2 gap-2'>
                        <Input type='date' value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)} />
                        <Input type='date' value={fechaHasta} onChange={(event) => setFechaHasta(event.target.value)} />
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className='py-10 text-center text-muted-foreground'>Cargando notificaciones...</div>
                  ) : (
                    <NotificacionTable
                      notificaciones={paginatedNotificaciones}
                      onView={handleView}
                      onEdit={(notificacion) => {
                        setSelectedNotificacion(notificacion);
                        setOpenModal(true);
                      }}
                      onCancel={handleCancel}
                      onSend={handleSend}
                    />
                  )}

                  <PaginationControls
                    currentPage={Math.min(currentPage, totalPages)}
                    totalItems={filteredNotificaciones.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                    itemLabel='notificaciones'
                  />
                </CardContent>
              </Card>
            </div>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>

      <NotificacionModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedNotificacion(null);
        }}
        onCreated={loadData}
        notificacion={selectedNotificacion}
        plantillas={plantillas}
      />

      <NotificacionViewModal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setNotificacionVer(null);
        }}
        notificacion={notificacionVer}
        onSend={handleSend}
      />
    </SidebarProvider>
  );
}
