'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Plus,
  RefreshCw,
  Wrench,
} from 'lucide-react';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useI18n } from '@/i18n/I18nProvider';
import type {
  CreateEquipamientoOrdenTecnicaDTO,
  CreateEquipamientoPlanPreventivoDTO,
  EquipamientoOrdenTecnica,
  EquipamientoPreventivosDashboard,
} from '@/interfaces/equipamientoPreventivo.interface';
import {
  createEquipamientoOrdenTecnicaClient,
  createEquipamientoPlanPreventivoClient,
  getEquipamientosPreventivosDashboardClient,
  updateEquipamientoOrdenTecnicaClient,
} from '@/services/equipamientoPreventivoClient';

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
    red: 'border-red-100 bg-red-50 text-red-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    blue: 'border-blue-100 bg-blue-50 text-blue-900',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    slate: 'border-slate-100 bg-white text-slate-950',
    violet: 'border-violet-100 bg-violet-50 text-violet-900',
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
    <label className="space-y-1 text-sm font-medium text-slate-700">
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
      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {children}
    </select>
  );
}

export default function EquipamientosPreventivosPage() {
  const { locale } = useI18n();
  const isEnglish = locale === 'en';
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const tValue = (value?: string | null) => {
    const raw = String(value ?? '').trim();
    if (!raw) return '-';
    const normalized = raw.toLowerCase().replace(/\s+/g, '_');
    const labels: Record<string, string> = {
      baja: 'Low',
      media: 'Medium',
      alta: 'High',
      critica: 'Critical',
      critico: 'Critical',
      preventivo: 'Preventive',
      correctivo: 'Corrective',
      inspeccion: 'Inspection',
      reparacion: 'Repair',
      limpieza_tecnica: 'Technical cleaning',
      cambio_pieza: 'Part replacement',
      completada: 'Completed',
      abierta: 'Open',
      pendiente: 'Pending',
      cancelada: 'Canceled',
      hire_date: 'Hire date',
      general: 'General',
    };
    if (isEnglish && labels[normalized]) return labels[normalized];
    return labelFromValue(raw);
  };
  const tHistoryTitle = (title?: string | null) => {
    const raw = String(title ?? '');
    if (!isEnglish) return raw;
    return raw
      .replace(/^Orden técnica completada:/, 'Completed technical order:')
      .replace(/^Orden técnica abierta:/, 'Open technical order:')
      .replace(/^Orden técnica creada:/, 'Created technical order:');
  };
  const tHistoryDetail = (detail?: string | null) => {
    const raw = String(detail ?? '');
    if (!isEnglish) return raw;
    const details: Record<string, string> = {
      'Orden técnica completada desde panel de preventivos.': 'Technical order completed from the preventive maintenance panel.',
      'Orden técnica creada desde panel de preventivos.': 'Technical order created from the preventive maintenance panel.',
    };
    return details[raw] ?? raw;
  };

  const tEquipmentType = (value?: string | null) => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (!isEnglish) return raw;
    const labels: Record<string, string> = {
      accesorio: 'Accessory',
      cardio: 'Cardio',
      fuerza: 'Strength',
      'multi gym': 'Multi Gym',
      multigym: 'Multi Gym',
      general: 'General',
    };
    return labels[raw.toLowerCase()] ?? raw;
  };

  const tPlanName = (value?: string | null) => {
    const raw = String(value ?? '').trim();
    if (!isEnglish) return raw;
    const labels: Record<string, string> = {
      'Preventivo bancos y accesorios': 'Bench and accessory preventive maintenance',
      'Preventivo bicicleta fija': 'Stationary bike preventive maintenance',
      'Preventivo cinta de correr': 'Treadmill preventive maintenance',
      'Preventivo Multi Gym': 'Multi Gym preventive maintenance',
      'Preventivo multigym / poleas': 'Multi-gym / pulley preventive maintenance',
    };
    return labels[raw] ?? raw;
  };

  const tPlanTask = (value?: string | null) => {
    const raw = String(value ?? '').trim();
    if (!isEnglish) return raw;
    const labels: Record<string, string> = {
      'Revisar estabilidad y soldaduras visibles': 'Check stability and visible welds',
      'Revisar tapizado, apoyos y tornillería': 'Check upholstery, supports, and screws',
      'Revisar pedales, asiento y ajuste de altura': 'Check pedals, seat, and height adjustment',
      'Revisar resistencia, transmisión y display': 'Check resistance, transmission, and display',
      'Revisar alineación y tensión de banda': 'Check belt alignment and tension',
      'Lubricar banda/superficie según fabricante': 'Lubricate belt/surface according to manufacturer',
      'Revisar motor, tablero y parada de emergencia': 'Check motor, control panel, and emergency stop',
      'Tarea 1 - engrasar': 'Task 1 - grease',
      'Tarea 2 - calibrar': 'Task 2 - calibrate',
      'Tarea 3 - ajustar': 'Task 3 - adjust',
      'Revisar cables, poleas y placas': 'Check cables, pulleys, and plates',
      'Revisar tapizados, estructura y anclajes': 'Check upholstery, structure, and anchors',
    };
    return labels[raw] ?? raw;
  };
  const [dashboard, setDashboard] = useState<EquipamientoPreventivosDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [planForm, setPlanForm] = useState<CreateEquipamientoPlanPreventivoDTO>({
    nombre: '',
    tipo_equipamiento: '',
    frecuencia_dias: 90,
    criticidad: 'media',
    descripcion: '',
    tareas: [''],
  });

  const [ordenForm, setOrdenForm] = useState<CreateEquipamientoOrdenTecnicaDTO>({
    id_equipamiento: '',
    plan_id: '',
    tipo_orden: 'preventivo',
    prioridad: 'media',
    titulo: '',
    fecha_programada: '',
    fecha_vencimiento: '',
    tecnico_responsable: '',
    costo_estimado: null,
    descripcion: '',
  });

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEquipamientosPreventivosDashboardClient();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : tx('No se pudo cargar preventivos de equipamientos.', 'Equipment preventive tasks could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const activeOrders = useMemo(
    () => (dashboard?.ordenes ?? []).filter((orden) => orden.activo !== false && !['completada', 'cancelada'].includes(String(orden.estado))),
    [dashboard],
  );

  const registerSuccess = async (message: string) => {
    setSuccess(message);
    await loadDashboard();
    setTimeout(() => setSuccess(null), 3500);
  };

  const handleCreatePlan = async (event: FormEvent) => {
    event.preventDefault();
    setSaving('plan');
    setError(null);
    try {
      await createEquipamientoPlanPreventivoClient({
        ...planForm,
        tareas: (planForm.tareas ?? []).map((tarea) => String(tarea).trim()).filter(Boolean),
      });
      setPlanForm({ nombre: '', tipo_equipamiento: '', frecuencia_dias: 90, criticidad: 'media', descripcion: '', tareas: [''] });
      await registerSuccess(tx('Plan preventivo creado correctamente.', 'Preventive plan created successfully.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : tx('No se pudo crear el plan preventivo.', 'The preventive plan could not be created.'));
    } finally {
      setSaving(null);
    }
  };

  const handleCreateOrden = async (event: FormEvent) => {
    event.preventDefault();
    setSaving('orden');
    setError(null);
    try {
      await createEquipamientoOrdenTecnicaClient({
        ...ordenForm,
        plan_id: ordenForm.plan_id || null,
        fecha_programada: ordenForm.fecha_programada || null,
        fecha_vencimiento: ordenForm.fecha_vencimiento || null,
        costo_estimado: ordenForm.costo_estimado ? Number(ordenForm.costo_estimado) : null,
      });
      setOrdenForm({ id_equipamiento: '', plan_id: '', tipo_orden: 'preventivo', prioridad: 'media', titulo: '', fecha_programada: '', fecha_vencimiento: '', tecnico_responsable: '', costo_estimado: null, descripcion: '' });
      await registerSuccess(tx('Orden técnica creada correctamente.', 'Technical order created successfully.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : tx('No se pudo crear la orden técnica.', 'The technical order could not be created.'));
    } finally {
      setSaving(null);
    }
  };

  const completeOrder = async (orden: EquipamientoOrdenTecnica) => {
    setSaving(orden.id);
    setError(null);
    try {
      await updateEquipamientoOrdenTecnicaClient(orden.id, {
        estado: 'completada',
        resultado: 'Orden técnica completada desde panel de preventivos.',
        costo_real: orden.costo_estimado ?? null,
        downtime_fin: orden.downtime_inicio ? new Date().toISOString() : null,
      });
      await registerSuccess(tx('Orden técnica completada y equipamiento actualizado.', 'Technical order completed and equipment updated.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : tx('No se pudo completar la orden técnica.', 'The technical order could not be completed.'));
    } finally {
      setSaving(null);
    }
  };

  const updatePlanTask = (index: number, value: string) => {
    setPlanForm((prev) => ({
      ...prev,
      tareas: (prev.tareas ?? ['']).map((tarea, idx) => (idx === index ? value : tarea)),
    }));
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={tx('Preventivos de Equipamientos', 'Equipment preventive tasks')} />
          <main className="flex-1 space-y-6 p-6">
            <Card className="border-sky-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-6 w-6 text-sky-600" />
                    <h1 className="text-2xl font-bold text-slate-950">{tx('Infraestructura / Preventivos de Equipamientos', 'Infrastructure / Equipment preventive tasks')}</h1>
                  </div>
                  <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
                    {tx('Planes preventivos, órdenes técnicas, historial y downtime para madurar el mantenimiento de máquinas y aparatos del gimnasio.', 'Preventive plans, technical orders, history, and downtime to mature maintenance for gym machines and equipment.')}
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={loadDashboard} disabled={loading || Boolean(saving)}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Actualizar
                </Button>
              </div>
            </Card>

            {error ? (
              <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <span>{error}</span>
                </div>
              </Card>
            ) : null}

            {success ? (
              <Card className="border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{success}</span>
                </div>
              </Card>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <MetricCard title={tx('Planes', 'Plans')} value={dashboard?.metricas.totalPlanes ?? 0} helper={tx('Preventivos', 'Preventive plans')} tone="blue" />
              <MetricCard title={tx('Órdenes abiertas', 'Open orders')} value={dashboard?.metricas.ordenesAbiertas ?? 0} helper={tx('Pendientes', 'Pending')} tone="violet" />
              <MetricCard title={tx('Vencidas', 'Overdue')} value={dashboard?.metricas.ordenesVencidas ?? 0} helper={tx('Atención', 'Attention')} tone="amber" />
              <MetricCard title={tx('Fuera servicio', 'Out of service')} value={dashboard?.metricas.equiposFueraServicio ?? 0} helper={tx('Equipos', 'Equipment')} tone="red" />
              <MetricCard title={tx('En mantenimiento', 'Under maintenance')} value={dashboard?.metricas.equiposEnMantenimiento ?? 0} helper={tx('Seguimiento', 'Follow-up')} />
              <MetricCard title={tx('Costo mes', 'Monthly cost')} value={formatCurrency(dashboard?.metricas.costoTecnicoMes)} helper={tx('Técnico', 'Technical')} tone="emerald" />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-sky-600" />
                  <h2 className="text-lg font-semibold">{tx('Nuevo plan preventivo', 'New preventive plan')}</h2>
                </div>
                <form className="space-y-3" onSubmit={handleCreatePlan}>
                  <Field label={tx('Nombre del plan', 'Plan name')}>
                    <Input value={planForm.nombre} onChange={(e) => setPlanForm((prev) => ({ ...prev, nombre: e.target.value }))} placeholder={tx('Preventivo cinta de correr, revisión multigym...', 'Treadmill preventive plan, multigym review...')} />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label={tx('Tipo de equipo', 'Equipment type')}>
                      <Input value={planForm.tipo_equipamiento ?? ''} onChange={(e) => setPlanForm((prev) => ({ ...prev, tipo_equipamiento: e.target.value }))} placeholder={tx('Cinta, bicicleta, banco...', 'Treadmill, bike, bench...')} />
                    </Field>
                    <Field label={tx('Frecuencia días', 'Frequency in days')}>
                      <Input type="number" value={String(planForm.frecuencia_dias ?? 90)} onChange={(e) => setPlanForm((prev) => ({ ...prev, frecuencia_dias: Number(e.target.value) }))} />
                    </Field>
                  </div>
                  <Field label={tx('Criticidad', 'Criticality')}>
                    <SelectField value={String(planForm.criticidad ?? 'media')} onChange={(value) => setPlanForm((prev) => ({ ...prev, criticidad: value }))}>
                      <option value="baja">{tx('Baja', 'Low')}</option>
                      <option value="media">{tx('Media', 'Medium')}</option>
                      <option value="alta">{tx('Alta', 'High')}</option>
                      <option value="critica">{tx('Crítica', 'Critical')}</option>
                    </SelectField>
                  </Field>
                  <Field label={tx('Tareas técnicas', 'Technical tasks')}>
                    <div className="space-y-2">
                      {(planForm.tareas ?? ['']).map((tarea, index) => (
                        <Input key={index} value={tarea} onChange={(e) => updatePlanTask(index, e.target.value)} placeholder={`${tx('Tarea', 'Task')} ${index + 1}`} />
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => setPlanForm((prev) => ({ ...prev, tareas: [...(prev.tareas ?? []), ''] }))}>
                        <Plus className="mr-2 h-4 w-4" />
                        {tx('Agregar tarea', 'Add task')}
                      </Button>
                    </div>
                  </Field>
                  <Field label={tx('Descripción', 'Description')}>
                    <textarea
                      value={planForm.descripcion ?? ''}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                      className="min-h-[78px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder={tx('Detalle técnico del plan...', 'Technical details for the plan...')}
                    />
                  </Field>
                  <Button className="w-full" type="submit" disabled={saving === 'plan'}>
                    {saving === 'plan' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    {tx('Crear plan preventivo', 'Create preventive plan')}
                  </Button>
                </form>
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-violet-600" />
                  <h2 className="text-lg font-semibold">{tx('Nueva orden técnica', 'New technical order')}</h2>
                </div>
                <form className="space-y-3" onSubmit={handleCreateOrden}>
                  <Field label={tx('Equipamiento', 'Equipment')}>
                    <SelectField value={ordenForm.id_equipamiento} onChange={(value) => setOrdenForm((prev) => ({ ...prev, id_equipamiento: value }))}>
                      <option value="">{tx('Seleccionar equipo', 'Select equipment')}</option>
                      {(dashboard?.equipos ?? []).map((equipo) => <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>)}
                    </SelectField>
                  </Field>
                  <Field label={tx('Plan preventivo', 'Preventive plan')}>
                    <SelectField value={String(ordenForm.plan_id ?? '')} onChange={(value) => setOrdenForm((prev) => ({ ...prev, plan_id: value }))}>
                      <option value="">{tx('Sin plan / correctivo manual', 'No plan / manual corrective')}</option>
                      {(dashboard?.planes ?? []).map((plan) => <option key={plan.id} value={plan.id}>{tPlanName(plan.nombre)}</option>)}
                    </SelectField>
                  </Field>
                  <Field label={tx('Título', 'Title')}>
                    <Input value={ordenForm.titulo} onChange={(e) => setOrdenForm((prev) => ({ ...prev, titulo: e.target.value }))} placeholder={tx('Revisión cinta 1, ajuste polea, cambio tapizado...', 'Treadmill 1 review, pulley adjustment, upholstery change...')} />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label={tx('Tipo', 'Type')}>
                      <SelectField value={String(ordenForm.tipo_orden ?? 'preventivo')} onChange={(value) => setOrdenForm((prev) => ({ ...prev, tipo_orden: value }))}>
                        <option value="preventivo">{tx('Preventivo', 'Preventive')}</option>
                        <option value="correctivo">{tx('Correctivo', 'Corrective')}</option>
                        <option value="inspeccion">{tx('Inspección', 'Inspection')}</option>
                        <option value="reparacion">{tx('Reparación', 'Repair')}</option>
                        <option value="limpieza_tecnica">{tx('Limpieza técnica', 'Technical cleaning')}</option>
                        <option value="cambio_pieza">{tx('Cambio de pieza', 'Part replacement')}</option>
                      </SelectField>
                    </Field>
                    <Field label={tx('Prioridad', 'Priority')}>
                      <SelectField value={String(ordenForm.prioridad ?? 'media')} onChange={(value) => setOrdenForm((prev) => ({ ...prev, prioridad: value }))}>
                        <option value="baja">{tx('Baja', 'Low')}</option>
                        <option value="media">{tx('Media', 'Medium')}</option>
                        <option value="alta">{tx('Alta', 'High')}</option>
                        <option value="critica">{tx('Crítica', 'Critical')}</option>
                      </SelectField>
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label={tx('Programada', 'Scheduled')}>
                      <Input type="date" value={ordenForm.fecha_programada ?? ''} onChange={(e) => setOrdenForm((prev) => ({ ...prev, fecha_programada: e.target.value }))} />
                    </Field>
                    <Field label={tx('Vencimiento', 'Due date')}>
                      <Input type="date" value={ordenForm.fecha_vencimiento ?? ''} onChange={(e) => setOrdenForm((prev) => ({ ...prev, fecha_vencimiento: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label={tx('Técnico / proveedor', 'Technician / vendor')}>
                      <Input value={ordenForm.tecnico_responsable ?? ''} onChange={(e) => setOrdenForm((prev) => ({ ...prev, tecnico_responsable: e.target.value }))} />
                    </Field>
                    <Field label={tx('Costo estimado', 'Estimated cost')}>
                      <Input type="number" value={ordenForm.costo_estimado ? String(ordenForm.costo_estimado) : ''} onChange={(e) => setOrdenForm((prev) => ({ ...prev, costo_estimado: e.target.value ? Number(e.target.value) : null }))} />
                    </Field>
                  </div>
                  <Field label={tx('Descripción', 'Description')}>
                    <textarea
                      value={ordenForm.descripcion ?? ''}
                      onChange={(e) => setOrdenForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                      className="min-h-[78px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder={tx('Trabajo requerido, falla detectada, repuestos previstos...', 'Required work, detected failure, expected spare parts...')}
                    />
                  </Field>
                  <Button className="w-full" type="submit" disabled={saving === 'orden'}>
                    {saving === 'orden' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    {tx('Crear orden técnica', 'Create technical order')}
                  </Button>
                </form>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-violet-600" />
                  <h2 className="text-lg font-semibold">{tx('Órdenes técnicas abiertas', 'Open technical orders')}</h2>
                </div>
                <div className="space-y-3">
                  {activeOrders.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{tx('Sin órdenes técnicas abiertas.', 'No open technical orders.')}</p>
                  ) : (
                    activeOrders.map((orden) => (
                      <div key={orden.id} className="rounded-lg border p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-slate-950">{orden.titulo}</p>
                            <p className="text-xs text-muted-foreground">{orden.equipamiento?.nombre ?? tx('Sin equipo', 'No equipment')} · {tValue(orden.tipo_orden)} · {tx('Vence', 'Due')} {formatDate(orden.fecha_vencimiento)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{tx('Técnico', 'Technician')}: {orden.tecnico_responsable ?? '-'} · {tx('Estimado', 'Estimated')}: {formatCurrency(orden.costo_estimado)}</p>
                            {orden.tareas?.length ? <p className="mt-1 text-xs text-muted-foreground">{tx('Tareas del plan', 'Plan tasks')}: {orden.tareas.length}</p> : null}
                          </div>
                          <Button size="sm" variant="outline" onClick={() => completeOrder(orden)} disabled={saving === orden.id}>
                            {saving === orden.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-2 h-3 w-3" />}
                            {tx('Completar', 'Complete')}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold">{tx('Historial técnico reciente', 'Recent technical history')}</h2>
                </div>
                <div className="space-y-3">
                  {(dashboard?.historial ?? []).length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{tx('Todavía no hay historial técnico registrado.', 'No technical history has been recorded yet.')}</p>
                  ) : (
                    (dashboard?.historial ?? []).slice(0, 8).map((item) => (
                      <div key={item.id} className="rounded-lg border p-3">
                        <p className="font-semibold text-slate-950">{tHistoryTitle(item.titulo)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{tValue(item.tipo_evento)} · {formatDate(item.creado_en)} · {formatCurrency(item.costo)}</p>
                        {item.detalle ? <p className="mt-1 text-xs text-muted-foreground">{tHistoryDetail(item.detalle)}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </section>

            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-sky-600" />
                <h2 className="text-lg font-semibold">{tx('Planes preventivos activos', 'Active preventive plans')}</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(dashboard?.planes ?? []).map((plan) => (
                  <div key={plan.id} className="rounded-lg border p-3">
                    <p className="font-semibold text-slate-950">{tPlanName(plan.nombre)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{tEquipmentType(plan.tipo_equipamiento) || tx('General', 'General')} · {tx('cada', 'every')} {plan.frecuencia_dias} {tx('días', 'days')} · {tValue(plan.criticidad)}</p>
                    {plan.tareas?.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                        {plan.tareas.slice(0, 4).map((tarea) => <li key={tarea.id}>{tPlanTask(tarea.descripcion)}</li>)}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
