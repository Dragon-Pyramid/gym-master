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
      setError(err instanceof Error ? err.message : 'No se pudo cargar preventivos de equipamientos.');
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
      await registerSuccess('Plan preventivo creado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el plan preventivo.');
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
      await registerSuccess('Orden técnica creada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la orden técnica.');
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
      await registerSuccess('Orden técnica completada y equipamiento actualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la orden técnica.');
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
          <AppHeader title="Preventivos de Equipamientos" />
          <main className="flex-1 space-y-6 p-6">
            <Card className="border-sky-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-6 w-6 text-sky-600" />
                    <h1 className="text-2xl font-bold text-slate-950">Infraestructura / Preventivos de Equipamientos</h1>
                  </div>
                  <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
                    Planes preventivos, órdenes técnicas, historial y downtime para madurar el mantenimiento de máquinas y aparatos del gimnasio.
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
              <MetricCard title="Planes" value={dashboard?.metricas.totalPlanes ?? 0} helper="Preventivos" tone="blue" />
              <MetricCard title="Órdenes abiertas" value={dashboard?.metricas.ordenesAbiertas ?? 0} helper="Pendientes" tone="violet" />
              <MetricCard title="Vencidas" value={dashboard?.metricas.ordenesVencidas ?? 0} helper="Atención" tone="amber" />
              <MetricCard title="Fuera servicio" value={dashboard?.metricas.equiposFueraServicio ?? 0} helper="Equipos" tone="red" />
              <MetricCard title="En mantenimiento" value={dashboard?.metricas.equiposEnMantenimiento ?? 0} helper="Seguimiento" />
              <MetricCard title="Costo mes" value={formatCurrency(dashboard?.metricas.costoTecnicoMes)} helper="Técnico" tone="emerald" />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-sky-600" />
                  <h2 className="text-lg font-semibold">Nuevo plan preventivo</h2>
                </div>
                <form className="space-y-3" onSubmit={handleCreatePlan}>
                  <Field label="Nombre del plan">
                    <Input value={planForm.nombre} onChange={(e) => setPlanForm((prev) => ({ ...prev, nombre: e.target.value }))} placeholder="Preventivo cinta de correr, revisión multigym..." />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Tipo de equipo">
                      <Input value={planForm.tipo_equipamiento ?? ''} onChange={(e) => setPlanForm((prev) => ({ ...prev, tipo_equipamiento: e.target.value }))} placeholder="Cinta, bicicleta, banco..." />
                    </Field>
                    <Field label="Frecuencia días">
                      <Input type="number" value={String(planForm.frecuencia_dias ?? 90)} onChange={(e) => setPlanForm((prev) => ({ ...prev, frecuencia_dias: Number(e.target.value) }))} />
                    </Field>
                  </div>
                  <Field label="Criticidad">
                    <SelectField value={String(planForm.criticidad ?? 'media')} onChange={(value) => setPlanForm((prev) => ({ ...prev, criticidad: value }))}>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica</option>
                    </SelectField>
                  </Field>
                  <Field label="Tareas técnicas">
                    <div className="space-y-2">
                      {(planForm.tareas ?? ['']).map((tarea, index) => (
                        <Input key={index} value={tarea} onChange={(e) => updatePlanTask(index, e.target.value)} placeholder={`Tarea ${index + 1}`} />
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => setPlanForm((prev) => ({ ...prev, tareas: [...(prev.tareas ?? []), ''] }))}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar tarea
                      </Button>
                    </div>
                  </Field>
                  <Field label="Descripción">
                    <textarea
                      value={planForm.descripcion ?? ''}
                      onChange={(e) => setPlanForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                      className="min-h-[78px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Detalle técnico del plan..."
                    />
                  </Field>
                  <Button className="w-full" type="submit" disabled={saving === 'plan'}>
                    {saving === 'plan' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Crear plan preventivo
                  </Button>
                </form>
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-violet-600" />
                  <h2 className="text-lg font-semibold">Nueva orden técnica</h2>
                </div>
                <form className="space-y-3" onSubmit={handleCreateOrden}>
                  <Field label="Equipamiento">
                    <SelectField value={ordenForm.id_equipamiento} onChange={(value) => setOrdenForm((prev) => ({ ...prev, id_equipamiento: value }))}>
                      <option value="">Seleccionar equipo</option>
                      {(dashboard?.equipos ?? []).map((equipo) => <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>)}
                    </SelectField>
                  </Field>
                  <Field label="Plan preventivo">
                    <SelectField value={String(ordenForm.plan_id ?? '')} onChange={(value) => setOrdenForm((prev) => ({ ...prev, plan_id: value }))}>
                      <option value="">Sin plan / correctivo manual</option>
                      {(dashboard?.planes ?? []).map((plan) => <option key={plan.id} value={plan.id}>{plan.nombre}</option>)}
                    </SelectField>
                  </Field>
                  <Field label="Título">
                    <Input value={ordenForm.titulo} onChange={(e) => setOrdenForm((prev) => ({ ...prev, titulo: e.target.value }))} placeholder="Revisión cinta 1, ajuste polea, cambio tapizado..." />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Tipo">
                      <SelectField value={String(ordenForm.tipo_orden ?? 'preventivo')} onChange={(value) => setOrdenForm((prev) => ({ ...prev, tipo_orden: value }))}>
                        <option value="preventivo">Preventivo</option>
                        <option value="correctivo">Correctivo</option>
                        <option value="inspeccion">Inspección</option>
                        <option value="reparacion">Reparación</option>
                        <option value="limpieza_tecnica">Limpieza técnica</option>
                        <option value="cambio_pieza">Cambio de pieza</option>
                      </SelectField>
                    </Field>
                    <Field label="Prioridad">
                      <SelectField value={String(ordenForm.prioridad ?? 'media')} onChange={(value) => setOrdenForm((prev) => ({ ...prev, prioridad: value }))}>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                      </SelectField>
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Programada">
                      <Input type="date" value={ordenForm.fecha_programada ?? ''} onChange={(e) => setOrdenForm((prev) => ({ ...prev, fecha_programada: e.target.value }))} />
                    </Field>
                    <Field label="Vencimiento">
                      <Input type="date" value={ordenForm.fecha_vencimiento ?? ''} onChange={(e) => setOrdenForm((prev) => ({ ...prev, fecha_vencimiento: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Técnico / proveedor">
                      <Input value={ordenForm.tecnico_responsable ?? ''} onChange={(e) => setOrdenForm((prev) => ({ ...prev, tecnico_responsable: e.target.value }))} />
                    </Field>
                    <Field label="Costo estimado">
                      <Input type="number" value={ordenForm.costo_estimado ? String(ordenForm.costo_estimado) : ''} onChange={(e) => setOrdenForm((prev) => ({ ...prev, costo_estimado: e.target.value ? Number(e.target.value) : null }))} />
                    </Field>
                  </div>
                  <Field label="Descripción">
                    <textarea
                      value={ordenForm.descripcion ?? ''}
                      onChange={(e) => setOrdenForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                      className="min-h-[78px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Trabajo requerido, falla detectada, repuestos previstos..."
                    />
                  </Field>
                  <Button className="w-full" type="submit" disabled={saving === 'orden'}>
                    {saving === 'orden' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Crear orden técnica
                  </Button>
                </form>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-violet-600" />
                  <h2 className="text-lg font-semibold">Órdenes técnicas abiertas</h2>
                </div>
                <div className="space-y-3">
                  {activeOrders.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Sin órdenes técnicas abiertas.</p>
                  ) : (
                    activeOrders.map((orden) => (
                      <div key={orden.id} className="rounded-lg border p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-slate-950">{orden.titulo}</p>
                            <p className="text-xs text-muted-foreground">{orden.equipamiento?.nombre ?? 'Sin equipo'} · {labelFromValue(orden.tipo_orden)} · Vence {formatDate(orden.fecha_vencimiento)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Técnico: {orden.tecnico_responsable ?? '-'} · Estimado: {formatCurrency(orden.costo_estimado)}</p>
                            {orden.tareas?.length ? <p className="mt-1 text-xs text-muted-foreground">Tareas del plan: {orden.tareas.length}</p> : null}
                          </div>
                          <Button size="sm" variant="outline" onClick={() => completeOrder(orden)} disabled={saving === orden.id}>
                            {saving === orden.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-2 h-3 w-3" />}
                            Completar
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
                  <h2 className="text-lg font-semibold">Historial técnico reciente</h2>
                </div>
                <div className="space-y-3">
                  {(dashboard?.historial ?? []).length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Todavía no hay historial técnico registrado.</p>
                  ) : (
                    (dashboard?.historial ?? []).slice(0, 8).map((item) => (
                      <div key={item.id} className="rounded-lg border p-3">
                        <p className="font-semibold text-slate-950">{item.titulo}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{labelFromValue(item.tipo_evento)} · {formatDate(item.creado_en)} · {formatCurrency(item.costo)}</p>
                        {item.detalle ? <p className="mt-1 text-xs text-muted-foreground">{item.detalle}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </section>

            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-sky-600" />
                <h2 className="text-lg font-semibold">Planes preventivos activos</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(dashboard?.planes ?? []).map((plan) => (
                  <div key={plan.id} className="rounded-lg border p-3">
                    <p className="font-semibold text-slate-950">{plan.nombre}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.tipo_equipamiento ?? 'General'} · cada {plan.frecuencia_dias} días · {labelFromValue(plan.criticidad)}</p>
                    {plan.tareas?.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                        {plan.tareas.slice(0, 4).map((tarea) => <li key={tarea.id}>{tarea.descripcion}</li>)}
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
