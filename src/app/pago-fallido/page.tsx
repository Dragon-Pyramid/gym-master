"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function PagoFallidoPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        Procesando pago...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  //! Esto es solo un mockeo

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-background text-foreground">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Pago Fallido" />
          <main className="flex items-center justify-center flex-1 p-6">
            <Card className="w-full max-w-md mx-auto shadow-lg bg-card text-card-foreground">
              <CardHeader className="flex flex-col items-center gap-2 p-6">
                <XCircle className="w-16 h-16 text-red-500 dark:text-red-400" />
                <h2 className="text-2xl font-bold text-center text-red-600 dark:text-red-400">
                  El pago no se pudo procesar
                </h2>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <p className="text-lg text-center text-gray-700 dark:text-gray-200">
                  Hubo un problema al intentar procesar tu suscripción como
                  socio.
                </p>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Por favor, verifica los datos de tu tarjeta o intenta
                  nuevamente más tarde.
                </p>
                {sessionId && (
                  <div className="w-full p-2 mt-2 text-xs text-center text-gray-700 bg-gray-100 rounded">
                    <strong>ID de sesión Stripe:</strong> {sessionId}
                  </div>
                )}
                <button
                  className="mt-4 px-6 py-2 bg-[#02a8e1] text-white rounded hover:bg-[#0288b1] dark:bg-[#0288b1] dark:text-white dark:hover:bg-[#02a8e1]"
                  onClick={() => router.push("/dashboard")}
                >
                  Volver al listado de socios
                </button>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
