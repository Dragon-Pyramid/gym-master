"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Database,
  Dumbbell,
  Loader2,
  Package,
  ReceiptText,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Tags,
  UserCog,
  Wrench,
} from "lucide-react";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppHeader } from "@/components/header/AppHeader";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  CatalogoParametrizableKey,
  CatalogoParametrizableSummary,
  ParametrizacionCatalogosResponse,
} from "@/interfaces/parametrizacion.interface";
import { getParametrizacionCatalogos } from "@/services/parametrizacionService";
import { useAuthStore } from "@/stores/authStore";

type CatalogUiDefinition = {
  icon: React.ElementType;
  href?: string;
  tags: string[];
};

const catalogUiDefinitions: Record<CatalogoParametrizableKey, CatalogUiDefinition> = {
  tipo_empleado: {
    icon: UserCog,
    href: "/dashboard/entrenadores",
    tags: ["administrativo", "entrenador", "mantenimiento", "limpieza", "mayordomía/bar-snack"],
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
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("es-AR");
}

export default function ParametrizacionPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [catalogosData, setCatalogosData] = useState<ParametrizacionCatalogosResponse | null>(null);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [catalogosError, setCatalogosError] = useState<string | null>(null);

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
      const data = await getParametrizacionCatalogos();
      setCatalogosData(data);
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

  if (!isInitialized) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const isAdmin = user?.rol === "admin";
  const catalogos = catalogosData?.catalogos ?? [];

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
                          Consulta en vivo de los catálogos reales creados en base de datos para eliminar progresivamente valores hardcodeados en formularios, reportes y procesos administrativos.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur">
                        <p className="font-semibold">Última lectura</p>
                        <p className="mt-1 text-cyan-100">
                          {formatDateTime(catalogosData?.generated_at)}
                        </p>
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
                      <p className="mt-1 text-xs text-gray-500">Seeds y valores activos para próximas integraciones.</p>
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

                <Card>
                  <CardHeader className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Catálogos disponibles</h2>
                      <p className="text-sm text-gray-500">
                        Datos vivos de la base. Esta fase todavía no reemplaza formularios existentes.
                      </p>
                    </div>
                    <Button
                      onClick={loadCatalogos}
                      disabled={loadingCatalogos}
                      className="bg-[#02a8e1] hover:bg-[#0288b1]"
                    >
                      {loadingCatalogos ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="mr-2 h-4 w-4" />
                      )}
                      Actualizar catálogos
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    {catalogosError ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {catalogosError}
                      </div>
                    ) : loadingCatalogos && !catalogos.length ? (
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
                            <div
                              key={catalogo.key}
                              className="flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="rounded-xl bg-[#02a8e1]/10 p-2 text-[#02a8e1]">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-wrap justify-end gap-2">
                                  <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${statusStyles[catalogo.status]}`}>
                                    {catalogo.status}
                                  </span>
                                  <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${priorityStyles[catalogo.priority]}`}>
                                    {catalogo.priority}
                                  </span>
                                </div>
                              </div>

                              <h3 className="mt-4 text-lg font-bold text-gray-950">{catalogo.title}</h3>
                              <p className="mt-2 text-sm leading-relaxed text-gray-500">{catalogo.description}</p>

                              <div className="mt-4 grid grid-cols-3 gap-2">
                                <div className="rounded-xl bg-slate-50 p-2 text-center">
                                  <p className="text-[11px] text-slate-500">Total</p>
                                  <p className="text-lg font-bold text-slate-950">{catalogo.total}</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-2 text-center">
                                  <p className="text-[11px] text-emerald-700">Activos</p>
                                  <p className="text-lg font-bold text-emerald-700">{catalogo.activos}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-2 text-center">
                                  <p className="text-[11px] text-slate-500">Inactivos</p>
                                  <p className="text-lg font-bold text-slate-950">{catalogo.inactivos}</p>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {examples.slice(0, 6).map((item) => (
                                  <span key={item} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                    {item}
                                  </span>
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
                                    <CheckCircle2 className="h-4 w-4" />
                                    Catálogo disponible para integración
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
    </SidebarProvider>
  );
}
