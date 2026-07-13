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
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";

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

function parametrizacionTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

function normalizeParametrizacionText(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const PARAMETRIZACION_TEXT_EN: Record<string, string> = {
  disponible: "Available",
  "base existente": "Existing base",
  planificado: "Planned",
  active: "Active",
  activo: "Active",
  activos: "Active",
  inactive: "Inactive",
  inactivo: "Inactive",
  inactivos: "Inactive",
  alta: "High",
  media: "Medium",
  futura: "Future",
  registros: "Records",
  total: "Total",

  "descuento por pago adelantado": "Advance payment discount",
  "descuento configurable para socios que pagan cuotas por adelantado.":
    "Configurable discount for members who pay fees in advance.",
  "mensaje al socio/admin": "Message to member/admin",

  "condiciones fiscales": "Fiscal conditions",
  "catalogo fiscal para datos legales del gimnasio: responsable inscripto, monotributo, consumidor final, exento u otras condiciones.":
    "Fiscal catalog for gym legal data: registered VAT taxpayer, monotributo, final consumer, tax-exempt, or other conditions.",
  "tipos de empleado": "Employee types",
  "base para evolucionar entrenadores hacia empleados, sueldos, recibos y reportes por rol.":
    "Base to evolve trainers into employees, salaries, receipts, and role-based reports.",
  "tipos de contratacion": "Contract types",
  "modalidades contractuales para empleados de gimnasio: mensual, por hora, jornal, eventual, pasantia u otras.":
    "Contract modalities for gym employees: monthly, hourly, daily wage, temporary, internship, or others.",
  "puestos / responsabilidades": "Roles / responsibilities",
  "responsabilidades laborales usadas al crear usuarios internos y perfiles de empleados.":
    "Work responsibilities used when creating internal users and employee profiles.",
  "areas de trabajo": "Work areas",
  "areas operativas del gimnasio: recepcion, entrenamiento, mantenimiento, limpieza, bar/snack y administracion.":
    "Operational gym areas: reception, training, maintenance, cleaning, bar/snack, and administration.",
  shifts: "Shifts",
  turnos: "Shifts",
  "shifts laborales disponibles para usuarios internos y empleados.":
    "Work shifts available for internal users and employees.",
  "schedule / availability": "Schedule / availability",
  "horarios / disponibilidad": "Schedule / availability",
  "bloques de disponibilidad horaria frecuentes para empleados de gimnasio.":
    "Frequent schedule availability blocks for gym employees.",
  "medios de pago": "Payment methods",
  "medios disponibles para cuotas, ventas, transferencias, stripe y futuros recibos verificables.":
    "Available methods for fees, sales, transfers, Stripe, and future verifiable receipts.",
  "tipos de gasto": "Expense types",
  "clasificacion de egresos operativos: sueldos, mantenimiento, servicios, insumos e impuestos.":
    "Classification of operational outflows: salaries, maintenance, services, supplies, and taxes.",
  "tipos de ingreso": "Income types",
  "clasificacion de ingresos por cuotas, ventas, servicios, clases especiales y promociones.":
    "Classification of income from fees, sales, services, special classes, and promotions.",
  "categorias de producto": "Product categories",
  "categorias para ordenar productos, ventas adicionales, stock y reportes comerciales.":
    "Categories to organize products, add-on sales, stock, and commercial reports.",
  "tipos de equipamiento": "Equipment types",
  "catalogo base para clasificar maquinas y equipamiento del gimnasio.":
    "Base catalog for classifying gym machines and equipment.",
  "ubicaciones de equipamiento": "Equipment locations",
  "sectores fisicos donde se ubican maquinas, accesorios y espacios operativos del gimnasio.":
    "Physical sectors where machines, accessories, and operational gym spaces are located.",
  "ubicaciones del gimnasio": "Gym locations",
  "catalogo global de zonas, salas y sectores fisicos del gimnasio para actividades, equipamiento, mantenimiento, asistencia y bi.":
    "Global catalog of gym zones, rooms, and physical sectors for activities, equipment, maintenance, attendance, and BI.",
  "tipos de mantenimiento": "Maintenance types",
  "viewificaciones configurables por frecuencia, alerta anticipada e impacto operativo.":
    "Configurable checks by frequency, early alert, and operational impact.",
  "verificaciones configurables por frecuencia, alerta anticipada e impacto operativo.":
    "Configurable checks by frequency, early alert, and operational impact.",

  "responsable inscripto": "Registered VAT taxpayer",
  monotributo: "Monotributo",
  "consumidor final": "Final consumer",
  exento: "Tax-exempt",
  administrativo: "Administrative",
  administrative: "Administrative",
  administracion: "Administration",
  entrenador: "Trainer",
  trainer: "Trainer",
  maintenance: "Maintenance",
  mantenimiento: "Maintenance",
  limpieza: "Cleaning",
  "mayordomia/bar-snack": "Janitorial/bar-snack",
  mensual: "Monthly",
  monthly: "Monthly",
  "por hora": "Hourly",
  jornal: "Daily wage",
  eventual: "Temporary",
  externo: "External",
  recepcion: "Reception",
  "recepcion y caja": "Reception and cash desk",
  caja: "Cash desk",
  "entrenador de sala": "Floor trainer",
  ventas: "Sales",
  manana: "Morning",
  tarde: "Afternoon",
  noche: "Night",
  rotativo: "Rotating",
  "fin de semana": "Weekend",
  cuotas: "Fees",
  servicios: "Services",
  recibos: "Receipts",
  sueldos: "Salaries",
  insumos: "Supplies",
  promociones: "Promotions",
  bebidas: "Beverages",
  snacks: "Snacks",
  suplementos: "Supplements",
  indumentaria: "Apparel",
  stock: "Stock",
  cardio: "Cardio",
  fuerza: "Strength",
  funcional: "Functional",
  "peso libre": "Free weights",
  "weight libre": "Free weights",
  zonas: "Zones",
  sala: "Room",
  deposito: "Storage",
  "bar/snack": "Bar/snack",
  "sala principal": "Main room",
  spinning: "Spinning",
  lubricacion: "Lubrication",
  cableado: "Cabling",
  seguridad: "Safety",
  alertas: "Alerts",
  preventivo: "Preventive",
  correctivo: "Corrective",
  "cableado / correas": "Cabling / belts",
  "zona a": "Zone A",
  "zona b": "Zone B",
  "zona c": "Zone C",
  "zona d": "Zone D",
  "zona vip": "VIP zone",
  "sala funcional": "Functional room",
  "sala spinning": "Spinning room",
  efectivo: "Cash",
  cash: "Cash",
  stripe: "Stripe",
  "bank transfer": "Bank transfer",
  "transferencia bancaria": "Bank transfer",
  "tarjeta de debito": "Debit card",
  "clases especiales": "Special classes",
  masajista: "Massage therapist",

  "responsable inscripto ante el organismo fiscal.": "Registered VAT taxpayer with the tax authority.",
  "regimen simplificado / monotributo.": "Simplified tax regime / Monotributo.",
  "empleado administrativo con posibles permisos de menu/rbac.": "Administrative employee with possible menu/RBAC permissions.",
  "hace masajes a socios": "Provides massages to members.",
  "pago mensual fijo para empleados estables.": "Fixed monthly payment for stable employees.",
  "pago por hora trabajada o clase asignada.": "Payment per hour worked or assigned class.",
  "atencion al socio, cobros, consultas y control de ingreso.": "Member service, collections, queries, and entry control.",
  "gestion administrativa, carga de datos, pagos y reportes.": "Administrative management, data entry, payments, and reports.",
  "backoffice, pagos, reportes y operacion administrativa.": "Back office, payments, reports, and administrative operations.",
  "shift manana.": "Morning shift.",
  "shift tarde.": "Afternoon shift.",
  "bloque administrativo o recepcion de manana.": "Administrative or reception morning block.",
  "bloque tarde/noche para recepcion, caja o sala.": "Afternoon/night block for reception, cash desk, or floor.",
  "pago manual registrado por administracion.": "Manual payment recorded by administration.",
  "pago online procesado por stripe.": "Online payment processed by Stripe.",
  "pagos mensuales a empleados.": "Monthly payments to employees.",
  "gastos asociados a mantenimiento de equipamiento o infraestructura.": "Expenses related to equipment or infrastructure maintenance.",
  "ingresos por pago de cuotas de socios.": "Income from member fee payments.",
  "ingresos por venta de productos.": "Income from product sales.",
  "agua, bebidas isotonicas, cafe u otras bebidas.": "Water, isotonic drinks, coffee, or other beverages.",
  "snacks y alimentos rapidos.": "Snacks and quick food.",
  "equipamiento cardiovascular.": "Cardio equipment.",
  "maquinas y equipamiento de fuerza.": "Strength machines and equipment.",
  "zona operativa a del gimnasio.": "Gym operational zone A.",
  "zona operativa b del gimnasio.": "Gym operational zone B.",
  "zona exclusiva para clientes importantes": "Exclusive zone for important clients.",
  "sala principal para clases, activities generales o usos multiples.": "Main room for classes, general activities, or multipurpose use.",
  "maintenance preventivo general.": "General preventive maintenance.",
  "maintenance correctivo por falla o rotura.": "Corrective maintenance for failure or breakage.",
  "monday a viernes 08:00-16:00": "Monday to Friday 08:00-16:00",
  "monday a viernes 14:00-22:00": "Monday to Friday 14:00-22:00",
  "monday a sabado 07:00-13:00": "Monday to Saturday 07:00-13:00",
  "monday a sabado 16:00-22:00": "Monday to Saturday 16:00-22:00",
};

function translateParametrizacionText(locale: GymMasterLocale, value?: string | null) {
  const text = String(value ?? "");
  if (locale !== "en" || !text) return text;
  const normalized = normalizeParametrizacionText(text);
  return PARAMETRIZACION_TEXT_EN[normalized] ?? text;
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
  const { locale } = useI18n();
  const c = (es: string, en: string) => parametrizacionTx(locale, es, en);
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
        error instanceof Error ? error.message : parametrizacionTx(locale, "No se pudieron cargar los catálogos", "Catalogs could not be loaded")
      );
    } finally {
      setLoadingCatalogos(false);
    }
  }, [locale]);

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
        setActionMessage(c("Registro actualizado correctamente.", "Record updated successfully."));
      } else {
        await createParametrizacionCatalogoItem(payload);
        setActionMessage(c("Registro creado correctamente.", "Record created successfully."));
      }

      setDialogOpen(false);
      await loadCatalogos();
    } catch (error) {
      setCatalogosError(error instanceof Error ? error.message : c("No se pudo guardar el registro", "The record could not be saved"));
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
      setActionMessage(item.activo ? c("Registro desactivado.", "Record deactivated.") : c("Registro activado.", "Record activated."));
      await loadCatalogos();
    } catch (error) {
      setCatalogosError(error instanceof Error ? error.message : c("No se pudo cambiar el estado", "The status could not be changed"));
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
      setActionMessage(c("Descuento por pago adelantado actualizado correctamente.", "Advance payment discount updated successfully."));
    } catch (error) {
      setCatalogosError(
        error instanceof Error
          ? error.message
          : c("No se pudo actualizar el descuento por pago adelantado", "The advance payment discount could not be updated")
      );
    } finally {
      setSavingDescuento(false);
    }
  };

  if (!isInitialized) {
    return <div>{c("Cargando...", "Loading...")}</div>;
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
          <AppHeader title={c("Parametrización", "Parametrization")} />
          <main className="flex-1 p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
            {!isAdmin ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="flex items-start gap-3 p-5 text-amber-800">
                  <AlertTriangle className="mt-0.5 h-5 w-5" />
                  <div>
                    <h2 className="text-lg font-semibold">{c("Acceso restringido", "Restricted access")}</h2>
                    <p className="mt-1 text-sm">
                      {c("La parametrización del sistema está disponible para usuarios administradores.", "System parametrization is available to administrator users.")}
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
                          {c("Configuración administrativa", "Administrative configuration")}
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">{c("Parametrización de catálogos", "Catalog parametrization")}</h1>
                      </div>
                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur">
                        <p className="font-semibold">{c("Última lectura", "Last read")}</p>
                        <p className="mt-1 text-cyan-100">{formatDateTime(catalogosData?.generated_at)}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{c("Catálogos reales", "Real catalogs")}</p>
                      <p className="mt-1 text-2xl font-bold text-gray-950 dark:text-gray-50">{resumen.catalogos}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{c("Leídos desde Supabase vía API interna.", "Read from Supabase via internal API.")}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{c("Registros parametrizables", "Configurable records")}</p>
                      <p className="mt-1 text-2xl font-bold text-gray-950 dark:text-gray-50">{resumen.registros}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{c("Seeds y valores vivos para próximas integraciones.", "Seeds and live values for upcoming integrations.")}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{c("Activos", "Active")}</p>
                      <p className="mt-1 text-2xl font-bold text-gray-950 dark:text-gray-50">{resumen.activos}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{c("Base para futuros selectores y CRUD administrativo.", "Base for future selectors and administrative CRUD.")}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-cyan-100 bg-white dark:border-cyan-900/50 dark:bg-slate-900">
                  <CardHeader className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700">
                        <Percent className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{c("Descuento por pago adelantado", "Advance payment discount")}</h2>
                        <p className="text-sm text-gray-500">
                          {c("Configura la promoción que se aplica cuando un socio paga varias cuotas juntas. Impacta en pago manual, Stripe, recibos e historial.", "Configure the promotion applied when a member pays multiple fees together. It affects manual payments, Stripe, receipts, and history.")}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      descuentoConfig?.activo
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}>
                      {descuentoConfig?.activo ? c("Activo", "Active") : c("Desactivado", "Disabled")}
                    </span>
                  </CardHeader>
                  <CardContent className="p-4">
                    <form onSubmit={handleSaveDescuento} className="grid gap-4 md:grid-cols-4">
                      <div className="flex items-center gap-2 rounded-xl border bg-white p-3 md:col-span-1 dark:border-slate-700 dark:bg-slate-950">
                        <Checkbox
                          id="descuento_activo"
                          checked={descuentoForm.activo}
                          onCheckedChange={(checked) =>
                            setDescuentoForm((prev) => ({ ...prev, activo: checked === true }))
                          }
                        />
                        <Label htmlFor="descuento_activo" className="text-sm font-medium">
                          {c("Activar descuento", "Enable discount")}
                        </Label>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="cuotas_minimas_descuento">{c("Cuotas mínimas", "Minimum fees")}</Label>
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
                        <Label htmlFor="porcentaje_descuento">{c("Porcentaje", "Percentage")}</Label>
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
                          {c("Guardar descuento", "Save discount")}
                        </Button>
                      </div>

                      <div className="space-y-1 md:col-span-4">
                        <Label htmlFor="descripcion_descuento">{c("Mensaje interno", "Internal message")}</Label>
                        <Input
                          id="descripcion_descuento"
                          value={descuentoForm.descripcion}
                          onChange={(event) =>
                            setDescuentoForm((prev) => ({
                              ...prev,
                              descripcion: event.target.value,
                            }))
                          }
                          placeholder={c("Ejemplo: pagando 2 o más cuotas se aplica 10% de descuento", "Example: paying 2 or more fees applies a 10% discount")}
                        />
                      </div>

                      {Number(descuentoForm.porcentaje || 0) > 0 ? (
                        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800 md:col-span-4">
                          {descuentoForm.activo
                            ? c(
                                `Mensaje al socio/admin: pagando ${descuentoForm.cuotas_minimas || 2} o más cuotas por adelantado obtiene ${descuentoForm.porcentaje || 0}% de descuento.`,
                                `Message to member/admin: paying ${descuentoForm.cuotas_minimas || 2} or more fees in advance gets a ${descuentoForm.porcentaje || 0}% discount.`
                              )
                            : c(
                                "El porcentaje está configurado pero no se aplica porque el descuento está desactivado.",
                                "The percentage is configured but not applied because the discount is disabled."
                              )}
                        </div>
                      ) : null}
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{c("Catálogos disponibles", "Available catalogs")}</h2>
                      <p className="text-sm text-gray-500">
                        {c("Datos vivos de la base. Esta fase habilita creación, edición y activación/desactivación sin hard delete.", "Live database data. This phase enables creation, editing, and activation/deactivation without hard delete.")}
                      </p>
                    </div>
                    <Button onClick={loadCatalogos} disabled={loadingCatalogos} className="bg-[#02a8e1] hover:bg-[#0288b1]">
                      {loadingCatalogos ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                      {c("Actualizar catálogos", "Refresh catalogs")}
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
                        {c("Cargando catálogos parametrizables...", "Loading configurable catalogs...")}
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {catalogos.map((catalogo: CatalogoParametrizableSummary) => {
                          const ui = catalogUiDefinitions[catalogo.key];
                          const Icon = ui?.icon ?? Database;
                          const examples = catalogo.examples.length ? catalogo.examples : ui?.tags ?? [];

                          return (
                            <div key={catalogo.key} className="flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                              <div className="flex items-start justify-between gap-3">
                                <div className="rounded-xl bg-[#02a8e1]/10 p-2 text-[#02a8e1]">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-wrap justify-end gap-2">
                                  <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${statusStyles[catalogo.status] ?? statusStyles.Disponible}`}>{translateParametrizacionText(locale, catalogo.status)}</span>
                                  <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${priorityStyles[catalogo.priority] ?? priorityStyles.Media}`}>{translateParametrizacionText(locale, catalogo.priority)}</span>
                                </div>
                              </div>

                              <h3 className="mt-4 text-lg font-bold text-gray-950 dark:text-gray-50">{translateParametrizacionText(locale, catalogo.title)}</h3>
                              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{translateParametrizacionText(locale, catalogo.description)}</p>

                              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="rounded-xl bg-slate-50 p-2">
                                  <p className="text-gray-500 dark:text-gray-400">{c("Total", "Total")}</p>
                                  <p className="text-lg font-bold text-gray-950 dark:text-gray-50">{catalogo.total}</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-2">
                                  <p className="text-emerald-600">{c("Activos", "Active")}</p>
                                  <p className="text-lg font-bold text-emerald-700">{catalogo.activos}</p>
                                </div>
                                <div className="rounded-xl bg-amber-50 p-2">
                                  <p className="text-amber-600">{c("Inactivos", "Inactive")}</p>
                                  <p className="text-lg font-bold text-amber-700">{catalogo.inactivos}</p>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{c("Registros", "Records")}</p>
                                  {catalogo.editable && (
                                    <Button size="sm" onClick={() => openCreateDialog(catalogo)} className="h-8 bg-[#02a8e1] hover:bg-[#0288b1]">
                                      <Plus className="mr-1 h-3.5 w-3.5" /> {c("Nuevo", "New")}
                                    </Button>
                                  )}
                                </div>

                                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                  {catalogo.items.map((item) => (
                                    <div key={item.id} className="rounded-xl border bg-slate-50 p-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <p className="text-sm font-semibold text-gray-950 dark:text-gray-50">{translateParametrizacionText(locale, item.nombre)}</p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.codigo}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${item.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                                          {item.activo ? c("Activo", "Active") : c("Inactivo", "Inactive")}
                                        </span>
                                      </div>

                                      {item.descripcion && (
                                        <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                                          {translateParametrizacionText(locale, item.descripcion)}
                                        </p>
                                      )}

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <Button size="sm" variant="outline" onClick={() => openEditDialog(catalogo, item)} className="h-8">
                                          <Edit3 className="mr-1 h-3.5 w-3.5" /> {c("Editar", "Edit")}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleToggleItem(catalogo, item)} className="h-8">
                                          {item.activo ? <ToggleRight className="mr-1 h-3.5 w-3.5" /> : <ToggleLeft className="mr-1 h-3.5 w-3.5" />}
                                          {item.activo ? c("Desactivar", "Deactivate") : c("Activar", "Activate")}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {examples.slice(0, 4).map((example) => (
                                  <span key={example} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{translateParametrizacionText(locale, example)}</span>
                                ))}
                              </div>

                              <div className="mt-auto pt-4">
                                {ui?.href ? (
                                  <Button asChild variant="outline" className="w-full justify-between border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]">
                                    <Link href={ui.href}>
                                      {c("Ver módulo relacionado", "View related module")}
                                      <ArrowRight className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    <CheckCircle2 className="h-4 w-4" /> {c("Disponible para integración", "Available for integration")}
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
            <DialogTitle>{selectedItem ? c("Editar registro", "Edit record") : c("Nuevo registro", "New record")}</DialogTitle>
            <DialogDescription>
              {translateParametrizacionText(locale, selectedCatalog?.title)}. {c("El sistema no elimina registros físicamente; se activan o desactivan.", "The system does not physically delete records; they are activated or deactivated.")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="catalogo-nombre">{c("Nombre", "Name")}</Label>
                <Input id="catalogo-nombre" value={formState.nombre} onChange={(event) => setFormState((prev) => ({ ...prev, nombre: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catalogo-codigo">{c("Código", "Code")}</Label>
                <Input id="catalogo-codigo" value={formState.codigo} onChange={(event) => setFormState((prev) => ({ ...prev, codigo: event.target.value }))} required />
                <p className="text-xs text-gray-500 dark:text-gray-400">{c("Se normaliza a minúsculas, sin espacios ni acentos.", "It is normalized to lowercase, without spaces or accents.")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catalogo-descripcion">{c("Descripción", "Description")}</Label>
              <textarea
                id="catalogo-descripcion"
                value={formState.descripcion}
                onChange={(event) => setFormState((prev) => ({ ...prev, descripcion: event.target.value }))}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="catalogo-orden">{c("Orden", "Order")}</Label>
                <Input id="catalogo-orden" type="number" min="0" value={formState.orden} onChange={(event) => setFormState((prev) => ({ ...prev, orden: event.target.value }))} />
              </div>
              <div className="flex items-center gap-2 rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950">
                <Checkbox checked={formState.activo} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, activo: checked === true }))} />
                <div>
                  <p className="text-sm font-medium">{c("Activo", "Active")}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{c("Disponible para futuras integraciones.", "Available for future integrations.")}</p>
                </div>
              </div>
            </div>

            {isMedioPago && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950">
                  <Checkbox checked={formState.requiere_comprobante} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, requiere_comprobante: checked === true }))} />
                  <div>
                    <p className="text-sm font-medium">{c("Requiere comprobante", "Requires receipt")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c("Útil para transferencias, Stripe o tarjetas.", "Useful for transfers, Stripe, or cards.")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950">
                  <Checkbox checked={formState.es_online} onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, es_online: checked === true }))} />
                  <div>
                    <p className="text-sm font-medium">{c("Es online", "Is online")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c("Identifica medios digitales.", "Identifies digital methods.")}</p>
                  </div>
                </div>
              </div>
            )}

            {isTipoMantenimiento && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="catalogo-frecuencia">{c("Frecuencia en días", "Frequency in days")}</Label>
                  <Input id="catalogo-frecuencia" type="number" min="1" value={formState.frecuencia_dias} onChange={(event) => setFormState((prev) => ({ ...prev, frecuencia_dias: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catalogo-alerta">{c("Alerta anticipada en días", "Early alert in days")}</Label>
                  <Input id="catalogo-alerta" type="number" min="0" value={formState.alerta_dias_anticipacion} onChange={(event) => setFormState((prev) => ({ ...prev, alerta_dias_anticipacion: event.target.value }))} />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>{c("Cancelar", "Cancel")}</Button>
              <Button type="submit" disabled={saving} className="bg-[#02a8e1] hover:bg-[#0288b1]">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedItem ? c("Guardar cambios", "Save changes") : c("Crear registro", "Create record")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
