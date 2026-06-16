'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
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
  CreateMantenimientoEdilicioOrdenDTO,
  InfraestructuraActivo,
  InfraestructuraMantenimientoDashboard,
  InfraestructuraSectorTipo,
} from '@/interfaces/infraestructuraMantenimiento.interface';
import {
  createInfraestructuraActivoClient,
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
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Mantenimiento Edilicio" />
          <main className="flex-1 space-y-6 p-6">
            <Card className="border-sky-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-sky-600" />
                    <h1 className="text-2xl font-bold text-slate-950">Infraestructura / Mantenimiento Edilicio</h1>
                  </div>
                  <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
                    Inventario y control del edificio del gimnasio: sectores, activos edilicios, matafuegos, luminarias, baños, salones, cañerías, mobiliario, vencimientos y órdenes de mantenimiento.
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
              <Card className="border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
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

            <section className="grid gap-6 xl:grid-cols-3">
              <Card className="p-5">
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

              <Card className="p-5">
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

              <Card className="p-5">
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

            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-semibold">Alertas edilicias</h2>
                </div>
                <div className="space-y-3">
                  {(dashboard?.alertas ?? []).length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Sin alertas críticas o vencimientos próximos.</p>
                  ) : (
                    (dashboard?.alertas ?? []).map((activo) => {
                      const remaining = Math.min(daysUntil(activo.fecha_vencimiento) ?? 9999, daysUntil(activo.fecha_proximo_mantenimiento) ?? 9999);
                      return (
                        <div key={activo.id} className="rounded-lg border p-3">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="font-semibold text-slate-950">{activo.nombre}</p>
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

              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-violet-600" />
                  <h2 className="text-lg font-semibold">Órdenes abiertas</h2>
                </div>
                <div className="space-y-3">
                  {activeOrders.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Sin órdenes abiertas.</p>
                  ) : (
                    activeOrders.map((orden) => (
                      <div key={orden.id} className="rounded-lg border p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-slate-950">{orden.titulo}</p>
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

            <Card className="p-5">
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
                          <td className="px-3 py-3 font-medium text-slate-950">{activo.nombre}</td>
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
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
