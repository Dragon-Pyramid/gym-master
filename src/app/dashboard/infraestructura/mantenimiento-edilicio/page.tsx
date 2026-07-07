'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ClipboardCheck,
  CheckCircle2,
  Loader2,
  Plus,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type {
  CreateInfraestructuraActivoDTO,
  CreateInfraestructuraSectorDTO,
  CreateInfraestructuraChecklistEjecucionDTO,
  CreateInfraestructuraQrDTO,
  CreateMantenimientoEdilicioOrdenDTO,
  InfraestructuraActivo,
  InfraestructuraQrCodigo,
  InfraestructuraMantenimientoDashboard,
  InfraestructuraSectorTipo,
} from '@/interfaces/infraestructuraMantenimiento.interface';
import {
  createInfraestructuraActivoClient,
  createInfraestructuraChecklistEjecucionClient,
  createInfraestructuraQrCodeClient,
  createInfraestructuraSectorClient,
  createMantenimientoEdilicioOrdenClient,
  getInfraestructuraMantenimientoDashboardClient,
  updateMantenimientoEdilicioOrdenClient,
} from '@/services/infraestructuraMantenimientoClient';

const sectorTypes: Array<{ value: InfraestructuraSectorTipo; label: string }> = [
  { value: 'edificio', label: 'Edificio' },
  { value: 'piso', label: 'Piso' },
  { value: 'salon', label: 'Salón' },
  { value: 'bano', label: 'Baño' },
  { value: 'ducha', label: 'Ducha' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'recepcion', label: 'Recepción' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'pasillo', label: 'Pasillo' },
  { value: 'patio', label: 'Patio' },
  { value: 'sala_maquinas', label: 'Sala de máquinas' },
  { value: 'otro', label: 'Otro' },
];

const priorityOptions = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

const orderTypes = [
  { value: 'correctivo', label: 'Correctivo' },
  { value: 'preventivo', label: 'Preventivo' },
  { value: 'inspeccion', label: 'Inspección' },
  { value: 'cambio', label: 'Cambio' },
  { value: 'vencimiento', label: 'Vencimiento' },
  { value: 'certificacion', label: 'Certificación' },
];

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function formatCurrency(value?: number | null) {
  return currencyFormatter.format(Number(value ?? 0));
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString('es-AR');
}

function labelFromValue(value?: string | null) {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildQrImageUrl(codigo?: string | null, size = 180) {
  const value = String(codigo ?? '').trim();
  if (!value) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(value)}`;
}

function printQrLabel({ codigo, titulo, subtitulo }: { codigo: string; titulo: string; subtitulo?: string }) {
  const qrUrl = buildQrImageUrl(codigo, 260);
  const safeTitle = titulo.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeSubtitle = String(subtitulo ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeCode = codigo.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const printWindow = window.open('', '_blank', 'width=520,height=720');
  if (!printWindow) return;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Etiqueta QR - ${safeTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #111827; }
          .label { border: 2px solid #111827; border-radius: 16px; padding: 18px; width: 340px; text-align: center; }
          .brand { font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #475569; }
          h1 { font-size: 18px; margin: 10px 0 4px; }
          .subtitle { font-size: 12px; color: #64748b; margin-bottom: 12px; }
          img { width: 240px; height: 240px; image-rendering: pixelated; }
          .code { margin-top: 10px; font-family: monospace; font-size: 13px; font-weight: 700; }
          .hint { margin-top: 8px; font-size: 10px; color: #64748b; }
          @media print { body { padding: 0; } .label { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="brand">Gym Master</div>
          <h1>${safeTitle}</h1>
          ${safeSubtitle ? `<div class="subtitle">${safeSubtitle}</div>` : ''}
          <img src="${qrUrl}" alt="QR ${safeCode}" />
          <div class="code">${safeCode}</div>
          <div class="hint">Escanear desde Infraestructura &gt; Lector QR/barra</div>
        </div>
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const target = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function MetricCard({
  title,
  value,
  helper,
  tone = 'slate',
}: {
  title: string;
  value: string | number;
  helper?: string;
  tone?: 'red' | 'amber' | 'blue' | 'emerald' | 'slate' | 'violet';
}) {
  const tones = {
    red: 'border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100',
    blue: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-sky-500/30 dark:bg-sky-950/30 dark:text-sky-100',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100',
    slate: 'border-slate-200 bg-white text-slate-950 dark:text-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
    violet: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-500/30 dark:bg-violet-950/30 dark:text-violet-100',
  };

  return (
    <Card className={`p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {helper ? <p className="mt-1 text-xs opacity-75">{helper}</p> : null}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {children}
    </select>
  );
}

