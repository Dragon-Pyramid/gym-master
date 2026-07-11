"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { useI18n } from "@/i18n/I18nProvider";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import RutinaDisplay from "@/components/dashboard/rutinas/RutinaDisplay";

export default function GestorRutinaDetallePage() {
  const router = useRouter();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const params = useParams<{ idRutina: string }>();
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return <div>{tx("Cargando...", "Loading...")}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={tx("Detalle de Rutina", "Routine detail")} />
          <main className="flex-1 p-6 bg-muted/20 dark:bg-black">
            <RutinaDisplay
              singleMode
              singleRutinaId={params.idRutina}
              backLabel={tx("VOLVER AL GESTOR", "BACK TO MANAGER")}
              onBack={() => router.push("/dashboard/gestor-rutinas")}
            />
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
