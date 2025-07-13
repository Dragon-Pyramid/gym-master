"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import DashboardInitialContent from "@/components/dashboard/DashboardInitialContent";

import { useEffect, useState } from "react";
import { getAllEquipamientos } from "@/services/equipamientoService";
import { getAllMantenimientos } from "@/services/mantenimientoService";

import { Equipamento } from "@/interfaces/equipamiento.interface";
import { Mantenimiento } from "@/interfaces/mantenimiento.interface";

const asistenciaPorDia = [
  { name: "Lun", socios: 40 },
  { name: "Mar", socios: 35 },
  { name: "Mié", socios: 52 },
  { name: "Jue", socios: 47 },
  { name: "Vie", socios: 63 },
  { name: "Sáb", socios: 70 },
  { name: "Dom", socios: 30 },
];

const actividadesData = [
  { name: "Musculación", value: 400 },
  { name: "Crossfit", value: 300 },
  { name: "Yoga", value: 200 },
  { name: "Spinning", value: 180 },
  { name: "Boxeo", value: 220 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [equipos, setEquipos] = useState<Equipamento[]>([]);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [loadingDatos, setLoadingDatos] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoadingDatos(true);
      const eqs = await getAllEquipamientos();
      const mants = await getAllMantenimientos();
      setEquipos(eqs || []);
      setMantenimientos(mants || []);
      setLoadingDatos(false);
    }
    fetchData();
  }, []);

  const equiposTotales = equipos.length;
  const equiposEnRevision = equipos.filter(
    (e) => e.estado === "en mantenimiento"
  ).length;
  const equiposFueraDeServicio = equipos.filter(
    (e) => e.estado === "fuera de servicio"
  ).length;
  const proximosMantenimientos = equipos.filter((e) => {
    if (!e.proxima_revision) return false;
    const fecha = new Date(e.proxima_revision);
    const hoy = new Date();
    const en30dias = new Date();
    en30dias.setDate(hoy.getDate() + 30);
    return fecha >= hoy && fecha <= en30dias;
  }).length;
  const mesActual = new Date().toISOString().slice(0, 7);
  const costoMantenimientoMensual = mantenimientos
    .filter(
      (m) =>
        m.fecha_mantenimiento && m.fecha_mantenimiento.startsWith(mesActual)
    )
    .reduce((acc, m) => acc + (m.costo || 0), 0);

  if (status === "loading" || loadingDatos) {
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando dashboard...
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/auth/login");
    return null;
  }

  const userType = session?.user?.userType;

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />

        <div className="flex flex-col flex-1 w-full">
          <AppHeader title="Dashboard" />
          <main className="flex-1 w-full max-w-full px-4 py-6 space-y-6 md:px-8">
            {(userType === "socio" || userType === "usuario") && (
              <DashboardInitialContent />
            )}

            {userType === "admin" && (
              <>
                <div className="p-5">
                  <h1 className="mb-4 text-3xl font-bold">
                    Bienvenido al Panel de Control
                  </h1>
                  <p className="text-lg text-gray-700 dark:text-gray-300">
                    Este es tu panel de control administrativo.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Socios Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">120</div>
                      <p className="text-sm text-muted-foreground">
                        Socios registrados actualmente
                      </p>
                      <p className="mt-1 text-sm text-green-500">
                        +8 nuevos esta semana
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Actividades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">5</div>
                      <p className="text-sm text-muted-foreground">
                        Tipos de actividades en el gimnasio
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        ≈ Sin cambios
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Entrenadores</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">4</div>
                      <p className="text-sm text-muted-foreground">
                        Entrenadores disponibles
                      </p>
                      <p className="mt-1 text-sm text-green-500">
                        ↑ +1 desde el mes pasado
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Clases Semanales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">36</div>
                      <p className="text-sm text-muted-foreground">
                        Total de clases esta semana
                      </p>
                      <p className="mt-1 text-sm text-green-500">
                        ↑ +10% asistencia
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <Card className="col-span-12 lg:col-span-8">
                    <CardHeader>
                      <CardTitle>Asistencias por Día</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={asistenciaPorDia}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="socios"
                            stroke="#02a8e1"
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="col-span-12 lg:col-span-4">
                    <CardHeader>
                      <CardTitle>Distribución por Actividad</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={actividadesData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {actividadesData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2 xl:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Equipos Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{equiposTotales}</div>
                      <p className="text-sm text-muted-foreground">
                        Total de equipos registrados
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Equipos en Revisión</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {equiposEnRevision}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Actualmente en proceso de revisión
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Próximos Mantenimientos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {proximosMantenimientos}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Equipos con mantenimiento programado
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Costo Total de Mantenimiento Mensual
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        ${costoMantenimientoMensual}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Costo estimado para este mes
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Equipos Fuera de Servicio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {equiposFueraDeServicio}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Equipos no operativos actualmente
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </main>
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