export default function MantenimientoEdilicioPage() {
  const [dashboard, setDashboard] = useState<InfraestructuraMantenimientoDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [sectorForm, setSectorForm] = useState<CreateInfraestructuraSectorDTO>({ nombre: '', tipo: 'salon', descripcion: '' });
  const [activoForm, setActivoForm] = useState<CreateInfraestructuraActivoDTO>({
    nombre: '',
    categoria_id: '',
    sector_id: '',
    criticidad: 'media',
    fecha_vencimiento: '',
    observaciones: '',
  });
  const [ordenForm, setOrdenForm] = useState<CreateMantenimientoEdilicioOrdenDTO>({
    titulo: '',
    tipo_orden: 'correctivo',
    prioridad: 'media',
    activo_id: '',
    sector_id: '',
    fecha_vencimiento: '',
    tecnico_responsable: '',
    descripcion: '',
  });

  const [checklistForm, setChecklistForm] = useState<CreateInfraestructuraChecklistEjecucionDTO>({
    template_id: '',
    activo_id: '',
    sector_id: '',
    orden_id: '',
    resultado_general: 'ok',
    notas: '',
  });
  const [qrForm, setQrForm] = useState<CreateInfraestructuraQrDTO>({
    target_type: 'infra_activo',
    target_id: '',
    titulo: '',
  });
  const [lastQr, setLastQr] = useState<InfraestructuraQrCodigo | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInfraestructuraMantenimientoDashboardClient();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar mantenimiento edilicio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const activeOrders = useMemo(
    () => (dashboard?.ordenes ?? []).filter((orden) => orden.activo !== false && orden.estado !== 'completada' && orden.estado !== 'cancelada'),
    [dashboard],
  );

  const executiveSummary = useMemo(() => {
    const metrics = dashboard?.metricas;
    const overdueAssets = metrics?.activosVencidos ?? 0;
    const criticalAssets = metrics?.activosCriticos ?? 0;
    const overdueOrders = metrics?.ordenesVencidas ?? 0;
    const openOrders = metrics?.ordenesAbiertas ?? 0;
    const checklistCritical = (dashboard?.checklistEjecuciones ?? []).filter((item) => item.resultado_general === 'critico').length;
    const needsAttention = overdueAssets + overdueOrders + checklistCritical;
    const status = needsAttention > 0 ? 'Atención prioritaria' : openOrders > 0 ? 'Seguimiento operativo' : 'Infraestructura controlada';
    const nextStep = needsAttention > 0
      ? 'Resolver vencimientos críticos, órdenes vencidas y checklists observados antes de nuevas mejoras edilicias.'
      : openOrders > 0
        ? 'Cerrar órdenes abiertas y registrar checklists para sostener trazabilidad edilicia.'
        : 'Mantener calendario preventivo, QR visibles y revisión periódica de sectores clave.';

    return {
      status,
      needsAttention,
      overdueAssets,
      criticalAssets,
      overdueOrders,
      openOrders,
      checklistCritical,
      nextStep,
    };
  }, [dashboard]);

  const registerSuccess = async (message: string) => {
    setSuccess(message);
    await loadDashboard();
    setTimeout(() => setSuccess(null), 3500);
  };

  const handleCreateSector = async (event: FormEvent) => {
    event.preventDefault();
    setSaving('sector');
    setError(null);
    try {
      await createInfraestructuraSectorClient(sectorForm);
      setSectorForm({ nombre: '', tipo: 'salon', descripcion: '' });
      await registerSuccess('Sector edilicio creado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el sector.');
    } finally {
      setSaving(null);
    }
  };

  const handleCreateActivo = async (event: FormEvent) => {
    event.preventDefault();
    setSaving('activo');
    setError(null);
    try {
      await createInfraestructuraActivoClient({
        ...activoForm,
        categoria_id: activoForm.categoria_id || null,
        sector_id: activoForm.sector_id || null,
        fecha_vencimiento: activoForm.fecha_vencimiento || null,
      });
      setActivoForm({ nombre: '', categoria_id: '', sector_id: '', criticidad: 'media', fecha_vencimiento: '', observaciones: '' });
      await registerSuccess('Activo edilicio creado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el activo edilicio.');
    } finally {
      setSaving(null);
    }
  };

  const handleCreateOrden = async (event: FormEvent) => {
    event.preventDefault();
    setSaving('orden');
    setError(null);
    try {
      await createMantenimientoEdilicioOrdenClient({
        ...ordenForm,
        activo_id: ordenForm.activo_id || null,
        sector_id: ordenForm.sector_id || null,
        fecha_vencimiento: ordenForm.fecha_vencimiento || null,
      });
      setOrdenForm({
        titulo: '',
        tipo_orden: 'correctivo',
        prioridad: 'media',
        activo_id: '',
        sector_id: '',
        fecha_vencimiento: '',
        tecnico_responsable: '',
        descripcion: '',
      });
      await registerSuccess('Orden de mantenimiento creada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la orden.');
    } finally {
      setSaving(null);
    }
  };


  const handleCreateChecklist = async (event: FormEvent) => {
    event.preventDefault();
    setSaving('checklist');
    setError(null);
    try {
      await createInfraestructuraChecklistEjecucionClient({
        ...checklistForm,
        activo_id: checklistForm.activo_id || null,
        sector_id: checklistForm.sector_id || null,
        orden_id: checklistForm.orden_id || null,
        notas: checklistForm.notas || null,
      });
      setChecklistForm({ template_id: '', activo_id: '', sector_id: '', orden_id: '', resultado_general: 'ok', notas: '' });
      await registerSuccess('Checklist edilicio registrado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ejecutar el checklist.');
    } finally {
      setSaving(null);
    }
  };

  const handleCreateQr = async (event: FormEvent) => {
    event.preventDefault();
    setSaving('qr');
    setError(null);
    try {
      const response = await createInfraestructuraQrCodeClient({
        ...qrForm,
        target_id: qrForm.target_id || '',
        titulo: qrForm.titulo || null,
      });
      setLastQr(response.data);
      setQrForm({ target_type: qrForm.target_type || 'infra_activo', target_id: '', titulo: '' });
      await registerSuccess('Código QR/barra generado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el código QR/barra.');
    } finally {
      setSaving(null);
    }
  };

  const completeOrder = async (id: string) => {
    setSaving(id);
    setError(null);
    try {
      await updateMantenimientoEdilicioOrdenClient(id, { estado: 'completada', resultado: 'Orden completada desde panel de infraestructura.' });
      await registerSuccess('Orden marcada como completada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la orden.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="!grid !min-h-0 !grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
          <AppHeader title="Mantenimiento Edilicio" />
          <main className="min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 pb-8">
            <Card className="overflow-hidden border-sky-500/30 bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 p-6 text-white shadow-xl dark:border-cyan-400/30">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-200">Infraestructura final</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-100 ring-1 ring-cyan-300/30">
                      <Building2 className="h-7 w-7" />
                    </span>
                    <div>
                      <h1 className="text-3xl font-black tracking-tight">Mantenimiento edilicio y checklists</h1>
                      <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-200">
                        Control operativo del edificio: sectores, activos edilicios, vencimientos, órdenes, checklists, QR y trazabilidad preventiva para sostener la continuidad del gimnasio.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[440px]">
                  <Button type="button" className="bg-cyan-500 text-slate-950 dark:text-slate-100 hover:bg-cyan-400" onClick={loadDashboard} disabled={loading || Boolean(saving)}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Actualizar
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => document.getElementById('infraestructura-checklist-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Checklist
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => document.getElementById('infraestructura-orden-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    <Wrench className="mr-2 h-4 w-4" />
                    Orden
                  </Button>
                </div>
              </div>
            </Card>

            {error ? (
              <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-semibold">No se pudo completar la operación.</p>
                    <p>{error}</p>
                    <p className="mt-1 text-xs">Si el mensaje indica que no existe una relación/tabla, aplicá primero el SQL privado de infraestructura en Supabase.</p>
                  </div>
                </div>
              </Card>
            ) : null}

            {success ? (
              <Card className="border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{success}</span>
                </div>
              </Card>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <MetricCard title="Sectores" value={dashboard?.metricas.totalSectores ?? 0} helper="Áreas físicas" tone="blue" />
              <MetricCard title="Activos" value={dashboard?.metricas.totalActivos ?? 0} helper="Inventario edilicio" />
              <MetricCard title="Críticos" value={dashboard?.metricas.activosCriticos ?? 0} helper="Alta prioridad" tone="red" />
              <MetricCard title="Vencidos" value={dashboard?.metricas.activosVencidos ?? 0} helper="Revisión urgente" tone="amber" />
              <MetricCard title="Órdenes abiertas" value={dashboard?.metricas.ordenesAbiertas ?? 0} helper="Pendientes" tone="violet" />
              <MetricCard title="Costo mes" value={formatCurrency(dashboard?.metricas.costoOrdenesMes)} helper="Estimado/real" tone="emerald" />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="border-cyan-500/25 bg-gradient-to-br from-cyan-950 via-slate-950 to-slate-950 p-5 text-white shadow-lg">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">Lectura ejecutiva edilicia</p>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">{executiveSummary.status}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">{executiveSummary.nextStep}</p>
                  </div>
                  <span className={`rounded-full px-4 py-2 text-sm font-bold ${executiveSummary.needsAttention > 0 ? 'bg-red-500/20 text-red-100 ring-1 ring-red-300/30' : 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-300/30'}`}>
                    {executiveSummary.needsAttention > 0 ? `${executiveSummary.needsAttention} alertas` : 'Sin críticos'}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Vencimientos</p>
                    <p className="mt-2 text-2xl font-black">{executiveSummary.overdueAssets}</p>
                    <p className="text-xs text-slate-300">activos vencidos</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Órdenes</p>
                    <p className="mt-2 text-2xl font-black">{executiveSummary.openOrders}</p>
                    <p className="text-xs text-slate-300">abiertas para seguimiento</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Checklists</p>
                    <p className="mt-2 text-2xl font-black">{executiveSummary.checklistCritical}</p>
                    <p className="text-xs text-slate-300">críticos detectados</p>
                  </div>
                </div>
              </Card>

              <Card className="border-emerald-500/25 bg-white p-5 text-slate-950 dark:text-slate-100 shadow-sm dark:border-emerald-500/25 dark:bg-slate-950 dark:text-slate-100">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-600 dark:text-emerald-300">Próximo paso operativo</p>
                <h2 className="mt-3 text-xl font-black">Checklists, QR y órdenes conectadas</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Usá las acciones rápidas para registrar inspecciones, crear órdenes y generar QR por sector o activo. La prioridad es mantener trazabilidad sin salir de esta pantalla.
                </p>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <span className="font-semibold">Sectores activos:</span> {dashboard?.sectores.length ?? 0}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <span className="font-semibold">QR generados:</span> {dashboard?.qrCodes.length ?? 0}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <span className="font-semibold">Ejecuciones recientes:</span> {dashboard?.checklistEjecuciones.length ?? 0}
                  </div>
                </div>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <Card className="p-5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <div className="mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-sky-600" />
                  <h2 className="text-lg font-semibold">Nuevo sector</h2>
                </div>
                <form className="space-y-3" onSubmit={handleCreateSector}>
                  <Field label="Nombre del sector">
                    <Input value={sectorForm.nombre} onChange={(e) => setSectorForm((prev) => ({ ...prev, nombre: e.target.value }))} placeholder="Baños hombres, salón musculación..." />
                  </Field>
                  <Field label="Tipo">
                    <SelectField value={String(sectorForm.tipo ?? 'salon')} onChange={(value) => setSectorForm((prev) => ({ ...prev, tipo: value }))}>
                      {sectorTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </SelectField>
                  </Field>
                  <Field label="Descripción">
                    <textarea
                      value={sectorForm.descripcion ?? ''}
                      onChange={(e) => setSectorForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                      className="min-h-[82px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Ubicación, uso, referencias internas..."
                    />
                  </Field>
                  <Button className="w-full" type="submit" disabled={saving === 'sector'}>
                    {saving === 'sector' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Crear sector
                  </Button>
                </form>
              </Card>

              <Card className="p-5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold">Nuevo activo edilicio</h2>
                </div>
                <form className="space-y-3" onSubmit={handleCreateActivo}>
                  <Field label="Nombre del activo">
                    <Input value={activoForm.nombre} onChange={(e) => setActivoForm((prev) => ({ ...prev, nombre: e.target.value }))} placeholder="Matafuego recepción, tablero eléctrico..." />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Categoría">
                      <SelectField value={String(activoForm.categoria_id ?? '')} onChange={(value) => setActivoForm((prev) => ({ ...prev, categoria_id: value }))}>
                        <option value="">Sin categoría</option>
                        {(dashboard?.categorias ?? []).map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
                      </SelectField>
                    </Field>
                    <Field label="Sector">
                      <SelectField value={String(activoForm.sector_id ?? '')} onChange={(value) => setActivoForm((prev) => ({ ...prev, sector_id: value }))}>
                        <option value="">Sin sector</option>
                        {(dashboard?.sectores ?? []).map((sector) => <option key={sector.id} value={sector.id}>{sector.nombre}</option>)}
                      </SelectField>
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Criticidad">
                      <SelectField value={String(activoForm.criticidad ?? 'media')} onChange={(value) => setActivoForm((prev) => ({ ...prev, criticidad: value }))}>
                        {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </SelectField>
                    </Field>
                    <Field label="Vencimiento">
                      <Input type="date" value={activoForm.fecha_vencimiento ?? ''} onChange={(e) => setActivoForm((prev) => ({ ...prev, fecha_vencimiento: e.target.value }))} />
                    </Field>
                  </div>
                  <Field label="Observaciones">
                    <textarea
                      value={activoForm.observaciones ?? ''}
                      onChange={(e) => setActivoForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                      className="min-h-[82px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Estado, garantía, ubicación exacta, certificado..."
                    />
                  </Field>
                  <Button className="w-full" type="submit" disabled={saving === 'activo'}>
                    {saving === 'activo' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Crear activo
                  </Button>
                </form>
              </Card>

              <Card id="infraestructura-orden-form" className="p-5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <div className="mb-4 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-violet-600" />
                  <h2 className="text-lg font-semibold">Nueva orden</h2>
                </div>
                <form className="space-y-3" onSubmit={handleCreateOrden}>
                  <Field label="Título">
                    <Input value={ordenForm.titulo} onChange={(e) => setOrdenForm((prev) => ({ ...prev, titulo: e.target.value }))} placeholder="Recarga de matafuego, reparación de baño..." />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Tipo">
                      <SelectField value={String(ordenForm.tipo_orden ?? 'correctivo')} onChange={(value) => setOrdenForm((prev) => ({ ...prev, tipo_orden: value }))}>
                        {orderTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </SelectField>
                    </Field>
                    <Field label="Prioridad">
                      <SelectField value={String(ordenForm.prioridad ?? 'media')} onChange={(value) => setOrdenForm((prev) => ({ ...prev, prioridad: value }))}>
                        {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </SelectField>
                    </Field>
                  </div>
                  <Field label="Activo edilicio">
                    <SelectField value={String(ordenForm.activo_id ?? '')} onChange={(value) => setOrdenForm((prev) => ({ ...prev, activo_id: value }))}>
                      <option value="">Sin activo específico</option>
                      {(dashboard?.activos ?? []).map((activo) => <option key={activo.id} value={activo.id}>{activo.nombre}</option>)}
                    </SelectField>
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Sector">
                      <SelectField value={String(ordenForm.sector_id ?? '')} onChange={(value) => setOrdenForm((prev) => ({ ...prev, sector_id: value }))}>
                        <option value="">Sin sector</option>
                        {(dashboard?.sectores ?? []).map((sector) => <option key={sector.id} value={sector.id}>{sector.nombre}</option>)}
                      </SelectField>
                    </Field>
                    <Field label="Vencimiento">
                      <Input type="date" value={ordenForm.fecha_vencimiento ?? ''} onChange={(e) => setOrdenForm((prev) => ({ ...prev, fecha_vencimiento: e.target.value }))} />
                    </Field>
                  </div>
                  <Field label="Técnico / proveedor">
                    <Input value={ordenForm.tecnico_responsable ?? ''} onChange={(e) => setOrdenForm((prev) => ({ ...prev, tecnico_responsable: e.target.value }))} placeholder="Electricista, plomero, proveedor externo..." />
                  </Field>
                  <Field label="Descripción">
                    <textarea
                      value={ordenForm.descripcion ?? ''}
                      onChange={(e) => setOrdenForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                      className="min-h-[82px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Detalle del trabajo requerido..."
                    />
                  </Field>
                  <Button className="w-full" type="submit" disabled={saving === 'orden'}>
                    {saving === 'orden' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Crear orden
                  </Button>
                </form>
              </Card>
            </section>



            <section className="grid gap-6 xl:grid-cols-3">
              <Card id="infraestructura-checklist-form" className="p-5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <div className="mb-4 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold">Ejecutar checklist</h2>
                </div>
                <form className="space-y-3" onSubmit={handleCreateChecklist}>
                  <Field label="Checklist">
                    <SelectField value={String(checklistForm.template_id ?? '')} onChange={(value) => setChecklistForm((prev) => ({ ...prev, template_id: value }))}>
                      <option value="">Seleccionar checklist</option>
                      {(dashboard?.checklists ?? []).map((template) => <option key={template.id} value={template.id}>{template.nombre}</option>)}
                    </SelectField>
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Activo">
                      <SelectField value={String(checklistForm.activo_id ?? '')} onChange={(value) => setChecklistForm((prev) => ({ ...prev, activo_id: value }))}>
                        <option value="">Sin activo</option>
                        {(dashboard?.activos ?? []).map((activo) => <option key={activo.id} value={activo.id}>{activo.nombre}</option>)}
                      </SelectField>
                    </Field>
                    <Field label="Sector">
                      <SelectField value={String(checklistForm.sector_id ?? '')} onChange={(value) => setChecklistForm((prev) => ({ ...prev, sector_id: value }))}>
                        <option value="">Sin sector</option>
                        {(dashboard?.sectores ?? []).map((sector) => <option key={sector.id} value={sector.id}>{sector.nombre}</option>)}
                      </SelectField>
                    </Field>
                  </div>
                  <Field label="Orden relacionada">
                    <SelectField value={String(checklistForm.orden_id ?? '')} onChange={(value) => setChecklistForm((prev) => ({ ...prev, orden_id: value }))}>
                      <option value="">Sin orden</option>
                      {(dashboard?.ordenes ?? []).slice(0, 30).map((orden) => <option key={orden.id} value={orden.id}>{orden.titulo}</option>)}
                    </SelectField>
                  </Field>
                  <Field label="Resultado general">
                    <SelectField value={String(checklistForm.resultado_general ?? 'ok')} onChange={(value) => setChecklistForm((prev) => ({ ...prev, resultado_general: value }))}>
                      <option value="ok">OK</option>
                      <option value="observado">Observado</option>
                      <option value="critico">Crítico</option>
                    </SelectField>
                  </Field>
                  <Field label="Notas">
                    <textarea
                      value={checklistForm.notas ?? ''}
                      onChange={(e) => setChecklistForm((prev) => ({ ...prev, notas: e.target.value }))}
                      className="min-h-[82px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Observaciones generales, fotos a cargar luego, hallazgos..."
                    />
                  </Field>
                  <Button className="w-full" type="submit" disabled={saving === 'checklist'}>
                    {saving === 'checklist' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                    Guardar checklist
                  </Button>
                </form>
              </Card>

              <Card className="p-5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <div className="mb-4 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-sky-600" />
                  <h2 className="text-lg font-semibold">QR activo / sector</h2>
                </div>
                <form className="space-y-3" onSubmit={handleCreateQr}>
                  <Field label="Tipo">
                    <SelectField value={String(qrForm.target_type ?? 'infra_activo')} onChange={(value) => setQrForm({ target_type: value, target_id: '', titulo: '' })}>
                      <option value="infra_activo">Activo edilicio</option>
                      <option value="infra_sector">Sector edilicio</option>
                    </SelectField>
                  </Field>
                  <Field label="Destino">
                    <SelectField value={String(qrForm.target_id ?? '')} onChange={(value) => setQrForm((prev) => ({ ...prev, target_id: value }))}>
                      <option value="">Seleccionar</option>
                      {qrForm.target_type === 'infra_sector'
                        ? (dashboard?.sectores ?? []).map((sector) => <option key={sector.id} value={sector.id}>{sector.nombre}</option>)
                        : (dashboard?.activos ?? []).map((activo) => <option key={activo.id} value={activo.id}>{activo.nombre}</option>)}
                    </SelectField>
                  </Field>
                  <Field label="Título opcional">
                    <Input value={qrForm.titulo ?? ''} onChange={(e) => setQrForm((prev) => ({ ...prev, titulo: e.target.value }))} placeholder="Ej: QR Matafuego recepción" />
                  </Field>
                  <Button className="w-full" type="submit" disabled={saving === 'qr'}>
                    {saving === 'qr' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                    Generar QR/barra
                  </Button>
                </form>
                {lastQr ? (
                  <div className="mt-4 rounded-lg border bg-slate-50 p-3 text-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <img
                        src={buildQrImageUrl(lastQr.codigo, 144)}
                        alt={`QR ${lastQr.codigo}`}
                        className="h-32 w-32 rounded border bg-white p-2"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Último código</p>
                        <p className="mt-1 break-all font-mono font-semibold text-slate-950 dark:text-slate-100">{lastQr.codigo}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{lastQr.titulo}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => printQrLabel({ codigo: lastQr.codigo, titulo: lastQr.titulo, subtitulo: labelFromValue(lastQr.target_type) })}
                        >
                          Imprimir etiqueta
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </Card>

              <Card className="p-5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <div className="mb-4 flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-violet-600" />
                  <h2 className="text-lg font-semibold">Lector QR/barra</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Base reutilizable para leer códigos con cámara. Sirve para Infraestructura, Equipamientos y deja preparada la evolución comercial para productos/kiosco.
                </p>
                <Button className="mt-4 w-full" type="button" variant="outline" onClick={() => window.location.href = '/dashboard/infraestructura/lector-qr-barra'}>
                  <ScanLine className="mr-2 h-4 w-4" />
                  Abrir lector
                </Button>
                <div className="mt-4 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  Próxima etapa comercial: celular escanea producto y la PC recibe el código en tiempo real para venta/alta/stock.
                </div>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card id="infraestructura-checklist-form" className="p-5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <div className="mb-4 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold">Checklists recientes</h2>
                </div>
                <div className="space-y-3">
                  {(dashboard?.checklistEjecuciones ?? []).length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground dark:border-slate-800">Todavía no hay checklists ejecutados.</p>
                  ) : (
                    (dashboard?.checklistEjecuciones ?? []).slice(0, 6).map((ejecucion) => (
                      <div key={ejecucion.id} className="rounded-lg border p-3 dark:border-slate-800">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-slate-100">{ejecucion.template?.nombre ?? 'Checklist edilicio'}</p>
                            <p className="text-xs text-muted-foreground">
                              {ejecucion.infraestructura_activo?.nombre ?? ejecucion.infraestructura_sector?.nombre ?? ejecucion.mantenimiento_edilicio_orden?.titulo ?? 'Sin referencia'} · {formatDate(ejecucion.ejecutado_en)}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ejecucion.resultado_general === 'critico' ? 'bg-red-100 text-red-800' : ejecucion.resultado_general === 'observado' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {labelFromValue(ejecucion.resultado_general)}
                          </span>
                        </div>
                        {ejecucion.notas ? <p className="mt-2 text-xs text-muted-foreground">{ejecucion.notas}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <div className="mb-4 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-sky-600" />
                  <h2 className="text-lg font-semibold">Códigos activos</h2>
                </div>
                <div className="space-y-3">
                  {(dashboard?.qrCodes ?? []).length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground dark:border-slate-800">Todavía no hay códigos QR/barra generados.</p>
                  ) : (
                    (dashboard?.qrCodes ?? []).slice(0, 8).map((qr) => (
                      <div key={qr.id} className="rounded-lg border p-3 dark:border-slate-800">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <img
                            src={buildQrImageUrl(qr.codigo, 120)}
                            alt={`QR ${qr.codigo}`}
                            className="h-24 w-24 rounded border bg-white p-1.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-950 dark:text-slate-100">{qr.titulo}</p>
                            <p className="mt-1 break-all font-mono text-xs text-slate-700 dark:text-slate-300">{qr.codigo}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{labelFromValue(qr.target_type)} · {qr.route}</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => printQrLabel({ codigo: qr.codigo, titulo: qr.titulo, subtitulo: labelFromValue(qr.target_type) })}
                            >
                              Imprimir etiqueta
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </section>
            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="p-5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-semibold">Alertas edilicias</h2>
                </div>
                <div className="space-y-3">
                  {(dashboard?.alertas ?? []).length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground dark:border-slate-800">Sin alertas críticas o vencimientos próximos.</p>
                  ) : (
                    (dashboard?.alertas ?? []).map((activo) => {
                      const remaining = Math.min(daysUntil(activo.fecha_vencimiento) ?? 9999, daysUntil(activo.fecha_proximo_mantenimiento) ?? 9999);
                      return (
                        <div key={activo.id} className="rounded-lg border p-3 dark:border-slate-800">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-slate-100">{activo.nombre}</p>
                              <p className="text-xs text-muted-foreground">{activo.categoria?.nombre ?? 'Sin categoría'} · {activo.sector?.nombre ?? 'Sin sector'}</p>
                            </div>
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              {remaining < 0 ? 'Vencido' : remaining === 9999 ? labelFromValue(activo.criticidad) : `${remaining} días`}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">Vencimiento: {formatDate(activo.fecha_vencimiento)} · Próx. mantenimiento: {formatDate(activo.fecha_proximo_mantenimiento)}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              <Card className="p-5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-violet-600" />
                  <h2 className="text-lg font-semibold">Órdenes abiertas</h2>
                </div>
                <div className="space-y-3">
                  {activeOrders.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground dark:border-slate-800">Sin órdenes abiertas.</p>
                  ) : (
                    activeOrders.map((orden) => (
                      <div key={orden.id} className="rounded-lg border p-3 dark:border-slate-800">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-slate-100">{orden.titulo}</p>
                            <p className="text-xs text-muted-foreground">{labelFromValue(orden.tipo_orden)} · {labelFromValue(orden.prioridad)} · Vence {formatDate(orden.fecha_vencimiento)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{orden.infraestructura_activo?.nombre ?? orden.infraestructura_sector?.nombre ?? 'Sin referencia'}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => completeOrder(orden.id)} disabled={saving === orden.id}>
                            {saving === orden.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-2 h-3 w-3" />}
                            Completar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </section>

            <Card className="p-5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-sky-600" />
                <h2 className="text-lg font-semibold">Inventario edilicio</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="px-3 py-2">Activo</th>
                      <th className="px-3 py-2">Categoría</th>
                      <th className="px-3 py-2">Sector</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Criticidad</th>
                      <th className="px-3 py-2">Vencimiento</th>
                      <th className="px-3 py-2">Próx. mant.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Cargando infraestructura...</td></tr>
                    ) : (dashboard?.activos ?? []).length === 0 ? (
                      <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Todavía no hay activos edilicios registrados.</td></tr>
                    ) : (
                      (dashboard?.activos ?? []).map((activo: InfraestructuraActivo) => (
                        <tr key={activo.id} className="border-b last:border-0">
                          <td className="px-3 py-3 font-medium text-slate-950 dark:text-slate-100">{activo.nombre}</td>
                          <td className="px-3 py-3">{activo.categoria?.nombre ?? '-'}</td>
                          <td className="px-3 py-3">{activo.sector?.nombre ?? '-'}</td>
                          <td className="px-3 py-3">{labelFromValue(activo.estado)}</td>
                          <td className="px-3 py-3">{labelFromValue(activo.criticidad)}</td>
                          <td className="px-3 py-3">{formatDate(activo.fecha_vencimiento)}</td>
                          <td className="px-3 py-3">{formatDate(activo.fecha_proximo_mantenimiento)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
            </div>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
