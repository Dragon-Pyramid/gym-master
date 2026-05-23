"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Database,
  Dumbbell,
  Package,
  ReceiptText,
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
import { useAuthStore } from "@/stores/authStore";

type ParametrizacionCard = {
  title: string;
  description: string;
  href?: string;
  status: "Disponible" | "Planificado" | "Base existente";
  priority: "Alta" | "Media" | "Futura";
  icon: React.ElementType;
  items: string[];
};

const parametrizacionCards: ParametrizacionCard[] = [
  {
    title: "Actividades",
    description:
      "Centralizar las actividades ofrecidas por el gimnasio y reutilizarlas en socios, rutinas, ventas y reportes.",
    href: "/dashboard/actividades",
    status: "Base existente",
    priority: "Alta",
    icon: Dumbbell,
    items: ["nombre", "descripción", "estado activo/inactivo"],
  },
  {
    title: "Medios de pago",
    description:
      "Definir efectivo, Stripe, transferencia u otros medios para pagos de cuotas, ventas y futuros recibos verificables.",
    status: "Planificado",
    priority: "Alta",
    icon: CreditCard,
    items: ["nombre", "tipo", "requiere comprobante", "activo"],
  },
  {
    title: "Tipos de gasto",
    description:
      "Parametrizar egresos operativos para ordenar otros gastos, sueldos, mantenimiento, servicios y compras.",
    href: "/dashboard/otros-gastos",
    status: "Planificado",
    priority: "Alta",
    icon: ReceiptText,
    items: ["sueldos", "mantenimiento", "servicios", "insumos"],
  },
  {
    title: "Tipos de ingreso",
    description:
      "Separar ingresos por cuotas, ventas adicionales, servicios, clases especiales u otros conceptos.",
    status: "Planificado",
    priority: "Alta",
    icon: Tags,
    items: ["cuotas", "ventas", "servicios", "clases"],
  },
  {
    title: "Productos y categorías",
    description:
      "Ordenar productos vendidos en el gimnasio y preparar categorías editables para ventas y stock.",
    href: "/dashboard/productos",
    status: "Base existente",
    priority: "Media",
    icon: Package,
    items: ["categoría", "proveedor", "stock", "precio"],
  },
  {
    title: "Servicios",
    description:
      "Administrar servicios comerciales o adicionales que el gimnasio pueda vender junto a la cuota.",
    href: "/dashboard/servicios",
    status: "Base existente",
    priority: "Media",
    icon: Database,
    items: ["nombre", "precio", "descripción", "activo"],
  },
  {
    title: "Equipamiento",
    description:
      "Parametrizar máquinas, tipos, ubicación, estado operativo y preparar la base para mantenimiento avanzado.",
    href: "/dashboard/equipamientos",
    status: "Base existente",
    priority: "Alta",
    icon: Wrench,
    items: ["tipo", "ubicación", "estado", "fecha de alta"],
  },
  {
    title: "Tipos de mantenimiento",
    description:
      "Crear catálogos de verificaciones por máquina, frecuencia, alerta anticipada y seguimiento histórico.",
    status: "Planificado",
    priority: "Alta",
    icon: Settings,
    items: ["lubricación", "cableado", "seguridad", "limpieza"],
  },
  {
    title: "Empleados y tipos de empleado",
    description:
      "Evolucionar la figura actual de entrenadores hacia empleados, con tipo editable para administración, entrenamiento, mantenimiento, limpieza y mayordomía/bar-snack.",
    href: "/dashboard/entrenadores",
    status: "Planificado",
    priority: "Alta",
    icon: UserCog,
    items: [
      "administrativo",
      "entrenador",
      "mantenimiento",
      "limpieza",
      "mayordomía/bar-snack",
    ],
  },
];

const statusStyles: Record<ParametrizacionCard["status"], string> = {
  "Base existente": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Disponible: "bg-[#e6f7fd] text-[#027aa3] border-[#b8e8f7]",
  Planificado: "bg-amber-50 text-amber-700 border-amber-200",
};

const priorityStyles: Record<ParametrizacionCard["priority"], string> = {
  Alta: "bg-red-50 text-red-700 border-red-200",
  Media: "bg-blue-50 text-blue-700 border-blue-200",
  Futura: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function ParametrizacionPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const isAdmin = user?.rol === "admin";

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
                    <h2 className="text-lg font-semibold">
                      Acceso restringido
                    </h2>
                    <p className="mt-1 text-sm">
                      La parametrización del sistema está disponible para
                      usuarios administradores.
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
                        <h1 className="mt-2 text-2xl font-bold">
                          Parametrización de catálogos
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-200">
                          Base operativa para administrar catálogos del negocio
                          sin depender siempre de seeds o valores fijos en el
                          frontend. Esta primera etapa organiza el mapa de
                          parametrización y conecta con módulos existentes.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur">
                        <p className="font-semibold">Siguiente paso técnico</p>
                        <p className="mt-1 text-cyan-100">
                          Diseñar migraciones y CRUD real para catálogos
                          faltantes.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Prioridad actual</p>
                      <p className="mt-1 text-2xl font-bold text-gray-950">
                        Alta
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Base para pagos, mantenimiento, empleados y BI.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">
                        Catálogos iniciales
                      </p>
                      <p className="mt-1 text-2xl font-bold text-gray-950">
                        {parametrizacionCards.length}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Incluye bases existentes y catálogos planificados.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Alcance fase 1</p>
                      <p className="mt-1 text-2xl font-bold text-gray-950">
                        Sin migraciones
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Pantalla base segura antes de tocar la base de datos.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="border-b p-4">
                    <h2 className="text-xl font-bold">
                      Mapa de catálogos del sistema
                    </h2>
                    <p className="text-sm text-gray-500">
                      Los módulos con base existente enlazan a su pantalla
                      actual. Los planificados quedan identificados para la
                      siguiente iteración de base de datos y CRUD.
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                    {parametrizacionCards.map((card) => {
                      const Icon = card.icon;

                      return (
                        <div
                          key={card.title}
                          className="flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="rounded-xl bg-[#02a8e1]/10 p-2 text-[#02a8e1]">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              <span
                                className={`rounded-full border px-2 py-1 text-[11px] font-medium ${statusStyles[card.status]}`}
                              >
                                {card.status}
                              </span>
                              <span
                                className={`rounded-full border px-2 py-1 text-[11px] font-medium ${priorityStyles[card.priority]}`}
                              >
                                {card.priority}
                              </span>
                            </div>
                          </div>

                          <h3 className="mt-4 text-lg font-bold text-gray-950">
                            {card.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-gray-500">
                            {card.description}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {card.items.map((item) => (
                              <span
                                key={item}
                                className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                              >
                                {item}
                              </span>
                            ))}
                          </div>

                          <div className="mt-auto pt-4">
                            {card.href ? (
                              <Button
                                asChild
                                variant="outline"
                                className="w-full justify-between border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                              >
                                <Link href={card.href}>
                                  Ver módulo actual
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                disabled
                                variant="outline"
                                className="w-full justify-between"
                              >
                                CRUD pendiente
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
