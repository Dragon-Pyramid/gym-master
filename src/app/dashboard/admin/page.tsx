"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageSubheader } from "@/components/header/PageSubHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";

export default function AdminDashboardPage() {
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col w-full min-h-screen">
        <div className="flex flex-1">
          <div className="overflow-x-auto flex-1 p-6 space-y-4 max-w-full">
            <AppHeader title="Panel de Administración" />

            <Card className="w-full">
              <CardHeader>
                <span className="text-lg font-semibold">Resumen General</span>
              </CardHeader>
              <CardContent>
                {/* Aquí podés agregar estadísticas, accesos rápidos o widgets */}
                <p>Contenido del dashboard. Métricas, accesos rápidos, etc.</p>
              </CardContent>
            </Card>
          </div>
        </div>
        <AppFooter />
      </div>
    </SidebarProvider>
  );
}
