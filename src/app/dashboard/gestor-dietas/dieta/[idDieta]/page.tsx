"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDieta } from "@/services/apiClient";
import { Dieta } from "@/interfaces/dieta.interface";
import DietaDisplay from "@/components/dashboard/dietas/DietaDisplay";
import { useI18n } from "@/i18n/I18nProvider";

export default function GestorDietaDetallePage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const router = useRouter();
  const params = useParams<{ idDieta: string }>();
  const [dieta, setDieta] = useState<Dieta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    const loadDieta = async () => {
      if (!isInitialized || !isAuthenticated || !params?.idDieta) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getDieta(params.idDieta);
        if (!response.ok) {
          setError(
            response.data?.error ||
              response.data?.message ||
              tx("No se pudo cargar la dieta.", "The diet could not be loaded.")
          );
          setDieta(null);
          return;
        }

        setDieta(response.data as Dieta);
      } catch (err) {
        console.error("Error al cargar dieta:", err);
        setError(tx("Ocurrió un error al cargar la dieta.", "An error occurred while loading the diet."));
        setDieta(null);
      } finally {
        setLoading(false);
      }
    };

    loadDieta();
  }, [isInitialized, isAuthenticated, params?.idDieta]);

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
          <AppHeader title={tx("Detalle de Dieta", "Diet detail")} />
          <main className="flex-1 p-6 space-y-6">
            {loading ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  {tx("Cargando detalle de dieta...", "Loading diet detail...")}
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-red-600">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/gestor-dietas")}
                  >
                    {tx("Volver al Gestor de Dietas", "Back to Diet manager")}
                  </Button>
                </CardContent>
              </Card>
            ) : dieta ? (
              <DietaDisplay
                dieta={dieta}
                onBack={() => router.push("/dashboard/gestor-dietas")}
                backLabel={tx("Volver", "Back")}
              />
            ) : null}
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
