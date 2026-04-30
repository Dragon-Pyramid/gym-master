"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { RegistrarAsistenciaQR } from "@/components/ui/RegistrarAsistenciaQR";

export default function ControlAsistenciaPage() {
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
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full">
          <AppHeader title="Control de Asistencia" />
          <main className="flex-1 w-full max-w-full px-4 py-6 space-y-6 md:px-8">
            <RegistrarAsistenciaQR />
          </main>
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
