"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { RegistrarAsistenciaQR } from "@/components/ui/RegistrarAsistenciaQR";
import { useI18n } from "@/i18n/I18nProvider";

export default function ControlAsistenciaPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const { locale } = useI18n();
  const tr = (es: string, en: string) => (locale === "en" ? en : es);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return <div>{tr("Cargando...", "Loading...")}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="gm-dashboard-scroll-root flex min-h-[100dvh] w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full">
          <AppHeader title={tr("Control de Asistencia", "Attendance control")} />
          <main data-gm-dashboard-content="true" className="flex-1 w-full max-w-full px-4 py-6 space-y-6 md:px-8">
            <RegistrarAsistenciaQR />
          </main>
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
