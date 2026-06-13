"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Database,
  Dumbbell,
  Edit3,
  Loader2,
  Package,
  Percent,
  Plus,
  ReceiptText,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Tags,
  ToggleLeft,
  ToggleRight,
  UserCog,
  Wrench,
} from "lucide-react";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppHeader } from "@/components/header/AppHeader";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  CatalogoParametrizableItem,
  CatalogoParametrizableKey,
  CatalogoParametrizablePayload,
  CatalogoParametrizableSummary,
  ParametrizacionCatalogosResponse,
} from "@/interfaces/parametrizacion.interface";
import type { PagoDescuentoConfig } from "@/interfaces/pago.interface";
import {
  createParametrizacionCatalogoItem,
  getCuotaDescuentoConfig,
  getParametrizacionCatalogos,
  toggleParametrizacionCatalogoItem,
  updateCuotaDescuentoConfig,
  updateParametrizacionCatalogoItem,
} from "@/services/parametrizacionService";
import { useAuthStore } from "@/stores/authStore";
import { formatFrontendDateTime, formatFrontendDate } from '@/utils/dateFormat';

type CatalogUiDefinition = {
  icon: React.ElementType;
  href?: string;
  tags: string[];
};

type CatalogFormState = {
  codigo: string;
  nombre: string;
  descripcion: string;
  orden: string;
  activo: boolean;
  requiere_comprobante: boolean;
  es_online: boolean;
  frecuencia_dias: string;
  alerta_dias_anticipacion: string;
};

type CuotaDescuentoFormState = {
  activo: boolean;
  cuotas_minimas: string;
  porcentaje: string;
  descripcion: string;
};

const catalogUiDefinitions: Record<CatalogoParametrizableKey, CatalogUiDefinition> = {
  gimnasio_condicion_fiscal: {
    icon: ReceiptText,
    href: "/dashboard/gimnasio-parametrizacion",
    tags: ["responsable inscripto", "monotributo", "consumidor final", "exento"],
  },
  tipo_empleado: {
    icon: UserCog,
    href: "/dashboard/empleados",
    tags: ["administrativo", "entrenador", "mantenimiento", "limpieza", "mayordomía/bar-snack"],
  },
  empleado_tipo_contratacion: {
    icon: ShieldCheck,
    href: "/dashboard/empleados",
    tags: ["mensual", "por hora", "jornal", "eventual", "externo"],
  },
  empleado_puesto_responsabilidad: {
    icon: UserCog,
    href: "/dashboard/empleados",
    tags: ["recepción", "caja", "entrenador", "mantenimiento", "limpieza"],
  },
  empleado_area: {
    icon: Database,
    href: "/dashboard/empleados",
    tags: ["recepción", "administración", "entrenamiento", "ventas", "bar/snack"],
  },
  empleado_turno: {
    icon: RefreshCcw,
    href: "/dashboard/empleados",
    tags: ["mañana", "tarde", "noche", "rotativo", "fin de semana"],
  },
  empleado_horario_disponibilidad: {
    icon: CheckCircle2,
    href: "/dashboard/empleados",
    tags: ["full time", "part time", "bloques", "rotativo", "a convenir"],
  },
  medio_pago: {
    icon: CreditCard,
    href: "/dashboard/pagos",
    tags: ["cuotas", "ventas", "recibos", "Stripe"],
  },
  tipo_gasto: {
    icon: ReceiptText,
    href: "/dashboard/otros-gastos",
    tags: ["sueldos", "mantenimiento", "servicios", "insumos"],
  },
  tipo_ingreso: {
    icon: Tags,
    href: "/dashboard/ventas",
    tags: ["cuotas", "ventas", "servicios", "promociones"],
  },
  categoria_producto: {
    icon: Package,
    href: "/dashboard/productos",
    tags: ["bebidas", "snacks", "suplementos", "stock"],
  },
  tipo_equipamiento: {
    icon: Dumbbell,
    href: "/dashboard/equipamientos",
    tags: ["cardio", "fuerza", "funcional", "peso libre"],
  },
  ubicacion_equipamiento: {
    icon: Database,
    href: "/dashboard/equipamientos",
    tags: ["zonas", "sala", "depósito", "bar/snack"],
  },

  ubicacion_gimnasio: {
    icon: Database,
    href: "/dashboard/actividades",
    tags: ["sala principal", "funcional", "spinning", "cardio", "fuerza"],
  },
  tipo_mantenimiento: {
    icon: Wrench,
    href: "/dashboard/equipamientos",
    tags: ["lubricación", "cableado", "seguridad", "alertas"],
  },
};

