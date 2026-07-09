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
import { useI18n } from "@/i18n/I18nProvider";

export default function AdminDashboardPage() {
  const { t } = useI18n();
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
    return <div>{t('common.loading')}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="gm-dashboard-scroll-root flex min-h-[100dvh] w-full flex-col bg-background">
        <div className="flex flex-1">
          <div data-gm-dashboard-content="true" className="flex-1 overflow-x-auto p-6 space-y-4 max-w-full">
            <AppHeader title={t("adminDashboard.adminPage.title")} />

            <Card className="w-full">
              <CardHeader>
                <span className="text-lg font-semibold">{t("adminDashboard.adminPage.summaryTitle")}</span>
              </CardHeader>
              <CardContent>
                <p>{t("adminDashboard.adminPage.placeholder")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
        <AppFooter />
      </div>
    </SidebarProvider>
  );
}