const statusStyles: Record<string, string> = {
  Disponible: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Base existente": "bg-[#e6f7fd] text-[#027aa3] border-[#b8e8f7]",
  Planificado: "bg-amber-50 text-amber-700 border-amber-200",
};

const priorityStyles: Record<string, string> = {
  Alta: "bg-red-50 text-red-700 border-red-200",
  Media: "bg-blue-50 text-blue-700 border-blue-200",
  Futura: "bg-slate-50 text-slate-700 border-slate-200",
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : formatFrontendDateTime(value);
}

function emptyFormState(): CatalogFormState {
  return {
    codigo: "",
    nombre: "",
    descripcion: "",
    orden: "0",
    activo: true,
    requiere_comprobante: false,
    es_online: false,
    frecuencia_dias: "",
    alerta_dias_anticipacion: "5",
  };
}

function formFromItem(item: CatalogoParametrizableItem): CatalogFormState {
  return {
    codigo: item.codigo,
    nombre: item.nombre,
    descripcion: item.descripcion ?? "",
    orden: String(item.orden ?? 0),
    activo: item.activo,
    requiere_comprobante: item.requiere_comprobante === true,
    es_online: item.es_online === true,
    frecuencia_dias: item.frecuencia_dias == null ? "" : String(item.frecuencia_dias),
    alerta_dias_anticipacion:
      item.alerta_dias_anticipacion == null ? "0" : String(item.alerta_dias_anticipacion),
  };
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function descuentoFormFromConfig(config: PagoDescuentoConfig | null): CuotaDescuentoFormState {
  return {
    activo: config?.activo === true,
    cuotas_minimas: String(config?.cuotas_minimas ?? 2),
    porcentaje: String(config?.porcentaje ?? 0),
    descripcion:
      config?.descripcion ??
      "Descuento por pago adelantado de cuotas aplicado en administración y Stripe.",
  };
}

export default function ParametrizacionPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [catalogosData, setCatalogosData] = useState<ParametrizacionCatalogosResponse | null>(null);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [catalogosError, setCatalogosError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogoParametrizableSummary | null>(null);
  const [selectedItem, setSelectedItem] = useState<CatalogoParametrizableItem | null>(null);
  const [formState, setFormState] = useState<CatalogFormState>(emptyFormState());
  const [saving, setSaving] = useState(false);
  const [descuentoConfig, setDescuentoConfig] = useState<PagoDescuentoConfig | null>(null);
  const [descuentoForm, setDescuentoForm] = useState<CuotaDescuentoFormState>(
    descuentoFormFromConfig(null)
  );
  const [savingDescuento, setSavingDescuento] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadCatalogos = useCallback(async () => {
    setLoadingCatalogos(true);
    setCatalogosError(null);

    try {
      const [data, descuento] = await Promise.all([
        getParametrizacionCatalogos(),
        getCuotaDescuentoConfig(),
      ]);
      setCatalogosData(data);
      setDescuentoConfig(descuento);
      setDescuentoForm(descuentoFormFromConfig(descuento));
    } catch (error) {
      setCatalogosError(
        error instanceof Error ? error.message : "No se pudieron cargar los catálogos"
      );
    } finally {
      setLoadingCatalogos(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.rol === "admin") {
      loadCatalogos();
    }
  }, [isAuthenticated, isInitialized, loadCatalogos, user?.rol]);

  const resumen = useMemo(() => {
    const catalogos = catalogosData?.catalogos ?? [];
    return {
      catalogos: catalogos.length,
      registros: catalogos.reduce((acc, catalogo) => acc + catalogo.total, 0),
      activos: catalogos.reduce((acc, catalogo) => acc + catalogo.activos, 0),
    };
  }, [catalogosData]);

  const openCreateDialog = (catalogo: CatalogoParametrizableSummary) => {
    setSelectedCatalog(catalogo);
    setSelectedItem(null);
    setFormState(emptyFormState());
    setActionMessage(null);
    setDialogOpen(true);
  };

  const openEditDialog = (
    catalogo: CatalogoParametrizableSummary,
    item: CatalogoParametrizableItem
  ) => {
    setSelectedCatalog(catalogo);
    setSelectedItem(item);
    setFormState(formFromItem(item));
    setActionMessage(null);
    setDialogOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCatalog) return;

    setSaving(true);
    setCatalogosError(null);
    setActionMessage(null);

    const payload: CatalogoParametrizablePayload = {
      catalogo: selectedCatalog.key,
      id: selectedItem?.id,
      codigo: formState.codigo,
      nombre: formState.nombre,
      descripcion: formState.descripcion || null,
      orden: Number(formState.orden || 0),
      activo: formState.activo,
    };

    if (selectedCatalog.key === "medio_pago") {
      payload.requiere_comprobante = formState.requiere_comprobante;
      payload.es_online = formState.es_online;
    }

    if (selectedCatalog.key === "tipo_mantenimiento") {
      payload.frecuencia_dias = parseOptionalNumber(formState.frecuencia_dias);
      payload.alerta_dias_anticipacion = Number(formState.alerta_dias_anticipacion || 0);
    }

    try {
      if (selectedItem) {
        await updateParametrizacionCatalogoItem(payload);
        setActionMessage("Registro actualizado correctamente.");
      } else {
        await createParametrizacionCatalogoItem(payload);
        setActionMessage("Registro creado correctamente.");
      }

      setDialogOpen(false);
      await loadCatalogos();
    } catch (error) {
      setCatalogosError(error instanceof Error ? error.message : "No se pudo guardar el registro");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleItem = async (
    catalogo: CatalogoParametrizableSummary,
    item: CatalogoParametrizableItem
  ) => {
    setCatalogosError(null);
    setActionMessage(null);

    try {
      await toggleParametrizacionCatalogoItem({
        catalogo: catalogo.key,
        id: item.id,
        activo: !item.activo,
      });
      setActionMessage(item.activo ? "Registro desactivado." : "Registro activado.");
      await loadCatalogos();
    } catch (error) {
      setCatalogosError(error instanceof Error ? error.message : "No se pudo cambiar el estado");
    }
  };

  const handleSaveDescuento = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSavingDescuento(true);
    setCatalogosError(null);
    setActionMessage(null);

    try {
      const saved = await updateCuotaDescuentoConfig({
        activo: descuentoForm.activo,
        cuotas_minimas: Number(descuentoForm.cuotas_minimas || 2),
        porcentaje: Number(descuentoForm.porcentaje || 0),
        descripcion: descuentoForm.descripcion || null,
      });

      setDescuentoConfig(saved);
      setDescuentoForm(descuentoFormFromConfig(saved));
      setActionMessage("Descuento por pago adelantado actualizado correctamente.");
    } catch (error) {
      setCatalogosError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el descuento por pago adelantado"
      );
    } finally {
      setSavingDescuento(false);
    }
  };

  if (!isInitialized) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const isAdmin = user?.rol === "admin";
  const catalogos = catalogosData?.catalogos ?? [];
  const isMedioPago = selectedCatalog?.key === "medio_pago";
  const isTipoMantenimiento = selectedCatalog?.key === "tipo_mantenimiento";

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Parametrización" />
          <main className="flex-1 p-6 space-y-6">
            {!isAdmin ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="flex items-start gap-3 p-5 text-amber-800">
                  <AlertTriangle className="mt-0.5 h-5 w-5" />
                  <div>
                    <h2 className="text-lg font-semibold">Acceso restringido</h2>
                    <p className="mt-1 text-sm">
                      La parametrización del sistema está disponible para usuarios administradores.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="overflow-hidden border-0 shadow-sm">
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#025f80] p-6 text-white">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-cyan-100">
                          <ShieldCheck className="h-4 w-4" />
                          Configuración administrativa
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">Parametrización de catálogos</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-200">
                          Consulta y administración base de catálogos reales para eliminar progresivamente valores hardcodeados en formularios, reportes y procesos administrativos.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur">
                        <p className="font-semibold">Última lectura</p>
                        <p className="mt-1 text-cyan-100">{formatDateTime(catalogosData?.generated_at)}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Catálogos reales</p>
                      <p className="mt-1 text-2xl font-bold text-gray-950">{resumen.catalogos}</p>
                      <p className="mt-1 text-xs text-gray-500">Leídos desde Supabase vía API interna.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Registros parametrizables</p>
                      <p className="mt-1 text-2xl font-bold text-gray-950">{resumen.registros}</p>
                      <p className="mt-1 text-xs text-gray-500">Seeds y valores vivos para próximas integraciones.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Activos</p>
                      <p className="mt-1 text-2xl font-bold text-gray-950">{resumen.activos}</p>
                      <p className="mt-1 text-xs text-gray-500">Base para futuros selectores y CRUD administrativo.</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-cyan-100">
                  <CardHeader className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700">
                        <Percent className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Descuento por pago adelantado</h2>
                        <p className="text-sm text-gray-500">
                          Configura la promoción que se aplica cuando un socio paga varias cuotas juntas. Impacta en pago manual, Stripe, recibos e historial.
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      descuentoConfig?.activo
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}>
                      {descuentoConfig?.activo ? "Activo" : "Desactivado"}
                    </span>
                  </CardHeader>
                  <CardContent className="p-4">
                    <form onSubmit={handleSaveDescuento} className="grid gap-4 md:grid-cols-4">
                      <div className="flex items-center gap-2 rounded-xl border bg-white p-3 md:col-span-1">
                        <Checkbox
                          id="descuento_activo"
                          checked={descuentoForm.activo}
                          onCheckedChange={(checked) =>
                            setDescuentoForm((prev) => ({ ...prev, activo: checked === true }))
                          }
                        />
                        <Label htmlFor="descuento_activo" className="text-sm font-medium">
                          Activar descuento
                        </Label>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="cuotas_minimas_descuento">Cuotas mínimas</Label>
                        <Input
                          id="cuotas_minimas_descuento"
                          type="number"
                          min={1}
                          max={24}
                          value={descuentoForm.cuotas_minimas}
                          onChange={(event) =>
                            setDescuentoForm((prev) => ({
                              ...prev,
                              cuotas_minimas: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="porcentaje_descuento">Porcentaje</Label>
                        <Input
                          id="porcentaje_descuento"
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={descuentoForm.porcentaje}
                          onChange={(event) =>
                            setDescuentoForm((prev) => ({
                              ...prev,
                              porcentaje: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="submit"
                          disabled={savingDescuento}
                          className="w-full bg-[#02a8e1] hover:bg-[#0288b1]"
                        >
                          {savingDescuento ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Guardar descuento
                        </Button>
                      </div>

                      <div className="space-y-1 md:col-span-4">
                        <Label htmlFor="descripcion_descuento">Mensaje interno</Label>
                        <Input
                          id="descripcion_descuento"
                          value={descuentoForm.descripcion}
                          onChange={(event) =>
                            setDescuentoForm((prev) => ({
                              ...prev,
                              descripcion: event.target.value,
                            }))
                          }
                          placeholder="Ejemplo: pagando 2 o más cuotas se aplica 10% de descuento"
                        />
                      </div>

                      {Number(descuentoForm.porcentaje || 0) > 0 ? (
                        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800 md:col-span-4">
                          {descuentoForm.activo
                            ? `Mensaje al socio/admin: pagando ${descuentoForm.cuotas_minimas || 2} o más cuotas por adelantado obtiene ${descuentoForm.porcentaje || 0}% de descuento.`
                            : "El porcentaje está configurado pero no se aplica porque el descuento está desactivado."}
                        </div>
                      ) : null}
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Catálogos disponibles</h2>
                      <p className="text-sm text-gray-500">
                        Datos vivos de la base. Esta fase habilita creación, edición y activación/desactivación sin hard delete.
                      </p>
                    </div>
                    <Button onClick={loadCatalogos} disabled={loadingCatalogos} className="bg-[#02a8e1] hover:bg-[#0288b1]">
                      {loadingCatalogos ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                      Actualizar catálogos
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {catalogosError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {catalogosError}
                      </div>
                    )}
                    {actionMessage && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {actionMessage}
                      </div>
                    )}

                    {loadingCatalogos && !catalogos.length ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando catálogos parametrizables...
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {catalogos.map((catalogo: CatalogoParametrizableSummary) => {
                          const ui = catalogUiDefinitions[catalogo.key];
                          const Icon = ui?.icon ?? Database;
                          const examples = catalogo.examples.length ? catalogo.examples : ui?.tags ?? [];

                          return (
                            <div key={catalogo.key} className="flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                              <div className="flex items-start justify-between gap-3">
                                <div className="rounded-xl bg-[#02a8e1]/10 p-2 text-[#02a8e1]">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-wrap justify-end gap-2">
                                  <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${statusStyles[catalogo.status]}`}>{catalogo.status}</span>
                                  <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${priorityStyles[catalogo.priority]}`}>{catalogo.priority}</span>
                                </div>
                              </div>

                              <h3 className="mt-4 text-lg font-bold text-gray-950">{catalogo.title}</h3>
                              <p className="mt-2 text-sm leading-relaxed text-gray-500">{catalogo.description}</p>

                              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="rounded-xl bg-slate-50 p-2">
                                  <p className="text-gray-500">Total</p>
                                  <p className="text-lg font-bold text-gray-950">{catalogo.total}</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-2">
                                  <p className="text-emerald-600">Activos</p>
                                  <p className="text-lg font-bold text-emerald-700">{catalogo.activos}</p>
                                </div>
                                <div className="rounded-xl bg-amber-50 p-2">
                                  <p className="text-amber-600">Inactivos</p>
                                  <p className="text-lg font-bold text-amber-700">{catalogo.inactivos}</p>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold uppercase text-gray-500">Registros</p>
                                  {catalogo.editable && (
                                    <Button size="sm" onClick={() => openCreateDialog(catalogo)} className="h-8 bg-[#02a8e1] hover:bg-[#0288b1]">
                                      <Plus className="mr-1 h-3.5 w-3.5" /> Nuevo
                                    </Button>
                                  )}
                                </div>

                                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                  {catalogo.items.map((item) => (
                                    <div key={item.id} className="rounded-xl border bg-slate-50 p-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <p className="text-sm font-semibold text-gray-950">{item.nombre}</p>
                                          <p className="text-xs text-gray-500">{item.codigo}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${item.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                                          {item.activo ? "Activo" : "Inactivo"}
                                        </span>
                                      </div>

                                      {item.descripcion && <p className="mt-2 line-clamp-2 text-xs text-gray-500">{item.descripcion}</p>}

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <Button size="sm" variant="outline" onClick={() => openEditDialog(catalogo, item)} className="h-8">
                                          <Edit3 className="mr-1 h-3.5 w-3.5" /> Editar
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleToggleItem(catalogo, item)} className="h-8">
                                          {item.activo ? <ToggleRight className="mr-1 h-3.5 w-3.5" /> : <ToggleLeft className="mr-1 h-3.5 w-3.5" />}
                                          {item.activo ? "Desactivar" : "Activar"}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {examples.slice(0, 4).map((example) => (
                                  <span key={example} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{example}</span>
                                ))}
                              </div>

                              <div className="mt-auto pt-4">
                                {ui?.href ? (
                                  <Button asChild variant="outline" className="w-full justify-between border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]">
                                    <Link href={ui.href}>
                                      Ver módulo relacionado
                                      <ArrowRight className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    <CheckCircle2 className="h-4 w-4" /> Disponible para integración
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Editar registro" : "Nuevo registro"}</DialogTitle>
            <DialogDescription>
              {selectedCatalog?.title}. El sistema no elimina registros físicamente; se activan o desactivan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="catalogo-nombre">Nombre</Label>
                <Input id="catalogo-nombre" value={formState.nombre} onChange={(event) => setFormState((prev) => ({ ...prev, nombre: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catalogo-codigo">Código</Label>
                <Input id="catalogo-codigo" value={formState.codigo} onChange={(event) => setFormState((prev) => ({ ...prev, codigo: event.target.value }))} required />
                <p className="text-xs text-gray-500">Se normaliza a minúsculas, sin espacios ni acentos.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catalogo-descripcion">Descripción</Label>
              <textarea
                id="catalogo-descripcion"
                value={formState.descripcion}
                onChange={(event) => setFormState((prev) => ({ ...prev, descripcion: event.target.value }))}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="catalogo-orden">Orden</Label>
                <Input id="catalogo-orden" type="number" min="0" value={formState.orden} onChange={(event) => setFormState((prev) => ({ ...prev, orden: event.target.value }))} />
              </div>
              <div className="flex items-center gap-2 rounded-xl border p-3">
                <Checkbox checked={formState.activo} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, activo: checked === true }))} />
                <div>
                  <p className="text-sm font-medium">Activo</p>
                  <p className="text-xs text-gray-500">Disponible para futuras integraciones.</p>
                </div>
              </div>
            </div>

            {isMedioPago && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border p-3">
                  <Checkbox checked={formState.requiere_comprobante} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, requiere_comprobante: checked === true }))} />
                  <div>
                    <p className="text-sm font-medium">Requiere comprobante</p>
                    <p className="text-xs text-gray-500">Útil para transferencias, Stripe o tarjetas.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border p-3">
                  <Checkbox checked={formState.es_online} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, es_online: checked === true }))} />
                  <div>
                    <p className="text-sm font-medium">Es online</p>
                    <p className="text-xs text-gray-500">Identifica medios digitales.</p>
                  </div>
                </div>
              </div>
            )}

            {isTipoMantenimiento && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="catalogo-frecuencia">Frecuencia en días</Label>
                  <Input id="catalogo-frecuencia" type="number" min="1" value={formState.frecuencia_dias} onChange={(event) => setFormState((prev) => ({ ...prev, frecuencia_dias: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catalogo-alerta">Alerta anticipada en días</Label>
                  <Input id="catalogo-alerta" type="number" min="0" value={formState.alerta_dias_anticipacion} onChange={(event) => setFormState((prev) => ({ ...prev, alerta_dias_anticipacion: event.target.value }))} />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#02a8e1] hover:bg-[#0288b1]">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedItem ? "Guardar cambios" : "Crear registro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
